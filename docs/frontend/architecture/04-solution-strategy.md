# §4 Solution Strategy

## Feature-first Layering

The source tree separates the application shell (`app/`), domain pages (`pages/`),
the backend-facing API layer (`api/`), global state providers (`context/`), and
cross-cutting features (`features/`), with shared hooks/utilities alongside. Domain
pages never touch HTTP details; the API layer never imports UI. The full rationale
is [ADR-0001](09-decisions/adr-0001-frontend-folder-structure-strategy.md).

## Server State vs Client State

TanStack React Query owns all **server state**: every read is a query with a stable
key encoding its filter inputs, and every mutation invalidates exactly the keys it
affects. React Context owns the small set of **client state** that is genuinely
global (auth session, user settings, toasts, help panel). Local component state
covers everything else. This three-way split is deliberate — no general-purpose
state library is used ([ADR-0006](09-decisions/adr-0006-global-state-with-context-modules.md)).

## Typed API Layer

A single Axios `httpClient` sends credentials on every call (the effective API origin
is decided at serve time — see [§3](03-context.md)); per-domain
modules (`api/inventory`, `api/suppliers`, `api/analytics`, `api/shared`) expose
typed fetchers and React Query hooks. Fetchers normalize backend responses and map
the structured error envelope to user-facing messages
([ADR-0002](09-decisions/adr-0002-api-layer-abstraction-httpclient-and-domain-modules.md)).

## Dialog-driven Mutations

Create/edit/delete flows run in dialogs owned by page orchestrators, each with a
dedicated form hook (React Hook Form + Zod) that owns validation, submission, and
error mapping. The pattern keeps pages readable and makes every mutation flow
independently testable ([ADR-0004](09-decisions/adr-0004-dialog-workflow-architecture.md)).

## Two Shells

Public routes (login, home, legal) and authenticated routes render under different
shells with different chrome; guards redirect between them based on the session
probe ([ADR-0005](09-decisions/adr-0005-shell-split-authenticated-vs-public.md)).

## German-first Internationalization

i18next with namespace JSONs under `public/locales/{en,de}`; language detection is
pre-seeded German-first on first visit. Keys are typed from the EN JSON via
`resources.d.ts`, and the codebase carries no fallback strings — a missing key is a
visible bug, not silent English
([ADR-0007](09-decisions/adr-0007-i18n-strategy-and-language-region-settings.md)).

## Testing Strategy

Vitest + React Testing Library, centralized under `src/__tests__/` mirroring the
source tree, with a locked directory taxonomy and mocking policy
([ADR-0008](09-decisions/adr-0008-testing-structure-and-taxonomy.md)). Currently
1,319 tests across 225 files at ~86% line coverage, run on every CI build.
