#!/usr/bin/env bash
# =============================================================================
# build-openapi-docs.sh — Generates ReDoc HTML from the OpenAPI spec
# Usage: .github/scripts/docs/build-openapi-docs.sh <project-dir>
#
# The CLI embeds the ReDoc bundle in the page (--inlineBundle), so the page
# loads no script from Redocly's CDN. Visitor data stays on this site, as German
# data-protection law expects without consent (TDDDG section 25, GDPR):
#   - REDOCLY_TELEMETRY=off stops the CLI's own telemetry and builds the page
#     with telemetry off; --openapi.disableTelemetry sets the same switch in
#     the page, so neither depends on the other;
#   - a CSP meta tag allows connections, images and fonts from this site only.
#     The browser then refuses any request to otel.cloud.redocly.com even if a
#     later ReDoc ignores the switch, and never loads the "API docs by Redocly"
#     logo from cdn.redoc.ly; ReDoc's onError handler removes the image.
# GitHub Pages sets no headers, so the policy has to be a meta tag. The page
# also hides the then-empty "API docs by" label, and the shared back link moves
# into its slot at the bottom left: ReDoc's own controls use both top corners.
#
# Failure mode: exits 1 when the spec is missing, or when the page lacks the
# telemetry switch, loads a script or resource from another site, or carries
# the policy after its first script; set -e stops the run when redocly fails.
# Prerequisites: redocly CLI
# =============================================================================
set -euo pipefail

PROJECT_DIR="${1:?Usage: build-openapi-docs.sh <project-dir>}"

OPENAPI_YAML="$PROJECT_DIR/docs/backend/api/openapi.yaml"
API_OUT="$PROJECT_DIR/target/docs/backend/api"

echo "==> [build-openapi-docs] PROJECT_DIR=$PROJECT_DIR"

if [ ! -f "$OPENAPI_YAML" ]; then
  echo "::error::OpenAPI YAML not found at $OPENAPI_YAML"
  exit 1
fi

mkdir -p "$API_OUT"
PAGE="$API_OUT/index.html"
REDOCLY_TELEMETRY=off redocly build-docs "$OPENAPI_YAML" --inlineBundle \
  --openapi.disableTelemetry=true -o "$PAGE"

if ! grep -q '"disableTelemetry":true' "$PAGE"; then
  echo "::error::the generated page does not have telemetry switched off"
  exit 1
fi
if grep -qE '<script[^>]+src="https?://|<link[^>]+href="https?://|from "https?://' "$PAGE"; then
  echo "::error::the generated page loads a script or resource from another site"
  exit 1
fi
# First <head> only: the inlined bundle contains the string "<head>" as well.
CSP="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'"
PAGE_CSS='span:has(>a[href="https://redocly.com/redoc/"]){visibility:hidden!important}#back-to-docs{top:auto!important;right:auto!important;bottom:11px!important;left:20px!important}'
sed -i "0,/<head>/s||<head><meta http-equiv=\"Content-Security-Policy\" content=\"$CSP\"><style>$PAGE_CSS</style>|" "$PAGE"
META_AT="$(grep -bo 'http-equiv="Content-Security-Policy"' "$PAGE" | head -1 | cut -d: -f1)"
SCRIPT_AT="$(grep -bo '<script' "$PAGE" | head -1 | cut -d: -f1)"
if [ -z "$META_AT" ] || [ -z "$SCRIPT_AT" ] || [ "$META_AT" -gt "$SCRIPT_AT" ]; then
  echo "::error::the CSP meta tag is missing or comes after the first script"
  exit 1
fi
echo "✓ ReDoc page built with its bundle inline, telemetry off and connections limited to the site"

# The self-contained ReDoc page loads none of the site's CSS; it gets the same
# "Back to docs" link as the coverage reports, from one script.
bash "$(dirname "$0")/inject-back-link.sh" "$API_OUT/index.html"
echo "✓ ReDoc HTML generated at backend/api/index.html (back-to-docs link injected)"
