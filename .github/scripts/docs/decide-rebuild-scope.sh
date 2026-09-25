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
# One merge can start up to three runs, and each builds only its own share
# (DOCS_TRIGGER, set by docs-build.yml). The push run builds the pages from
# docs/**; the run after backend CI builds nothing and carries JaCoCo; the run
# after frontend CI builds TypeDoc and carries frontend coverage. A full
# rebuild is the push run's, except TypeDoc when frontend source also changed:
# frontend CI then runs too, and its run rebuilds TypeDoc from the same commit.
#
# Every match reads the list from a here-string, not a pipe. Under pipefail,
# `echo | grep -q` fails when grep exits on its first match before echo has
# written everything, which on a long file list read as "no match" and
# skipped a subtree about once in forty runs.
#
# Failure mode: aborts the step. It needs DOCS_TRIGGER (push, backend or
# frontend), GITHUB_OUTPUT, GITHUB_STEP_SUMMARY and a checkout with
# fetch-depth >= 2; a missing or unknown one stops the run rather than
# publishing a wrong scope.
# =============================================================================
set -euo pipefail
changed="$(git diff --name-only HEAD^ HEAD)"
echo "$changed"

full=false
if grep -qE '^(docs/_theme/|\.github/scripts/docs/|\.github/workflows/docs-build\.yml$)' <<<"$changed"; then
  full=true
fi

typedoc=false; redoc=false
arch_backend=false; arch_frontend=false; decisions=false

frontend_src=false
if grep -qE '^frontend/(src/|typedoc\.json$|package\.json$|package-lock\.json$|tsconfig\.app\.json$)' <<<"$changed"; then
  frontend_src=true
fi

case "$DOCS_TRIGGER" in
  push)
    redoc="$full"; arch_backend="$full"; arch_frontend="$full"; decisions="$full"
    if [ "$full" = true ] && [ "$frontend_src" = false ]; then
      typedoc=true
    fi
    if grep -qE '^docs/backend/api/' <<<"$changed"; then
      redoc=true
    fi
    if grep -qE '^docs/backend/architecture/' <<<"$changed"; then
      arch_backend=true
    fi
    if grep -qE '^docs/frontend/architecture/' <<<"$changed"; then
      arch_frontend=true
    fi
    if grep -qE '^docs/decisions/' <<<"$changed"; then
      decisions=true
    fi
    ;;
  backend)
    ;;
  frontend)
    typedoc="$frontend_src"
    ;;
  *)
    echo "::error::DOCS_TRIGGER must be push, backend or frontend, got '$DOCS_TRIGGER'"
    exit 1
    ;;
esac

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
  echo "### Docs rebuild plan ($DOCS_TRIGGER run)"
  echo "- full rebuild: $full"
  echo "- frontend/api (TypeDoc): $typedoc"
  echo "- backend/api (ReDoc): $redoc"
  echo "- backend/architecture: $arch_backend"
  echo "- frontend/architecture: $arch_frontend"
  echo "- decisions: $decisions"
} >> "$GITHUB_STEP_SUMMARY"
