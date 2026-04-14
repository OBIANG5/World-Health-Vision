from dataclasses import dataclass

from analytics_service.models import EconomicLensTone


@dataclass(frozen=True)
class EconomicLensProfile:
    lens_code: str
    lens_display_name: str
    indicator_code: str
    why_it_matters: str


@dataclass(frozen=True)
class RelativeCostLensProfile:
    lens_code: str
    lens_display_name: str
    indicator_code: str
    why_it_matters: str


@dataclass(frozen=True)
class RelativeCostDecisionProfile:
    decision_code: str
    decision_display_name: str
    why_it_matters: str
    supporting_lens_codes: tuple[str, ...]


ECONOMIC_LENS_PROFILES: tuple[EconomicLensProfile, ...] = (
    EconomicLensProfile(
        lens_code="ECONOMIC_SCALE",
        lens_display_name="Economic scale",
        indicator_code="NY.GDP.MKTP.CD",
        why_it_matters="Shows the aggregate economic weight of the region or continent in current dollars.",
    ),
    EconomicLensProfile(
        lens_code="PROSPERITY_LEVEL",
        lens_display_name="Prosperity level",
        indicator_code="NY.GDP.PCAP.CD",
        why_it_matters="Adjusts for population size to give a more meaningful output-per-person signal.",
    ),
    EconomicLensProfile(
        lens_code="GROWTH_MOMENTUM",
        lens_display_name="Growth momentum",
        indicator_code="NY.GDP.MKTP.KD.ZG",
        why_it_matters="Signals whether the regional economy is expanding, stalling, or contracting in real terms.",
    ),
    EconomicLensProfile(
        lens_code="PRICE_PRESSURE",
        lens_display_name="Price pressure",
        indicator_code="FP.CPI.TOTL.ZG",
        why_it_matters="Highlights how intense consumer price pressure is across the region or continent.",
    ),
    EconomicLensProfile(
        lens_code="LABOR_STRESS",
        lens_display_name="Labor stress",
        indicator_code="SL.UEM.TOTL.ZS",
        why_it_matters="Shows whether labor market slack is becoming a drag on households and activity.",
    ),
    EconomicLensProfile(
        lens_code="EXTERNAL_BALANCE",
        lens_display_name="External balance",
        indicator_code="BN.CAB.XOKA.GD.ZS",
        why_it_matters="Helps identify whether the region is financing itself externally or running a resilient balance.",
    ),
)


