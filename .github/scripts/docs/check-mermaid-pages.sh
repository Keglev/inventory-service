#!/usr/bin/env bash
# =============================================================================
# check-mermaid-pages.sh — a docs page loads Mermaid exactly when it draws a diagram
# Usage: .github/scripts/docs/check-mermaid-pages.sh <site-dir>
#        Called by docs-pr-check.yml on the site it built and by docs-build.yml
#        on the assembled site it is about to publish.
#
# The Mermaid bundle is 3.3 MB. md-to-html-links.lua flags the pages that
# hold a diagram and app-docs.html loads the bundle only on those (W23). This
# script holds every built page to that rule, in both directions:
#   - a page with a <div class="mermaid"> must load the bundle, or its diagram
#     shows as raw text;
#   - a page without one must not load it, or the download is back for nothing.
#
# Produces: the page counts on stdout and, in a workflow, in the job summary.
#
# Outcomes: passes when every page agrees and at least one page was read;
# fails with one ::error:: line per page that disagrees; fails when the
# directory holds no page, since a check over nothing proves nothing.
# Failure mode: exits 1 on any of the failures above or a missing directory;
# set -e stops the run when find or sort fails.
# =============================================================================
set -euo pipefail

SITE="${1:?Usage: check-mermaid-pages.sh <site-dir>}"
if [ ! -d "$SITE" ]; then
  echo "::error::$SITE is not a directory"
  exit 1
fi

DIAGRAM='<div class="mermaid">'
BUNDLE='<script src="/inventory-service/assets/mermaid.min.js"'

LIST="$(mktemp)"
trap 'rm -f "$LIST" "$LIST.sorted"' EXIT
find "$SITE" -type f -name '*.html' -print0 > "$LIST"
sort -z "$LIST" > "$LIST.sorted"

pages=0
diagrams=0
wrong=0
while IFS= read -r -d '' page; do
  pages=$((pages + 1))
  draws=false
  loads=false
  if grep -qF "$DIAGRAM" "$page"; then draws=true; fi
  if grep -qF "$BUNDLE" "$page"; then loads=true; fi
  if [ "$draws" = true ]; then diagrams=$((diagrams + 1)); fi
  if [ "$draws" = true ] && [ "$loads" = false ]; then
    echo "::error file=$page::draws a diagram but does not load mermaid.min.js"
    wrong=$((wrong + 1))
  elif [ "$draws" = false ] && [ "$loads" = true ]; then
    echo "::error file=$page::loads mermaid.min.js but draws no diagram"
    wrong=$((wrong + 1))
  fi
done < "$LIST.sorted"

if [ "$pages" -eq 0 ]; then
  echo "::error::no .html page under $SITE"
  exit 1
fi

result="Mermaid: $pages pages, $diagrams with a diagram, $wrong disagree"
echo "$result"
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  echo "- $result" >> "$GITHUB_STEP_SUMMARY"
fi
if [ "$wrong" -gt 0 ]; then
  exit 1
fi
