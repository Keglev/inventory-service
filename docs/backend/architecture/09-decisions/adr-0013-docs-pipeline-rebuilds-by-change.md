# ADR-0013: The docs pipeline rebuilds, and publishes, by change

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-09-07

## Context
The published documentation site is four generated subtrees plus two coverage
reports and two landing pages: 1,192 files on `gh-pages`. Until this change every
run of `docs-pipeline.yml` regenerated all four subtrees and replaced the whole
branch with the result, whatever the merge had actually touched.

Three costs came out of that, all measured on real runs rather than estimated.

The work was mostly wasted. On the run for `02d420e7`, of roughly 65 seconds of
job time about 50 went on installs and generators whose inputs had not changed:
pandoc 10s, `npm ci` 19s, TypeDoc 7s, the pandoc conversions 16s. Across the
sixteen merges before this wave, three touched `frontend/src`, and none touched
`docs/_theme`, `docs/backend/api` or either architecture tree.

The history was unreadable. Every publish rewrote all 277 themed pages, because
the cache-busting token was stamped from the commit SHA, and a further 152
because TypeDoc embedded the publishing commit in every source link. A real
documentation change was indistinguishable from the noise around it.

And the branch was not safe under concurrency. One merge can trigger this
pipeline up to three times — once on its own push, once behind `1-ci-test.yml`
and once behind `5-frontend-ci.yml` — and each run carries a different artifact:
one has JaCoCo, one has the Vitest report and the TypeDoc pages, one has neither.
A run that published the whole site published the parts it did not build, taken
from a copy of `gh-pages` read minutes earlier during its build. Nothing
serialises that read against another run's push.

Forces:
- The link check must keep its meaning. Every page embeds `nav-backend.html` or
  `nav-frontend.html`, and both link across subtrees, so a run that stages only
  what it rebuilt hands the checker a broken site. Measured against the published
  tree: staging `backend/architecture` alone leaves 210 of its 720 checked links
  unresolved, from five distinct missing targets. That fails the gate; it does
  not merely weaken it.
- Coverage arrives from CI and is not derivable from the repository, so a run
  that did not receive it must not be able to remove it.
- No mechanism exists by which one pipeline run can know that another is in
  flight, and none is wanted.

## Decision
Each run rebuilds only the subtrees its merge can have changed, and publishes
only the paths it built.

A gate step compares the released commit against its first parent, in the shape
`2-docker-backend.yml` already uses, and classifies the change:

| change | rebuilds |
|---|---|
| `docs/_theme/**`, `.github/scripts/docs/**`, `docs-pipeline.yml` | all four subtrees |
| `frontend/src/**`, `typedoc.json`, `package*.json`, `tsconfig.app.json` | `frontend/api` |
| `docs/backend/api/**` | `backend/api` |
| `docs/backend/architecture/**` | `backend/architecture` |
| `docs/frontend/architecture/**` | `frontend/architecture` |
| everything else | nothing |

The theme is not gateable per subtree: the navigation partial and the page
templates are embedded in every page, so a half-rebuilt site would serve two
different navigations. The theme assets and the two landing pages are always
built — four files — because `version_assets` hashes the built assets to stamp
whichever pages the run did produce.

Coverage is not path-gated at all. It follows whichever CI workflow chained into
the run, which is the only thing that determines whether a fresh report exists.

`assemble-site.sh` then lays the build over a shallow copy of the published site,
subtree by subtree, and records in `MANIFEST` what it replaced. The assembled
tree is what the link checker reads, so the check runs against the site as it
will be published rather than against a fragment. The tree is *not* what gets
published: the artifact is the built tree plus its `MANIFEST`, and
`3-deploy-ghpages.yml` replaces exactly those paths and leaves the branch
otherwise untouched.

That is what makes the concurrent runs safe, and it is a different approach from
coordinating them. Runs are not made aware of each other; each is confined to
what it owns, so any interleaving produces the same branch. Verified against the
published site by assembling three runs from one pre-publish snapshot and
publishing them in three different orders: byte-identical every time, where the
previous publisher lost two of the three contributions.

For the same reason `cancel-in-progress` is now `false` on this pipeline.
Cancelling an overtaken run silently dropped the coverage report it was about to
publish, and queuing is only safe once a run publishes just its own paths.

## Alternatives Considered
**Stage only the rebuilt subtrees for the link check, and widen the exclusion
list until it passes.** Rejected on the 210-broken-links measurement above: the
exclusions would have to grow until the check no longer covers the cross-subtree
navigation, which is the part most likely to rot.

**Publish the assembled tree and keep replacing the branch wholesale.** This is
what the first version of the change did, and it is what introduced the
lost-update window: the assembly reads `gh-pages` during the build, the publisher
writes it during the deploy, and nothing serialises the two.

**One gated job per subtree instead of step conditions in one job.** Rejected.
The saving comes from not doing the work, not from doing it in parallel, and five
jobs would pay checkout and tool installation four extra times to hand their
output to an assembly job through artifacts.

**Detect concurrent runs and suppress the redundant ones.** Rejected as
unimplementable. A run cannot know what another run is carrying, and the
alternative — making each run's writes disjoint — removes the need to know.

**A nightly full rebuild as a safety net.** Rejected previously and not revisited:
a scheduled job that republishes everything reintroduces exactly the churn and
the lost-update window this decision removes.

## Consequences
- The pipeline no longer runs its expensive steps for merges that cannot have
  changed a page. `README.md`, `pom.xml`, `Dockerfile`, `src/**`, `ops/nginx/**`,
  `docker/**`, `scripts/**` and `lychee.toml` rebuild nothing — and those runs
  still assemble, check links and publish, because a `src/**` merge produces a
  new JaCoCo report even though no page changed.
- The branch is never wiped. A subtree that is retired will have to be deleted
  from `gh-pages` by hand; nothing removes a path no `MANIFEST` names.
- The artifact carries only what the run built: 0.9 MB and 1.5 MB on the two runs
  for `021e96c6`, against 3.4 MB before and the 18 MB the assembled tree would
  have been.
- The gate reads one commit against its first parent. That is exact for the
  squash merges this repository lands, and covers only the last commit of a
  multi-commit push.
- `docs-pr-check.yml` is deliberately not gated. `build-docs.sh` treats an unset
  `DOCS_BUILD_*` as "build it", so the pull-request check still exercises every
  generator end to end before a change reaches `main`, which is the property that
  makes it worth its ninety seconds.
- Determinism became a prerequisite rather than a nicety. Both the SHA-stamped
  asset token and TypeDoc's SHA-stamped source links had to be fixed first, or a
  gated build could not be shown to have changed nothing.

## Implementation Notes
- Gate and step conditions: `.github/workflows/docs-pipeline.yml`.
- Generator selection: `DOCS_BUILD_REDOC`, `DOCS_BUILD_TYPEDOC`,
  `DOCS_BUILD_ARCH_BACKEND`, `DOCS_BUILD_ARCH_FRONTEND` in
  `.github/scripts/docs/build-docs.sh`.
- Assembly and `MANIFEST`: `.github/scripts/docs/assemble-site.sh`.
- Manifest-driven publish: `.github/workflows/3-deploy-ghpages.yml`.
- Delivered as PRs #77 to #81.

## References
- [ADR-0012: Backend hosting on the shared Hetzner host](adr-0012-backend-hosting-on-shared-hetzner-host.md)
- Section 7 Deployment (`../07-deployment.md`)
- Frontend decisions index (`../../../frontend/architecture/09-decisions/index.md`)
