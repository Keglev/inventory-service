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
# The result is a COMPLETE site, and it exists for the link check: a page linking
# into a subtree this run did not rebuild still resolves, so the check runs
# against what will be published rather than against a fragment of it.
#
# It is NOT what gets published. This script also writes MANIFEST, naming what
# this run actually produced, and docs-deploy.yml replaces those paths and
# leaves the rest of the branch alone. That is what makes two or three pipeline
# runs for one merge safe in any order: each writes only what it owns, so the
# branch ends the same however they interleave. Publishing the assembled tree
# instead would let a run that read gh-pages before a concurrent run pushed
# revert that run's work.
#
# Produces: <project-dir>/target/publish, the complete site, and
# <project-dir>/target/docs/MANIFEST, the paths this run built.
# Failure mode: exits 1 when target/docs is missing, holds a file or directory
# the layout does not know, or holds a built subtree with no files; set -e
# stops the run when a copy fails. A wrong layout fails here, before the link
# check and long before publishing.
# =============================================================================
set -euo pipefail

PROJECT_DIR="${1:?Usage: assemble-site.sh <project-dir> <published-dir>}"
PUBLISHED_DIR="${2:?Usage: assemble-site.sh <project-dir> <published-dir>}"

BUILT_DIR="$PROJECT_DIR/target/docs"
OUTPUT_DIR="$PROJECT_DIR/target/publish"

# Every subtree the docs build owns; gh-pages holds exactly these plus the two
# landing pages. An entry outside the list means a generator writes somewhere
# new, which fails here rather than being published unnoticed.
SUBTREES=(
  "assets"
  "decisions"
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

# Reject anything the build wrote outside the known layout, before assembling.
for entry in "$BUILT_DIR"/*; do
  [ -e "$entry" ] || continue
  name="$(basename "$entry")"
  if [ -f "$entry" ]; then
    # A MANIFEST from an earlier local run (CI starts from an empty target/); it
    # would trip the check below on this script's own output, and is rewritten.
    [ "$name" = "MANIFEST" ] && continue
    case " ${ROOT_FILES[*]} " in
      *" $name "*) continue ;;
      *) echo "::error::Unexpected file at the root of the built tree: $name"; exit 1 ;;
    esac
  fi
  case "$name" in
    assets|decisions) continue ;;
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

# Paths this run produced, written to MANIFEST at the end for the publisher.
OWNED=()

replaced=0
carried=0
for subtree in "${SUBTREES[@]}"; do
  if [ -d "$BUILT_DIR/$subtree" ]; then
    # An empty built subtree is a bug, never an instruction to publish nothing: it
    # would replace a published subtree and delete every page in it, on main.
    if [ -z "$(find "$BUILT_DIR/$subtree" -type f -print -quit)" ]; then
      echo "::error::Built subtree $subtree exists but contains no files"
      exit 1
    fi
    rm -rf "${OUTPUT_DIR:?}/$subtree"
    mkdir -p "$(dirname "$OUTPUT_DIR/$subtree")"
    cp -R "$BUILT_DIR/$subtree" "$OUTPUT_DIR/$subtree"
    echo "  replaced  $subtree ($(find "$OUTPUT_DIR/$subtree" -type f | wc -l) files)"
    OWNED+=("$subtree")
    replaced=$((replaced + 1))
  else
    echo "  carried   $subtree"
    carried=$((carried + 1))
  fi
done

for file in "${ROOT_FILES[@]}"; do
  if [ -f "$BUILT_DIR/$file" ]; then
    cp "$BUILT_DIR/$file" "$OUTPUT_DIR/$file"
    OWNED+=("$file")
    echo "  replaced  $file"
  else
    echo "  carried   $file"
  fi
done

# Into the BUILT tree, which is uploaded; not a dotfile, because the upload drops
# hidden files. Written last: the layout check above rejects any unexpected file
# at the root of the built tree, and this is one.
printf '%s\n' "${OWNED[@]}" > "$BUILT_DIR/MANIFEST"

echo ""
echo "✓ Site assembled — $replaced subtree(s) rebuilt, $carried carried forward, $(find "$OUTPUT_DIR" -type f | wc -l) files, $(du -sh "$OUTPUT_DIR" | cut -f1)"
echo "✓ MANIFEST lists ${#OWNED[@]} path(s) this run owns: ${OWNED[*]}"
