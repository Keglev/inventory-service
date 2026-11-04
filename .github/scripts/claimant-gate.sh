#!/usr/bin/env bash
# =============================================================================
# claimant-gate.sh - decides whether a pull request belongs to one CI claimant
# Usage: bash .github/scripts/claimant-gate.sh backend|frontend|docs, as the
#        step of claimant-gate.yml, which backend-ci.yml, frontend-ci.yml and
#        docs-pr-check.yml call as their first job.
#
# Each claimant reports a required check of its own (build-and-test-backend,
# -frontend, -docs; backend ADR-0019). A required check must report on every
# pull request: a workflow left out by a path filter never reports and blocks
# the merge, while a job skipped by an `if:` reports success. So the three
# workflows run on every pull request, and this script does the path filtering
# a pull_request filter would have done. A docs-only pull request runs only the
# docs checks; the other two report success after this job. The lists repeat the
# push filters of backend-ci.yml (paths-ignore) and frontend-ci.yml (paths)
# and the docs entries of backend-ci.yml's list: change them together.
#
# Produces: run=true|false on $GITHUB_OUTPUT (stdout when unset) and, for a
# skip, one line in the job summary. A push or a manual run is always true:
# push filters on main already chose the workflow, and a manual run is asked
# for. HEAD^..HEAD on a pull request is its own diff (the merge commit).
# Failure mode: exits non-zero on an unknown claimant or when git cannot
# compare HEAD with its parent (a checkout without fetch-depth 2); the job
# then fails, and so does the claimant's required check, rather than guess.
# =============================================================================
set -euo pipefail

out="${GITHUB_OUTPUT:-/dev/stdout}"
claimant="${1:-}"

frontend='^(frontend/|ops/nginx/|\.github/(workflows/frontend-ci\.yml$|scripts/(verify-image-contract|report-dependency-tree|frontend-ci-summary)\.sh$|actions/image-sbom-scan/))'
docs='^(docs/|\.github/(scripts/docs/|actions/docs-toolchain/|workflows/docs-(build|pr-check)\.yml$)|lychee\.toml$)'

case "$claimant" in
  backend|frontend|docs) ;;
  *) echo "::error::claimant must be backend, frontend or docs, got '$claimant'" >&2; exit 2 ;;
esac

if [ "${GITHUB_EVENT_NAME:-}" != "pull_request" ]; then
  echo "run=true" >> "$out"
  exit 0
fi

changed=$(git diff --name-only HEAD^ HEAD)

case "$claimant" in
  frontend) mine=$(grep -E "$frontend" <<< "$changed" || true) ;;
  docs) mine=$(grep -E "$docs" <<< "$changed" || true) ;;
  # The catch-all: every path the other two do not claim, README and LICENSE
  # included, belongs to the backend family.
  backend) mine=$(grep -vE "$frontend|$docs" <<< "$changed" || true) ;;
esac

if [ -n "$mine" ]; then
  echo "run=true" >> "$out"
else
  echo "run=false" >> "$out"
  echo "No $claimant path in this pull request; its jobs are skipped and its check passes." >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"
fi
