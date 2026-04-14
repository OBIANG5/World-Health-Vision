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
