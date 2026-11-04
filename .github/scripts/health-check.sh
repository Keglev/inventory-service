#!/usr/bin/env bash
# =============================================================================
# health-check.sh — polls /api/health, then checks the app root
# Usage: .github/scripts/health-check.sh <base-url> [max-attempts] [interval-seconds]
#
# The gate's own 200 from /api/health is the health proof; a second request
# right after it could only repeat it, so the one smoke check is / (200, 302
# or 401). Every request is capped at 10 s; one that times out or cannot
# connect counts as HTTP 000, so the gate polls again and the smoke check fails
# with that code instead of set -e ending the script without a message.
#
# Produces: one line per poll and one per check.
# Failure mode: exits 1 when the health gate times out or the smoke check fails.
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
  CODE=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" "$HEALTH_URL" || true)
  echo "Attempt $attempt/$MAX_ATTEMPTS — HTTP $CODE"

  if [ "$CODE" = "200" ]; then
    echo "✓ Health check passed"
    curl -s --max-time 10 "$HEALTH_URL" | jq '.' || true
    break
  fi

  [ "$attempt" -eq "$MAX_ATTEMPTS" ] && echo "::error::Health check timed out" && exit 1
  sleep "$INTERVAL"
done

# check <label> <url> <accepted-code>...: passes when the status is one of them.
check() {
  local label="$1" url="$2"
  shift 2
  CODE=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" "$url" || true)
  for expected in "$@"; do
    [ "$CODE" = "$expected" ] && echo "  PASS [$label] HTTP $CODE" && return 0
  done
  echo "::error::FAIL [$label] expected ($*), got HTTP $CODE"
  exit 1
}

echo "==> [health-check] Running smoke tests"
# Root may return 200 (SPA), 302 (redirect to login), or 401 (unauthenticated)
check "app root"        "$BASE_URL/"           "200" "302" "401"
echo "✓ All smoke tests passed"