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
# the caching headers, the five security headers that ops/nginx/default.conf
# repeats in three locations because add_header does not accumulate across
# levels, and the plain-http redirect. That repetition is the failure this gate
# exists for: a location added without its copy of the five serves them
# silently missing.
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
# a wrong status, an absent header, a present header carrying the wrong value,
# a host that is not redirected, a redirect to the wrong place, a response that
# is not compressed -- and exits 1 unless all six are reported. It runs against
# the same server, on the same runner, immediately before the real pass, so the
# gate proves it can still fail every time it is trusted.
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

# expect_status <label> <url> <expected-code> [host] [forwarded-proto]
expect_status() {
  local label="$1" url="$2" want="$3" host="${4:-}" proto="${5:-}" got
  local -a hdr=()
  if [ -n "$host" ]; then hdr+=(-H "Host: $host"); fi
  if [ -n "$proto" ]; then hdr+=(-H "X-Forwarded-Proto: $proto"); fi
  got="$(curl -s -o "$WORK/body" -w '%{http_code}' "${hdr[@]}" "$url")"
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

# expect_redirect <label> <url> <host> <location> [forwarded-proto] - a 301 to
# exactly <location>
expect_redirect() {
  local label="$1" url="$2" host="$3" want="$4" proto="${5:-}" fmt out got loc
  local -a hdr=(-H "Host: $host")
  if [ -n "$proto" ]; then hdr+=(-H "X-Forwarded-Proto: $proto"); fi
  fmt='%{http_code} %{redirect_url}'
  out="$(curl -s -o /dev/null -w "$fmt" "${hdr[@]}" "$url")"
  got="${out%% *}"
  loc="${out#* }"
  if [ "$got" != "301" ]; then
    fail "$label" "expected HTTP 301 for Host $host, got $got"
  elif [ "$loc" != "$want" ]; then
    fail "$label" "expected Location $want for Host $host, got: $loc"
  else
    echo "  PASS [$label] HTTP 301 to $want"
  fi
}

# expect_gzip <label> <url> [accept] - served gzip-encoded to a client sending
# Accept-Encoding <accept> (default gzip; the selftest sends identity)
expect_gzip() {
  local label="$1" url="$2" accept="${3:-gzip}" enc
  curl -s -o /dev/null -D "$WORK/headers" -H "Accept-Encoding: $accept" "$url"
  enc="$(LC_ALL=C grep -i '^content-encoding:' "$WORK/headers" || true)"
  case "$enc" in
    *gzip*) echo "  PASS [$label] Content-Encoding: gzip" ;;
    *) fail "$label" "expected Content-Encoding gzip, got: ${enc:-none}" ;;
  esac
}

# expect_security_headers <label> <url> - the five repeated in three locations
expect_security_headers() {
  expect_header "$1" "$2" "X-Content-Type-Options" "nosniff"
  expect_header "$1" "$2" "X-Frame-Options" "DENY"
  expect_header "$1" "$2" "Referrer-Policy" "strict-origin-when-cross-origin"
  expect_header "$1" "$2" "Permissions-Policy" "camera=()"
  expect_header "$1" "$2" "Strict-Transport-Security" "max-age=31536000"
}

if [ "${1:-}" = "--selftest" ]; then
  SELF="${2:?Usage: verify-image-contract.sh --selftest <base-url>}"
  SELF="${SELF%/}"
  echo "==> [verify-image-contract] selftest against $SELF: all six must fail"
  QUIET_FAIL=1
  expect_status "selftest status" "$SELF/" "599"
  expect_header "selftest absent header" "$SELF/" "X-Not-A-Real-Header" "anything"
  expect_header "selftest wrong value" "$SELF/" "X-Frame-Options" "SAMEORIGIN"
  BAD="https://example.invalid/"
  expect_redirect "selftest no redirect" "$SELF/" "127.0.0.1" "$BAD"
  expect_redirect "selftest wrong location" "$SELF/" "smartsupplypro.de" "$BAD"
  expect_gzip "selftest not compressed" "$SELF/" "identity"
  if [ "$FAILURES" -ne 6 ]; then
    echo "::error::selftest: expected 6 recorded failures, got $FAILURES"
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

# The bare apex redirects to the canonical host with path and query intact;
# the canonical host itself is served, not caught by the redirect block.
APEX_WANT="https://www.smartsupplypro.de/inventory?page=2"
expect_redirect "apex redirect" "$ROOT/inventory?page=2" "smartsupplypro.de" "$APEX_WANT"
expect_status "canonical host" "$ROOT/" "200" "www.smartsupplypro.de"

# TLS ends at the Koyeb edge, which reports the visitor's scheme in
# X-Forwarded-Proto. A plain-http visitor is sent to https with path and query
# intact; an https visitor is served; a request without the header (the
# HEALTHCHECK, every other check here) is served too, so the redirect cannot
# loop if the platform stops sending it.
HTTP_WANT="https://www.smartsupplypro.de/inventory?page=2"
expect_redirect "http visitor" "$ROOT/inventory?page=2" "www.smartsupplypro.de" "$HTTP_WANT" "http"
expect_status "https visitor" "$ROOT/" "200" "www.smartsupplypro.de" "https"

expect_status "index.html" "$ROOT/index.html" "200"
expect_header "index.html" "$ROOT/index.html" "Cache-Control" "no-cache"

# The CSP rides on the app shell only, so every route that serves it must
# carry it: the root, a deep link and the GET of /logout.
CSP_CORE="default-src 'self'; script-src 'self';"
expect_header "csp root" "$ROOT/" "Content-Security-Policy-Report-Only" "$CSP_CORE"
expect_header "csp deep link" "$ROOT/inventory" "Content-Security-Policy-Report-Only" "$CSP_CORE"
expect_header "csp logout get" "$ROOT/logout" "Content-Security-Policy-Report-Only" "$CSP_CORE"

expect_status "spa fallback" "$ROOT/inventory" "200"
expect_header "spa fallback" "$ROOT/inventory" "Content-Type" "text/html"
expect_security_headers "spa fallback" "$ROOT/inventory"

# A GET of /logout (a reload or a typed URL) serves the shell from this image;
# only the logout form's POST is proxied. The security headers tell the two
# apart: proxied responses carry none of the four nginx-only ones.
expect_status "logout get" "$ROOT/logout" "200"
expect_header "logout get" "$ROOT/logout" "Cache-Control" "no-cache"
expect_security_headers "logout get" "$ROOT/logout"

# Compression comes from one gzip_types list in nginx.conf; a second list in a
# server block replaces it rather than adding to it. A locale file stands for
# the JSON and SVG types, the entry bundle for JavaScript.
expect_gzip "locale json" "$ROOT/locales/de/common.json"

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
  expect_gzip "entry asset" "$ROOT$ENTRY"
  expect_security_headers "entry asset" "$ROOT$ENTRY"
fi

if [ "$FAILURES" -ne 0 ]; then
  echo "::error::[verify-image-contract] $FAILURES assertion(s) failed"
  exit 1
fi
echo "PASS [verify-image-contract] the image serves the contract in ops/nginx"
