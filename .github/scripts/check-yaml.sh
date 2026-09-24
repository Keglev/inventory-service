#!/usr/bin/env bash
# =============================================================================
# check-yaml.sh — YAML hygiene gate
# Usage: bash .github/scripts/check-yaml.sh
#        Invoked by .github/workflows/yaml-lint.yml from the repository root.
#        Needs the js-yaml CLI on PATH; the workflow installs it pinned.
#
# Three checks over every tracked .yml and .yaml file except docs/backend/api,
# which is OpenAPI and is gated by Redocly in docs-build.yml. Two linters
# with two opinions on one tree is how a gate starts getting waived.
#
#   1. It parses. js-yaml also rejects duplicate mapping keys, which is the
#      failure worth catching here: a repeated key in a workflow is silently
#      overwritten and the run does something nobody wrote.
#   2. No line ends in whitespace.
#   3. The file ends with a newline.
#
# Deliberately not a style linter. Line length, comment alignment and bracket
# spacing vary across this repository on purpose, and a rule for each would be
# a standing waiver list rather than a gate.
#
# No check runs inside a pipeline. A `failed=1` assignment on the right-hand
# side of a pipe lands in a subshell and is lost, which would report a defect
# and still exit 0.
#
# Failure mode: reports every offending file and exits 1. It never rewrites a
# file; fixing is the author's job, so the diff stays reviewable.
# =============================================================================
set -uo pipefail

failed=0

files="$(git ls-files '*.yml' '*.yaml' | grep -v '^docs/backend/api/')"
count="$(echo "$files" | wc -l)"
echo "Checking $count YAML file(s)."

for f in $files; do
  if ! out="$(js-yaml "$f" 2>&1 >/dev/null)"; then
    echo "PARSE   $f"
    echo "        ${out%%$'\n'*}"
    failed=1
  fi
  if spaces="$(git grep -nI ' $' -- "$f")"; then
    while IFS= read -r line; do echo "SPACE   $line"; done <<< "$spaces"
    failed=1
  fi
  if [ -n "$(tail -c 1 "$f")" ]; then
    echo "NEWLINE $f has no terminating newline"
    failed=1
  fi
done

if [ "$failed" -ne 0 ]; then
  echo "YAML check failed."
  exit 1
fi

echo "All $count file(s) parse, end with a newline, and carry no trailing whitespace."
