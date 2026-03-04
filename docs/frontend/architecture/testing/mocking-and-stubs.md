<a id="top"></a>

[⬅️ Back to Testing Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Mocking, Stubs, and Test Doubles

This repo uses test doubles to keep tests **fast, deterministic, and focused on our contracts**.

## Stubs (test-only module replacements)

Stubs live in `frontend/src/__tests__/stubs/` and are wired via `frontend/vitest.config.ts`.

Current stubs include:
- MUI icons → `MuiIconStub.tsx` (avoids importing hundreds of icon modules)
- DataGrid locale/theme augmentation stubs
- DataGrid component stub
- empty CSS replacement for `@mui/x-data-grid/esm/index.css`

Why:
- Avoid slow/brittle ESM resolution and heavy dependency graphs.
- Keep tests focused on our wiring, not library internals.

## Hoisted mocks (`vi.hoisted`) guidance

Vitest hoists `vi.mock()` calls. If your mock factory references helper functions/variables, they must be initialized before the mock is evaluated.

Pattern used in this repo:
- Define hoisted helpers with `vi.hoisted(() => ...)`.
- Use those inside `vi.mock(...)` factories.

This avoids TDZ errors like “Cannot access before initialization”.

## What should be mocked

Mock these boundaries:
- Network:
  - `fetch` via `vi.stubGlobal('fetch', vi.fn())` when testing fetch-based utilities.
  - Axios-based modules by mocking `httpClient` or domain fetchers/hooks.

- i18n runtime:
  - Many component tests mock `react-i18next` to return stable `t()` outputs.

- Toast/context hooks:
  - In orchestration tests, mock hooks like `useAuth`, `useSettings`, `useHealthCheck`.

- Date/time:
  - Use `vi.useFakeTimers()` + `vi.setSystemTime(...)` for date-dependent logic.

## What should NOT be mocked

Avoid mocking:
- Your own pure logic (formatters, validators, normalizers). Test it directly.
- Implementation details of a component under test.

Rule of thumb:
- Mock at module boundaries, and assert **observable behavior**.

---

[Back to top](#top)
