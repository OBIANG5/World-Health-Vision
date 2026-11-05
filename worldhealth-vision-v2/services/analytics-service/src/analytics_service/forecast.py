"""WHV Forecast Engine — linear projection with honest uncertainty quantification.

Methodology
-----------
This module implements Ordinary Least Squares (OLS) linear regression on the
N most recent non-null observations for a given indicator series.  The approach
is deliberately transparent and conservative:

  1. OLS fit on the last MIN_OBSERVATIONS..MAX_OBSERVATIONS years.
  2. Prediction intervals (not confidence intervals) at 80 % and 95 % using the
     t-distribution approximation:
         PI = ŷ ± t_(α/2, n-2) · SE_pred
         SE_pred = s · sqrt(1 + 1/n + (x_new - x̄)² / Sxx)
     where s = sqrt(RSS / (n-2)) is the residual standard deviation.
  3. Quality tiers (RELIABLE / INDICATIVE / SPECULATIVE) based on R² and the
     coefficient of variation of first differences (a proxy for volatility).

Design principles (inspired by IMF WEO, World Bank MPO, OECD EO)
-----------------------------------------------------------------
- Projections are conditional on the continuation of recent structural trends.
- No shock scenario is modelled.  Major discontinuities (recessions, pandemics,
  policy reversals, commodity shocks) are not reflected in the projection band.
- The horizon is indicator-dependent: shorter for volatile series (inflation,
  current account) and longer for structural series (life expectancy, internet
  penetration).
- We report R² and sample size so users can assess model quality themselves.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

# ---------------------------------------------------------------------------
# t-distribution quantile approximation (Hill's algorithm, 1970)
# Good to < 0.001 for df >= 3.  Avoids scipy/scipy dependency.
# ---------------------------------------------------------------------------

def _t_quantile(p: float, df: int) -> float:
    """Upper-tail t quantile: P(T > return_value) ≈ p for large-sample approx."""
    # Cornish-Fisher / simple approximation for df >= 3
    if df < 3:
        return 4.0  # conservative fallback
    # Abramowitz & Stegun 26.7.8 approximation
    z = _normal_quantile(p)
    g1 = (z**3 + z) / (4 * df)
    g2 = (5 * z**5 + 16 * z**3 + 3 * z) / (96 * df**2)
    g3 = (3 * z**7 + 19 * z**5 + 17 * z**3 - 15 * z) / (384 * df**3)
    return z + g1 + g2 + g3


def _normal_quantile(p: float) -> float:
    """Rational approximation of the standard normal quantile (Beasley-Springer-Moro)."""
    a = [2.515517, 0.802853, 0.010328]
    b = [1.432788, 0.189269, 0.001308]
    t = math.sqrt(-2.0 * math.log(p))
    num = a[0] + a[1] * t + a[2] * t**2
    den = 1.0 + b[0] * t + b[1] * t**2 + b[2] * t**3
    return t - num / den


# ---------------------------------------------------------------------------
# Indicator metadata — governs horizon and interpretation caveats
# ---------------------------------------------------------------------------

_VOLATILE_INDICATORS = {
    "FP.CPI.TOTL.ZG",    # inflation — highly sensitive to monetary / supply shocks
    "BN.CAB.XOKA.GD.ZS", # current account — volatile with trade cycle
    "NY.GDP.MKTP.KD.ZG", # GDP growth — short-horizon only
    "BX.KLT.DINV.WD.GD.ZS",  # FDI — highly cyclical
}

_SEMI_STABLE_INDICATORS = {
    "NY.GDP.PCAP.CD",
    "NY.GDP.MKTP.CD",
    "SL.UEM.TOTL.ZS",
    "GC.DOD.TOTL.GD.ZS",
    "NE.EXP.GNFS.ZS",
    "NE.IMP.GNFS.ZS",
    "SH.XPD.CHEX.GD.ZS",
    "GC.REV.TOTL.GD.ZS",
    "NE.GDI.FTOT.ZS",
    "SE.XPD.TOTL.GD.ZS",
    "SL.TLF.CACT.ZS",
    "SI.POV.GINI",
    "GC.XPN.TOTL.GD.ZS",
    "SH.MED.PHYS.ZS",
}

# Structural indicators get longer horizons
_STRUCTURAL_INDICATORS = {
    "SP.DYN.LE00.IN",
    "SP.DYN.IMRT.IN",
    "IT.NET.USER.ZS",
    "EN.ATM.CO2E.PC",
    "SP.POP.TOTL",
}

_HORIZON_YEARS = {
    "volatile": 3,
    "semi_stable": 5,
    "structural": 8,
}

_CAVEATS_BASE_FR = (
    "Projection conditionnelle basée sur la régression des {n} dernières "
    "observations ({from_year}–{to_year}). Valide uniquement si les conditions "
    "structurelles restent stables — aucun choc majeur (crise financière, "
    "pandémie, conflit, retournement de politique) n'est intégré dans ce modèle."
)

_CAVEATS_VOLATILE_FR = (
    "Indicateur à forte volatilité cyclique. L'horizon de projection est "
    "volontairement limité à {horizon} ans. Les valeurs passées de cet indicateur "
    "ont historiquement présenté des ruptures de tendance difficiles à anticiper."
)

_CAVEATS_LOW_R2_FR = (
    "R² = {r2:.2f} — la série historique présente une dispersion élevée autour de "
    "la tendance linéaire. L'intervalle de confiance est large : interpréter avec "
    "une grande prudence. Une approche hors-tendance ou non-linéaire pourrait mieux "
    "convenir à cet indicateur."
)

_CAVEATS_SMALL_SAMPLE_FR = (
    "Nombre d'observations limité (n = {n}). La robustesse statistique est réduite "
    "— l'intervalle de confiance sous-estime probablement l'incertitude réelle."
)

_CAVEATS_BASE_EN = (
    "Conditional projection based on regression of the {n} most recent "
    "observations ({from_year}–{to_year}). Valid only if structural conditions "
    "remain stable — no major shock (financial crisis, pandemic, conflict, policy "
    "reversal) is incorporated in this model."
)

_CAVEATS_VOLATILE_EN = (
    "Highly cyclical indicator. The projection horizon is deliberately limited to "
    "{horizon} years. Historical values of this indicator have shown trend "
    "reversals that are inherently difficult to anticipate."
)

_CAVEATS_LOW_R2_EN = (
    "R² = {r2:.2f} — the historical series shows high dispersion around the linear "
    "trend. The confidence interval is wide: interpret with great caution. A "
    "non-linear or off-trend approach might better suit this indicator."
)

_CAVEATS_SMALL_SAMPLE_EN = (
    "Limited number of observations (n = {n}). Statistical robustness is reduced "
    "— the confidence interval likely underestimates actual uncertainty."
)


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class ForecastPoint:
    year: int
    value: float           # OLS point estimate
    ci_low_80: float       # 80 % prediction interval lower bound
    ci_high_80: float
    ci_low_95: float       # 95 % prediction interval lower bound
    ci_high_95: float
    is_extrapolated: bool = True


@dataclass
class ForecastMetadata:
    method: str = "OLS_LINEAR"
    n_observations: int = 0
    from_year: int = 0
    to_year: int = 0
    r_squared: float = 0.0
    slope: float = 0.0
    intercept: float = 0.0
    residual_std: float = 0.0
    quality: str = "SPECULATIVE"   # RELIABLE | INDICATIVE | SPECULATIVE
    horizon_years: int = 5
    caveats: list[str] = field(default_factory=list)


@dataclass
class ForecastResult:
    indicator_code: str
    iso3: str
    base_year: int
    horizon_years: int
    points: list[ForecastPoint]
    metadata: ForecastMetadata
    insufficient_data: bool = False


# ---------------------------------------------------------------------------
# Core computation
# ---------------------------------------------------------------------------

MIN_OBSERVATIONS = 5
MAX_OBSERVATIONS = 15  # use at most the 15 most recent


def _classify_indicator(code: str) -> str:
    if code in _VOLATILE_INDICATORS:
        return "volatile"
    if code in _STRUCTURAL_INDICATORS:
        return "structural"
    return "semi_stable"


def _ols_fit(xs: list[float], ys: list[float]) -> tuple[float, float, float, float]:
    """OLS: returns (slope, intercept, r_squared, residual_std)."""
    n = len(xs)
    x_mean = sum(xs) / n
    y_mean = sum(ys) / n

    sxx = sum((x - x_mean) ** 2 for x in xs)
    sxy = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys))

    if sxx == 0:
        return 0.0, y_mean, 0.0, 0.0

    slope = sxy / sxx
    intercept = y_mean - slope * x_mean

    ss_tot = sum((y - y_mean) ** 2 for y in ys)
    ss_res = sum((y - (slope * x + intercept)) ** 2 for x, y in zip(xs, ys))

    r_squared = max(0.0, 1.0 - ss_res / ss_tot) if ss_tot > 0 else 0.0

    df = n - 2
    residual_std = math.sqrt(ss_res / df) if df > 0 else 0.0

    return slope, intercept, r_squared, residual_std


def _prediction_interval(
    x_new: float,
    xs: list[float],
    slope: float,
    intercept: float,
    residual_std: float,
    alpha: float,
) -> tuple[float, float]:
    """Symmetric prediction interval at confidence level (1-alpha)."""
    n = len(xs)
    x_mean = sum(xs) / n
    sxx = sum((x - x_mean) ** 2 for x in xs)

    if residual_std == 0:
        y_hat = slope * x_new + intercept
        return y_hat, y_hat

    # SE of prediction at x_new
    leverage = 1.0 / n + (x_new - x_mean) ** 2 / sxx if sxx > 0 else 1.0
    se_pred = residual_std * math.sqrt(1.0 + leverage)

    t_val = _t_quantile(alpha / 2, n - 2)
    y_hat = slope * x_new + intercept
    margin = t_val * se_pred
    return y_hat - margin, y_hat + margin


def _assess_quality(r_squared: float, n: int, volatility_cv: float) -> str:
    if r_squared >= 0.80 and n >= 8 and volatility_cv <= 0.25:
        return "RELIABLE"
    if r_squared >= 0.50 and n >= 5:
        return "INDICATIVE"
    return "SPECULATIVE"


def compute_forecast(
    indicator_code: str,
    iso3: str,
    series: list[dict[str, Any]],  # [{year: int, value: float|None}, ...]
    lang: str = "fr",
) -> ForecastResult:
    """Compute a linear OLS projection for the given series.

    Args:
        indicator_code: WHV/WB indicator code.
        iso3: Country ISO3 code.
        series: List of {'year': int, 'value': float|None} sorted by year ascending.
        lang: Language for caveat strings ('fr' or 'en').

    Returns:
        ForecastResult with forecast points and metadata.
    """
    # 1. Filter non-null values
    valid = [(int(p["year"]), float(p["value"])) for p in series if p.get("value") is not None]
    valid.sort(key=lambda t: t[0])

    if len(valid) < MIN_OBSERVATIONS:
        return ForecastResult(
            indicator_code=indicator_code,
            iso3=iso3,
            base_year=valid[-1][0] if valid else 0,
            horizon_years=0,
            points=[],
            metadata=ForecastMetadata(n_observations=len(valid)),
            insufficient_data=True,
        )

    # 2. Use only the MAX_OBSERVATIONS most recent
    sample = valid[-MAX_OBSERVATIONS:]
    years = [t[0] for t in sample]
    values = [t[1] for t in sample]
    n = len(sample)
    base_year = years[-1]

    # 3. Fit OLS on relative x (x = year - base_year)
    xs = [float(y - base_year) for y in years]
    slope, intercept, r_squared, residual_std = _ols_fit(xs, values)

    # 4. Determine horizon
    kind = _classify_indicator(indicator_code)
    horizon_years = _HORIZON_YEARS[kind]

    # 5. Volatility measure: CV of first differences
    diffs = [abs(values[i] - values[i - 1]) for i in range(1, n)]
    mean_abs_val = sum(abs(v) for v in values) / n
    volatility_cv = (sum(diffs) / len(diffs)) / mean_abs_val if mean_abs_val > 0 else 1.0

    quality = _assess_quality(r_squared, n, volatility_cv)

    # 6. Build forecast points
    x_mean = sum(xs) / n
    points: list[ForecastPoint] = []

    for h in range(1, horizon_years + 1):
        x_new = float(h)
        y_hat = slope * x_new + intercept

        lo_80, hi_80 = _prediction_interval(x_new, xs, slope, intercept, residual_std, 0.20)
        lo_95, hi_95 = _prediction_interval(x_new, xs, slope, intercept, residual_std, 0.05)

        points.append(ForecastPoint(
            year=base_year + h,
            value=round(y_hat, 4),
            ci_low_80=round(lo_80, 4),
            ci_high_80=round(hi_80, 4),
            ci_low_95=round(lo_95, 4),
            ci_high_95=round(hi_95, 4),
        ))

    # 7. Build caveats
    caveats: list[str] = []
    base_tmpl = _CAVEATS_BASE_FR if lang == "fr" else _CAVEATS_BASE_EN
    caveats.append(base_tmpl.format(n=n, from_year=years[0], to_year=base_year))

    if kind == "volatile":
        v_tmpl = _CAVEATS_VOLATILE_FR if lang == "fr" else _CAVEATS_VOLATILE_EN
        caveats.append(v_tmpl.format(horizon=horizon_years))

    if r_squared < 0.50:
        r2_tmpl = _CAVEATS_LOW_R2_FR if lang == "fr" else _CAVEATS_LOW_R2_EN
        caveats.append(r2_tmpl.format(r2=r_squared))

    if n < 8:
        n_tmpl = _CAVEATS_SMALL_SAMPLE_FR if lang == "fr" else _CAVEATS_SMALL_SAMPLE_EN
        caveats.append(n_tmpl.format(n=n))

    metadata = ForecastMetadata(
        method="OLS_LINEAR",
        n_observations=n,
        from_year=years[0],
        to_year=base_year,
        r_squared=round(r_squared, 4),
        slope=round(slope, 6),
        intercept=round(intercept, 4),
        residual_std=round(residual_std, 4),
        quality=quality,
        horizon_years=horizon_years,
        caveats=caveats,
    )

    return ForecastResult(
        indicator_code=indicator_code,
        iso3=iso3,
        base_year=base_year,
        horizon_years=horizon_years,
        points=points,
        metadata=metadata,
        insufficient_data=False,
    )