from contextlib import contextmanager
from time import perf_counter

import httpx
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

# Private, fixed-cardinality economic batching wait; NOT a request rate limit.
# Records how long each of the three batched requests queued in Analytics.
ECONOMIC_BATCH_WAIT_SECONDS = Histogram(
    "whv_analytics_economic_timeseries_batch_wait_seconds",
    "Time queued before issuing an economic Timeseries batch upstream HTTP request.",
    labelnames=("operation",),
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 15, 30),
)


def observe_economic_batch_wait(operation: str, seconds: float) -> None:
    if operation not in {"latest", "availability", "history"}:
        raise ValueError("Non-reviewed batch wait metric operation")
    ECONOMIC_BATCH_WAIT_SECONDS.labels(operation=operation).observe(max(0.0, seconds))


# F1.2b.2c-2: bounded cardinality, HTTP-only dependency timings.
# Never use dynamic URLs, country codes, source names or users as metric labels.
_DEPENDENCY_OPERATIONS = {
    "timeseries": frozenset({
        "readiness", "series", "series_batch", "latest_by_source", "latest_batch", "availability", "availability_batch",
        "country_comparison", "source_runs",
    }),
    "catalog": frozenset({
        "readiness", "country", "local_context", "countries", "region",
        "indicator", "indicators", "indicators_batch", "source", "dataset",
    }),
}

UPSTREAM_HTTP_REQUESTS = Counter(
    "whv_analytics_upstream_http_requests_total",
    "Outbound HTTP calls by bounded service, operation and outcome.",
    labelnames=("dependency", "operation", "outcome"),
)

UPSTREAM_HTTP_LATENCY_SECONDS = Histogram(
    "whv_analytics_upstream_http_latency_seconds",
    "Outbound HTTP round-trip and status validation time; excludes JSON model parsing.",
    labelnames=("dependency", "operation"),
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 15, 30),
)


@contextmanager
def timed_dependency_http(dependency: str, operation: str):
    """Instrument only reviewed HTTP operations; invalid labels fail closed."""
    if operation not in _DEPENDENCY_OPERATIONS.get(dependency, frozenset()):
        raise ValueError("Unknown dependency operation")
    start = perf_counter()
    outcome = "success"
    try:
        yield
    except httpx.HTTPStatusError:
        outcome = "http_error"
        raise
    except httpx.HTTPError:
        outcome = "transport_error"
        raise
    except Exception:
        outcome = "client_error"
        raise
    finally:
        UPSTREAM_HTTP_REQUESTS.labels(
            dependency=dependency, operation=operation, outcome=outcome
        ).inc()
        UPSTREAM_HTTP_LATENCY_SECONDS.labels(
            dependency=dependency, operation=operation
        ).observe(perf_counter() - start)
