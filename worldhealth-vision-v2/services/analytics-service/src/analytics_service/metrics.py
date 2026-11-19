from contextlib import contextmanager
from time import perf_counter

from prometheus_client import Counter, Histogram


ANALYTICS_REQUEST_COUNTER = Counter(
    "whv_analytics_requests_total",
    "Total analytics-service requests by endpoint and outcome.",
    labelnames=("endpoint", "outcome"),
)

ANALYTICS_REQUEST_LATENCY_SECONDS = Histogram(
    "whv_analytics_request_latency_seconds",
    "Latency of analytics-service requests by endpoint.",
    labelnames=("endpoint",),
)


@contextmanager
def observe_request(endpoint: str):
    start = perf_counter()
    try:
        yield
        ANALYTICS_REQUEST_COUNTER.labels(endpoint=endpoint, outcome="success").inc()
    except Exception:
        ANALYTICS_REQUEST_COUNTER.labels(endpoint=endpoint, outcome="error").inc()
        raise
    finally:
        ANALYTICS_REQUEST_LATENCY_SECONDS.labels(endpoint=endpoint).observe(perf_counter() - start)

# Fixed-cardinality phase measurements. Never label by country, source or user:
# with 217+ territories and new verticals that would explode time-series costs
# and could expose the user's interests in operational monitoring.
ECONOMIC_SNAPSHOT_PHASE_SECONDS = Histogram(
    "whv_analytics_country_economic_snapshot_phase_seconds",
    "Country economic snapshot phases (catalog, indicators, series/provenance, total).",
    labelnames=("phase",),
    buckets=(0.005, 0.02, 0.05, 0.1, 0.25, 0.5, 1, 2, 3, 5, 10, 30),
)


def observe_economic_phase(phase: str, elapsed_seconds: float) -> None:
    if phase not in {"country", "indicators", "series_provenance", "total"}:
        raise ValueError("Unknown economic snapshot phase")
    ECONOMIC_SNAPSHOT_PHASE_SECONDS.labels(phase=phase).observe(elapsed_seconds)


@contextmanager
def timed_economic_phase(phase: str):
    start = perf_counter()
    try:
        yield
    finally:
        observe_economic_phase(phase, perf_counter() - start)
