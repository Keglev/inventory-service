#!/usr/bin/env bash
# =============================================================================
# build-architecture-docs.sh — Converts architecture markdown guides to HTML
# Usage: .github/scripts/docs/build-architecture-docs.sh <project-dir>
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

# Pandoc resolves the $nav()$ partial from <data-dir>/templates/. Setting this
# explicitly makes partial resolution work the same on old and new pandoc
# (older versions ignore the template's own directory for partials).
DATA_DIR="$DOCS_DIR/_theme"

# Contexts to convert, given as arguments after the project directory. Absent,
# the two architecture trees are converted, which is what docs-pr-check.yml
# relies on.
if [ "$#" -gt 1 ]; then
  CONTEXTS=("${@:2}")
else
  CONTEXTS=(backend frontend)
fi

# A context resolves to four things: a source directory, a destination under
# target/docs, a sidebar and a title prefix. Two contexts share the shape
# docs/<name>/architecture; the system-wide decisions index does not, because it
# sits at docs/decisions with no tier above it. Interpolating the context name
# into a path therefore cannot reach every subtree this script builds, so the
# mapping is written out as a table. Adding a subtree means adding a case here,
# not teaching the callers a new path shape.
# Sets SRC_DIR, DST_DIR, NAV_META and TITLE_PREFIX; fails on an unknown name,
# which the previous code reported as a missing directory and skipped.
resolve_context() {
  case "$1" in
    backend)
      SRC_DIR="$DOCS_DIR/backend/architecture"
      DST_DIR="$OUTPUT_DIR/backend/architecture"
      NAV_META=(--metadata=backendnav:true)
      TITLE_PREFIX="Backend"
      ;;
    frontend)
      SRC_DIR="$DOCS_DIR/frontend/architecture"
      DST_DIR="$OUTPUT_DIR/frontend/architecture"
      NAV_META=()
      TITLE_PREFIX="Frontend"
      ;;
    decisions)
      SRC_DIR="$DOCS_DIR/decisions"
      DST_DIR="$OUTPUT_DIR/decisions"
      NAV_META=(--metadata=decisionsnav:true)
      TITLE_PREFIX="Decisions"
      ;;
    *)
      echo "✗ build-architecture-docs: unknown context '$1'" >&2
      return 1
      ;;
  esac
}

# Converts all .md files in the context's source directory to HTML, preserving
# subdirectory structure. Output mirrors the deployed URL tree:
#   backend   → target/docs/backend/architecture/
#   frontend  → target/docs/frontend/architecture/
#   decisions → target/docs/decisions/
convert_arch() {
  local CONTEXT="$1"
  resolve_context "$CONTEXT"

  if [ ! -d "$SRC_DIR" ]; then
    echo "ℹ️  No architecture docs at $SRC_DIR — skipping $CONTEXT"
    return 0
  fi

  local count
  count=$(find "$SRC_DIR" -type f -name "*.md" | wc -l)
  [ "$count" -eq 0 ] && echo "ℹ️  No .md files in $SRC_DIR — skipping $CONTEXT" && return 0

  # Created only after both guards have passed. The caller loop used to create
  # it before calling this function, which left an empty target/docs/<context>
  # behind for a selected context whose source is absent. An empty built subtree
  # is indistinguishable from a rebuilt one to assemble-site.sh, which would then
  # replace the published pages with nothing.
  mkdir -p "$DST_DIR"

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
      --data-dir="$DATA_DIR" \
      --template "$TEMPLATE" \
      --lua-filter "$LUA_FILTER" \
      --metadata=title:"$TITLE_PREFIX · ${rel%.md}" \
      --metadata=lang:"$lang" \
      "${NAV_META[@]}" \
      --toc --toc-depth=3 --standalone \
      -o "$out"
    echo "  ✓ $rel ($lang)"
  done
}

# Only the selected contexts are built, and only a context that produced pages
# gets a directory. convert_arch creates its own destination after its guards.
for CTX in "${CONTEXTS[@]}"; do
  convert_arch "$CTX"
done
echo "✓ Architecture docs complete"