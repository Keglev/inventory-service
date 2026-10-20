#!/usr/bin/env bash
# =============================================================================
# inject-back-link.sh — adds the fixed "Back to docs" link to generated pages
# Usage: .github/scripts/docs/inject-back-link.sh <html-file>...
#        Called by build-openapi-docs.sh (the ReDoc page) and build-docs.sh (the
#        JaCoCo and Vitest coverage index pages, which come from CI artifacts
#        and are never rendered through a docs template).
#
# Those pages are produced by other tools and load none of the site's CSS, so
# the link carries its own inline style and a fixed position. The markup lived
# as two identical sed lines, one in build-openapi-docs.sh at build time and one
# in docs-deploy.yml on the published tree (W5); a change to one left the other
# behind.
# The coverage pages now get the link when they are built, like the ReDoc page.
# Pages rendered from docs/_theme templates have their own link in the topbar
# and do not use this.
#
# Produces: each existing file with the link inserted right after its <body>
# tag; a file that already has id="back-to-docs" is left as it is, so a
# re-run never adds a second link.
#
# Failure mode: exits 1 when a named file does not exist or its <body> tag is
# not found (nothing would be injected and the page would lose its way back).
# =============================================================================
set -euo pipefail

[ "$#" -gt 0 ] || { echo "Usage: inject-back-link.sh <html-file>..." >&2; exit 1; }

LINK='<a id="back-to-docs" href="/inventory-service/" style="position:fixed;top:8px;right:12px;z-index:9999;font:14px sans-serif;padding:6px 12px;background:#2563eb;color:#fff;text-decoration:none;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.2);">\&larr; Back to docs</a>'

for page in "$@"; do
  if [ ! -f "$page" ]; then
    echo "::error::$page does not exist"
    exit 1
  fi
  if grep -q 'id="back-to-docs"' "$page"; then
    echo "$page: back-to-docs link already present — skipping"
    continue
  fi
  if ! grep -q '<body' "$page"; then
    echo "::error::$page has no <body> tag to put the link after"
    exit 1
  fi
  sed -i "s|<body[^>]*>|&${LINK}|" "$page"
  echo "$page: back-to-docs link injected"
done
