#!/usr/bin/env bash
# =============================================================================
# assemble-site.sh — Produces the tree that will replace gh-pages
# Usage: .github/scripts/docs/assemble-site.sh <project-dir> <published-dir>
#
# Takes what this run built and lays it over a copy of the site currently
# published, one subtree at a time. A subtree this run produced replaces the
# published one wholesale, so a page deleted at source disappears; a subtree
# this run did not produce is carried forward untouched.
#
# The result is always a COMPLETE site. Two things depend on that. The link
# check runs against the tree that is about to be published rather than against
# a fragment of it, so a page linking into a subtree this run did not rebuild
# still resolves. And 3-deploy-ghpages.yml can keep replacing the branch
# wholesale, because the artifact is never missing a part of the site.
# =============================================================================
set -euo pipefail

PROJECT_DIR="${1:?Usage: assemble-site.sh <project-dir> <published-dir>}"
PUBLISHED_DIR="${2:?Usage: assemble-site.sh <project-dir> <published-dir>}"

BUILT_DIR="$PROJECT_DIR/target/docs"
OUTPUT_DIR="$PROJECT_DIR/target/publish"

# The complete set of subtrees the docs build owns. Every generator writes into
# exactly one of these, and gh-pages contains exactly these plus the two landing
# pages. An entry outside this list means a generator started writing somewhere
# new; that must fail here rather than be published unnoticed or silently
# dropped on the next run.
SUBTREES=(
  "assets"
  "backend/api"
  "backend/architecture"
  "backend/coverage"
  "frontend/api"
  "frontend/architecture"
  "frontend/coverage"
)
ROOT_FILES=("index.html" "index-de.html")

echo "==> [assemble-site] BUILT=$BUILT_DIR PUBLISHED=$PUBLISHED_DIR"

if [ ! -d "$BUILT_DIR" ]; then
  echo "::error::No built tree at $BUILT_DIR"
  exit 1
fi

# ---------------------------------------------------------------------------
# Reject anything the build wrote outside the known layout, before assembling.
# ---------------------------------------------------------------------------
for entry in "$BUILT_DIR"/*; do
  [ -e "$entry" ] || continue
  name="$(basename "$entry")"
  if [ -f "$entry" ]; then
    case " ${ROOT_FILES[*]} " in
      *" $name "*) continue ;;
      *) echo "::error::Unexpected file at the root of the built tree: $name"; exit 1 ;;
    esac
  fi
  case "$name" in
    assets) continue ;;
    backend|frontend)
      for child in "$entry"/*; do
        [ -e "$child" ] || continue
        case "$(basename "$child")" in
          api|architecture|coverage) ;;
          *) echo "::error::Unexpected subtree: $name/$(basename "$child")"; exit 1 ;;
        esac
      done
      ;;
    *) echo "::error::Unexpected directory at the root of the built tree: $name"; exit 1 ;;
  esac
done

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

if [ -d "$PUBLISHED_DIR" ] && [ -n "$(ls -A "$PUBLISHED_DIR" 2>/dev/null)" ]; then
  cp -R "$PUBLISHED_DIR/." "$OUTPUT_DIR/"
  echo "✓ Base laid down from the published site ($(find "$OUTPUT_DIR" -type f | wc -l) files)"
else
  echo "ℹ️  No published site supplied — assembling from this build alone"
fi

replaced=0
carried=0
for subtree in "${SUBTREES[@]}"; do
  if [ -d "$BUILT_DIR/$subtree" ]; then
    rm -rf "${OUTPUT_DIR:?}/$subtree"
    mkdir -p "$(dirname "$OUTPUT_DIR/$subtree")"
    cp -R "$BUILT_DIR/$subtree" "$OUTPUT_DIR/$subtree"
    echo "  replaced  $subtree ($(find "$OUTPUT_DIR/$subtree" -type f | wc -l) files)"
    replaced=$((replaced + 1))
  else
    echo "  carried   $subtree"
    carried=$((carried + 1))
  fi
done

for file in "${ROOT_FILES[@]}"; do
  if [ -f "$BUILT_DIR/$file" ]; then
    cp "$BUILT_DIR/$file" "$OUTPUT_DIR/$file"
    echo "  replaced  $file"
  else
    echo "  carried   $file"
  fi
done

echo ""
echo "✓ Site assembled — $replaced subtree(s) rebuilt, $carried carried forward, $(find "$OUTPUT_DIR" -type f | wc -l) files, $(du -sh "$OUTPUT_DIR" | cut -f1)"
