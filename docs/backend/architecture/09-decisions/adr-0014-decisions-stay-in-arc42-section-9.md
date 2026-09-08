# ADR-0014: Decision records stay in each tier's arc42 section 9, with one index over both

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-09-08

## Context
This system is documented with arc42 in two tiers, `docs/backend/architecture/`
and `docs/frontend/architecture/`, and each tier keeps its decision records where
arc42 puts them: section 9, `09-decisions/`. Each tier numbers its own sequence.
At the time of this decision the backend holds ADR-0001 to ADR-0013 and the
frontend ADR-0001 to ADR-0010, 23 records across two directories.

Two problems followed from that arrangement.

The set was not discoverable. The site's landing page described "the decision
log" and linked to the backend's section 9, so the ten frontend records were
reachable only by a reader who had already found the frontend architecture tree.
Nothing anywhere listed all 23.

And the numbers collide. ADR-0001 to ADR-0010 exist in both tiers, so an
unqualified "ADR-0004" is ambiguous: backend ADR-0004 is the HTTP-status error
envelope, frontend ADR-0004 is the dialog workflow architecture.

The obvious remedy for both — one central log with one sequence, the convention
MADR uses with its flat `docs/adr/` — is a different documentation standard from
the one this repository follows, and adopting it here is not free. Measured on
`main` before this decision: 23 record files would move and be renumbered, 111
link paths would be rewritten, 157 uppercase `ADR-0NNN` mentions across 43 files
would need re-reading, and 25 published URLs would be retired, 23 record pages
plus both tier indexes.

Forces:
- Relative links must resolve in the repository as well as on the published site.
  A backend record is reached from `04-solution-strategy.md` as
  `./09-decisions/adr-0004-...md`, which reads correctly in an editor, in a
  GitHub file view and in the generated HTML. Moving the records out of the tier
  ends that co-location for all 23.
- Published URLs are the addresses the README and external references use. The
  repository README links backend ADR-0007 by its absolute published URL.
- Discoverability is a separate problem from placement, and can be solved without
  moving anything.
- Every additional published subtree costs a change-gate entry, a `MANIFEST`
  path, a navigation entry, a landing-page card and a conversion path, per
  ADR-0013.

## Decision
Records stay in `docs/<tier>/architecture/09-decisions/`, each tier keeping its
own sequence, and a single index at `docs/decisions/` lists all of them.

The index is an index, not a log. It holds no record text and owns no numbers.
Each entry states its tier, links into the record where that record already
lives, and carries its title. Adding a record means adding a line to its tier
index and a line to this one; the record itself exists in exactly one place.

Prose referring to a record from outside its tier names the tier: "backend
ADR-0004", not "ADR-0004". Within a tier's own documents the bare number keeps
its current meaning.

The index page belongs to neither tier and therefore gets neither tier's sidebar.
A third navigation partial links to both.

## Alternatives Considered
- **One central log with a single sequence.** Rejected on cost against benefit.
  It removes the ten colliding numbers and costs the 23 moves, 111 link
  rewrites, 157 mentions to re-verify and 25 retired URLs measured above, plus a
  navigation partial for a subtree belonging to neither tier and a conversion
  path that the tier-shaped `docs/<context>/architecture` mapping could not
  express. The collision it removes is instead handled by naming the tier, which
  costs one convention.
- **Two directories, globally unique numbers**, continuing the frontend sequence
  at 0014. Rejected: it breaks ten published frontend URLs and every link to
  them, and still leaves the records spread over two directories. It pays a large
  part of the migration cost and buys neither co-location nor a single log.
- **No index, fix only the landing-page link** so that it names both tier
  indexes. Rejected: it repairs one sentence and leaves the reader to hold two
  lists in their head. Nothing would list the decisions of this system as one
  set.
- **Adopt MADR across the repository** so that placement is uniform with the flat
  convention. Rejected as disproportionate: it would relocate every architecture
  artefact, not only the decisions, to change where one category of document
  sits.

## Consequences
- The arc42 documents stay self-contained. Each tier's section 9 is complete on
  its own and its relative links resolve in the repository and on the site alike.
- No published URL moves. All 23 record pages and both tier indexes keep the
  addresses they have had since they were published, including the ADR-0007 link
  in the repository README.
- The whole set is reachable in one place, and both landing pages and both tier
  sidebars point at it.
- The collision remains and is managed rather than removed. An unqualified
  "ADR-0004" is ambiguous outside its own tier. This is the accepted cost of the
  decision.
- The index is a second place to edit when a record is added. Forgetting it
  leaves the index incomplete rather than the site broken, which is why the page
  is a listing and not a source of record text.
- The site gains a fifth generated subtree, `decisions/`, with the standing costs
  ADR-0013 describes. Its gate entry is `docs/decisions/**`; a change there
  rebuilds that subtree alone.

## Implementation Notes
- Index source: `docs/decisions/index.md`, published at `decisions/index.html`.
- Conversion: `.github/scripts/docs/build-architecture-docs.sh` resolves a
  context to a source directory, a destination, a sidebar and a title prefix
  through a table, so a subtree that is not `docs/<tier>/architecture` can be
  built.
- Generator selection: `DOCS_BUILD_DECISIONS` in
  `.github/scripts/docs/build-docs.sh`. Unset means build it.
- Gate and publish: the `decisions` output in
  `.github/workflows/docs-pipeline.yml`, and `decisions` in the `SUBTREES` list
  and the layout guard of `.github/scripts/docs/assemble-site.sh`.
- Sidebar: `docs/_theme/templates/nav-decisions.html`, selected by the
  `decisionsnav` metadata flag in `docs/_theme/app-docs.html`.
- Links in: both tier navigation partials and both landing pages.
- Delivered as PRs #83 to #86.

## References
- [ADR-0013: The docs pipeline rebuilds, and publishes, by change](adr-0013-docs-pipeline-rebuilds-by-change.md)
- Frontend decisions index (`../../../frontend/architecture/09-decisions/index.md`)
- System-wide decisions index (`../../../decisions/index.md`)
- arc42 section 9, Architecture Decisions: https://docs.arc42.org/section-9/
