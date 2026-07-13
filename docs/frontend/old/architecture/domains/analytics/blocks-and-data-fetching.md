<a id="top"></a>

[⬅️ Back to Analytics Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Analytics Blocks & Data Fetching

Analytics is intentionally implemented as a **page orchestrator + independent blocks**.

## Orchestrator responsibilities

`frontend/src/pages/analytics/Analytics.tsx` owns:
- parsing `:section` and choosing which block group to render
- holding the controlled `filters` state
- syncing `filters` ↔ URL search params
- fetching supplier options once (`['analytics','suppliers']`)

It does **not** own API DTO mapping or shared HTTP behavior.

## Block responsibilities

Blocks under `frontend/src/pages/analytics/blocks/*` typically:
- render one card/table
- declare a React Query query with a stable `queryKey`
- call an analytics API function (under `frontend/src/api/analytics/*`)
- handle loading/empty/error UI locally

Examples:
- `StockValueCard` → stock value time series line chart
- `MovementLineCard` → stock in/out over time line chart
- `LowStockTable` → table gated by supplier selection
- `FinancialSummaryCard` → supplier-gated financial summary

## Query key conventions

Blocks key their queries by:
- feature (`'analytics'`)
- block name
- all filter inputs that affect the request (`from/to/supplierId`)

Example patterns:
- `['analytics','stockValue', from, to, supplierId ?? null]`
- `['analytics','movementLine', from ?? null, to ?? null, supplierId ?? null]`

This ensures caching is correct and requests deduplicate naturally.

## Caching and retry defaults

Most blocks use small freshness windows (commonly `staleTime: 60_000`).
Some blocks explicitly set `retry: 0` when they prefer a fast fallback over repeated retries.

## Charts and formatting

Charts are rendered using Recharts.
Formatting is delegated to shared user preferences:
- dates via `formatDate(..., userPreferences.dateFormat)`
- numbers via `formatNumber(..., userPreferences.numberFormat, decimals)`

This keeps analytics visuals consistent across locales.

## Conceptual flow

```mermaid
flowchart TD
  Filters[filters state
(from/to/supplierId)] --> Blocks[Analytics blocks]
  Blocks --> RQ[React Query]
  RQ --> API[Analytics API functions
src/api/analytics/*]
  API --> Backend[Backend /api/analytics/*]
  RQ --> UI[loading / empty / error / data]
```

---

[Back to top](#top)
