#!/usr/bin/env bash
# =============================================================================
# build-openapi-docs.sh — Generates ReDoc HTML from the OpenAPI spec
# Usage: .github/scripts/docs/build-openapi-docs.sh <project-dir>
#
# The generated page renders the spec in the browser with redoc.standalone.js.
# The CLI writes a script tag pointing at Redocly's CDN with an integrity hash;
# this script serves that file from the Pages site instead. --disableGoogleFont
# drops the stylesheet link to fonts.googleapis.com: without it every visitor's
# browser contacts Google, a transfer a German court has ruled unlawful without
# consent (LG Muenchen I, 3 O 17493/20). The CDN script and the "API docs by
# Redocly" logo (cdn.redoc.ly) were the same kind of transfer (FW6 NF-7):
#   - the bundle comes from the npm package of the version the CLI named, and
#     must hash to the CLI's own integrity value, so it is byte-for-byte the
#     file the CDN would have served; the tag keeps that integrity attribute;
#   - a CSP meta tag limits images to this site, so the browser never requests
#     the logo; ReDoc's onError handler then simply leaves it out.
# ReDoc uses the browser's sans-serif fonts. Theme assets, landing pages and
# JaCoCo coverage are handled by build-docs.sh.
#
# Failure mode: exits 1 when the spec is missing, when the CLI's script tag is
# not in the expected form, or when the npm bundle does not match its
# integrity hash; set -e stops the run when redocly or npm fails.
# Prerequisites: redocly CLI, npm, openssl
# =============================================================================
set -euo pipefail

PROJECT_DIR="${1:?Usage: build-openapi-docs.sh <project-dir>}"

OPENAPI_YAML="$PROJECT_DIR/docs/backend/api/openapi.yaml"
API_OUT="$PROJECT_DIR/target/docs/backend/api"

echo "==> [build-openapi-docs] PROJECT_DIR=$PROJECT_DIR"

if [ ! -f "$OPENAPI_YAML" ]; then
  echo "::error::OpenAPI YAML not found at $OPENAPI_YAML"
  exit 1
fi

mkdir -p "$API_OUT"
redocly build-docs "$OPENAPI_YAML" --disableGoogleFont -o "$API_OUT/index.html"

# Serve the ReDoc bundle from this site instead of cdn.redocly.com.
CDN_RE='https://cdn\.redocly\.com/redoc/v([0-9.]+)/bundles/redoc\.standalone\.js'
TAG="$(grep -oE "<script src=\"$CDN_RE\" integrity=\"[^\"]+\"" "$API_OUT/index.html" || true)"
if [ -z "$TAG" ]; then
  echo "::error::the generated page has no ReDoc CDN script tag in the expected form"
  exit 1
fi
REDOC_VERSION="$(sed -E "s|.*$CDN_RE.*|\1|" <<< "$TAG")"
INTEGRITY="$(sed -E 's|.*integrity="([^"]+)".*|\1|' <<< "$TAG")"
PACK_DIR="$(mktemp -d)"
trap 'rm -rf "$PACK_DIR"' EXIT
npm pack --silent --pack-destination "$PACK_DIR" "redoc@$REDOC_VERSION" > /dev/null
tar -xzf "$PACK_DIR/redoc-$REDOC_VERSION.tgz" -C "$PACK_DIR" package/bundles/redoc.standalone.js
BUNDLE="$PACK_DIR/package/bundles/redoc.standalone.js"
ACTUAL="sha384-$(openssl dgst -sha384 -binary "$BUNDLE" | base64 -w0)"
if [ "$ACTUAL" != "$INTEGRITY" ]; then
  echo "::error::redoc@$REDOC_VERSION from npm hashes to $ACTUAL, the CLI expects $INTEGRITY"
  exit 1
fi
cp "$BUNDLE" "$API_OUT/redoc.standalone.js"
sed -i -E "s|$CDN_RE|redoc.standalone.js|" "$API_OUT/index.html"
sed -i 's|<head>|<head><meta http-equiv="Content-Security-Policy" content="img-src '"'"'self'"'"' data:">|' "$API_OUT/index.html"
echo "✓ ReDoc $REDOC_VERSION served from the site (integrity verified); images limited to the site"

# Inject a fixed-position "back to docs" link into the self-contained ReDoc page.
# Same pattern as the JaCoCo coverage injection in docs-deploy.yml, applied
# at build time because this file is regenerated on every docs build.
sed -i 's|<body[^>]*>|&<a id="back-to-docs" href="/inventory-service/" style="position:fixed;top:8px;right:12px;z-index:9999;font:14px sans-serif;padding:6px 12px;background:#2563eb;color:#fff;text-decoration:none;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.2);">\&larr; Back to docs</a>|' "$API_OUT/index.html"
echo "✓ ReDoc HTML generated at backend/api/index.html (back-to-docs link injected)"
