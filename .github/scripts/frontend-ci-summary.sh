#!/usr/bin/env bash
# =============================================================================
# frontend-ci-summary.sh - writes the frontend CI job summary
# Usage: bash .github/scripts/frontend-ci-summary.sh, the last step of the
#        frontend job in frontend-ci.yml.
# It writes the frontend CI job summary: which coverage artifact this run produced
# and what happened to the image. A pull request builds and scans the image
# without publishing it; a push publishes it and frontend-deploy.yml takes it
# from there.
#
# Extracted from frontend-ci.yml when the file reached its size alarm.
# Inputs: HEAD_SHA (set by the caller), GITHUB_EVENT_NAME, IMAGE_NAME.
# Produces: a few lines in $GITHUB_STEP_SUMMARY.
# Failure mode: exits non-zero (set -u) when HEAD_SHA or GITHUB_STEP_SUMMARY is
# unset; it reads nothing else, so a content error cannot fail it.
# =============================================================================
set -euo pipefail

{
  echo "## Frontend CI Results"
  echo "- **Coverage artifact:** \`frontend-coverage-html-${HEAD_SHA}\`"
  if [ "${GITHUB_EVENT_NAME}" = "pull_request" ]; then
    echo "- **Image:** built and scanned, not published"
  else
    echo "- **Image:** \`${IMAGE_NAME}:${GITHUB_SHA}\`"
    echo "- **Next:** \`frontend-deploy.yml\` deploys this image to Koyeb"
  fi
} >> "$GITHUB_STEP_SUMMARY"
