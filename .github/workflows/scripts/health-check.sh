#!/usr/bin/env bash
# =============================================================================
# health-check.sh — Polls /api/health then runs smoke tests
# Usage: .github/scripts/health-check.sh <base-url> [max-attempts] [interval-seconds]
#
# Smoke tests: /api/health (200), / (200, 302, or 401)
# Exit code 1 if health gate times out or any smoke test fails.
# =============================================================================
set -euo pipefail

BASE_URL="${1:?Usage: health-check.sh <base-url> [max-attempts] [interval-seconds]}"
MAX_ATTEMPTS="${2:-12}"
INTERVAL="${3:-10}"

HEALTH_URL="$BASE_URL/api/health"

echo "==> [health-check] Polling $HEALTH_URL (max ${MAX_ATTEMPTS} attempts, ${INTERVAL}s interval)"

# Initial settle — gives the platform time to route traffic after deploy
sleep 15

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")
  echo "Attempt $attempt/$MAX_ATTEMPTS — HTTP $CODE"

  if [ "$CODE" = "200" ]; then
    echo "✓ Health check passed"
    curl -s "$HEALTH_URL" | jq '.' || true
    break
  fi

  [ "$attempt" -eq "$MAX_ATTEMPTS" ] && echo "::error::Health check timed out" && exit 1
  sleep "$INTERVAL"
done

# ---------------------------------------------------------------------------
# Smoke tests — validate core endpoints return expected HTTP status codes
# ---------------------------------------------------------------------------
check() {
  local label="$1" url="$2"
  shift 2
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  for expected in "$@"; do
    [ "$CODE" = "$expected" ] && echo "  PASS [$label] HTTP $CODE" && return 0
  done
  echo "::error::FAIL [$label] expected ($*), got HTTP $CODE"
  exit 1
}

echo "==> [health-check] Running smoke tests"
check "health endpoint" "$BASE_URL/api/health" "200"
# Root may return 200 (SPA), 302 (redirect to login), or 401 (unauthenticated)
check "app root"        "$BASE_URL/"           "200" "302" "401"
echo "✓ All smoke tests passed"