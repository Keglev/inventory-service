[⬅️ Back to Frontend Architecture Index](../index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Testing

## 1️⃣ Purpose

Frontend tests in this repo are designed for **fast feedback** and **high confidence refactors**:

- Prefer deterministic tests that run the same way on every machine.
- Treat tests as a safety net for **contracts** (hook outputs, component props, route behavior).
- Mock external boundaries (network, i18n runtime, heavy UI libraries) rather than testing their internals.
- Keep failures actionable: a failing test should clearly point at a broken contract.
- Avoid flaky timing: no real clocks, no real network, minimal reliance on browser quirks.

## 2️⃣ Scope & Boundaries

Included:
- Unit tests for pure utilities, formatting/parsing, and API/client contracts.
- Component tests using React Testing Library (RTL) focused on behavior and accessibility.
- Contract tests that verify integration boundaries (e.g., shell orchestration, routing groups).

Excluded:
- Internal behavior of third-party libraries (MUI internals, React Router internals, i18next internals).
- Visual styling correctness (that belongs to manual review / visual regression, if introduced).

## 3️⃣ Contents

- [Testing strategy (layers / pyramid)](./strategy.md)
- [Test structure & naming conventions](./test-structure.md)
- [Mocking, stubs, and test doubles](./mocking-and-stubs.md)
- [Rendering helpers & provider setup](./rendering-helpers.md)
- [Coverage philosophy & reports](./coverage.md)
- [What to test (practical checklist)](./what-to-test.md)

## 4️⃣ What is tested where (quick map)

- `frontend/src/__tests__/unit/*`
  - Pure logic and contracts (e.g., formatters, system info parsing, API client defaults).
- `frontend/src/__tests__/routes/*`
  - Router and route-grouping contracts.
- `frontend/src/__tests__/app/*`
  - App shell orchestration (header/sidebar wiring, settings surfaces, public shell).
- `frontend/src/__tests__/components/*`
  - Page/presentational component contracts (rendering and event wiring).
- `frontend/src/__tests__/context/*`, `features/*`, `hooks/*`
  - Cross-cutting modules and reusable hooks.

## Related ADRs

- [ADR-0008: Testing structure and taxonomy](../adr/adr-0008-testing-structure-and-taxonomy.md)

---

[⬅️ Back to Frontend Architecture Index](../index.md)
