#!/usr/bin/env bash
# =============================================================================
# deploy-pages.sh - deploys one uploaded Pages artifact and waits for its result
# Usage: bash .github/scripts/deploy-pages.sh, from docs-deploy.yml, with
#        ARTIFACT_ID (upload-pages-artifact's artifact_id), PAGES_SHA (the
#        gh-pages commit the artifact was cut from), GH_TOKEN (pages: write) and
#        the job's id-token: write permission.
#
# It replaces actions/deploy-pages, which names every deployment after
# GITHUB_SHA. Under workflow_run that is main's newest commit, not the built
# one, so two runs of one merge, or a run that finishes after the next merge,
# share a name: the second reads the first's status and reports success without
# going live (backend ADR-0015). Here the build version is the gh-pages commit
# the artifact was cut from. Pages accepts only a commit of the repository (a
# derived hash got HTTP 404), and every push, re-runs included, makes a new
# one, so every deployment has its own name and the script reads only its own
# status.
#
# Produces: one Pages deployment; page_url in $GITHUB_OUTPUT (stdout when
# unset).
#
# Failure mode: exits 1 when the deployment is refused, fails, is cancelled or
# is lost, after 10 failed status reads, or after 10 minutes; on the last two,
# and on a cancelled job, the deployment is cancelled first so it cannot block
# the next one.
# =============================================================================
set -euo pipefail

: "${ARTIFACT_ID:?ARTIFACT_ID is required}"
: "${PAGES_SHA:?PAGES_SHA is required}"
: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${ACTIONS_ID_TOKEN_REQUEST_URL:?the job needs permission id-token: write}"
: "${ACTIONS_ID_TOKEN_REQUEST_TOKEN:?the job needs permission id-token: write}"
OUT="${GITHUB_OUTPUT:-/dev/stdout}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-600}"
POLL_SECONDS="${POLL_SECONDS:-5}"
MAX_ERRORS=10
API="repos/${GITHUB_REPOSITORY}/pages/deployments"

BUILD_VERSION="$PAGES_SHA"
echo "Build version: gh-pages commit $BUILD_VERSION"

# The OIDC token proves to Pages which workflow run asks; no audience, as in
# actions/deploy-pages (core.getIDToken()).
oidc="$(curl -sSf -H "Authorization: bearer ${ACTIONS_ID_TOKEN_REQUEST_TOKEN}" \
  "${ACTIONS_ID_TOKEN_REQUEST_URL}" | jq -r '.value')"
[ -n "$oidc" ] && [ "$oidc" != null ] || { echo "::error::no OIDC token was issued"; exit 1; }

# The request body goes through stdin so the token never appears in a process list.
# On a refusal gh prints the API's error body to stdout: it is logged, it holds no token.
created="$(jq -n --argjson id "$ARTIFACT_ID" --arg v "$BUILD_VERSION" --arg t "$oidc" \
    '{artifact_id: $id, pages_build_version: $v, oidc_token: $t}' \
  | gh api -X POST "$API" -H 'Content-Type: application/json' --input -)" || {
  echo "$created"
  echo "::error::Pages refused the deployment of build version $BUILD_VERSION"
  exit 1
}
unset oidc

deployment_id="$(jq -r '.id // ((.status_url // "") | split("/") | last | select(. != "")) // empty' <<< "$created")"
[ -n "$deployment_id" ] || deployment_id="$BUILD_VERSION"
page_url="$(jq -r '.page_url // empty' <<< "$created")"
echo "page_url=$page_url" >> "$OUT"
echo "Created deployment $deployment_id"

pending=true
cancel_deployment() {
  [ "$pending" = true ] || return 0
  pending=false
  if gh api -X POST "$API/$deployment_id/cancel" > /dev/null; then
    echo "Cancelled deployment $deployment_id"
  else
    echo "::warning::could not cancel deployment $deployment_id"
  fi
}
trap 'cancel_deployment; exit 1' INT TERM

errors=0
deadline=$(( $(date +%s) + TIMEOUT_SECONDS ))
while :; do
  sleep "$POLL_SECONDS"
  if status="$(gh api "$API/$deployment_id" --jq '.status')"; then
    case "$status" in
      succeed)
        pending=false
        echo "Deployment $deployment_id is live"
        exit 0 ;;
      deployment_failed|deployment_content_failed|deployment_cancelled|deployment_lost)
        pending=false
        echo "::error::deployment $deployment_id ended as $status"
        exit 1 ;;
      *)
        echo "Status: $status" ;;
    esac
  else
    errors=$((errors + 1))
    if [ "$errors" -ge "$MAX_ERRORS" ]; then
      echo "::error::$MAX_ERRORS status reads failed"
      cancel_deployment
      exit 1
    fi
  fi
  if [ "$(date +%s)" -ge "$deadline" ]; then
    echo "::error::deployment $deployment_id was not live after $TIMEOUT_SECONDS seconds"
    cancel_deployment
    exit 1
  fi
done
