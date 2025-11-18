#!/usr/bin/env bash
set -euo pipefail

# Usage: build-openapi-docs.sh PROJECT_DIR
PROJECT_DIR="${1:-.}"

OPENAPI_YAML="$PROJECT_DIR/docs/backend/api/openapi.yaml"
OUTPUT_DIR="$PROJECT_DIR/target/docs"
API_OUT="$OUTPUT_DIR/backend/api"
TEMPLATES_SRC="$PROJECT_DIR/docs/templates"

echo "==> [build-openapi-docs] PROJECT_DIR=$PROJECT_DIR"
echo "    OpenAPI spec: $OPENAPI_YAML"
echo "    Output dir:   $OUTPUT_DIR"

mkdir -p "$API_OUT"
mkdir -p "$OUTPUT_DIR/templates"

# Copy CSS/HTML templates if they exist
if [ -d "$TEMPLATES_SRC" ]; then
  cp -R "$TEMPLATES_SRC/." "$OUTPUT_DIR/templates/" || true
fi

# Copy root index.html from templates to output root (landing page)
if [ -f "$TEMPLATES_SRC/index.html" ]; then
  cp "$TEMPLATES_SRC/index.html" "$OUTPUT_DIR/index.html"
  echo "✓ Copied templates/index.html to output root"
fi

# Check OpenAPI YAML
if [ ! -f "$OPENAPI_YAML" ]; then
  echo "❌ OpenAPI YAML not found at $OPENAPI_YAML"
  exit 1
fi

echo "✓ Found OpenAPI YAML"

# Generate ReDoc HTML (index.html under /api/)
redocly build-docs "$OPENAPI_YAML" -o "$API_OUT/index.html"
echo "✓ ReDoc HTML generated at $API_OUT/index.html"

# Copy JaCoCo HTML into docs tree if present
JACOCO_SRC="$PROJECT_DIR/target/site/jacoco"
COVERAGE_OUT="$OUTPUT_DIR/backend/coverage"

if [ -d "$JACOCO_SRC" ]; then
  mkdir -p "$COVERAGE_OUT"
  cp -R "$JACOCO_SRC/." "$COVERAGE_OUT/"
  echo "✓ Copied JaCoCo report from $JACOCO_SRC to $COVERAGE_OUT"
else
  echo "⚠️  No JaCoCo report directory at $JACOCO_SRC (skipping coverage copy)"
fi
