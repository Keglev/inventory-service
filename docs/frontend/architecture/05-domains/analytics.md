# §5.3 Analytics Domain

Purchasing and stock analytics under `frontend/src/pages/analytics/`: six
navigable sections composed from self-contained chart/table blocks.

## Sections & Navigation

`Analytics.tsx` orchestrates section routing with the URL as the source of truth:
the active section and filters (date window, supplier) are synchronized to query
parameters, so views are shareable and survive refresh. The six sections are
Overview, Movements, Pricing, Inventory Health, Finance, and Employees — the last
visible only for ADMIN or demo sessions.

## Block Pattern

Each block (card or table) renders one visualization, declares one React Query
query with a stable key encoding every filter input, calls one function from
`frontend/src/api/analytics/*`, and handles its own loading/empty/error states.
Key conventions: keys are feature-scoped
(`['analytics','lowStock', supplierId, from, to]`-style), and supplier-gated
blocks compute `enabled = Boolean(supplierId)` so the query never fires without
its required input — rendering a select-a-supplier helper instead.

## Shared & Extracted Building Blocks

- **`ItemSearchAutocomplete`** (`components/`) — the shared item type-ahead used
  by the price-trend card and the movements section; callers own option
  enrichment and helper-text semantics, the component owns the invariant picker
  behavior (no client re-filtering, selection mirrored into the input).
- **`useLowStockRows`** (`hooks/`) — owns the low-stock business rule: deficit is
  `minimumQuantity - quantity` floored at zero, computed client-side; rows filter
  to at-or-under threshold, order by deficit descending, and cap to a visible
  slice with a pre-cap total for the "showing n of m" footer.
- **`LowStockTableRow`** (`blocks/`) — severity presentation: Critical at deficit
  ≥ LOW_STOCK_CRITICAL_THRESHOLD (config/inventoryPolicy), Warning below it,
  OK at zero.
- **`EmployeesActivityChart`** (`sections/`) — the per-employee activity line
  chart with a granularity toggle. Series use FUNCTION dataKey accessors because
  employee identifiers are emails: dots in string keys would be resolved by
  Recharts as nested paths.

## Data Notes

The client-side pivot for employee activity (flat period/employee/count rows to
one object per period) lives in `useEmployeesSectionData`, with server-side
pagination for the change log. Dashboard KPIs reuse this domain's API module but
under dashboard-scoped query keys, so caches never collide.
