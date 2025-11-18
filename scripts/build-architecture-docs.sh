#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-.}"
DOCS_DIR="$PROJECT_DIR/docs"
OUTPUT_DIR="$PROJECT_DIR/target/docs"
TEMPLATE="$DOCS_DIR/templates/app-docs.html"   # already created
LUA_FILTER="$PROJECT_DIR/scripts/md-to-html-links.lua"

mkdir -p "$OUTPUT_DIR/architecture" "$OUTPUT_DIR/frontend/architecture"

# Lua filter: convert .md links → .html and mermaid blocks → <div class="mermaid">
cat > "$LUA_FILTER" << 'EOF'
function Link(el)
  if el.target:match("%.md$") then
    el.target = el.target:gsub("%.md$", ".html")
  elseif el.target:match("%.md#") then
    el.target = el.target:gsub("%.md#", ".html#")
  end
  return el
end

function CodeBlock(el)
  if el.classes:includes('mermaid') then
    local html = '<div class="mermaid">\n' .. el.text .. '\n</div>'
    return pandoc.RawBlock('html', html)
  end
  return el
end
EOF

convert_arch() {
  local CONTEXT="$1"   # backend or frontend
  local SRC_DIR="$DOCS_DIR/$CONTEXT/architecture"
  # Output: backend/ → architecture/, frontend/ → frontend/architecture/
  local DST_DIR="$OUTPUT_DIR/architecture"
  if [ "$CONTEXT" = "frontend" ]; then
    DST_DIR="$OUTPUT_DIR/frontend/architecture"
  fi

  if [ ! -d "$SRC_DIR" ]; then
    echo "ℹ️  No architecture docs directory at $SRC_DIR (skipping)"
    return 0
  fi

  local md_count
  md_count=$(find "$SRC_DIR" -type f -name "*.md" 2>/dev/null | wc -l)
  
  if [ "$md_count" -eq 0 ]; then
    echo "ℹ️  No .md files found in $SRC_DIR (skipping)"
    return 0
  fi

  find "$SRC_DIR" -type f -name "*.md" | while read -r md; do
    rel="${md#$SRC_DIR/}"
    out="$DST_DIR/${rel%.md}.html"
    mkdir -p "$(dirname "$out")"

    pandoc "$md" \
      --from markdown \
      --to html \
      --template "$TEMPLATE" \
      --lua-filter "$LUA_FILTER" \
      --metadata=title:"${CONTEXT^} · ${rel%.md}" \
      --toc \
      --toc-depth=3 \
      --standalone \
      -o "$out"

    echo "✓ [$CONTEXT] $md → $out"
  done
}

echo "==> [build-architecture-docs] Building architecture documentation..."
convert_arch backend
convert_arch frontend
echo "✓ Architecture docs build complete"
