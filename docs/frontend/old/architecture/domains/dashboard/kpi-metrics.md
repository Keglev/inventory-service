<a id="top"></a>

[⬅️ Back to Dashboard Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Dashboard KPI Metrics

The dashboard’s KPI row is intentionally lightweight and resilient. It renders three stat cards backed by a single React Query hook.

## Where it lives

- Page orchestrator: `frontend/src/pages/dashboard/Dashboard.tsx`
- KPI hook: `frontend/src/api/analytics/hooks/useDashboardMetrics.ts`
- API helpers (tolerant): `frontend/src/api/analytics/metrics.ts`
- UI component: `frontend/src/components/ui/StatCard.tsx`

## Data shape

`useDashboardMetrics()` returns:

```ts
{
  inventoryCount: number;
  suppliersCount: number;
  lowStockCount: number;
}
```

## Query behavior

`useDashboardMetrics(true)` uses React Query:
- `queryKey`: `['analytics', 'dashboard-metrics']`
- `enabled`: allows conditional fetching (dashboard can be mounted but not fetch)
- `staleTime`: 2 minutes (fresh enough for KPIs, avoids hammering the backend)
- `gcTime`: 10 minutes (keeps cached data around longer than staleness)

The query function loads all metrics in parallel:

```ts
await Promise.all([getItemCount(), getSupplierCount(), getLowStockCount()]);
```

## Failure tolerance: what users see

There are two layers of resilience:

1) API helper functions are tolerant
- `getItemCount()`, `getSupplierCount()`, `getLowStockCount()` catch all errors and return `0`.
- Result: even if one endpoint fails, the hook still resolves successfully and the page keeps rendering.

2) StatCard shows a placeholder only for missing values
- `StatCard` renders `value ?? '—'`.
- That means:
  - While loading: skeleton
  - After load: `0` is displayed if the API helper fell back
  - `—` is only shown when `value` is actually `null`/`undefined` (typically “not loaded yet”)

## Conceptual flow

```mermaid
flowchart TD
  Dashboard[Dashboard.tsx] --> Hook[useDashboardMetrics]
  Hook --> Q[React Query]
  Q --> Parallel[Promise.all]

  Parallel --> C1[getItemCount]
  Parallel --> C2[getSupplierCount]
  Parallel --> C3[getLowStockCount]

  C1 --> B1[/api/inventory/count]
  C2 --> B2[/api/suppliers/count]
  C3 --> B3[/api/analytics/low-stock/count]

  Q --> Cards[StatCard x3]
```

---

[Back to top](#top)
