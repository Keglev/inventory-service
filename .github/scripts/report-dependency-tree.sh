#!/usr/bin/env bash
# =============================================================================
# report-dependency-tree.sh - writes the frontend dependency audit to the job summary
# Usage: bash .github/scripts/report-dependency-tree.sh from the repository
#        root, a step of frontend-ci.yml that runs even when earlier steps fail.
# Reporting only: the
# gate that can fail the job is the separate `npm audit --omit=dev` step in
# frontend-ci.yml, which is why every finding here is tolerated.
#
# Extracted from that workflow when the file reached its size alarm.
# Produces: the full npm audit output in $GITHUB_STEP_SUMMARY.
# Failure mode: never fails on a finding (npm audit's exit status is
# swallowed); exits non-zero only when frontend/ is missing or the summary
# file is unset.
# =============================================================================
set -euo pipefail

cd frontend

{
  echo "## Dependency audit"
  echo ""
  echo '```'
  npm audit 2>&1 || true
  echo '```'
  echo ""
  echo "Development-only findings are reported here and do not fail the job."
} >> "$GITHUB_STEP_SUMMARY"
