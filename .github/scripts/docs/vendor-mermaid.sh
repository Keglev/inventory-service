#!/usr/bin/env bash
# =============================================================================
# vendor-mermaid.sh — puts the pinned Mermaid bundle into the docs site
# Usage: .github/scripts/docs/vendor-mermaid.sh <theme-dir> <assets-dir>
#        Called by build-docs.sh from build_theme_assets.
#
# The architecture and API page templates (app-docs.html, app-api.html) render
# diagrams with Mermaid. They used to load it from cdn.jsdelivr.net, so every
# visitor's browser sent its address to a third party, the transfer the Google
# Fonts ruling (LG Muenchen I, 3 O 17493/20) is about (FW6 N4, as NF-7 for
# ReDoc). The templates now load /inventory-service/assets/mermaid.min.js.
#
# The templates stay the one place that names the version and the hash: each
# script tag carries data-mermaid-version and an integrity attribute. This
# script requires both templates to agree, takes dist/mermaid.min.js from the
# npm package of that version, and refuses it unless its sha384 equals the
# integrity value, so the site serves the bytes the pinned tag always named.
#
# Produces: <assets-dir>/mermaid.min.js
#
# Failure mode: exits 1 when a template lacks the tag, when the two templates
# name different versions or hashes, or when the npm bundle does not match the
# hash; set -e stops the run when npm or tar fails.
# Prerequisites: npm, openssl
# =============================================================================
set -euo pipefail

THEME_DIR="${1:?Usage: vendor-mermaid.sh <theme-dir> <assets-dir>}"
ASSETS_DIR="${2:?Usage: vendor-mermaid.sh <theme-dir> <assets-dir>}"

read_pin() {
  local template="$1" tag
  tag="$(tr '\n' ' ' < "$template" \
    | grep -oE '<script src="[^"]*mermaid\.min\.js"[^>]*>' || true)"
  if [ -z "$tag" ]; then
    echo "::error::$template has no mermaid.min.js script tag" >&2
    exit 1
  fi
  local version integrity
  version="$(grep -oE 'data-mermaid-version="[0-9.]+"' <<< "$tag" | cut -d'"' -f2 || true)"
  integrity="$(grep -oE 'integrity="[^"]+"' <<< "$tag" | cut -d'"' -f2 || true)"
  if [ -z "$version" ] || [ -z "$integrity" ]; then
    echo "::error::$template: the mermaid tag needs data-mermaid-version and integrity" >&2
    exit 1
  fi
  echo "$version $integrity"
}

DOCS_PIN="$(read_pin "$THEME_DIR/app-docs.html")"
API_PIN="$(read_pin "$THEME_DIR/app-api.html")"
if [ "$DOCS_PIN" != "$API_PIN" ]; then
  echo "::error::app-docs.html ($DOCS_PIN) and app-api.html ($API_PIN) pin different Mermaid builds"
  exit 1
fi
VERSION="${DOCS_PIN%% *}"
INTEGRITY="${DOCS_PIN#* }"

PACK_DIR="$(mktemp -d)"
trap 'rm -rf "$PACK_DIR"' EXIT
npm pack --silent --pack-destination "$PACK_DIR" "mermaid@$VERSION" > /dev/null
tar -xzf "$PACK_DIR/mermaid-$VERSION.tgz" -C "$PACK_DIR" package/dist/mermaid.min.js
BUNDLE="$PACK_DIR/package/dist/mermaid.min.js"
ACTUAL="sha384-$(openssl dgst -sha384 -binary "$BUNDLE" | base64 -w0)"
if [ "$ACTUAL" != "$INTEGRITY" ]; then
  echo "::error::mermaid@$VERSION from npm hashes to $ACTUAL, the templates expect $INTEGRITY"
  exit 1
fi

mkdir -p "$ASSETS_DIR"
cp "$BUNDLE" "$ASSETS_DIR/mermaid.min.js"
echo "✓ Mermaid $VERSION served from the site (integrity verified)"
