<a id="top"></a>

[⬅️ Back to Inventory Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Inventory Data Fetching & Filtering

Inventory uses a small adapter layer to translate UI state into server query parameters, then applies a few domain-specific client-side filters.

## Where it lives

- State → server params: `frontend/src/pages/inventory/handlers/useDataFetchingLogic.ts`
- Data loading + derived data: `frontend/src/pages/inventory/hooks/useInventoryData.ts`
- UI gating when no supplier: `frontend/src/pages/inventory/InventoryBoard.tsx`

## Server parameter translation

### Pagination

MUI DataGrid pagination is 0-based, but the backend page API is 1-based.

`useDataFetchingLogic` converts:
- `serverPage = paginationModel.page + 1`

### Sorting

The UI stores a sort model, and the server expects a string:
- `"<field>,<direction>"` (e.g. `name,asc`)

If no sort is set, the default falls back to `name,asc`.

## Fetch gating (supplier required)

Inventory only loads items after a supplier is selected:

- In `useInventoryData`, the `load()` effect runs only when `supplierId` is truthy.
- When no supplier is selected, the server payload is cleared to an empty list.

This is paired with a UI prompt in `InventoryBoard` (“Select a supplier…”).

## Suppliers list

Supplier options for the filter dropdown come from a shared query:
- `useSuppliersQuery(true)`

This query is independent of the selected supplier (it feeds the supplier selector).

## Client-side filtering (domain rules)

After the server page loads, the Inventory domain applies:

### 1) Supplier fallback filter

Even though supplierId is included in the request, the hook also filters rows by supplier id as a safety net.

### 2) Text search

`q` filters by `name` (case-insensitive substring match).

### 3) “Below minimum only”

Rows are filtered to those with `onHand < min`.
- If `minQty` is missing/invalid, a default of `5` is used.

## Conceptual flow

```mermaid
flowchart TD
  State[useInventoryState] --> Adapter[useDataFetchingLogic]
  Adapter --> Query[useInventoryData]
  Query --> Server[getInventoryPage]

  Server --> Raw[server.items]
  Raw --> Filter1[Supplier fallback filter]
  Filter1 --> Filter2[Search filter (q)]
  Filter2 --> Filter3[Below-min filter]
  Filter3 --> Rows[filteredItems]

  Rows --> Table[InventoryTable]
```

---

[Back to top](#top)
