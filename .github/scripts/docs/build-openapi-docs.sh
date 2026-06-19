#!/usr/bin/env bash
# =============================================================================
# build-openapi-docs.sh — Generates ReDoc HTML from the OpenAPI spec
# Usage: .github/scripts/docs/build-openapi-docs.sh <project-dir>
#
# ReDoc output is fully self-contained (its own CSS/JS), so this script does
# not touch the docs theme. Theme assets, landing pages, and JaCoCo coverage
# are handled by build-docs.sh.
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
redocly build-docs "$OPENAPI_YAML" -o "$API_OUT/index.html"
echo "✓ ReDoc HTML generated at backend/api/index.html"
