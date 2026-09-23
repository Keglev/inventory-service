#!/usr/bin/env bash
# =============================================================================
# Writes the frontend dependency audit to the job summary. Reporting only: the
# gate that can fail the job is the separate `npm audit --omit=dev` step in
# 5-frontend-ci.yml, which is why every finding here is tolerated.
#
# Extracted from that workflow when the file reached its size alarm.
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