def describe_regional_economic_lens(lens_code: str, median_value: float | None) -> tuple[EconomicLensTone, str, str]:
    if median_value is None:
        return (
            "CONTEXT",
            "Insufficient comparable evidence",
            "The current multi-source evidence is not yet rich enough to describe this regional lens confidently.",
        )

    if lens_code == "ECONOMIC_SCALE":
        if median_value >= 5_000_000_000_000:
            return (
                "CONTEXT",
                "Very large economic base",
                "The regional median points to a very large aggregate economic footprint in current US dollars.",
            )
        if median_value >= 1_000_000_000_000:
            return (
                "CONTEXT",
                "Large economic base",
                "The regional median points to a large economic footprint with meaningful global weight.",
            )
        return (
            "CONTEXT",
            "More limited economic scale",
            "The regional median points to a smaller aggregate economic base in absolute dollar terms.",
        )

    if lens_code == "PROSPERITY_LEVEL":
        if median_value >= 40_000:
            return (
                "POSITIVE",
                "High output per person",
                "Median GDP per capita suggests a comparatively high prosperity level across the comparable countries.",
            )
        if median_value >= 20_000:
            return (
                "BALANCED",
                "Mid-to-high output per person",
                "Median GDP per capita suggests a meaningful prosperity base, though with room for structural improvement.",
            )
        if median_value >= 8_000:
            return (
                "WATCH",
                "Mid-range output per person",
                "Median GDP per capita suggests a mixed prosperity profile with uneven resilience across member countries.",
            )
        return (
            "STRESS",
            "Lower output per person",
            "Median GDP per capita remains relatively low, which can amplify vulnerability to external shocks.",
        )

    if lens_code == "GROWTH_MOMENTUM":
        if median_value >= 4:
            return (
                "POSITIVE",
                "Strong expansion",
                "Regional real GDP growth is running at a strong pace across the comparable countries.",
            )
        if median_value >= 2:
            return (
                "BALANCED",
                "Healthy expansion",
                "Regional real GDP growth indicates a broadly resilient expansion rather than stagnation.",
            )
        if median_value >= 0:
            return (
                "WATCH",
                "Soft growth",
                "Regional growth remains positive, but momentum is soft enough to warrant closer monitoring.",
            )
        return (
            "STRESS",
            "Contraction risk",
            "Regional real GDP growth is negative, pointing to contractionary pressure in the comparable countries.",
        )

    if lens_code == "PRICE_PRESSURE":
        if median_value <= 3:
            return (
                "POSITIVE",
                "Contained inflation",
                "Consumer price pressure looks contained at the regional level, which supports planning visibility.",
            )
        if median_value <= 6:
            return (
                "WATCH",
                "Elevated inflation",
                "Inflation is still manageable, but it is high enough to erode margins and household purchasing power.",
            )
        return (
            "STRESS",
            "High inflation pressure",
            "Regional inflation is elevated enough to signal real pressure on costs, policy, and affordability.",
        )

    if lens_code == "LABOR_STRESS":
        if median_value <= 5:
            return (
                "POSITIVE",
                "Tight labor market",
                "Median unemployment is low, suggesting relatively limited labor market slack.",
            )
        if median_value <= 8:
            return (
                "BALANCED",
                "Manageable unemployment",
                "Median unemployment remains in a manageable range, though the labor market is not especially tight.",
            )
        if median_value <= 12:
            return (
                "WATCH",
                "Labor slack visible",
                "Median unemployment is high enough to show visible labor market slack across the region.",
            )
        return (
            "STRESS",
            "Labor market stress",
            "Median unemployment is materially elevated and points to labor market stress in the region.",
        )

    if lens_code == "EXTERNAL_BALANCE":
        if median_value >= 2:
            return (
                "POSITIVE",
                "External surplus buffer",
                "The current account median suggests an external surplus that can help absorb shocks.",
            )
        if median_value >= -2:
            return (
                "BALANCED",
                "Broadly balanced external position",
                "The current account median is close to balance, which reduces immediate external financing pressure.",
            )
        if median_value >= -5:
            return (
                "WATCH",
                "Noticeable external deficit",
                "The region is running an external deficit that is still manageable but should be monitored.",
            )
        return (
            "STRESS",
            "External financing pressure",
            "The current account median points to a sizable deficit and growing reliance on external financing.",
        )

    return (
        "CONTEXT",
        "Context signal",
        "This lens is currently exposed as contextual evidence without a custom narrative rule.",
    )


