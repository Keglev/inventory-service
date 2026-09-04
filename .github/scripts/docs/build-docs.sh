#!/usr/bin/env bash
# =============================================================================
# build-docs.sh — Documentation build orchestrator
# Usage: .github/scripts/docs/build-docs.sh <project-dir>
#
# Copies the Lua filter into place, builds the theme assets, then delegates to
# sibling scripts for each doc type. Output tree mirrors the deployed site under
# <project-dir>/target/docs.
# Prerequisites: pandoc, redocly CLI, npx
# =============================================================================
set -euo pipefail

PROJECT_DIR="${1:?Usage: build-docs.sh <project-dir>}"
DOCS_DIR="$PROJECT_DIR/docs"
THEME_DIR="$DOCS_DIR/_theme"
OUTPUT_DIR="$PROJECT_DIR/target/docs"
ASSETS_DIR="$OUTPUT_DIR/assets"
LUA_FILTER="$PROJECT_DIR/scripts/md-to-html-links.lua"

# Resolve sibling script directory at runtime — safe regardless of working directory
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# Lua filter — tracked at .github/scripts/docs/md-to-html-links.lua and copied
# into place here, so the filter is reviewed like any other source file.
# Converts .md links to .html and wraps mermaid blocks in a div for the browser.
# ---------------------------------------------------------------------------
write_lua_filter() {
  mkdir -p "$PROJECT_DIR/scripts"
  cp "$SCRIPTS_DIR/md-to-html-links.lua" "$LUA_FILTER"
  echo "✓ Lua filter copied into place"
}

# ---------------------------------------------------------------------------
# Theme assets — concatenate the CSS partials into one stylesheet and copy the
# runtime JS. Templates reference these at /assets/docs.css and /assets/docs.js.
# Concat order is the cascade order: tokens first (defines the variables every
# later partial consumes), mermaid last.
# ---------------------------------------------------------------------------
build_theme_assets() {
  mkdir -p "$ASSETS_DIR"
  cat \
    "$THEME_DIR/css/tokens.css" \
    "$THEME_DIR/css/base.css" \
    "$THEME_DIR/css/layout.css" \
    "$THEME_DIR/css/components.css" \
    "$THEME_DIR/css/landing.css" \
    "$THEME_DIR/css/content.css" \
    "$THEME_DIR/css/mermaid.css" \
    > "$ASSETS_DIR/docs.css"
  cp "$THEME_DIR/js/docs.js" "$ASSETS_DIR/docs.js"
  echo "✓ Theme assets built (docs.css, docs.js)"
}

# Rewrites every unversioned theme-asset reference in the built output. Applied
# after all generators have run, so it covers the pandoc templates, the ReDoc
# wrapper and the copied landing pages alike without each having to know the id.
version_assets() {
  local count css_id js_id
  # Each asset is stamped with a hash of its own bytes, so the token changes when
  # the file changes and at no other time. It used to be the commit SHA, which
  # changes on every commit: that rewrote all 277 pages on every publish, grew
  # gh-pages by roughly 1700 lines each time, and buried real documentation
  # changes in the diff. Hashing per asset also means a stylesheet edit does not
  # bust the cached script. Computed after build_theme_assets, on the built files.
  css_id="$(sha256sum "$ASSETS_DIR/docs.css" | cut -c1-10)"
  js_id="$(sha256sum "$ASSETS_DIR/docs.js"  | cut -c1-10)"
  count=$(grep -rl -e 'assets/docs\.css"' -e 'assets/docs\.js"' \
    --include='*.html' "$OUTPUT_DIR" 2>/dev/null | wc -l)
  grep -rl -e 'assets/docs\.css"' -e 'assets/docs\.js"' \
    --include='*.html' "$OUTPUT_DIR" 2>/dev/null \
    | xargs -r sed -i \
        -e "s|assets/docs\.css\"|assets/docs.css?v=${css_id}\"|g" \
        -e "s|assets/docs\.js\"|assets/docs.js?v=${js_id}\"|g"
  echo "✓ Theme asset links versioned (css ?v=${css_id}, js ?v=${js_id}) in ${count} page(s)"
}

# Landing pages are static HTML served at the site root.
copy_landing_pages() {
  cp "$THEME_DIR/index.html"    "$OUTPUT_DIR/index.html"
  cp "$THEME_DIR/index-de.html" "$OUTPUT_DIR/index-de.html"
  echo "✓ Landing pages copied"
}

# JaCoCo HTML is downloaded by the workflow to target/site/jacoco; absent on
# docs-only pushes, in which case deploy-ghpages preserves the existing report.
copy_backend_coverage() {
  local SRC="$PROJECT_DIR/target/site/jacoco"
  local DEST="$OUTPUT_DIR/backend/coverage"
  if [ -d "$SRC" ] && [ "$(ls -A "$SRC")" ]; then
    mkdir -p "$DEST"
    cp -R "$SRC/." "$DEST/"
    echo "✓ Backend coverage (JaCoCo) copied"
  else
    echo "ℹ️  No backend coverage found — skipping"
  fi
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
build_theme_assets
copy_landing_pages
bash "$SCRIPTS_DIR/build-openapi-docs.sh"      "$PROJECT_DIR"
bash "$SCRIPTS_DIR/build-typedoc-html.sh"      "$PROJECT_DIR" "$LUA_FILTER"
bash "$SCRIPTS_DIR/build-architecture-docs.sh" "$PROJECT_DIR"
copy_backend_coverage
copy_frontend_coverage
version_assets

echo ""
echo "✓ Docs build complete — $(find "$OUTPUT_DIR" -type f | wc -l) files, $(du -sh "$OUTPUT_DIR" | cut -f1)"
