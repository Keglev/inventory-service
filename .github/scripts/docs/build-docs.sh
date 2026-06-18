#!/usr/bin/env bash
# =============================================================================
# build-docs.sh — Documentation build orchestrator
# Usage: .github/scripts/build-docs.sh <project-dir>
#
# Writes the Lua filter, then delegates to sibling scripts for each doc type.
# Prerequisites: pandoc, redocly CLI, npx
# =============================================================================
set -euo pipefail

PROJECT_DIR="${1:?Usage: build-docs.sh <project-dir>}"
OUTPUT_DIR="$PROJECT_DIR/target/docs"
LUA_FILTER="$PROJECT_DIR/scripts/md-to-html-links.lua"

# Resolve sibling script directory at runtime — safe regardless of working directory
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# Lua filter — owned here to avoid duplication across sibling scripts.
# Converts .md links to .html and wraps mermaid blocks in a div for the browser.
# ---------------------------------------------------------------------------
write_lua_filter() {
  mkdir -p "$PROJECT_DIR/scripts"
  cat > "$LUA_FILTER" << 'LUA'
function Link(el)
  while el.target:match("^%.%./") do
    el.target = el.target:gsub("^%.%./", "")
  end
  el.target = el.target:gsub("^api/", "")
  el.target = el.target:gsub("^%./api/", "")
  el.target = el.target:gsub("%.md#", ".html#")
  el.target = el.target:gsub("%.md$", ".html")
  return el
end

function CodeBlock(el)
  if el.classes:includes('mermaid') then
    local html = '<div class="mermaid">\n' .. el.text .. '\n</div>'
    return pandoc.RawBlock('html', html)
  end
  return el
end
LUA
  echo "✓ Lua filter written"
}

copy_frontend_coverage() {
  local SRC="$PROJECT_DIR/target/frontend/coverage"
  local DEST="$OUTPUT_DIR/frontend/coverage"
  if [ -d "$SRC" ] && [ "$(ls -A "$SRC")" ]; then
    mkdir -p "$DEST"
    cp -R "$SRC/." "$DEST/"
    echo "✓ Frontend coverage copied"
  else
    echo "ℹ️  No frontend coverage found — skipping"
  fi
}

echo "==> [build-docs] Starting (PROJECT_DIR=$PROJECT_DIR)"
mkdir -p "$OUTPUT_DIR"

write_lua_filter
bash "$SCRIPTS_DIR/build-openapi-docs.sh"      "$PROJECT_DIR"
bash "$SCRIPTS_DIR/build-typedoc-html.sh"      "$PROJECT_DIR" "$LUA_FILTER"
bash "$SCRIPTS_DIR/build-architecture-docs.sh" "$PROJECT_DIR"
copy_frontend_coverage

echo ""
echo "✓ Docs build complete — $(find "$OUTPUT_DIR" -type f | wc -l) files, $(du -sh "$OUTPUT_DIR" | cut -f1)"