def describe_country_economic_lens(
    lens_code: str,
    latest_value: float | None,
    trend_direction: str,
) -> tuple[EconomicLensTone, str, str]:
    if latest_value is None:
        return (
            "CONTEXT",
            "Insufficient comparable evidence",
            "The current multi-source evidence is not yet rich enough to describe this country lens confidently.",
        )

    if lens_code == "ECONOMIC_SCALE":
        if latest_value >= 2_000_000_000_000:
            return (
                "CONTEXT",
                "Very large national economy",
                "The country sits in the top tier by absolute economic scale, which changes how shocks propagate through the rest of the profile.",
            )
        if latest_value >= 300_000_000_000:
            return (
                "CONTEXT",
                "Meaningful national scale",
                "The country has enough economic scale to matter regionally, even if resilience still depends on the other lenses.",
            )
        return (
            "CONTEXT",
            "More limited national scale",
            "The country operates at a smaller absolute scale, which can amplify exposure to external shocks and concentration risks.",
        )

    if lens_code == "PROSPERITY_LEVEL":
        if latest_value >= 40_000:
            return (
                "POSITIVE",
                "High output per person",
                "GDP per capita points to a relatively strong prosperity base, even though inequality and cost structure still matter.",
            )
        if latest_value >= 20_000:
            return (
                "BALANCED",
                "Mid-to-high prosperity level",
                "GDP per capita points to a meaningful prosperity base, but not one that automatically guarantees resilience.",
            )
        if latest_value >= 8_000:
            return (
                "WATCH",
                "Mid-range prosperity level",
                "GDP per capita suggests a mixed prosperity profile that can improve or weaken depending on momentum and inflation.",
            )
        return (
            "STRESS",
            "Lower prosperity base",
            "GDP per capita remains relatively low, which can magnify sensitivity to inflation and labor-market weakness.",
        )

    if lens_code == "GROWTH_MOMENTUM":
        if latest_value >= 4:
            return (
                "POSITIVE",
                "Strong expansion",
                "The country is growing at a strong real pace, which supports a healthier short-term economic picture.",
            )
        if latest_value >= 2:
            return (
                "BALANCED",
                "Healthy expansion",
                "Growth is positive enough to support the economy, though it still needs to be checked against inflation and external balance.",
            )
        if latest_value >= 0:
            return (
                "WATCH",
                "Soft growth",
                "Growth remains positive but lacks the strength to remove broader fragility on its own.",
            )
        return (
            "STRESS",
            "Contractionary signal",
            "Negative real GDP growth points to an economy under cyclical or structural pressure.",
        )

    if lens_code == "PRICE_PRESSURE":
        if latest_value <= 3:
            return (
                "POSITIVE",
                "Contained inflation",
                "Inflation looks broadly contained, which helps preserve household purchasing power and planning visibility.",
            )
        if latest_value <= 6:
            return (
                "WATCH",
                "Elevated inflation",
                "Inflation is elevated enough to affect affordability and cost planning, even if it is not yet extreme.",
            )
        return (
            "STRESS",
            "High inflation pressure",
            "Inflation is high enough to create real pressure on households, policy, and business cost structures.",
        )

    if lens_code == "LABOR_STRESS":
        if latest_value <= 5:
            return (
                "POSITIVE",
                "Tight labor market",
                "Unemployment is low enough to suggest relatively limited labor market slack.",
            )
        if latest_value <= 8:
            return (
                "BALANCED",
                "Manageable unemployment",
                "Unemployment remains in a workable range, though not one that signals especially strong labor-market tightness.",
            )
        if latest_value <= 12:
            return (
                "WATCH",
                "Labor slack visible",
                "Unemployment is high enough to show visible slack and pressure on household income resilience.",
            )
        return (
            "STRESS",
            "Labor market stress",
            "Unemployment is materially elevated and weighs on resilience, demand, and social stability.",
        )

    if lens_code == "EXTERNAL_BALANCE":
        if latest_value >= 2:
            return (
                "POSITIVE",
                "External surplus buffer",
                "The country is running an external surplus that can help absorb shocks and reduce financing pressure.",
            )
        if latest_value >= -2:
            return (
                "BALANCED",
                "Broadly balanced external position",
                "The external account is close to balance, limiting immediate dependence on external financing.",
            )
        if latest_value >= -5:
            return (
                "WATCH",
                "Noticeable external deficit",
                "The country is running a meaningful external deficit that remains manageable but should be monitored closely.",
            )
        return (
            "STRESS",
            "External financing pressure",
            "The external deficit is large enough to signal meaningful financing pressure and vulnerability to shifts in capital or trade conditions.",
        )

    trend_note = {
        "UP": "The latest selected series is still trending upward.",
        "DOWN": "The latest selected series is now moving downward.",
        "FLAT": "The latest selected series is broadly flat.",
        "INSUFFICIENT_DATA": "The selected source series is too short to derive a reliable trend.",
    }.get(trend_direction, "The selected source trend is not available.")

    return (
        "CONTEXT",
        "Context signal",
        trend_note,
    )


REGIONAL_ECONOMIC_LENS_PROFILES = ECONOMIC_LENS_PROFILES


