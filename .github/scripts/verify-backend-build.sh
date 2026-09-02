#!/usr/bin/env bash
# =============================================================================
# verify-backend-build.sh - asserts the running jar is the commit just released
# Usage: .github/scripts/verify-backend-build.sh <base-url> <commit> [attempts]
#
# A green deploy proves the release was accepted, not that it is running. A pull
# that resolved a stale tag, or a restart that decided nothing had changed,
# leaves the previous jar answering every check.
#
# The commit is written into META-INF/build-info.properties by Maven at package
# time and reported at /actuator/info, so the value comes from the build that
# produced the jar rather than from whatever started it.
#
# This runs AFTER the health gate, unlike its frontend counterpart. Compose
# recreates the single backend container, so there is no window in which the
# previous release answers: the service is down until the new one is up, and
# health-check.sh is what waits for that. The retry below only covers a proxy
# still holding the draining upstream.
# =============================================================================
set -euo pipefail

BASE_URL="${1:?Usage: verify-backend-build.sh <base-url> <commit> [attempts]}"
EXPECTED="${2:?Usage: verify-backend-build.sh <base-url> <commit> [attempts]}"
ATTEMPTS="${3:-6}"
INTERVAL=5

ROOT="${BASE_URL%/}"
INFO_URL="$ROOT/actuator/info"

echo "==> [verify-backend-build] $INFO_URL must report $EXPECTED (max $ATTEMPTS attempts, ${INTERVAL}s apart)"

REPORTED=""
for i in $(seq 1 "$ATTEMPTS"); do
  # -f leaves 3xx alone, so a redirect to the login page arrives as an empty
  # body rather than an error: that has to reach the missing-field branch below.
  BODY="$(curl -fsS -H 'Cache-Control: no-cache' "$INFO_URL" || true)"
  # Parsed with grep rather than jq: the payload shape is fixed and this keeps
  # the check runnable on any machine, not only on a runner that ships jq. The
  # grep is guarded because no match is an outcome this script reports, not a
  # reason for pipefail to kill it.
  REPORTED="$(printf '%s' "$BODY" \
    | { grep -oE '"commit"[[:space:]]*:[[:space:]]*"[^"]*"' || true; } \
    | head -n1 \
    | sed -E 's/.*"([^"]*)"$/\1/')"

  if [ "$REPORTED" = "$EXPECTED" ]; then
    echo "PASS [verify-backend-build] running jar reports $REPORTED after $i attempt(s)"
    exit 0
  fi

  if [ -z "$REPORTED" ]; then
    echo "Attempt $i/$ATTEMPTS - no build.commit in the response"
  else
    echo "Attempt $i/$ATTEMPTS - running jar reports $REPORTED"
  fi
  sleep "$INTERVAL"
done

if [ "$REPORTED" = "unknown" ]; then
  echo "::error::The running jar reports build.commit=unknown, so it was packaged without -Dbuild.commit. Check the BUILD_COMMIT build argument in 2-docker-backend.yml."
  exit 1
fi

if [ -z "$REPORTED" ]; then
  echo "::error::$INFO_URL exposed no build.commit. Check that 'info' is in the actuator exposure list and that build-info.properties is in the jar."
  exit 1
fi

echo "::error::The running jar reports $REPORTED, not the released $EXPECTED. The deployed image is not the one serving."
exit 1
