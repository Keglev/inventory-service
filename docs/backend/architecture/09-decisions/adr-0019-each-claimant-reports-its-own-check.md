# ADR-0019: Each CI claimant reports its own required check

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-11-02

## Context
Since ADR-0016 the ruleset protect-main requires one status, the bare context
`build-and-test`, and three workflows declare a job by that name:
`backend-ci.yml`, `frontend-ci.yml` and `docs-pr-check.yml`. Their
`pull_request` path filters split the repository between them, so a pull
request confined to one family is reported once.

A pull request that spans families is reported once per family, under the same
name. GitHub does not say which run counts, and ADR-0016 left that open. Pull
request #446 (docs page and frontend code, 2026-10-29) answered it in practice:
`docs-pr-check.yml` finished first, `build-and-test` turned green, and the pull
request showed as mergeable while the frontend suite was still running (W27).
It was merged only after the frontend run finished, because the runs were read
by hand.

Separate names close the gap, but a required check must report on every pull
request. GitHub's documentation is explicit: a workflow skipped by a path
filter leaves its checks pending ("Waiting for status to be reported") and
blocks the merge, while a job skipped by an `if:` condition reports success.
Docs, backend and frontend changes often arrive alone, so the three checks
cannot all be required while each workflow keeps its path filter.

## Decision
Each claimant reports a check of its own, and all three are required.

- The aggregator jobs are named `build-and-test-backend`,
  `build-and-test-frontend` and `build-and-test-docs`. The ruleset requires
  these three contexts instead of `build-and-test`.
- The three workflows lose their `pull_request` path filters and run on every
  pull request. Their first job calls the reusable `claimant-gate.yml`, which
  runs `.github/scripts/claimant-gate.sh <family>` on the pull request's own
  diff (`HEAD^..HEAD` of the merge commit) and returns `run=true|false`.
- Every other job of the workflow, the reusable browser suite and YAML lint
  included, runs only with `run=true`. The aggregator passes when the gate
  returned `run=false`, and fails when the gate itself failed.
- The families are the old path filters, unchanged: frontend = `frontend/`,
  `ops/nginx/`, `frontend-ci.yml`, the three scripts it runs and the SBOM
  action; docs = `docs/`, the docs scripts and toolchain action, `docs-build.yml`,
  `docs-pr-check.yml`, `lychee.toml`; backend = every other path.
- Pushes to `main` keep their path filters. The deploy chains start from the CI
  run of their own family (`workflow_run`), and a run with skipped jobs on every
  push would start them for nothing.

## Alternatives Considered
- **Keep one name and read every check before merging.** It works while the
  merging person remembers it; the merge button does not.
- **Three required names, path filters kept.** Every pull request confined to
  one or two families would be blocked forever by the missing check.
- **One always-running workflow that waits for the others.** It needs polling
  through the API, with "not started yet" and "not relevant" states to tell
  apart; the gate job gives the same guarantee with the platform's own rules.

## Consequences
- A pull request merges only when every family it touches has passed: the case
  of #446 can no longer show as mergeable early.
- A docs-only pull request runs the docs checks; the backend and frontend
  workflows run their gate job (seconds) and report success. The same holds
  for a backend-only or frontend-only pull request.
- Every pull request starts all three workflows. The cost of an idle one is one
  short gate job.
- The path lists exist twice: in the push filters and in `claimant-gate.sh`
  (and the frontend list a third time in `e2e-relevant.sh`). A path added to
  one place must be added to the others; the script's header says so.
- `frontend-ci.yml` stands at its size alarm (180 code lines). The next
  addition there needs a script or a waiver.

## Implementation Notes
- The gate script returns `run=true` for a push or a manual run, and exits
  non-zero for an unknown family or a checkout without the parent commit.
- Replayed over the last 99 merged pull requests (#385 to #484): for every one,
  the gate's three verdicts equal the set of claimant workflows that actually
  ran on it; all seven non-empty combinations of families occur. A planted
  change (`ops/nginx/` dropped from the frontend list) moves #411 to the
  backend and nothing else.
- The ruleset change belongs to the merge of this change: the three new
  contexts replace `build-and-test` right before the merge, after the other
  open pull requests have merged, so none waits for a name it does not report.

## Amendment 2026-11-12: what the ruleset requires, and the drift check
- **Branches need not be up to date.** The ruleset does not require a pull
  request's branch to contain the latest `main` before it merges. A pull request is
  tested on its merge commit with `main` as it was when the run started; after the
  merge, the push run on `main` tests the merged tree again, and only a successful
  push run starts the image build and deploy chains. Two changes that pass alone but
  break together therefore stop at the release, not in production, without forcing
  every open pull request to re-run after each merge.
- **A fourth required check.** Besides the three claimant checks the ruleset
  requires `GitGuardian Security Checks`, the secret scan GitHub's GitGuardian app
  reports on every pull request.
- **A check over two families.** `openapi-drift.yml` compares the OpenAPI spec with
  the controllers and DTOs. Its files belong to the docs family (the spec) and the
  backend family (controllers and DTOs), so `backend-ci.yml` and `docs-pr-check.yml`
  both call it as a job behind their aggregators, and it has its own diff gate: it
  runs when the pull request touches `docs/backend/api/`, a `controller/` or `dto/`
  folder, or the check itself. A check that spans two families follows this shape;
  one that spans all three is called by all three claimants, as the YAML lint is
  (ADR-0016, amendment of 2026-10-20).

## References
- [ADR-0016: One claimant for the required check, and the browser suite inside CI](adr-0016-one-claimant-and-the-e2e-inside-ci.md)
- [ADR-0017: Workflow files are named by chain, not numbered](adr-0017-workflows-named-by-chain.md)
- GitHub Docs, troubleshooting required status checks (handling skipped but required checks): https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks
- System-wide decisions index (`../../../decisions/index.md`)

---

Frontend decisions: see [docs/frontend/architecture/adr/](../../../frontend/architecture/09-decisions/index.md)

[Back to Architecture Index](../index.md)
