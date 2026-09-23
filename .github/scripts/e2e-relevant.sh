#!/usr/bin/env bash
# =============================================================================
# Decides whether the Playwright suite can tell this commit anything.
#
# The callers (1-ci-test.yml, 5-frontend-ci.yml) trigger on wider path sets
# than the browser suite covers: the backend gate is the repository's catch-all,
# so without this decision a README or a release-workflow edit would start a
# browser run that cannot fail for any reason connected to the change.
#
# Writes run=true|false to $GITHUB_OUTPUT. A manual dispatch always runs.
# HEAD^..HEAD is the pull request's own diff on a pull_request run, because the
# checked-out commit is the merge commit; on a push it is the pushed commit.
# =============================================================================
set -euo pipefail

if [ "${GITHUB_EVENT_NAME:-}" = "workflow_dispatch" ]; then
  echo "run=true" >> "$GITHUB_OUTPUT"
  exit 0
fi

changed=$(git diff --name-only HEAD^ HEAD)
echo "$changed"

if echo "$changed" | grep -qE '^(src/|pom\.xml|frontend/|\.github/(workflows/e2e-playwright\.yml|scripts/e2e-relevant\.sh))'; then
  echo "run=true" >> "$GITHUB_OUTPUT"
else
  echo "run=false" >> "$GITHUB_OUTPUT"
  echo "No change the browser suite can see; the E2E run is skipped." >> "$GITHUB_STEP_SUMMARY"
fi
