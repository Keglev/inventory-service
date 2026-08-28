# ADR-0009: End-to-end testing with Playwright against a local demo stack

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-08-28

## Context
The frontend test stack ends at Vitest component tests (ADR-0008). Nothing
exercises a rendered browser against a running backend: routing after the demo
login, the locale switch, DataGrid rendering with real API payloads, and the
error-envelope handling all pass unit tests while remaining untested as flows.
The maintenance-assistant project closed the same gap with a Playwright suite
that runs inside the CI runner against its own backend; the pattern is proven
and its lessons (advisory first, no production traffic, no credentials in the
workflow file) apply here unchanged.

Forces:
- Pull-request runs must be side-effect free and must not reach production
  (established by the PR-safety series, PRs #20 to #31).
- Google OAuth is bound to the canonical origin (ADR-0010 backend). An
  authenticated flow cannot run from a CI runner; demo mode can.
- Demo mode is a client-side session, but every data request still goes to the
  backend anonymously and is admitted by `app.demo-readonly`. A browser test
  in demo mode therefore needs a backend.
- The `test` profile already gives an H2 backend in Oracle mode with the OAuth
  client stubbed, but Flyway is disabled there, so the Oracle demo seed (V3)
  never reaches H2, and `demo-readonly` is `false`.
- The frontend Nginx image proxies API calls to `api.smartsupplypro.de` by
  name. A container built from the PR cannot be pointed at a local backend
  without changing production configuration.

## Decision
Add a Playwright suite under `frontend/e2e/` that runs in CI against a local
stack: the backend started from the PR's source on H2 with an additive `e2e`
profile (`spring.profiles.active=test,e2e`) that enables `demo-readonly` and
loads an e2e-only seed; the frontend served by `vite preview` with
`VITE_API_BASE` pointing at that backend. Tests use demo mode only. Chromium
only. The job reports under its own name (`e2e`) and is advisory; it becomes a
required check after ten consecutive green pull-request runs with no
infrastructure-caused failure.

## Alternatives Considered
- Production backend as the e2e target: zero setup, but PR runs would read
  live data cross-origin from a runner, and a host incident would fail the
  check for reasons unrelated to the change. Rejected: violates the
  side-effect-free PR principle.
- Playwright route mocking with JSON fixtures, no backend: hermetic and fast,
  but asserts the frontend against fixtures that drift silently from the API.
  Rejected: contract honesty matters more than the minutes saved.
- Koyeb PR preview deployments: feasible on the Starter plan (about 5 ct per
  PR-day, quota 25 apps / 50 services), but previews would be demo-mode only
  anyway, would hit the production backend and data, require hand-built
  tooling, and depend on a platform in post-acquisition transition. Rejected.
- Vercel migration for native previews: loses the Nginx serve-time rewrite
  architecture (ADR-0008 backend). Rejected.
- Testing the built Nginx container instead of `vite preview`: would need a
  proxy-target build argument in production Nginx config for a test concern.
  Deferred; the container is already smoke-tested by the deploy workflow.

## Consequences
Positive:
- Browser-level regressions surface on the pull request, before Koyeb deploys.
- The stack is hermetic: no secrets, no network dependency on Hetzner or Oracle.
- Backend and frontend of the same PR are tested together, so an API change
  that breaks a rendered flow fails in the PR that introduced it.

Negative / accepted:
- Only demo-mode flows are covered; authenticated-only screens (employee
  analytics for ADMIN) stay under unit tests.
- H2 in Oracle mode is not Oracle; dialect-specific behaviour remains covered
  by the Oracle integration tests, not by e2e.
- One more seed to keep in step with the domain (e2e seed vs V3 demo seed).
- Job time of roughly 10 to 15 minutes per PR touching frontend or backend.

## Implementation Notes
- Backend: `application-e2e.yml` (profile additive to `test`): `demo-readonly:
  true`, `spring.sql.init` loading `e2e-seed.sql`, frontend base URL set to the
  preview origin so CORS admits it. `DatabaseDialectDetector` stays on H2
  because `test` remains active.
- Frontend: `playwright.config.ts` with `webServer` running `vite preview` on a
  fixed port; `VITE_API_BASE=http://localhost:8081` at build time; `npm run
  e2e` script; report and traces uploaded only on failure.
- Workflow `7-frontend-e2e.yml`: `pull_request` and `push` on `frontend/**`,
  `src/**`, `pom.xml`, its own file. Job name `e2e`, never `build-and-test`
  (branch protection, L-AQ). Concurrency group per ref, cancel in progress.
- First suite: login page renders (EN/DE), demo entry reaches the dashboard,
  inventory grid shows seeded rows, locale switch keeps the route.

## References
- ADR-0008: Testing structure and taxonomy
- ADR-0007: i18n strategy and language/region settings
- Backend ADR-0010: Custom domain and canonical host
- Backend ADR-0012: Backend hosting on the shared Hetzner host
- maintenance-assistant ADR-007: End-to-end testing strategy
