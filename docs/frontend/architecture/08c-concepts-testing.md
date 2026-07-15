# §8c Concepts — Testing

## Pyramid

Four layers, most to few, all centralized under `src/__tests__/` mirroring the
source tree ([ADR-0008](09-decisions/adr-0008-testing-structure-and-taxonomy.md)):

1. **Unit** (`__tests__/unit/`) — pure contracts: utilities, mappers/normalizers,
   API-client invariants, i18n constants.
2. **Component** (`__tests__/components/`, `__tests__/app/`) — RTL rendering with
   accessibility-first queries; observable behavior and callback wiring, not
   implementation details.
3. **Contract** (`__tests__/routes/`, `__tests__/app/`) — boundary wiring: route
   grouping via MemoryRouter, shell orchestration props and side effects.
4. **Integration-ish workflow** (few) — page workflows with mocked boundaries,
   strictly deterministic.

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
through the English JSON rather than hardcoding strings. The suite currently
stands at ~1,600 tests across 251 files (~99% line coverage), runs on every CI
push, and publishes its coverage report to GitHub Pages (linked from the
README and the documentation hub).
