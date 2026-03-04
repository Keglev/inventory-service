<a id="top"></a>

[⬅️ Back to Performance Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Bundle strategy

This repo uses Vite’s production build with explicit **vendor chunking** to keep bundle size predictable.

## Current state

### Manual vendor chunks

The Vite config defines `manualChunks` for the major dependency families:

- React: `react`, `react-dom`
- MUI: `@mui/material`, `@mui/icons-material`, `@mui/x-data-grid`
- Router: `react-router-dom`
- Forms/validation: `react-hook-form`, `zod`
- Charts: `recharts`
- i18n: `i18next`, `react-i18next`, detector/backend
- Utilities: `axios`, `@tanstack/react-query`, `dayjs`

This helps prevent “everything ends up in one vendor chunk” and makes it easier to see what grows over time.

### Chunk size warning limit

`chunkSizeWarningLimit` is set to `800` KB so we still get warnings for unexpected growth, while acknowledging that MUI can produce a larger chunk.

## Route-level separation (Inventory vs Analytics)

From a code organization perspective, Inventory and Analytics are already separate page modules (`src/pages/inventory/*` vs `src/pages/analytics/*`).

However, the **router currently imports pages eagerly** (no `React.lazy` for route elements). That means:

- the “Inventory vs Analytics” separation exists in the source tree,
- but not (yet) as route-level code-splitting at runtime.

If route-level code splitting becomes a priority, the existing page boundaries are the right seams to introduce it.

## Why this matters

- **Initial load**: keeping “rarely used” libraries (charts, DataGrid, big dialogs) out of the initial JS reduces time-to-interactive.
- **Caching**: stable chunks with hashed filenames can be cached aggressively by the browser/CDN.
- **Operational clarity**: if a chunk grows unexpectedly, it’s easier to attribute it to a dependency family.

## Practical guidelines

- Keep “shared utilities” small and stable; avoid importing heavy UI libs from generic helpers.
- Prefer importing charts only in analytics-related modules.
- Keep dialog workflows in domain folders (already true), and consider interaction-level lazy loading for large dialogs.

---

[Back to top](#top)
