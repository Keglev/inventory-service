# ADR-0020: Employee analytics are shown to administrators and the demo, not to users

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-11-02

## Context
The Employees section of the analytics page shows who changed which stock, when
and how much: a chart per employee and a change log. That is a supervision view.
The two endpoints behind it, `GET /api/analytics/by-employee` and
`GET /api/analytics/employee-changes` (`EmployeeAnalyticsController`), have
allowed two callers since they were built:

- a signed-in `ADMIN`, and
- an anonymous caller while the demo is on (`app.demo-readonly`), whose
  responses carry masked identities (`DemoIdentityMasking`).

A signed-in `USER` gets 403. The frontend hid the tab from that user, and a
typed `/analytics/employees` silently showed the overview instead.

Read side by side, the rule looks contradictory: an anonymous visitor sees what
a signed-in employee may not. The endpoint review of 2026-10-28 (ADR-0018) left
it open because the access log carried no roles, so usage could not settle it.

## Decision
The rule stays, and it is now a recorded decision, not an accident of history.

- `ADMIN` sees the employee charts: supervising stock changes is an
  administrator's task.
- The demo shows them too. This is a portfolio application, and the demo is how
  a reviewer sees what the system does; a feature hidden from the demo is a
  feature nobody sees. The demo shows seeded data with masked identities, so no
  real person's activity is exposed.
- A signed-in `USER` does not see them. The API keeps answering 403. In the UI
  the Employees tab is visible to every signed-in user; for a `USER` the section
  shows a notice ("Die Mitarbeiter-Auswertung ist nur für Administratoren
  verfügbar." / "Employee analytics are available to administrators only."),
  the filter panel stays visible but disabled, and no employee request is sent.

## Alternatives Considered
- **Hide the tab from users (the behaviour until now).** A user never learns the
  view exists or why it is missing; a typed address silently lands elsewhere.
- **Hide the tab, show the notice only on a typed address.** A user would almost
  never see the notice (fork EA-1 B).
- **Open the view to users.** It turns a supervision view into colleagues
  watching each other's activity; not wanted.
- **Close it to the demo.** Consistent, but the portfolio would lose one of its
  sections for every reviewer.

## Consequences
- The UI and the API state the same rule: the UI explains it, the API enforces
  it. The 403 for a `USER` is unchanged, so a client that ignores the UI is still
  refused.
- The rule is visible in the product: every signed-in user sees six tabs.
- Changing who may see the view means changing both the `@PreAuthorize`
  expression on the two endpoints and `canSeeEmployees` in `Analytics.tsx`.

## Implementation Notes
- Backend: `@PreAuthorize("hasRole('ADMIN') or (!isAuthenticated() and
  @appProperties.demoReadonly)")` on both `EmployeeAnalyticsController`
  endpoints; unchanged by this record.
- Frontend: `Analytics.tsx` decides between `EmployeesSection` and the notice
  (`analytics:employees.restricted`, EN and DE) and passes `disabled` to the
  filters; `AnalyticsNav` renders the Employees tab for everyone.
- Tests: the page spec covers a `USER` (notice, no section, filters disabled once
  the supplier list has loaded), the same `USER` on another section (filters
  enabled), `ADMIN` and the demo (section, filters enabled); four mutations of
  the rule each fail their own test.

## References
- [ADR-0018: Endpoints without callers are removed after a measured access-log window](adr-0018-endpoints-removed-after-measured-usage.md)
- Frontend architecture, analytics domain (`../../../frontend/architecture/05-domains/analytics.md`)
- System-wide decisions index (`../../../decisions/index.md`)

---

Frontend decisions: see [docs/frontend/architecture/adr/](../../../frontend/architecture/09-decisions/index.md)

[Back to Architecture Index](../index.md)
