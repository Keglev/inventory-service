# §8c Concepts — Testing

## Pyramid

Four layers, most to few, all centralized under `src/__tests__/` mirroring the
source tree ([ADR-0008](09-decisions/adr-0008-testing-structure-and-taxonomy.md)):

1. **Unit** — pure contracts: utilities, mappers/normalizers, API-client
   invariants, i18n constants.
2. **Component** — RTL rendering with accessibility-first queries; observable
   behavior and callback wiring, not implementation details.
3. **Contract** — boundary wiring: route grouping via MemoryRouter, shell
   orchestration props and side effects, and the chart standards every chart file
   must follow.
4. **Integration-ish workflow** (few) — page workflows with mocked boundaries,
   strictly deterministic.

The layers are kinds of test, not folders: a spec sits at the path of the source
file it tests (`src/<path>/X.tsx` -> `src/__tests__/<path>/X.test.tsx`), and
`src/__tests__/test/` and `src/__tests__/stubs/` hold the shared harness and stubs.
The browser suite (Playwright, `frontend/e2e/`) runs in CI against a backend built
from the same commit ([ADR-0009](09-decisions/adr-0009-end-to-end-testing-with-playwright.md)).

## Mocking Policy

Mock at boundaries, never internals: the network (httpClient/fetch), the i18n
runtime (react-i18next mocked onto the shared English-resolving helper), heavy
MUI dependencies (icons, DataGrid stubs), and time (fake timers +
`setSystemTime`). Explicitly NOT tested: MUI internals, React Router internals,
i18next resource loading and detection.

## Conventions & Scale

Every test file carries the canonical header dialect
(`@file`/`@module`/`@description` plus contract/out-of-scope prose). Shared
rendering helpers provide provider wrappers; locale-sensitive assertions resolve
through the English JSON rather than hardcoding strings. The suite runs on every CI
push, fails below the coverage thresholds set in `vitest.config.ts`, and publishes
its coverage report to GitHub Pages ([frontend coverage report](https://keglev.github.io/inventory-service/frontend/coverage/index.html)).
