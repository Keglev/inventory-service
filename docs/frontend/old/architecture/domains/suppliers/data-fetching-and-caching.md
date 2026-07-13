<a id="top"></a>

[⬅️ Back to Suppliers Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Suppliers Data Fetching & Caching

Suppliers uses React Query hooks for:
- paginated supplier listing
- search dropdown results

and a small adapter hook to translate UI state into server-compatible parameters.

## Where it lives

- State → server params: `frontend/src/pages/suppliers/handlers/useDataFetchingLogic.ts`
- Data composition: `frontend/src/pages/suppliers/hooks/useSuppliersBoardData.ts`
- API hooks: `frontend/src/api/suppliers/hooks/*`
- Fetcher + normalization: `frontend/src/api/suppliers/supplierListFetcher.ts`, `supplierNormalizers.ts`

## Server parameter translation

### Pagination

MUI DataGrid uses 0-based page indices. The backend expects 1-based:

- `serverPage = paginationModel.page + 1`

### Sorting

The server sort is serialized as:

- `"<field>,<direction>"` (example: `name,asc`)

If the UI sort model is empty, the default falls back to `name,asc`.

## Paginated list query

`useSupplierPageQuery(params, enabled)`:
- `queryKey`: `['suppliers','page', page, pageSize, q, sort]`
- `staleTime`: 60 seconds
- `gcTime`: 5 minutes

In `useSuppliersBoardData`, the `q` parameter is only passed to the paginated API when:
- `showAllSuppliers === true` and `searchQuery.length >= 2`

This avoids filtering the list when the user is only using the dropdown search mode.

## Search dropdown query

`useSupplierSearchQuery(query, enabled)`:
- `queryKey`: `['suppliers','search', query]`
- enabled only when `query.length >= 2`
- query function calls `getSuppliersPage({ page: 1, pageSize: 1000, q: query })`

This means dropdown search is backend-powered and returns full rows for display.

## Response tolerance and normalization

`getSuppliersPage` is tolerant of backend response envelopes:
- plain arrays
- Spring Page-style objects (`content`, `totalElements`)
- custom envelopes (`items`, `results`)

Rows are normalized via `toSupplierRow`.

On network errors, the fetcher returns an empty page `{ items: [], total: 0 }`.

## Important stability detail: memoized return object

`useSuppliersBoardData` returns a memoized object via `React.useMemo`. This avoids recreating a new reference on every render, which the code comments call out as important to prevent router update freezes (re-render loops).

## Conceptual flow

```mermaid
flowchart TD
  State[useSuppliersBoardState] --> Adapter[useDataFetchingLogic]
  Adapter --> Data[useSuppliersBoardData]

  Data --> PageQ[useSupplierPageQuery]
  Data --> SearchQ[useSupplierSearchQuery]

  PageQ --> Fetcher[getSuppliersPage]
  SearchQ --> Fetcher
  Fetcher --> Backend[/api/suppliers]

  Data --> UI[SuppliersTable + Search dropdown]
```

---

[Back to top](#top)
