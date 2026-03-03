# ADR-0006: Global state approach using Context modules (Auth/Settings/Toast/Help)

## Status
Accepted

## Date
2026-03-03

## Context
The app needs a small set of global, cross-cutting state that must be accessible across domains:
- authentication/session state
- user preferences and system info
- toast notifications
- help panel open/close state and current topic

Forces/constraints:
- **Simplicity:** avoid introducing a full global state framework for limited global needs.
- **Separation of concerns:** API state should live in React Query, not in app-global stores.
- **Testability:** global behaviors should be testable with provider wrappers.

## Decision
We use **React Context providers** for global app concerns, and keep other state local:

- Context providers under `frontend/src/context/*`:
  - `auth/`, `settings/`, `toast/`, `help/`

- Data state lives in React Query hooks (API layer).
- UI-local state stays inside components/pages.

Access patterns are standardized via:
- `frontend/src/hooks/createContextHook.ts`
- convenience hooks like `frontend/src/hooks/useAuth.ts`, `useSettings.ts`, `useHelp.ts`

## Alternatives Considered
1. **Redux / global store**
   - Pros:
     - Centralized state and tooling
   - Cons:
     - Overhead for the current scale
     - Risk of pushing API state into global store

2. **React Query for everything**
   - Pros:
     - Good for server-state
   - Cons:
     - Not appropriate for UI/session providers like help/toast

3. **Prop drilling**
   - Pros:
     - No extra framework
   - Cons:
     - Becomes unmaintainable across many pages

## Consequences
### Positive
- Clear split: Context for global app concerns; React Query for server-state.
- Reusable providers and stable typed hooks.
- Easy to wrap tests with “all providers”.

### Negative / Tradeoffs
- Provider composition order matters and must be managed.
- Contexts can become “god objects” if scope creeps.

## Implementation Notes
- Where it is implemented (paths, key modules)
  - Providers: `frontend/src/context/auth/*`, `frontend/src/context/settings/*`, `frontend/src/context/help/*`, `frontend/src/context/toast/*`
  - Hook factory: `frontend/src/hooks/createContextHook.ts`
  - Typed access hooks: `frontend/src/hooks/useAuth.ts`, `frontend/src/hooks/useSettings.ts`, `frontend/src/hooks/useHelp.ts`

- Migration notes (if relevant)
  - Prefer adding new domain state locally; only promote to context if truly cross-cutting.

- Testing implications (what should be tested and where)
  - Provider + hook behavior in unit tests.
  - Use `frontend/src/__tests__/test/all-providers.tsx` to render components under correct providers.

## References
- Architecture docs: [State](../state/index.md), [UI & UX Building Blocks](../ui/index.md)
- Diagram: [Provider composition](../diagrams/state/provider-composition-flow.md)
- Related ADRs: ADR-0002
