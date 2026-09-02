#!/usr/bin/env bash
# =============================================================================
# wait-for-build.sh - blocks until the commit being deployed is the one served
# Usage: .github/scripts/wait-for-build.sh <frontend-url> <build-id> [attempts]
#
# Koyeb reports a service HEALTHY throughout a rolling update, so a post-deploy
# check that starts as soon as the platform says HEALTHY can run against the
# outgoing image and pass on it. That happened on the 2026-09-02 rollout: the
# served-bundle check reported success against the previous build.
#
# The build id is the commit SHA. 5-frontend-ci.yml passes it as the
# VITE_BUILD_ID build argument and src/config/appMeta.ts reads it, so Vite
# inlines it into the entry chunk. Finding it in the served bytes is direct
# evidence that the new image is answering, and owes nothing to the platform's
# own status semantics.
# =============================================================================
set -euo pipefail

BASE_URL="${1:?Usage: wait-for-build.sh <frontend-url> <build-id> [attempts]}"
BUILD_ID="${2:?Usage: wait-for-build.sh <frontend-url> <build-id> [attempts]}"
ATTEMPTS="${3:-30}"
INTERVAL=10

ROOT="${BASE_URL%/}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "==> [wait-for-build] $ROOT must serve build $BUILD_ID (max $ATTEMPTS attempts, ${INTERVAL}s apart)"

for i in $(seq 1 "$ATTEMPTS"); do
  # index.html is served no-cache, but ask the edge explicitly: a stale shell
  # would name the previous build's assets and stall this loop on a cache.
  if ! curl -fsS -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' "$ROOT/" -o "$WORK/index.html"; then
    echo "Attempt $i/$ATTEMPTS - index not reachable"
  elif ENTRY="$(grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' "$WORK/index.html" | head -n1)" \
    && [ -n "$ENTRY" ] \
    && curl -fsS --compressed "$ROOT$ENTRY" -o "$WORK/entry.js"; then
    if grep -q -F "$BUILD_ID" "$WORK/entry.js"; then
      echo "PASS [wait-for-build] $ENTRY carries $BUILD_ID after $i attempt(s)"
      exit 0
    fi
    echo "Attempt $i/$ATTEMPTS - $ENTRY does not carry that build id"
  else
    echo "Attempt $i/$ATTEMPTS - no entry bundle available"
  fi
  sleep "$INTERVAL"
done

echo "::error::$ROOT never served build $BUILD_ID within $((ATTEMPTS * INTERVAL))s. Either the rollout did not reach the edge, or the running image was built from a different commit."
exit 1
