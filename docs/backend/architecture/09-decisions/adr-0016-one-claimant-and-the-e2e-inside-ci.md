# ADR-0016: One claimant for the required check, and the browser suite inside CI

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-09-23

## Context
Ruleset 19198869 (protect-main) requires one status: the bare context
`build-and-test`. Until this decision four workflows declared a job by that
name, and their trigger paths were arranged so that every pull request reached
at least one of them: `1-ci-test.yml` ignored exactly the union of the frontend
and docs path sets, and so acted as the catch-all.

Two defects followed from that arrangement.

The first is a release defect. `2-docker-backend.yml`, `4-deploy-backend.yml`,
`6-deploy-frontend.yml` and `docs-pipeline.yml` all trigger on a `workflow_run`
of their own CI and test `conclusion == 'success'`. The browser suite was a
workflow of its own, in no chain, so a merge whose Playwright run went red still
built an image and still deployed both tiers. The suite gated the merge and not
the release.

The second is an ambiguity. On a frontend pull request two workflows reported
`build-and-test` for the same commit. GitHub's documentation advises that a
required job name be unique across workflows, because the same name in several
workflows can give ambiguous results; it does not say which run wins. The
question was carried open for two sessions and never decided, because the only
honest way to answer it is to let a required check go red on a pull request into
`main`.

What was established, on pull request #177 (closed, never merged): a required
check that never reports leaves the pull request `BLOCKED` while GitHub still
calls it `MERGEABLE`. Coverage of every path by some claimant is therefore
load-bearing, not a nicety. The same probe showed that a ruleset restricts
branch deletion by default.

## Decision
One workflow claims `build-and-test` for any given pull request, and the browser
suite runs inside the CI it belongs to.

- `e2e-playwright.yml` is a reusable workflow (`workflow_call`), with no `push`
  or `pull_request` trigger and a job named `e2e`. It keeps the number-free name
  because it is no longer a step in the numbered build-and-deploy sequence.
- `1-ci-test.yml` and `5-frontend-ci.yml` each call it as a job, beside their own
  work rather than after it, and each ends in an aggregator job named
  `build-and-test` that fails when either job failed or was cancelled and passes
  when the suite was skipped.
- The suite decides for itself whether it can say anything: a gate job runs
  `.github/scripts/e2e-relevant.sh`, which looks for `src/`, `pom.xml`,
  `frontend/`, the workflow or the script itself in the commit's own diff.
- The three claimants are `1-ci-test.yml` (backend and catch-all),
  `5-frontend-ci.yml` (frontend) and `docs-pr-check.yml` (docs). No path belongs
  to two of them, so a pull request confined to one family sees exactly one run
  of the required name.

## Alternatives Considered
- **Keep the four claimants and document the catch-all.** It leaves the release
  defect in place and keeps relying on behaviour GitHub calls ambiguous.
- **Gate the deploys on the suite's result from outside**, by asking the API for
  the conclusion of the e2e run on the same commit before deploying. Two
  workflows would gain polling logic, with "not started yet" and "does not
  apply" to handle, and the ambiguity would remain.
- **Chain `6-deploy-frontend.yml` behind the browser suite instead of behind
  frontend CI.** The suite also runs for backend-only changes, when no frontend
  image was built, so the deploy would fire with nothing new to deploy.
- **Settle the ambiguity by experiment.** A probe against a second protected
  branch cannot work: every claimant filters `pull_request` to `main`. The
  remaining variants are a red required check on a pull request into `main`, or
  a throwaway repository that proves the rule elsewhere. Removing the repetition
  was cheaper than measuring it.

## Consequences
- A red browser suite now fails the CI run that called it, so no image is built
  and neither tier deploys. That is the defect this decision exists to close.
- A backend change waits for the suite before the image is built: roughly one to
  two minutes later than before. On the frontend side the suite runs beside a
  longer job and costs no extra wall-clock time.
- A commit the suite cannot see skips it, and the aggregator still passes.
- The standalone "7 Frontend E2E" entries no longer appear in the run list; the
  suite appears as jobs inside the calling run.
- `1-ci-test.yml` stays the catch-all: a change outside the frontend and docs
  path sets still runs the backend suite, even when it cannot affect the backend.
  That cost is accepted here, and it is the reason its `paths-ignore` must stay
  the exact complement of the other two claimants. Adding a path to one of them
  without adding it here runs the backend suite for nothing; removing a path from
  one of them without removing it here leaves those pull requests with no
  claimant and permanently blocked.
- A new workflow declaring a `build-and-test` job would widen the ambiguity.
  New checks belong in an existing claimant, as a job behind its aggregator.
- The ambiguity is reduced, not abolished. A pull request that spans families,
  backend and docs for instance, still produces one run of the required name per
  family, and GitHub still does not define which counts. What this decision
  removes is the case where two workflows claimed the SAME paths: every frontend
  pull request used to produce two runs, and now produces one. Whether the
  remaining case matters can be settled, if it ever does, in a throwaway
  repository rather than by failing a check on `main`.

## Implementation Notes
- The aggregator reads `needs.<job>.result`, not `success()`, so a skipped suite
  is distinguishable from a failed one.
- The gate script reads `HEAD^..HEAD`: on a `pull_request` run the checked-out
  commit is the merge commit, so that range is the pull request's own diff.
- Two reporting blocks moved out of `5-frontend-ci.yml`
  (`report-dependency-tree.sh`, `frontend-ci-summary.sh`) to keep the file below
  its size alarm once the two jobs were added. Neither can fail a run.
- Verified with `actionlint` over all eleven workflows, and by running the gate
  script against the last six commits on `main`: the docs-only commit yields
  `run=false`, the five source commits `run=true`.

## Amendment 2026-09-24: paths the suite cannot see

The gate script no longer runs the suite for every change under `src/` or
`frontend/`. It sets aside the paths that never reach what the suite runs, and
runs the suite only if a watched path is left:

- `src/test/`: the suite's backend jar is packaged with tests skipped
  (`-Dmaven.test.skip=true`), so no test source or test resource enters it.
- Under `frontend/`: `src/__tests__/`, `vitest.config.ts`, `eslint.config.js`,
  `README.md`, `typedoc.json`, `Dockerfile`, `.env.development` and
  `.env.example`. The suite serves a `vite preview` of a production build, not
  the image, and a production build reads neither env file.

Any other path in a watched tree, a new file included, still runs the suite. A
broken spec would also break the suite's own build, since `tsc -b` compiles the
tests; `5-frontend-ci`'s own job fails on the same error, so no signal is lost.

Replayed over the 437 commits on `main` from 2026-06-01 to `775c9db0cb`: 49 flip
from run to skip, 28 of them frontend and 21 backend, and no other commit
changes its result.

Superseded by this block:

- Decision: the gate script "looks for `src/`, `pom.xml`, `frontend/`, the
  workflow or the script itself in the commit's own diff". It still looks for
  those, less the paths above.

## References
- [ADR-0013: The docs pipeline rebuilds, and publishes, by change](adr-0013-docs-pipeline-rebuilds-by-change.md)
- [ADR-0015: GitHub Pages is deployed by the publisher job](adr-0015-pages-deployed-from-the-publisher-job.md)
- Frontend ADR-0009 and its amendment of 2026-09-23
- About protected branches (job names should be unique across workflows): https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- System-wide decisions index (`../../../decisions/index.md`)

---

Frontend decisions: see [docs/frontend/architecture/adr/](../../../frontend/architecture/09-decisions/index.md)

[Back to Architecture Index](../index.md)
