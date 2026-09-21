# ADR-0015: GitHub Pages is deployed by the publisher job, not by GitHub's branch build

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-09-21

## Context
The docs site is assembled by `docs-pipeline.yml` and written to the `gh-pages`
branch by `3-deploy-ghpages.yml`, which replaces only the paths a run's
`MANIFEST` names ([ADR-0013](adr-0013-docs-pipeline-rebuilds-by-change.md)).
Until this decision the Pages source was "Deploy from a branch": every push to
`gh-pages` made GitHub start its own managed workflow, `pages-build-deployment`,
which built and deployed the branch.

That last step sat outside the repository's control, and it showed:

- For the single `gh-pages` push of 2026-09-21 15:15 UTC (`126b31f77d`), GitHub
  started two managed runs one second apart. One failed after four seconds with
  no step logs; the other deployed. The repository's own workflows had run
  exactly once each, and nothing in them could have prevented the duplicate.
- The managed workflow's build step runs on Node.js 20, which GitHub has
  deprecated, and it runs a Jekyll build the site does not need: every page is
  already HTML when it reaches the branch.
- The deployment was invisible to the repository's own logs; it had to be looked
  up separately in the managed workflow's history.

## Decision
The Pages source is "GitHub Actions". `3-deploy-ghpages.yml` keeps writing the
branch exactly as before and then, in the same job, uploads the branch tree with
`actions/upload-pages-artifact` and deploys it with `actions/deploy-pages`, both
pinned by commit.

- The branch stays the store. The manifest publisher, the back-to-docs
  injection and the history of every published change are unchanged.
- A deployment happens only when the push changed the branch, or when the run
  is a re-run, so a failed deployment can be retried without a new commit. A run
  that publishes nothing deploys nothing.
- The job already runs in the `ghpages-deploy` concurrency queue, which never
  cancels. The same queue now orders deployments: one per push, never two at
  once.
- The job deploys to the `github-pages` environment, which admits the default
  branch.

## Alternatives Considered
- **Keep branch deployment and accept the duplicate.** The duplicate was
  harmless the time it was observed, but it cannot be prevented from inside
  the repository, and the Node.js 20 build step would stay.
- **Deploy from the docs pipeline's artifact and retire the branch.** This
  removes a moving part, but each pipeline run carries only the paths it
  rebuilt; deploying one run's artifact would unpublish everything else. The
  branch is what holds the union.
- **A second job for the deployment.** It would need the tree passed between
  jobs as an artifact; deploying from the job that just pushed uses the tree it
  already has.

## Consequences
- One push to `gh-pages` produces at most one deployment, started by this
  repository, and it appears in this workflow's own run.
- The source is a repository setting, not code, and it is part of this
  decision: switched back to a branch, GitHub's own build would resume beside
  the deploy steps, and the single deployment path would be lost.
- The `github-pages` environment must admit `main`. A branch-sourced site
  restricts it to the publishing branch, so the rule is changed with the
  source.
- A merge that triggers several pipeline runs still produces several
  deployments, one per `gh-pages` push, each carrying different content
  ([ADR-0013](adr-0013-docs-pipeline-rebuilds-by-change.md)).

## Implementation Notes
- `3-deploy-ghpages.yml` gains `pages: write` and `id-token: write`, the
  `github-pages` environment, and two steps gated on the push step's `changed`
  output or on `github.run_attempt > 1`.
- `upload-pages-artifact` excludes `.git` and hidden files. The branch holds no
  hidden files, and the branch build ignored them as well, so the deployed set
  is the same.
- Verified after the switch against the published site and the absence of a
  `pages-build-deployment` run for the push, not against a green tick.

## References
- [ADR-0013: The docs pipeline rebuilds, and publishes, by change](adr-0013-docs-pipeline-rebuilds-by-change.md)
- Configuring a publishing source for GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- System-wide decisions index (`../../../decisions/index.md`)
