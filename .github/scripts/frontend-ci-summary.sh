#!/usr/bin/env bash
# =============================================================================
# Writes the frontend CI job summary: which coverage artifact this run produced
# and what happened to the image. A pull request builds and scans the image
# without publishing it; a push publishes it and 6-deploy-frontend.yml takes it
# from there.
#
# Extracted from 5-frontend-ci.yml when the file reached its size alarm.
# Inputs: HEAD_SHA (set by the caller), GITHUB_EVENT_NAME, IMAGE_NAME.
# =============================================================================
set -euo pipefail

{
  echo "## Frontend CI Results"
  echo "- **Coverage artifact:** \`frontend-coverage-html-${HEAD_SHA}\`"
  if [ "${GITHUB_EVENT_NAME}" = "pull_request" ]; then
    echo "- **Image:** built and scanned, not published"
  else
    echo "- **Image:** \`${IMAGE_NAME}:${GITHUB_SHA}\`"
    echo "- **Next:** \`6-deploy-frontend.yml\` deploys this image to Koyeb"
  fi
} >> "$GITHUB_STEP_SUMMARY"
