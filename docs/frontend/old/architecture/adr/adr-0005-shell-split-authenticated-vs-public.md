# ADR-0005: Application shell split: authenticated shell vs public shell

## Status
Accepted

## Date
2026-03-03

## Context
The application has two distinct experiences:
- Public/unauthenticated pages (landing, login, OAuth callback, logout-success)
- Authenticated app pages that require navigation chrome (AppBar/Drawer/layout)

Forces/constraints:
- **UX clarity:** login/landing should be minimal and not show full app chrome.
- **Guard correctness:** routes must be protected without flicker during auth bootstrap.
- **Maintainability:** keep “chrome” code separate from page content.

## Decision
We define two shells and route groups:

- Public shell:
  - `frontend/src/app/public-shell/*`
  - wraps public routes only

- Authenticated app shell:
  - `frontend/src/app/layout/AppShell.tsx` (+ layout submodules)
  - wraps authenticated routes

Routing decides which shell wraps which routes in:
- `frontend/src/routes/AppRouter.tsx`

Protected routes are additionally guarded by:
- `frontend/src/features/auth/guards/RequireAuth.tsx`

## Alternatives Considered
1. **Single shell for everything**
   - Pros:
     - Fewer components
   - Cons:
     - Public UX looks “logged in”
     - More conditional rendering inside chrome

2. **No shell concept, only layouts per page**
   - Pros:
     - Maximum flexibility
   - Cons:
     - Duplicated layout and inconsistent navigation

3. **Server-side routing / multi-page app**
   - Pros:
     - Traditional separation
   - Cons:
     - Not aligned with SPA architecture and existing stack

## Consequences
### Positive
- Clear separation between public UX and authenticated UX.
- AppShell becomes the single place for navigation chrome and cross-cutting UI.
- Public routes remain fast/simple and avoid guard races.

### Negative / Tradeoffs
- Requires discipline to keep public pages out of AppShell.
- Some cross-cutting UI (e.g., toast) may need separate implementations for public shell vs app shell.

## Implementation Notes
- Where it is implemented (paths, key modules)
  - Router: `frontend/src/routes/AppRouter.tsx`
  - App shell: `frontend/src/app/layout/*`
  - Public shell: `frontend/src/app/public-shell/*`
  - Guard: `frontend/src/features/auth/guards/RequireAuth.tsx`

- Migration notes (if relevant)
  - When adding new routes, decide explicitly whether they are public or authenticated.

- Testing implications (what should be tested and where)
  - Route grouping behavior and shell rendering: `frontend/src/__tests__/routes/*` and `frontend/src/__tests__/app/*`.

## References
- Architecture docs: [App Shell](../app-shell/index.md), [Routing](../routing/index.md)
- Diagram: [Routing flow](../diagrams/routing/routing-flow.md)
- Related ADRs: ADR-0006
