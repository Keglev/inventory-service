#!/usr/bin/env bash
# =============================================================================
# frontend-deploy-gate.sh - decides whether a frontend CI run is worth deploying
# Usage: git diff --name-only HEAD^ HEAD | bash .github/scripts/frontend-deploy-gate.sh
#        Reads the changed paths of the merge on stdin. Invoked by
#        .github/workflows/frontend-deploy.yml; the backend chain has the same
#        gate inline in backend-docker.yml and backend-deploy.yml.
#
# frontend-ci runs on every frontend/** change, and the deploy used to follow
# every green run, so a merge that touched only specs rebuilt nothing the
# browser receives and still rolled the Koyeb service (FW6 NF-51: 5 of the 62
# deploys since 2026-09-24). This gate skips the deploy only when every changed
# path is on the list below, which names test, lint and CI-only files. Any
# other path deploys, including paths added later: a new file defaults to a
# deploy, never to a silent skip.
#
# Produces: deploy=true|false in $GITHUB_OUTPUT (stdout when unset) and one
# line naming the path that decided it.
#
# Failure mode: none by design; an empty list deploys (nothing proves the run
# test-only). Exits non-zero only on a shell error.
# =============================================================================
set -euo pipefail

OUT="${GITHUB_OUTPUT:-/dev/stdout}"
changed="$(cat)"

deploy=false
reason="every changed path is test, lint or CI only"
if [ -z "$changed" ]; then
  deploy=true
  reason="no changed paths were reported"
fi

# A here-string, not a pipe: the loop must set variables in this shell.
while IFS= read -r path; do
  [ -n "$path" ] || continue
  case "$path" in
    frontend/src/__tests__/*|frontend/e2e/*) ;;
    frontend/vitest.config.ts|frontend/playwright.config.ts) ;;
    frontend/tsconfig.test.json|frontend/eslint.config.js) ;;
    frontend/typedoc.json|frontend/README.md|docs/*) ;;
    .github/workflows/frontend-ci.yml|.github/workflows/e2e-playwright.yml) ;;
    .github/scripts/verify-image-contract.sh) ;;
    .github/scripts/report-dependency-tree.sh) ;;
    .github/scripts/frontend-ci-summary.sh) ;;
    *)
      deploy=true
      reason="$path"
      break
      ;;
  esac
done <<< "$changed"

echo "deploy=$deploy" >> "$OUT"
echo "[frontend-deploy-gate] deploy=$deploy ($reason)"
