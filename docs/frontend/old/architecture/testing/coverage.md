<a id="top"></a>

[⬅️ Back to Testing Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Coverage

Coverage is a tool for **risk management**, not a score to maximize.

## Philosophy

- Aim for strong coverage on **critical flows** and **high-change logic**.
- Use coverage to find untested branches (errors, fallbacks, edge cases).
- Do not chase 100% on low-value code (tiny presentational wrappers, library glue).

## What should have strong coverage

Typically high-value targets:
- `src/api/*/hooks/*` and API utilities
- `src/pages/*/handlers/*` and workflow orchestration helpers
- `src/utils/*` and validation/normalization logic

## Lower value to chase

- tiny presentational components that mostly render MUI primitives
- MUI wrapper components where behavior is in the library

## How to run coverage locally

From the `frontend/` directory:
- `npm test -- --coverage`

Alternative (CI-like):
- `npx vitest run --coverage`

## Where reports live

Vitest writes reports to:
- `frontend/coverage/`

Useful entry points:
- `frontend/coverage/index.html`
- `frontend/coverage/lcov-report/index.html`

---

[Back to top](#top)
