#!/usr/bin/env bash
# =============================================================================
# decide-rebuild-scope.sh — Docs rebuild scope gate
# Usage: bash .github/scripts/docs/decide-rebuild-scope.sh
#        Invoked by .github/workflows/docs-build.yml as the step with
#        id `gate`, from the repository root.
#
# Produces seven booleans on $GITHUB_OUTPUT (full, typedoc, redoc, arch_backend,
# arch_frontend, decisions, pandoc) and a readable plan on $GITHUB_STEP_SUMMARY.
# Later steps read them as steps.gate.outputs.<name>.
#
# Three outcomes. A theme, generator-script or pipeline change rebuilds all
# five, because the nav partial and the templates are embedded in every page
# and a half-rebuilt site would serve two different navigations. A source
# change under one of the five listed prefixes rebuilds that subtree alone.
# Everything else — README.md, LICENSE, pom.xml, Dockerfile, src/**,
# ops/nginx/**, docker/**, scripts/**, lychee.toml, the other workflows —
# rebuilds nothing, and the run still assembles, link-checks and publishes,
# because the coverage report that a backend or frontend CI run carries in is
# new even when no page is.
#
# Failure mode: aborts the step. It needs GITHUB_OUTPUT, GITHUB_STEP_SUMMARY
# and a checkout with fetch-depth >= 2; under `set -u` a missing one stops the
# run rather than publishing a wrong scope.
# =============================================================================
set -euo pipefail
changed="$(git diff --name-only HEAD^ HEAD)"
echo "$changed"

full=false
if echo "$changed" | grep -qE '^(docs/_theme/|\.github/scripts/docs/|\.github/workflows/docs-build\.yml$)'; then
  full=true
fi

typedoc="$full"; redoc="$full"
arch_backend="$full"; arch_frontend="$full"; decisions="$full"

if echo "$changed" | grep -qE '^frontend/(src/|typedoc\.json$|package\.json$|package-lock\.json$|tsconfig\.app\.json$)'; then
  typedoc=true
fi
if echo "$changed" | grep -qE '^docs/backend/api/'; then
  redoc=true
fi
if echo "$changed" | grep -qE '^docs/backend/architecture/'; then
  arch_backend=true
fi
if echo "$changed" | grep -qE '^docs/frontend/architecture/'; then
  arch_frontend=true
fi
if echo "$changed" | grep -qE '^docs/decisions/'; then
  decisions=true
fi

# build-typedoc-html.sh and build-architecture-docs.sh both render through
# pandoc, so the install is needed if any of those four is selected. The
# decisions index is converted by build-architecture-docs.sh like the two
# architecture trees, from a different source directory.
pandoc=false
if [ "$typedoc" = true ] || [ "$arch_backend" = true ] || [ "$arch_frontend" = true ] || [ "$decisions" = true ]; then
  pandoc=true
fi

{
  echo "full=$full"
  echo "typedoc=$typedoc"
  echo "redoc=$redoc"
  echo "arch_backend=$arch_backend"
  echo "arch_frontend=$arch_frontend"
  echo "decisions=$decisions"
  echo "pandoc=$pandoc"
} >> "$GITHUB_OUTPUT"

{
  echo "### Docs rebuild plan"
  echo "- full rebuild: $full"
  echo "- frontend/api (TypeDoc): $typedoc"
  echo "- backend/api (ReDoc): $redoc"
  echo "- backend/architecture: $arch_backend"
  echo "- frontend/architecture: $arch_frontend"
  echo "- decisions: $decisions"
} >> "$GITHUB_STEP_SUMMARY"
