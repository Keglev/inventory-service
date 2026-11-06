#!/usr/bin/env bash
# =============================================================================
# check-openapi-drift.sh - lints the OpenAPI spec and compares it with the code
# Usage: bash .github/scripts/docs/check-openapi-drift.sh [repo-root]
#        as the step of openapi-drift.yml; needs node and the pinned redocly on
#        PATH (docs-toolchain with redoc: 'true'). Runs locally the same way.
#
# Two checks, both from Standards OPENAPI (FY-1 A):
#   1. redocly lint with docs/backend/api/redocly.yaml. Findings accepted on
#      purpose live in docs/backend/api/.redocly.lint-ignore.yaml; every other
#      error or warning fails, so a new warning cannot pile up unnoticed.
#   2. check-openapi-drift.mjs over the dereferenced bundle and src/main/java:
#      operations, parameters and response schemas against the controllers.
#
# Produces: the lint findings and the drift lines on stdout, one summary line
# per check.
# FAILURE MODE: exits non-zero on a lint error or warning, on any drift line,
# or when either tool cannot run (missing redocly, a spec that does not bundle).
# =============================================================================
set -euo pipefail

root="${1:-.}"
api="$root/docs/backend/api"
export REDOCLY_TELEMETRY=off
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

redocly lint "$api/openapi.yaml" --config "$api/redocly.yaml" --format=json > "$tmp/lint.json" || true
# shellcheck disable=SC2016 # ${...} below are JavaScript template literals, not shell
node -e '
  const r = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  for (const p of r.problems) {
    const at = p.location[0];
    console.log(`LINT ${p.severity} ${p.ruleId} ${at.source.ref}${at.pointer}: ${p.message}`);
  }
  const t = r.totals;
  console.log(`lint: ${t.errors} errors, ${t.warnings} warnings, ${t.ignored} accepted`);
  process.exit(t.errors + t.warnings ? 1 : 0);
' "$tmp/lint.json" || lint_failed=1

redocly bundle "$api/openapi.yaml" --dereferenced --ext json -o "$tmp/bundle.json" > /dev/null
node "$root/.github/scripts/docs/check-openapi-drift.mjs" "$tmp/bundle.json" "$root/src/main/java"

[ -z "${lint_failed:-}" ]
