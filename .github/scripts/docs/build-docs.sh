#!/usr/bin/env bash
# =============================================================================
# build-docs.sh — Documentation build orchestrator
# Usage: .github/scripts/docs/build-docs.sh <project-dir>
#
# Builds the theme assets, then delegates to sibling scripts for each doc type,
# all reading the Lua filter where it is tracked.
# Prerequisites: pandoc, redocly CLI, npm, openssl
# Produces: <project-dir>/target/docs, a tree that mirrors the deployed site.
# Failure mode: set -euo pipefail stops the build at the first failing step
# (theme assets, a sibling script, a copy), so no partial site reaches the
# assembly step.
# =============================================================================
set -euo pipefail

PROJECT_DIR="${1:?Usage: build-docs.sh <project-dir>}"
DOCS_DIR="$PROJECT_DIR/docs"
THEME_DIR="$DOCS_DIR/_theme"
OUTPUT_DIR="$PROJECT_DIR/target/docs"
ASSETS_DIR="$OUTPUT_DIR/assets"

# Resolve sibling script directory at runtime — safe regardless of working directory
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# The pandoc Lua filter, read where it is tracked (one location, no copy). It
# rewrites .md link targets to .html and wraps mermaid code blocks, so every
# pandoc invocation in this build is passed it.
LUA_FILTER="$SCRIPTS_DIR/md-to-html-links.lua"

# Which generators run; unset means run, so docs-pr-check.yml builds the whole
# site and docs-build.yml sets them from its gate. Theme assets and landing pages
# always build: version_assets stamps every page with their hashes.
: "${DOCS_BUILD_REDOC:=true}"
: "${DOCS_BUILD_TYPEDOC:=true}"
: "${DOCS_BUILD_ARCH_BACKEND:=true}"
: "${DOCS_BUILD_ARCH_FRONTEND:=true}"
: "${DOCS_BUILD_DECISIONS:=true}"

# Theme assets: the CSS partials concatenated into /assets/docs.css plus the
# runtime JS. Concat order is the cascade order: tokens first (the variables
# every later partial consumes), mermaid last.
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
  bash "$SCRIPTS_DIR/vendor-mermaid.sh" "$THEME_DIR" "$ASSETS_DIR"
  echo "✓ Theme assets built (docs.css, docs.js, mermaid.min.js)"
}

# Rewrites every unversioned theme-asset reference in the built output, after all
# generators ran. backend/api carries no token: ReDoc emits a self-contained
# bundle that references neither assets/docs.css nor assets/docs.js.
version_assets() {
  local count css_id js_id
  # A hash of each asset's own bytes: the token changes when the file does and at
  # no other time (a commit SHA would rewrite every page on every publish), and a
  # stylesheet edit does not bust the cached script.
  css_id="$(sha256sum "$ASSETS_DIR/docs.css" | cut -c1-10)"
  js_id="$(sha256sum "$ASSETS_DIR/docs.js"  | cut -c1-10)"
  # Taken once and guarded: grep exits 1 on no match, which pipefail would turn
  # into a failed build if a caller ever selected no generators and no page
  # referenced the assets.
  local files
  files="$(grep -rl -e 'assets/docs\.css"' -e 'assets/docs\.js"' \
    --include='*.html' "$OUTPUT_DIR" 2>/dev/null || true)"
  count=$(printf '%s\n' "$files" | sed '/^$/d' | wc -l)
  if [ "$count" -gt 0 ]; then
    printf '%s\n' "$files" | sed '/^$/d' \
      | xargs -r sed -i \
          -e "s|assets/docs\.css\"|assets/docs.css?v=${css_id}\"|g" \
          -e "s|assets/docs\.js\"|assets/docs.js?v=${js_id}\"|g"
  fi
  echo "✓ Theme asset links versioned (css ?v=${css_id}, js ?v=${js_id}) in ${count} page(s)"
}

