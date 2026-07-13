# §5.4 Dashboard Domain

The front-door overview under `frontend/src/pages/dashboard/`: three KPI cards, a
compact movement chart, and navigation shortcuts — built to degrade gracefully
rather than break.

## KPI Row

`useDashboardMetrics` (in `api/analytics/hooks/`) loads item, supplier, and
low-stock counts in parallel under the key `['analytics','dashboard-metrics']`
with a 2-minute staleTime and 10-minute gcTime. Resilience is layered: each API
helper catches all errors and returns 0, so the hook always resolves; `StatCard`
renders a skeleton while loading and an em dash only for genuinely absent values.

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