RELATIVE_COST_LENS_PROFILES: tuple[RelativeCostLensProfile, ...] = (
    RelativeCostLensProfile(
        lens_code="GENERAL_COST_LEVEL",
        lens_display_name="General cost level",
        indicator_code="WHV.PRICE.LEVEL.GDP.OECD100",
        why_it_matters="Shows whether the country or region sits above or below the OECD benchmark for overall price levels.",
    ),
    RelativeCostLensProfile(
        lens_code="HOUSING_MARKET_HEAT",
        lens_display_name="Housing market heat",
        indicator_code="WHV.HOUSING.PRICE.REAL.INDEX2015",
        why_it_matters="Tracks whether real housing prices are running above or below their 2015 baseline and whether that pressure is still building.",
    ),
    RelativeCostLensProfile(
        lens_code="CONSUMER_PRICE_PRESSURE",
        lens_display_name="Consumer price pressure",
        indicator_code="FP.CPI.TOTL.ZG",
        why_it_matters="Shows whether current inflation is adding short-term pressure on top of the broader relative cost picture.",
    ),
)


RELATIVE_COST_DECISION_PROFILES: tuple[RelativeCostDecisionProfile, ...] = (
    RelativeCostDecisionProfile(
        decision_code="TRAVEL_AFFORDABILITY",
        decision_display_name="Travel affordability",
        why_it_matters=(
            "Turns broad price-level, inflation, and housing-pressure evidence into a practical travel-cost planning signal "
            "without pretending to replace live FX, hotel, or short-stay quotes."
        ),
        supporting_lens_codes=("GENERAL_COST_LEVEL", "CONSUMER_PRICE_PRESSURE", "HOUSING_MARKET_HEAT"),
    ),
    RelativeCostDecisionProfile(
        decision_code="HOUSEHOLD_AFFORDABILITY",
        decision_display_name="Household affordability pressure",
        why_it_matters=(
            "Combines the broad cost base, current inflation pressure, and housing heat into a more decision-oriented "
            "affordability signal for residents and policy watchers."
        ),
        supporting_lens_codes=("GENERAL_COST_LEVEL", "CONSUMER_PRICE_PRESSURE", "HOUSING_MARKET_HEAT"),
    ),
)


def describe_regional_relative_cost_lens(lens_code: str, median_value: float | None) -> tuple[EconomicLensTone, str, str]:
    if median_value is None:
        return (
            "CONTEXT",
            "Insufficient comparable evidence",
            "The current multi-source evidence is not yet rich enough to describe this relative-cost lens confidently.",
        )

    if lens_code == "GENERAL_COST_LEVEL":
        if median_value <= 80:
            return (
                "POSITIVE",
                "Clearly below OECD cost benchmark",
                "The regional median price level sits well below the OECD reference level, which points to a comparatively lighter cost base.",
            )
        if median_value <= 100:
            return (
                "BALANCED",
                "Below-to-near OECD cost benchmark",
                "The regional median price level remains below or close to the OECD benchmark rather than materially above it.",
            )
        if median_value <= 120:
            return (
                "WATCH",
                "Above OECD cost benchmark",
                "The regional median price level is above the OECD benchmark, which raises the relative cost base for households, firms, and travelers.",
            )
        return (
            "STRESS",
            "Materially above OECD cost benchmark",
            "The regional median price level is far above the OECD benchmark and points to a meaningfully expensive cost environment.",
        )

    if lens_code == "HOUSING_MARKET_HEAT":
        if median_value <= 90:
            return (
                "BALANCED",
                "Housing still below 2015 baseline",
                "The regional real housing-price median remains below its 2015 base, which limits the signal of accumulated housing heat.",
            )
        if median_value <= 110:
            return (
                "BALANCED",
                "Housing near long-run baseline",
                "The regional real housing-price median is still close to its 2015 benchmark rather than materially stretched.",
            )
        if median_value <= 130:
            return (
                "WATCH",
                "Housing above long-run baseline",
                "The regional real housing-price median is above its 2015 benchmark, pointing to visible housing-market heat.",
            )
        return (
            "STRESS",
            "Housing materially above long-run baseline",
            "The regional real housing-price median is far above its 2015 benchmark and signals strong housing-market pressure.",
        )

    if lens_code == "CONSUMER_PRICE_PRESSURE":
        if median_value <= 3:
            return (
                "POSITIVE",
                "Contained current price pressure",
                "Current inflation looks contained enough not to intensify the broader relative-cost picture materially.",
            )
        if median_value <= 6:
            return (
                "WATCH",
                "Current price pressure visible",
                "Current inflation is elevated enough to push day-to-day costs higher even if the broader cost base is still manageable.",
            )
        return (
            "STRESS",
            "Current price pressure high",
            "Current inflation is high enough to materially intensify the cost environment across the region.",
        )

    return (
        "CONTEXT",
        "Context signal",
        "This relative-cost lens is currently exposed as contextual evidence without a custom narrative rule.",
    )


