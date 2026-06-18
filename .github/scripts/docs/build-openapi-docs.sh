#!/usr/bin/env bash
# =============================================================================
# build-openapi-docs.sh — Generates ReDoc HTML from the OpenAPI spec
# Usage: .github/scripts/build-openapi-docs.sh <project-dir>
#
# Copies HTML templates and JaCoCo coverage into the output tree.
# JaCoCo copy is skipped silently on docs-only builds (no prior backend CI).
# Prerequisites: redocly CLI
# =============================================================================
set -euo pipefail

PROJECT_DIR="${1:?Usage: build-openapi-docs.sh <project-dir>}"

OPENAPI_YAML="$PROJECT_DIR/docs/backend/api/openapi.yaml"
OUTPUT_DIR="$PROJECT_DIR/target/docs"
API_OUT="$OUTPUT_DIR/backend/api"
TEMPLATES_SRC="$PROJECT_DIR/docs/templates"

echo "==> [build-openapi-docs] PROJECT_DIR=$PROJECT_DIR"
mkdir -p "$API_OUT" "$OUTPUT_DIR/templates"

# Templates are shared across all generated pages via relative paths
if [ -d "$TEMPLATES_SRC" ]; then
  cp -R "$TEMPLATES_SRC/." "$OUTPUT_DIR/templates/"
  echo "✓ Templates copied"
fi

# Landing page sits at the docs site root, outside the templates/ subdirectory
if [ -f "$TEMPLATES_SRC/index.html" ]; then
  cp "$TEMPLATES_SRC/index.html" "$OUTPUT_DIR/index.html"
  echo "✓ Landing page copied"
fi

if [ ! -f "$OPENAPI_YAML" ]; then
  echo "::error::OpenAPI YAML not found at $OPENAPI_YAML"
  exit 1
fi

redocly build-docs "$OPENAPI_YAML" -o "$API_OUT/index.html"
echo "✓ ReDoc HTML generated"

# JaCoCo is only present after backend CI — absent on docs-only pushes
JACOCO_SRC="$PROJECT_DIR/target/site/jacoco"
if [ -d "$JACOCO_SRC" ] && [ "$(ls -A "$JACOCO_SRC")" ]; then
  mkdir -p "$OUTPUT_DIR/backend/coverage"
  cp -R "$JACOCO_SRC/." "$OUTPUT_DIR/backend/coverage/"
  echo "✓ JaCoCo coverage copied ($(ls -1 "$OUTPUT_DIR/backend/coverage" | wc -l) files)"
else
  echo "ℹ️  No JaCoCo report found — skipping coverage copy"
fi