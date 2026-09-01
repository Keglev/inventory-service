#!/usr/bin/env bash
# =============================================================================
# verify-served-bundle.sh - asserts the serve-time API-base rewrite is active
# Usage: .github/scripts/verify-served-bundle.sh <frontend-url> <backend-origin>
#
# ADR-0008 has Nginx rewrite the baked backend origin to the serving host in the
# response body (sub_filter). That transform is invisible in the source tree and
# in the built image; only the served bytes show whether it ran. If it stops
# running the app keeps working over the direct cross-origin path, so the
# topology flips without a symptom. This is the detection FR-01 calls cheap.
#
# Hosts are compared without scheme or port. sub_filter writes "https://$host",
# and nginx's $host carries no port, so the rewritten bundle names the bare
# hostname however the request was addressed. Matching on "localhost:8080" would
# find nothing in a bundle that says "https://localhost", which is exactly what a
# local container run produces.
#
# Exit 1 when the entry bundle still carries the backend host, and when it
# carries neither host - the second case means the assertion went vacuous rather
# than passed.
# =============================================================================
set -euo pipefail

BASE_URL="${1:?Usage: verify-served-bundle.sh <frontend-url> <backend-origin>}"
BACKEND_ORIGIN="${2:?Usage: verify-served-bundle.sh <frontend-url> <backend-origin>}"

# Reduce an argument to a bare hostname: no scheme, no path, no port.
host_of() {
  local v="${1#http://}"
  v="${v#https://}"
  v="${v%%/*}"
  printf '%s' "${v%:[0-9]*}"
}

FRONTEND_HOST="$(host_of "$BASE_URL")"
BACKEND_HOST="$(host_of "$BACKEND_ORIGIN")"
ROOT="${BASE_URL%/}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "==> [verify-served-bundle] $ROOT (frontend host $FRONTEND_HOST, backend host $BACKEND_HOST)"

# index.html is served no-cache, but ask the edge explicitly: a stale shell would
# name a previous build's assets and this check would verify the wrong bytes.
curl -fsS -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' "$ROOT/" -o "$WORK/index.html"

# The entry chunk holds the application's call sites; vendor chunks do not.
ENTRY="$(grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' "$WORK/index.html" | head -n1 || true)"
if [ -z "$ENTRY" ]; then
  echo "::error::No entry bundle referenced by the served index.html"
  exit 1
fi

CTYPE="$(curl -fsS --compressed -o "$WORK/entry.js" -w '%{content_type}' "$ROOT$ENTRY")"
echo "Entry bundle: $ENTRY"
echo "Content-Type: $CTYPE"

count_of() {
  { grep -o -F "$1" "$WORK/entry.js" || true; } | wc -l | tr -d ' '
}

BACKEND_HITS="$(count_of "$BACKEND_HOST")"
FRONTEND_HITS="$(count_of "$FRONTEND_HOST")"
echo "Occurrences of $BACKEND_HOST: $BACKEND_HITS"
echo "Occurrences of $FRONTEND_HOST: $FRONTEND_HITS"

if [ "$BACKEND_HITS" -ne 0 ]; then
  echo "::error::Serve-time rewrite is NOT active: the entry bundle still names $BACKEND_HOST while being served as '$CTYPE'. Check that type against sub_filter_types in ops/nginx/default.conf."
  exit 1
fi

if [ "$FRONTEND_HITS" -eq 0 ]; then
  echo "::error::The entry bundle names neither host, so this check proves nothing. If the build stopped baking an absolute API base, retire the sub_filter and this script together."
  exit 1
fi

echo "PASS [serve-time rewrite] backend host absent, frontend host present"
