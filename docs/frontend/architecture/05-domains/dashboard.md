# §5.4 Dashboard Domain

The front-door overview under `frontend/src/pages/dashboard/`: three KPI cards, a
2×2 analytics overview grid, and navigation shortcuts — built to degrade
gracefully rather than break.

## KPI Row

`useDashboardMetrics` (in `api/analytics/hooks/`) loads item, supplier, and
low-stock counts in parallel under the key `['analytics','dashboard-metrics']`
with a 2-minute staleTime and 10-minute gcTime. Resilience is layered: each API
helper catches all errors and returns 0, so the hook always resolves; `StatCard`
renders a skeleton while loading and an em dash only for genuinely absent values.

## Analytics Overview Grid

Below the KPI row, `Dashboard.tsx` renders a responsive 2×2 grid (`Grid`
`size={{ xs: 12, md: 6 }}`, single column on mobile) of at-a-glance charts, each
a self-fetching block that degrades to an empty state on error. Cards stretch to
a shared height per row, and every chart uses the theme-aware tooltip helper
(`utils/chartTooltip`) so the tooltip surface follows light/dark mode.

- **Stock per supplier** — reuses `pages/analytics/blocks/StockPerSupplierDonut`
  (donut over `getStockPerSupplier`), so dashboard and analytics share one
  component and query.
- **Movement by reason** — `blocks/ReasonBreakdownMini` groups increase/decrease
  per `StockChangeReason` from `getReasonBreakdown` (global, no filters), reusing
  the analytics reason-label lookup.
- **90-day stock movement** — `blocks/MonthlyMovementMini` (detailed below).
- **Low-stock watchlist** — `blocks/LowStockMini` renders quantity-vs-minimum
  bars from `getDashboardLowStock`, which reads `GET /api/analytics/summary` and
  consumes its `lowStockItems`. The summary returns the low-stock list across all
  suppliers (most critical first) when no supplier filter is applied, so the
  watchlist works without a supplier selection.

## Movement Mini Chart

`blocks/MonthlyMovementMini.tsx` derives a rolling 90-day window
(`getDaysAgoIso(90)` to `getTodayIso()`, local ISO dates) and queries
`getMonthlyStockMovement` under the dashboard-scoped key
`['dashboard','movementMini', from, to]`. The fetcher returns an empty array on
any error, so the chart renders empty instead of crashing. Two bar series:
stock-in (theme success) and stock-out (theme error).

## Navigation & Help

Three action buttons navigate to `/inventory`, `/suppliers`, and
`/analytics/overview` via `useNavigate()`; guard behavior belongs to the routing
layer, not the page. The header carries `HelpIconButton topicId="app.main"`. All
labels resolve from the `common` namespace (`dashboard.title`,
`dashboard.kpi.*`, `dashboard.actions.*`).
