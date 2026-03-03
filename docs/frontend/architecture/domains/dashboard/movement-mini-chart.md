<a id="top"></a>

[⬅️ Back to Dashboard Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Dashboard Movement Mini Chart (90d)

The dashboard includes a compact “stock movement (90d)” visualization that reuses the Analytics API and renders a small dual-bar chart.

## Where it lives

- Component: `frontend/src/pages/dashboard/blocks/MonthlyMovementMini.tsx`
- API: `frontend/src/api/analytics/stock.ts` (`getMonthlyStockMovement`)
- Date helpers: `frontend/src/utils/formatters.ts` (`getDaysAgoIso`, `getTodayIso`)

## Time window derivation

The component derives a rolling 90-day window:
- `from = getDaysAgoIso(90)`
- `to = getTodayIso()`

Both helpers produce ISO dates in `YYYY-MM-DD` format (local date).

## Query behavior

The chart uses React Query directly:
- `queryKey`: `['dashboard', 'movementMini', from, to]`
- `queryFn`: `getMonthlyStockMovement({ from, to })`

This key is dashboard-scoped, so it does not collide with analytics page keys.

## Rendering states

- Loading: rounded skeleton (`height=220`)
- Loaded:
  - a `BarChart` with two series:
    - `stockIn` (theme `success.main`)
    - `stockOut` (theme `error.main`)

## Resilience to backend failures

`getMonthlyStockMovement` is tolerant:
- on any error, it returns `[]` (empty dataset)

The UI still renders the chart container; with `[]`, the chart will be empty rather than crashing.

## Conceptual flow

```mermaid
flowchart TD
  Mini[MonthlyMovementMini] --> Dates["from/to via formatters"]
  Dates --> Query[React Query]
  Query --> API[getMonthlyStockMovement]
  API --> Backend[/api/analytics/monthly-stock-movement]

  Query -->|loading| Skeleton[Skeleton]
  Query -->|data| Chart[Recharts BarChart]
```

---

[Back to top](#top)