def describe_country_relative_cost_lens(
    lens_code: str,
    latest_value: float | None,
    trend_direction: str,
) -> tuple[EconomicLensTone, str, str]:
    if latest_value is None:
        return (
            "CONTEXT",
            "Insufficient comparable evidence",
            "The current multi-source evidence is not yet rich enough to describe this country relative-cost lens confidently.",
        )

    if lens_code == "GENERAL_COST_LEVEL":
        if latest_value <= 80:
            return (
                "POSITIVE",
                "Clearly below OECD cost benchmark",
                "The country’s overall price level sits well below the OECD benchmark, which points to a comparatively lighter cost base.",
            )
        if latest_value <= 100:
            return (
                "BALANCED",
                "Below-to-near OECD cost benchmark",
                "The country’s overall price level is below or close to the OECD benchmark rather than materially above it.",
            )
        if latest_value <= 120:
            return (
                "WATCH",
                "Above OECD cost benchmark",
                "The country’s overall price level is above the OECD benchmark, which raises the relative cost base for households, firms, and travelers.",
            )
        return (
            "STRESS",
            "Materially above OECD cost benchmark",
            "The country’s overall price level is far above the OECD benchmark and points to a meaningfully expensive cost environment.",
        )

    if lens_code == "HOUSING_MARKET_HEAT":
        if latest_value <= 90:
            headline = "Housing still below 2015 baseline"
            narrative = "Real housing prices remain below the 2015 base, which limits the signal of accumulated housing-market heat."
            tone: EconomicLensTone = "BALANCED"
        elif latest_value <= 110:
            headline = "Housing near long-run baseline"
            narrative = "Real housing prices remain close to the 2015 benchmark rather than materially stretched."
            tone = "BALANCED"
        elif latest_value <= 130:
            headline = "Housing above long-run baseline"
            narrative = "Real housing prices are above the 2015 benchmark, pointing to visible housing-market heat."
            tone = "WATCH"
        else:
            headline = "Housing materially above long-run baseline"
            narrative = "Real housing prices are far above the 2015 benchmark and signal strong housing-market pressure."
            tone = "STRESS"

        if trend_direction == "UP":
            narrative += " The latest selected series is still climbing, which means the pressure is not yet cooling."
        elif trend_direction == "DOWN":
            narrative += " The latest selected series is easing, which suggests some cooling in housing pressure."

        return tone, headline, narrative

    if lens_code == "CONSUMER_PRICE_PRESSURE":
        if latest_value <= 3:
            return (
                "POSITIVE",
                "Contained current price pressure",
                "Current inflation looks contained enough not to intensify the broader relative-cost picture materially.",
            )
        if latest_value <= 6:
            return (
                "WATCH",
                "Current price pressure visible",
                "Current inflation is elevated enough to push day-to-day costs higher even if the broader cost base is still manageable.",
            )
        return (
            "STRESS",
            "Current price pressure high",
            "Current inflation is high enough to materially intensify the cost environment faced by households and travelers.",
        )

    trend_note = {
        "UP": "The latest selected series is still trending upward.",
        "DOWN": "The latest selected series is now moving downward.",
        "FLAT": "The latest selected series is broadly flat.",
        "INSUFFICIENT_DATA": "The selected source series is too short to derive a reliable trend.",
    }.get(trend_direction, "The selected source trend is not available.")

    return (
        "CONTEXT",
        "Context signal",
        trend_note,
    )
