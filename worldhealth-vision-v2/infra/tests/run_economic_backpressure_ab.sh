#!/usr/bin/env bash
# Disposable GitHub CI ONLY: same DB, same source, unbounded->cap8->unbounded.
# Never run against production, never publish internal endpoints or test observations.
set -euo pipefail
artifacts="worldhealth-vision-v2/infra/benchmarks/artifacts"
compose=(docker compose -f worldhealth-vision-v2/infra/compose.secure-staging.yml
  -f worldhealth-vision-v2/infra/tests/compose.ci-batch-optimized.yml
  -f worldhealth-vision-v2/infra/tests/compose.ci-private-timeseries-metrics.yml
  -f worldhealth-vision-v2/infra/tests/compose.ci-economic-batch-limit.yml)
mkdir -p "$artifacts"

for mode in baseline bounded8 baseline_repeat; do
  if [[ "$mode" == bounded8 ]]; then
    export WHV_ECONOMIC_BATCH_LIMIT=8
  else
    export WHV_ECONOMIC_BATCH_LIMIT=0
  fi
  echo "CI only: optimized economic batch cap=${WHV_ECONOMIC_BATCH_LIMIT}; mode=${mode}"
  "${compose[@]}" up -d --no-deps --force-recreate --wait analytics-service
  ready=0
  for attempt in $(seq 1 40); do
    if "${compose[@]}" exec -T analytics-service python -c \
      "from analytics_service.config import Settings; import urllib.request; assert Settings().economic_timeseries_batch_max_inflight==int('${WHV_ECONOMIC_BATCH_LIMIT}'); urllib.request.urlopen('http://127.0.0.1:8000/health',timeout=3).read()" \
      >/dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 1
  done
  test "$ready" = 1 || { echo "Analytics failed mode ${mode}" >&2; exit 1; }
  ids="$("${compose[@]}" ps -q whv-timescaledb catalog-service timeseries-service analytics-service)"
  test -n "$ids"
  "${compose[@]}" exec -T analytics-service python - --profile-timeseries-jdbc \
    < worldhealth-vision-v2/infra/tests/benchmark_optimized_dense_concurrency.py \
    > "$artifacts/queue-${mode}.json" \
    2> "$artifacts/queue-${mode}.log" &
  bench_pid="$!"
  for n in $(seq 1 12); do
    if ! kill -0 "$bench_pid" 2>/dev/null; then break; fi
    docker stats --no-stream --format '{{json .}}' $ids \
      >> "$artifacts/queue-${mode}-resources.jsonl" || true
    sleep 1
  done
  if ! wait "$bench_pid"; then
    cat "$artifacts/queue-${mode}.log"
    exit 1
  fi
  python3 -m json.tool "$artifacts/queue-${mode}.json" >/dev/null
  cat "$artifacts/queue-${mode}.log"
  "${compose[@]}" exec -T analytics-service python -c \
    "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/metrics',timeout=15).read().decode())" \
    > "$artifacts/queue-${mode}-metrics.prom"
  python3 worldhealth-vision-v2/infra/tests/report_upstream_metrics.py \
    --input "$artifacts/queue-${mode}-metrics.prom" \
    --output "$artifacts/queue-${mode}-dependencies.json" \
    --require-optimized-economic
done

python3 worldhealth-vision-v2/infra/tests/compare_economic_batch_backpressure_ab.py \
  --baseline "$artifacts/queue-baseline.json" \
  --bounded "$artifacts/queue-bounded8.json" \
  --baseline-repeat "$artifacts/queue-baseline_repeat.json" \
  --baseline-metrics "$artifacts/queue-baseline-metrics.prom" \
  --bounded-metrics "$artifacts/queue-bounded8-metrics.prom" \
  --baseline-repeat-metrics "$artifacts/queue-baseline_repeat-metrics.prom" \
  --output "$artifacts/queue-baseline-vs-bounded-ab.json"
