#!/usr/bin/env bash
# =============================================================================
# build-architecture-docs.sh — Converts architecture markdown guides to HTML
# Usage: .github/scripts/build-architecture-docs.sh <project-dir>
#
# Expects the Lua filter at <project-dir>/scripts/md-to-html-links.lua,
# written by build-docs.sh before this script is called.
# Prerequisites: pandoc
# =============================================================================
set -euo pipefail

PROJECT_DIR="${1:?Usage: build-architecture-docs.sh <project-dir>}"

DOCS_DIR="$PROJECT_DIR/docs"
OUTPUT_DIR="$PROJECT_DIR/target/docs"
TEMPLATE="$DOCS_DIR/_theme/app-docs.html"
LUA_FILTER="$PROJECT_DIR/scripts/md-to-html-links.lua"

mkdir -p "$OUTPUT_DIR/backend/architecture" "$OUTPUT_DIR/frontend/architecture"

# Converts all .md files in docs/<context>/architecture/ to HTML, preserving
# subdirectory structure. Output mirrors the deployed URL tree:
#   backend  → target/docs/backend/architecture/
#   frontend → target/docs/frontend/architecture/
convert_arch() {
  local CONTEXT="$1"
  local SRC_DIR="$DOCS_DIR/$CONTEXT/architecture"
  local DST_DIR="$OUTPUT_DIR/$CONTEXT/architecture"

  if [ ! -d "$SRC_DIR" ]; then
    echo "ℹ️  No architecture docs at $SRC_DIR — skipping $CONTEXT"
    return 0
  fi

  local count
  count=$(find "$SRC_DIR" -type f -name "*.md" | wc -l)
  [ "$count" -eq 0 ] && echo "ℹ️  No .md files in $SRC_DIR — skipping $CONTEXT" && return 0

  echo "==> [build-architecture-docs] Converting $count file(s) for $CONTEXT"

  find "$SRC_DIR" -type f -name "*.md" | while read -r md; do
    rel="${md#$SRC_DIR/}"
    out="$DST_DIR/${rel%.md}.html"
    mkdir -p "$(dirname "$out")"

    # German pages (-de suffix) set lang:de so the template renders <html lang="de">.
    local lang="en"
    case "${rel%.md}" in
      *-de) lang="de" ;;
    esac

    pandoc "$md" \
      --from markdown --to html \
      --template "$TEMPLATE" \
      --lua-filter "$LUA_FILTER" \
      --metadata=title:"${CONTEXT^} · ${rel%.md}" \
      --metadata=lang:"$lang" \
      --toc --toc-depth=3 --standalone \
      -o "$out"
    echo "  ✓ $rel ($lang)"
  done
}

convert_arch backend
convert_arch frontend
echo "✓ Architecture docs complete"
