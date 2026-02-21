import numpy as np
import pandas as pd


def compute_trend_from_df(d: "pd.DataFrame", window: int = 10, threshold: float = 0.01):
    """
    Calcule une tendance UP/DOWN/STABLE sur les 'window' dernières années disponibles.
    threshold = seuil relatif (ex: 0.01 = 1%/an) basé sur slope / mean(value).
    """
    d = d.dropna(subset=["year", "value"]).sort_values("year")
    if len(d) < 3:
        return {
            "trend": "INSUFFICIENT_DATA",
            "points_used": int(len(d)),
            "method": "linear_regression_on_last_window_years",
        }

    d_recent = d.tail(window)
    x = d_recent["year"].to_numpy(dtype=float)
    y = d_recent["value"].to_numpy(dtype=float)

    a, _b = np.polyfit(x, y, 1)

    mean_y = float(np.mean(np.abs(y))) if float(np.mean(np.abs(y))) != 0.0 else 1.0
    a_rel = float(a / mean_y)

    if a_rel > threshold:
        trend = "UP"
    elif a_rel < -threshold:
        trend = "DOWN"
    else:
        trend = "STABLE"

    return {
        "trend": trend,
        "window": int(window),
        "points_used": int(len(d_recent)),
        "slope": float(a),
        "slope_relative": a_rel,
        "threshold_relative": float(threshold),
        "method": "linear_regression_on_last_window_years",
    }
