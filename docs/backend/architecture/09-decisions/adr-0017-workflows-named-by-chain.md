# ADR-0017: Workflow files are named by chain, not numbered

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-09-24

## Context
The six workflows of the push-to-main chains carried a number in the file name
and in the display name (`1-ci-test.yml`, "1 Backend CI - Build & Test"). The
rule, in the project standards since 2026-09-21, was that a numbered file is a
step in the chain that runs on a push to main, in execution order, and every
other workflow is unnumbered. ADR-0016 applied it when the browser suite left
the numbers, and the release left them with it.

One sequence of numbers described three separate chains. Backend (1, 2, 4) and
frontend (5, 6) run independently of each other, and 3 publishes the docs after
a workflow that had no number at all. A reader could not tell from the names
which workflows belong together, and the five unnumbered files sorted after all
of them.

GitHub reads workflows only from `.github/workflows` and supports no
subdirectories there, so grouping cannot come from folders. Its Actions sidebar
lists workflows alphabetically by display name.

## Decision
A workflow is named by the chain it belongs to: `backend-`, `frontend-` or
`docs-`, followed by what it does. The display name follows the same pattern.
A workflow that belongs to no single chain keeps a plain name that says what it
does. No workflow carries a number.

| Previous file | File | Display name |
|---|---|---|
| `1-ci-test.yml` | `backend-ci.yml` | Backend CI - Build & Test |
| `2-docker-backend.yml` | `backend-docker.yml` | Backend Docker - Build & Scan |
| `4-deploy-backend.yml` | `backend-deploy.yml` | Backend Deploy - Hetzner |
| `5-frontend-ci.yml` | `frontend-ci.yml` | Frontend CI - Build & Test |
| `6-deploy-frontend.yml` | `frontend-deploy.yml` | Frontend Deploy - Koyeb |
| `3-deploy-ghpages.yml` | `docs-deploy.yml` | Docs Deploy - GitHub Pages |
| `docs-pipeline.yml` | `docs-build.yml` | Docs Build - Site & Link Check |
| `e2e-playwright.yml` | unchanged | E2E - Playwright Browser Suite |

`docs-pr-check.yml`, `release.yml` and `yaml-lint.yml` keep their names. The
browser suite's inner job is renamed from `e2e` to `e2e-playwright`, so its
check reads `e2e / e2e-playwright` instead of `e2e / e2e`. The calling jobs keep
the id `e2e`, and the three aggregator jobs keep the name `build-and-test`, which the
branch ruleset requires.

## Alternatives Considered
- **Keep the numbers.** One order across three chains that do not depend on
  each other, and every workflow added to a chain would force a renumbering.
- **Subdirectories per chain.** Not supported by GitHub.
- **A shared prefix for the unassigned workflows** (for example `shared-`). An
  invented prefix no reader would recognise; the three files are few and say
  what they do.

## Consequences
- The execution order is no longer in the names. It is shown by the workflow
  table and the sequence diagram in section 7 (Deployment View).
- GitHub keys a workflow by its file path, so each renamed workflow starts a new
  run history in the Actions tab; the old runs stay listed under the old names.
- Five workflows start on another workflow's completion by display name, in six
  references, and one compares the name of the workflow that started it, twice.
  Renaming a display name means changing every one of those references in the
  same commit, or the chain stops without failing. All eight were changed with
  the rename.
- The status badges in the README point at the new file names.
- The decision records before this one are immutable and keep the old names.
  The table above maps each of them.
- Supersedes the numbering rule applied in ADR-0016 ("It keeps the number-free
  name because it is no longer a step in the numbered build-and-deploy
  sequence") and the job name `e2e` for the browser suite named in ADR-0016 and
  in the 2026-09-23 amendment of frontend ADR-0009.

## References
- [ADR-0016: One claimant for the required check, and the browser suite inside CI](adr-0016-one-claimant-and-the-e2e-inside-ci.md)
- Frontend ADR-0009 and its amendment of 2026-09-23
- GitHub Docs, reusing workflows: reusable workflows live in `.github/workflows`, and subdirectories of that directory are not supported
- System-wide decisions index (`../../../decisions/index.md`)

---

Frontend decisions: see [docs/frontend/architecture/adr/](../../../frontend/architecture/09-decisions/index.md)

[Back to Architecture Index](../index.md)
