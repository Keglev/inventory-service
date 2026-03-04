<a id="top"></a>

[⬅️ Back to Performance Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Lazy loading

Lazy loading is used to reduce the amount of code needed for the **first render** and to defer rarely used UI until it is needed.

## Current state (in this repo)

### Routes/pages are eager-loaded

`AppRouter` imports page components directly (eagerly). There is currently no route-level `React.lazy(() => import(...))` for:

- `InventoryBoard`
- `SuppliersBoard`
- `Analytics`

### Suspense boundaries exist

The public shell wraps its `<Outlet />` in a `React.Suspense` boundary.

This is useful if/when public pages are moved to lazy imports, but today it mainly serves as “future-proofing”.

## Recommended patterns (when we need them)

The goal is to introduce lazy loading only where it actually improves perceived performance.

### 1) Route-level lazy loading

Good candidates:

- `Analytics` (charts + multiple blocks)
- `InventoryBoard` and/or the DataGrid-heavy sub-tree

Pattern:

- Convert the page import to `React.lazy(() => import(...))`
- Wrap the route element in `Suspense` with a small fallback

### 2) Interaction-level lazy loading (dialogs)

This repo is intentionally dialog-heavy (inventory and supplier workflows live in dialogs).

Currently, dialogs are imported eagerly into the page bundle (even if they are closed most of the time). For bundle-size wins, consider lazy-loading dialog components and only importing when `open === true`.

This tends to pay off when dialogs include:

- heavy form schemas and validation
- typeahead/autocomplete logic
- secondary API hooks

### 3) Keep the “steady state” fast

Lazy loading can introduce jank if it triggers while the user is actively interacting.

Heuristics:

- Preload when it’s likely needed soon (e.g., after a row is selected, start preloading Edit/Delete dialogs).
- Avoid lazy loading UI that is always visible (navigation chrome).

## Route-level separation (Inventory vs Analytics)

Even without lazy loading, the route structure already separates concerns:

- `/inventory` is DataGrid + dialog workflows
- `/analytics/:section?` is chart + block-driven views

Lazy loading is the next step if we want that separation to show up in the JS delivery profile.

---

[Back to top](#top)
