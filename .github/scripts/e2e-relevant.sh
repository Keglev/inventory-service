#!/usr/bin/env bash
# =============================================================================
# e2e-relevant.sh - decides whether the Playwright suite can tell this commit anything
# Usage: bash .github/scripts/e2e-relevant.sh, as the gate step of
#        e2e-playwright.yml, with E2E_CALLER set by the calling workflow.
#
# The callers (backend-ci.yml, frontend-ci.yml) trigger on wider path sets
# than the browser suite covers: the backend gate is the repository's catch-all,
# so without this decision a README or a release-workflow edit would start a
# browser run that cannot fail for any reason connected to the change.
#
# Inside the watched trees, some paths never reach what the suite runs: the
# backend jar is packaged with tests skipped, so src/test/ never enters it; the
# suite serves a vite preview of a production build, so frontend unit tests,
# their config, lint, docs, the image build and the development env files never
# enter it. A commit that touches only those skips the suite. Any other path,
# a new file included, runs it.
#
# One suite per pull request (F4, fork C, 2026-10-20). When backend-ci calls
# this (E2E_CALLER=backend-ci) for a pull request that also touches a path
# frontend-ci triggers on, frontend-ci runs this same script on the same diff
# and so reaches the same verdict; backend-ci skips its copy instead of a second
# identical run. Pushes to main keep both runs, so a red suite still stops both
# deploy chains. The list below must match frontend-ci.yml's paths filter: a
# path missing from it costs a duplicate run, a path listed here that
# frontend-ci does not trigger on would leave the pull request without a suite.
#
# Produces: run=true|false on $GITHUB_OUTPUT and, for a skip, the reason in the
# job summary. A manual dispatch always runs.
# HEAD^..HEAD is the pull request's own diff on a pull_request run, because the
# checked-out commit is the merge commit; on a push it is the pushed commit.
# Failure mode: exits non-zero (set -e) when git cannot compare HEAD with its
# parent, as in a checkout without fetch-depth 2; the job then fails rather
# than guessing, and the caller's build-and-test reports it.
# =============================================================================
set -euo pipefail

if [ "${GITHUB_EVENT_NAME:-}" = "workflow_dispatch" ]; then
  echo "run=true" >> "$GITHUB_OUTPUT"
  exit 0
fi

changed=$(git diff --name-only HEAD^ HEAD)
echo "$changed"

frontend_ci='^(frontend/|ops/nginx/|\.github/(workflows/frontend-ci\.yml|scripts/(verify-image-contract|report-dependency-tree|frontend-ci-summary)\.sh|actions/image-sbom-scan/))'
if [ "${E2E_CALLER:-}" = "backend-ci" ] && [ "${GITHUB_EVENT_NAME:-}" = "pull_request" ] \
    && grep -qE "$frontend_ci" <<< "$changed"; then
  echo "run=false" >> "$GITHUB_OUTPUT"
  echo "frontend-ci also checks this pull request and runs the browser suite there; backend-ci skips its copy." >> "$GITHUB_STEP_SUMMARY"
  exit 0
fi

watched='^(src/|pom\.xml|frontend/|\.github/(workflows/e2e-playwright\.yml|scripts/e2e-relevant\.sh))'
unseen='^(src/test/|frontend/(src/__tests__/|vitest\.config\.ts$|eslint\.config\.js$|README\.md$|typedoc\.json$|Dockerfile$|\.env\.development$|\.env\.example$))'
relevant=$(echo "$changed" | grep -E "$watched" | grep -vE "$unseen" || true)

if [ -n "$relevant" ]; then
  echo "run=true" >> "$GITHUB_OUTPUT"
else
  echo "run=false" >> "$GITHUB_OUTPUT"
  echo "No change the browser suite can see; the E2E run is skipped." >> "$GITHUB_STEP_SUMMARY"
fi
