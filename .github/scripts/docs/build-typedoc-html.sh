#!/usr/bin/env bash
# =============================================================================
# build-typedoc-html.sh — Converts TypeDoc markdown output to HTML pages
# Usage: .github/scripts/docs/build-typedoc-html.sh <project-dir> <lua-filter>
#
# Skips when the TypeDoc markdown directory is absent (docs-pr-check, and any
# run that does not build TypeDoc). Fails when that directory has no README.md,
# the API index, rather than publishing pages without one.
# Prerequisites: pandoc, Lua filter written by build-docs.sh
# =============================================================================
set -euo pipefail

PROJECT_DIR="${1:?Usage: build-typedoc-html.sh <project-dir> <lua-filter>}"
LUA_FILTER="${2:?Usage: build-typedoc-html.sh <project-dir> <lua-filter>}"

TYPEDOC_MD_DIR="$PROJECT_DIR/frontend/docs"
API_OUT="$PROJECT_DIR/target/docs/frontend/api"
TEMPLATE="$PROJECT_DIR/docs/_theme/app-api.html"

# Pandoc resolves the $nav()$ partial from <data-dir>/templates/; setting this
# explicitly keeps partial resolution working across pandoc versions.
DATA_DIR="$PROJECT_DIR/docs/_theme"

if [ ! -d "$TYPEDOC_MD_DIR" ]; then
  echo "ℹ️  No TypeDoc markdown at $TYPEDOC_MD_DIR — skipping"
  exit 0
fi

echo "==> [build-typedoc-html] Converting markdown to HTML"
mkdir -p "$API_OUT"

# Convert each markdown file, preserving the relative directory structure.
find "$TYPEDOC_MD_DIR" -type f -name "*.md" | while read -r md; do
  rel="${md#$TYPEDOC_MD_DIR/}"
  out="$API_OUT/${rel%.md}.html"
  mkdir -p "$(dirname "$out")"
  pandoc "$md" \
    --from gfm --to html \
    --data-dir="$DATA_DIR" \
    --template "$TEMPLATE" \
    --lua-filter "$LUA_FILTER" \
    --metadata=title:"Frontend API · ${rel%.md}" \
    --standalone --toc --toc-depth=3 \
    -o "$out"
done

# Landing page: TypeDoc's own root README, the complete module index with
# working relative links. The markdown plugin always writes it; a placeholder
# page used to stand in when it was missing, which would have published an
# index without links instead of failing (W12).
if [ ! -f "$TYPEDOC_MD_DIR/README.md" ]; then
  echo "::error::TypeDoc wrote no README.md in $TYPEDOC_MD_DIR: no index for the API pages"
  exit 1
fi
pandoc "$TYPEDOC_MD_DIR/README.md" \
  --from gfm --to html \
  --data-dir="$DATA_DIR" \
  --template "$TEMPLATE" \
  --lua-filter "$LUA_FILTER" \
  --metadata=title:"Frontend API" \
  --standalone --toc --toc-depth=3 \
  -o "$API_OUT/index.html"

echo "✓ TypeDoc HTML complete"