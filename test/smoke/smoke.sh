#!/usr/bin/env bash
# Builds the image, starts it the way Compose does on the server, checks health,
# posts one event and looks for it in the container log. Proves the wiring.
set -euo pipefail
cd "$(dirname "$0")/../.."

export SMOKE_PORT="${SMOKE_PORT:-18080}"
# compose.yaml insists on these. The override drops the mounts, so any path will do.
export VAULT_REPO=/nonexistent JOURNAL_REPO=/nonexistent

compose() {
  docker compose -p journal-inbox-smoke -f compose.yaml -f test/smoke/compose.smoke.yaml "$@"
}
cleanup() { compose down --volumes --remove-orphans >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "building and starting"
compose up -d --build --wait --wait-timeout 60

echo "checking health"
health="$(curl -fsS "http://127.0.0.1:$SMOKE_PORT/health")"
grep -q '"status":"ok"' <<<"$health"

echo "posting an event"
curl -fsS -X POST "http://127.0.0.1:$SMOKE_PORT/events" \
  -H 'content-type: application/json' \
  -H 'x-event-secret: smoke-secret' \
  -d '{"name":"smoke_test"}' >/dev/null

echo "looking for it in the log"
for _ in $(seq 1 20); do
  if compose logs journal-inbox | grep -q 'event smoke_test logged'; then
    echo "smoke test passed"
    exit 0
  fi
  sleep 0.5
done
echo "event never showed up in the log" >&2
compose logs journal-inbox >&2
exit 1
