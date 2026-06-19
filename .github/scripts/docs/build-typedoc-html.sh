#!/usr/bin/env bash
# =============================================================================
# build-typedoc-html.sh — Converts TypeDoc markdown output to HTML pages
# Usage: .github/scripts/docs/build-typedoc-html.sh <project-dir> <lua-filter>
#
# Non-blocking: skips silently if the TypeDoc markdown directory is absent.
# Prerequisites: pandoc, Lua filter written by build-docs.sh
# =============================================================================
set -euo pipefail

PROJECT_DIR="${1:?Usage: build-typedoc-html.sh <project-dir> <lua-filter>}"
LUA_FILTER="${2:?Usage: build-typedoc-html.sh <project-dir> <lua-filter>}"

TYPEDOC_MD_DIR="$PROJECT_DIR/frontend/docs"
API_OUT="$PROJECT_DIR/target/docs/frontend/api"
TEMPLATE="$PROJECT_DIR/docs/_theme/app-api.html"

if [ ! -d "$TYPEDOC_MD_DIR" ]; then
  echo "ℹ️  No TypeDoc markdown at $TYPEDOC_MD_DIR — skipping"
  exit 0
fi

echo "==> [build-typedoc-html] Converting markdown to HTML"
mkdir -p "$API_OUT"

# Convert each markdown file, preserving the relative directory structure.
find "$TYPEDOC_MD_DIR" -type f -name "*.md" | while read -r md; do
  rel="${md#$TYPEDOC_MD_DIR/}"
  rel="${rel#api/}"
  out="$API_OUT/${rel%.md}.html"
  mkdir -p "$(dirname "$out")"
  pandoc "$md" \
    --from gfm --to html \
    --template "$TEMPLATE" \
    --lua-filter "$LUA_FILTER" \
    --metadata=title:"Frontend API · ${rel%.md}" \
    --standalone --toc --toc-depth=3 \
    -o "$out"
done

# Static landing page — TypeDoc generates none in markdown mode with readme:none.
cat > "$API_OUT/index.md" << 'MD'
# Frontend API
Generated API reference for the Smart Supply Pro frontend.
Browse by module using the navigation panel.
MD
pandoc "$API_OUT/index.md" \
  --from gfm --to html \
  --template "$TEMPLATE" \
  --lua-filter "$LUA_FILTER" \
  --metadata=title:"Frontend API" \
  --standalone -o "$API_OUT/index.html"
rm -f "$API_OUT/index.md"

echo "✓ TypeDoc HTML complete"
