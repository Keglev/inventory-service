#!/usr/bin/env bash
# =============================================================================
# build-openapi-docs.sh — Generates ReDoc HTML from the OpenAPI spec
# Usage: .github/scripts/docs/build-openapi-docs.sh <project-dir>
#
# The generated page renders the spec in the browser with redoc.standalone.js,
# loaded from Redocly's CDN at one version with an integrity hash (the CLI
# writes that tag). --disableGoogleFont drops the stylesheet link to
# fonts.googleapis.com: without it every visitor's browser contacts Google, a
# transfer a German court has ruled unlawful without consent (LG Muenchen I,
# 3 O 17493/20). ReDoc then uses the browser's sans-serif fonts. Theme assets,
# landing pages and JaCoCo coverage are handled by build-docs.sh.
#
# Failure mode: exits 1 when the spec is missing; set -e stops the run when
# redocly cannot build the page.
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
redocly build-docs "$OPENAPI_YAML" --disableGoogleFont -o "$API_OUT/index.html"

# Inject a fixed-position "back to docs" link into the self-contained ReDoc page.
# Same pattern as the JaCoCo coverage injection in docs-deploy.yml, applied
# at build time because this file is regenerated on every docs build.
sed -i 's|<body[^>]*>|&<a id="back-to-docs" href="/inventory-service/" style="position:fixed;top:8px;right:12px;z-index:9999;font:14px sans-serif;padding:6px 12px;background:#2563eb;color:#fff;text-decoration:none;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.2);">\&larr; Back to docs</a>|' "$API_OUT/index.html"
echo "✓ ReDoc HTML generated at backend/api/index.html (back-to-docs link injected)"
