from prometheus_client import Counter


INGESTION_RUN_COUNTER = Counter(
    "whv_ingestion_runs_total",
    "Total ingestion runs executed by dataset and status.",
    labelnames=("source", "dataset", "status"),
)

INGESTION_RECORD_COUNTER = Counter(
    "whv_ingestion_records_total",
    "Total normalized records produced by ingestion runs.",
    labelnames=("source", "dataset"),
)

TIMESERIES_PUBLICATION_COUNTER = Counter(
    "whv_timeseries_publications_total",
    "Total publication attempts from ingestion-service to timeseries-service.",
    labelnames=("source", "dataset", "status"),
)