# Landing pages are static HTML served at the site root.
copy_landing_pages() {
  cp "$THEME_DIR/index.html"    "$OUTPUT_DIR/index.html"
  cp "$THEME_DIR/index-de.html" "$OUTPUT_DIR/index-de.html"
  echo "✓ Landing pages copied"
}

# JaCoCo HTML arrives from the workflow in target/site/jacoco; absent on a docs-only
# run, and then the published report stays. jacoco.xml (session id, times) and the
# sessions page (generated class names) change every run, so both are cut.
copy_backend_coverage() {
  local SRC="$PROJECT_DIR/target/site/jacoco"
  local DEST="$OUTPUT_DIR/backend/coverage"
  if [ -d "$SRC" ] && [ "$(ls -A "$SRC")" ]; then
    mkdir -p "$DEST"
    cp -R "$SRC/." "$DEST/"
    perl -pi -e 's{<sessioninfo [^>]*/>}{}g' "$DEST/jacoco.xml"
    perl -0pi -e 's{<p>This coverage report is based.*?(?=<div class="footer">)}{<p>Session details are not published: they change on every run.</p>}s' \
      "$DEST/jacoco-sessions.html"
    bash "$SCRIPTS_DIR/inject-back-link.sh" "$DEST/index.html"
    echo "✓ Backend coverage (JaCoCo) copied"
  else
    echo "ℹ️  No backend coverage found — skipping"
  fi
}

# The HTML reporter stamps the generation time into every page's footer; the
# line is dropped so an unchanged report publishes nothing.
copy_frontend_coverage() {
  local SRC="$PROJECT_DIR/target/frontend/coverage"
  local DEST="$OUTPUT_DIR/frontend/coverage"
  if [ -d "$SRC" ] && [ "$(ls -A "$SRC")" ]; then
    mkdir -p "$DEST"
    cp -R "$SRC/." "$DEST/"
    find "$DEST" -name '*.html' -exec perl -ni -e \
      'print unless /^\s*at \d{4}-\d\d-\d\dT[\d:.]+Z\s*$/' {} +
    bash "$SCRIPTS_DIR/inject-back-link.sh" "$DEST/index.html"
    echo "✓ Frontend coverage copied"
  else
    echo "ℹ️  No frontend coverage found — skipping"
  fi
}

echo "==> [build-docs] Starting (PROJECT_DIR=$PROJECT_DIR)"
mkdir -p "$OUTPUT_DIR"

build_theme_assets
copy_landing_pages
if [ "$DOCS_BUILD_REDOC" = "true" ]; then
  bash "$SCRIPTS_DIR/build-openapi-docs.sh" "$PROJECT_DIR"
else
  echo "ℹ️  ReDoc not selected — skipping"
fi

if [ "$DOCS_BUILD_TYPEDOC" = "true" ]; then
  bash "$SCRIPTS_DIR/build-typedoc-html.sh" "$PROJECT_DIR" "$LUA_FILTER"
else
  echo "ℹ️  TypeDoc pages not selected — skipping"
fi

ARCH_CONTEXTS=()
[ "$DOCS_BUILD_ARCH_BACKEND" = "true" ]  && ARCH_CONTEXTS+=(backend)  || true
[ "$DOCS_BUILD_ARCH_FRONTEND" = "true" ] && ARCH_CONTEXTS+=(frontend) || true
[ "$DOCS_BUILD_DECISIONS" = "true" ]     && ARCH_CONTEXTS+=(decisions) || true
if [ "${#ARCH_CONTEXTS[@]}" -gt 0 ]; then
  bash "$SCRIPTS_DIR/build-architecture-docs.sh" "$PROJECT_DIR" "${ARCH_CONTEXTS[@]}"
else
  echo "ℹ️  No architecture context selected — skipping"
fi
copy_backend_coverage
copy_frontend_coverage
version_assets

echo ""
echo "✓ Docs build complete — $(find "$OUTPUT_DIR" -type f | wc -l) files, $(du -sh "$OUTPUT_DIR" | cut -f1)"
