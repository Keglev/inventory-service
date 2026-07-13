<a id="top"></a>

[⬅️ Back to Performance Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Rendering optimization

This section focuses on “React work” (re-renders, expensive computations, and large UI trees) and the patterns used in this repo.

## 1) Tables (Inventory/Suppliers)

### DataGrid performance basics

The Inventory and Suppliers pages are built on MUI X DataGrid, which is designed for large datasets.

Repo patterns that support DataGrid performance:

- Column definitions are memoized (e.g., `useInventoryColumns` returns `useMemo`-stable columns).
- Handler props are typically stable via `useCallback` hooks in `handlers/*`.
- Server-side pagination and sorting reduce client-side rendering work and avoid holding huge datasets in memory.

### Keep prop identity stable

For large components like DataGrid, stable prop identity matters:

- Prefer `useMemo` for `columns` and computed row arrays.
- Prefer `useCallback` for `onRowClick`, pagination/sort handlers.

## 2) Dialog-heavy UI (workflows)

Inventory and Suppliers workflows are dialog-driven (create/edit/delete/adjust/change-price).

Current behavior:

- Dialog components are composed at the page level (`InventoryDialogs`, `SuppliersDialogs`).
- Dialog content is not necessarily mounted when closed (MUI Dialog defaults), but the *code* is already included in the page bundle.

Optimization lever:

- If dialogs become large, treat them as “interaction-level bundles” (lazy load on open) to reduce initial route cost.

## 3) Analytics blocks (charts and computed views)

The Analytics page composes “blocks” and uses conditional rendering by section:

- Only the blocks for the active section render.
- Each block tends to own its own query and uses memoization for derived data.

Common patterns used in blocks:

- `useMemo` for derived series/rows (avoid recomputing for unrelated renders).
- `useCallback` for formatters passed into chart/table components.

### Debounced inputs to avoid re-render storms

Typeahead inputs and search are debounced using `useDebounced(...)`.

This reduces:

- render churn while typing
- request churn against the backend

## 4) Practical checklist

- Avoid computing derived arrays inline in JSX for large lists/series.
- Prefer controlled state that is scoped to the smallest component that needs it.
- Use `enabled` and debouncing to keep queries from firing on every keystroke.
- Keep “layout chrome” stable; avoid putting fast-changing state in the AppShell.

---

[Back to top](#top)
