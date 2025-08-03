#!/usr/bin/env bash
set -euo pipefail
MODE=${1:-stream}
CONN=2
DUR=30

if ! command -v autocannon >/dev/null; then
  echo "Installing autocannon (global)..." >&2
  npm i -g autocannon
fi

echo "Benchmarking mode=$MODE duration=${DUR}s connections=${CONN}" >&2
START_RSS=$(docker stats --no-stream --format '{{.Name}} {{.MemUsage}}' generate-large-report-limited-resources-nestjs-app-1 | awk '{print $2}')

autocannon -c "$CONN" -d "$DUR" --timeout 100000 "http://localhost:3000/reports/csv?mode=$MODE" | tee "/tmp/bench_${MODE}.txt"

END_RSS=$(docker stats --no-stream --format '{{.Name}} {{.MemUsage}}' generate-large-report-limited-resources-nestjs-app-1 | awk '{print $2}')

echo "Memory RSS before: $START_RSS | after: $END_RSS"
