#!/usr/bin/env bash
# =============================================================================
# verify-image-contract.sh - frontend image HTTP contract gate
# Usage: bash .github/scripts/verify-image-contract.sh <base-url>
#        bash .github/scripts/verify-image-contract.sh --selftest <base-url>
#        Invoked by .github/workflows/frontend-ci.yml against the image that
#        job has just built and started, on http://127.0.0.1:8080.
#
# The Playwright suite runs the bundle under `vite preview`, which serves dist/
# directly and executes none of ops/nginx. Everything this image adds at serve
# time was therefore unproven before this gate: the SPA fallback, the asset 404,
# the caching headers, and the four security headers that ops/nginx/default.conf
# repeats in three locations because add_header does not accumulate across
# levels. That repetition is the failure this gate exists for: a location added
# without its copy of the four serves them silently missing.
#
# Not covered, deliberately. The proxy locations reach the production backend,
# so exercising them from CI would send traffic there; /api/ is proven after
# deploy by health-check.sh instead. The serve-time sub_filter rewrite depends
# on $host, which is 127.0.0.1 here and the real host in production, so it is
# proven after deploy by verify-served-bundle.sh. Neither is re-checked here.
#
# The expected values below were measured against the deployed image on
# 2026-09-18, not derived from the config.
#
# No check runs inside a pipeline. A failure count incremented on the right-hand
# side of a pipe lands in a subshell and is lost, which would report a defect
# and still exit 0.
#
# --selftest <base-url> puts each comparison against a value that must fail --
# a wrong status, an absent header, a present header carrying the wrong value --
# and exits 1 unless all three are reported. It runs against the same server, on
# the same runner, immediately before the real pass, so the gate proves it can
# still fail every time it is trusted.
#
# Failure mode: reports every failing assertion and exits 1.
# =============================================================================
set -uo pipefail

FAILURES=0
# Set while --selftest is running, so its deliberate failures are not annotated
# as errors in the job log. A real failure always annotates.
QUIET_FAIL=0
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Records a failure. Never called from inside a pipeline.
fail() {
  if [ "$QUIET_FAIL" = "1" ]; then
    echo "  expected failure [$1] $2"
  else
    echo "::error::FAIL [$1] $2"
  fi
  FAILURES=$((FAILURES + 1))
}

# expect_status <label> <url> <expected-code>
expect_status() {
  local label="$1" url="$2" want="$3" got
  got="$(curl -s -o "$WORK/body" -w '%{http_code}' "$url")"
  if [ "$got" = "$want" ]; then
    echo "  PASS [$label] HTTP $got"
  else
    fail "$label" "expected HTTP $want, got $got"
  fi
}

# expect_header <label> <url> <header-name> <substring>
expect_header() {
  local label="$1" url="$2" name="$3" want="$4" line
  curl -s -o /dev/null -D "$WORK/headers" "$url"
  line="$(LC_ALL=C grep -i "^$name:" "$WORK/headers" | tr -d '\r')"
  case "$line" in
    *"$want"*) echo "  PASS [$label] $name carries $want" ;;
    "")        fail "$label" "$name absent from the response to $url" ;;
    *)         fail "$label" "$name did not carry $want; got: $line" ;;
  esac
}

# expect_security_headers <label> <url> - the four repeated in three locations
expect_security_headers() {
  expect_header "$1" "$2" "X-Content-Type-Options" "nosniff"
  expect_header "$1" "$2" "X-Frame-Options" "DENY"
  expect_header "$1" "$2" "Referrer-Policy" "strict-origin-when-cross-origin"
  expect_header "$1" "$2" "Permissions-Policy" "camera=()"
}

if [ "${1:-}" = "--selftest" ]; then
  SELF="${2:?Usage: verify-image-contract.sh --selftest <base-url>}"
  SELF="${SELF%/}"
  echo "==> [verify-image-contract] selftest against $SELF: all three must fail"
  QUIET_FAIL=1
  expect_status "selftest status" "$SELF/" "599"
  expect_header "selftest absent header" "$SELF/" "X-Not-A-Real-Header" "anything"
  expect_header "selftest wrong value" "$SELF/" "X-Frame-Options" "SAMEORIGIN"
  if [ "$FAILURES" -ne 3 ]; then
    echo "::error::selftest: expected 3 recorded failures, got $FAILURES"
    exit 1
  fi
  echo "PASS [selftest] each comparison reports a failure and the count survives"
  exit 0
fi

BASE="${1:?Usage: verify-image-contract.sh <base-url> | --selftest}"
ROOT="${BASE%/}"
echo "==> [verify-image-contract] $ROOT"

# The app shell, reached directly and through the SPA fallback. A deep link is
# a route the bundle owns and the filesystem does not; it must serve the shell.
expect_status "root" "$ROOT/" "200"
expect_security_headers "root" "$ROOT/"
expect_header "root" "$ROOT/" "Cache-Control" "no-cache"

expect_status "index.html" "$ROOT/index.html" "200"
expect_header "index.html" "$ROOT/index.html" "Cache-Control" "no-cache"

expect_status "spa fallback" "$ROOT/inventory" "200"
expect_header "spa fallback" "$ROOT/inventory" "Content-Type" "text/html"
expect_security_headers "spa fallback" "$ROOT/inventory"

# A missing asset must 404 rather than fall back to the shell, or a stale
# bundle reference returns HTML that the browser then fails to parse as JS.
expect_status "missing asset" "$ROOT/assets/does-not-exist-xyz.js" "404"
expect_security_headers "missing asset" "$ROOT/assets/does-not-exist-xyz.js"

# The content-hashed entry bundle, discovered rather than named, because its
# name changes on every build.
curl -fsS -o "$WORK/index.html" "$ROOT/"
ENTRY="$(LC_ALL=C grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' "$WORK/index.html" | head -n1)"
if [ -z "$ENTRY" ]; then
  fail "entry asset" "the served index.html references no /assets/index-*.js bundle"
else
  echo "  entry bundle: $ENTRY"
  expect_status "entry asset" "$ROOT$ENTRY" "200"
  expect_header "entry asset" "$ROOT$ENTRY" "Cache-Control" "max-age=31536000"
  expect_header "entry asset" "$ROOT$ENTRY" "Cache-Control" "immutable"
  expect_security_headers "entry asset" "$ROOT$ENTRY"
fi

if [ "$FAILURES" -ne 0 ]; then
  echo "::error::[verify-image-contract] $FAILURES assertion(s) failed"
  exit 1
fi
echo "PASS [verify-image-contract] the image serves the contract in ops/nginx"
