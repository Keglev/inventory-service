[⬅️ Back to Domains Index](../index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Dashboard Domain

This domain covers the main dashboard page implemented under `frontend/src/pages/dashboard`.

## 1️⃣ Domain Purpose

The Dashboard domain provides a “front door” overview:
- shows a small set of KPIs (items, suppliers, low stock)
- shows a compact 90-day stock movement chart
- provides navigation shortcuts into primary workflows (Inventory, Suppliers, Analytics)

The dashboard is intentionally resilient: partial API failures should degrade to placeholders instead of breaking the page.

## 2️⃣ Scope & Boundaries

Included:
- Page orchestration in `Dashboard.tsx`
- KPI metrics query via `useDashboardMetrics` (analytics hook)
- Compact chart block in `blocks/MonthlyMovementMini.tsx`
- Navigation actions to domain routes

Excluded:
- Full analytics visualizations and filtering — see [Analytics domain](../analytics/index.md)
- API caching/normalization and HTTP client semantics — see [Data Access](../../data-access/index.md)
- Global routing/guard behavior — see [Routing](../../routing/index.md)
- Shell layout/chrome — see [App Shell](../../app-shell/index.md)

## 3️⃣ High-Level Diagram

```mermaid
flowchart TD
  Route["/dashboard"] --> Page[Dashboard.tsx\n(page orchestrator)]

  Page --> Help[HelpIconButton\n(topicId=app.main)]

  Page --> KPIs["KPI StatCards\n(items, suppliers, low stock)"]
  KPIs --> Metrics[useDashboardMetrics\n(analytics hook)]
  Metrics --> API[Analytics API\n/src/api/analytics/*]
  API --> Backend[Backend\n/api/inventory/count\n/api/suppliers/count\n/api/analytics/low-stock/count]

  Page --> Chart[MonthlyMovementMini\n(90d movement)]
  Chart --> MovementQ[React Query\n['dashboard','movementMini',from,to]]
  MovementQ --> MovementAPI[getMonthlyStockMovement]
  MovementAPI --> Backend2[Backend\n/api/analytics/monthly-stock-movement]

  Page --> Nav[Action buttons]
  Nav --> Inventory[/inventory]
  Nav --> Suppliers[/suppliers]
  Nav --> Analytics[/analytics/overview]
```

## 4️⃣ Domain Notes (Implementation-facing)

- KPIs are fetched through a single hook that aggregates backend calls.
- The movement mini-chart reuses the analytics API and uses a fixed 90-day window.
- Dashboard queries use their own query keys (dashboard-scoped) so cache entries don’t collide with analytics views.

## 5️⃣ Domain Map (Deep-dives)

- [KPI metrics (caching + failure tolerance)](./kpi-metrics.md)
- [Movement mini chart (90d window + query)](./movement-mini-chart.md)
- [Navigation shortcuts + help integration](./navigation-and-help.md)

## Related ADRs

- [ADR-0003: Page model and domain separation](../../adr/adr-0003-page-model-and-domain-separation.md)
- [ADR-0002: API layer abstraction (httpClient + domain modules)](../../adr/adr-0002-api-layer-abstraction-httpclient-and-domain-modules.md)
- [ADR-0006: Global state with Context modules (Help/Settings)](../../adr/adr-0006-global-state-with-context-modules.md)

---

[⬅️ Back to Domains Index](../index.md)
