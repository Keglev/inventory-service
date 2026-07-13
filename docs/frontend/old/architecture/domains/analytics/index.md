[⬅️ Back to Domains Index](../index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Analytics Domain

This domain covers the Analytics experience implemented under `frontend/src/pages/analytics`.

## 1️⃣ Domain Purpose

The Analytics domain provides a single place to:
- explore analytics KPIs and trends (stock value, movement, pricing, low stock, finance)
- filter analytics by **date range** and optionally by **supplier**
- deep-link and share analytics views via URL state

A key intent is that the URL is the source of truth for the current section and filters, so analytics views are bookmarkable.

## 2️⃣ Scope & Boundaries

Included:
- Page orchestration in `Analytics.tsx` (tabs/section routing, filter state, URL sync)
- Filters UI (`components/filters/*`) including quick presets + custom ranges
- Section navigation (`components/AnalyticsNav.tsx`) based on route segments
- Analytics blocks (`blocks/*`) that each fetch and render a single chart/table

Excluded:
- API-level mechanics (Axios client, caching rules, normalization) — see [Data Access](../../data-access/index.md)
- Global routing rules (guards, shells) — see [Routing](../../routing/index.md)
- Shared layout chrome (header/sidebar) — see [App Shell](../../app-shell/index.md)

## 3️⃣ High-Level Diagram

```mermaid
flowchart TD
  URL[URL\n/analytics/:section? + ?from&to&supplierId] --> Page[Analytics.tsx\n(orchestrator)]

  Page --> Tabs[AnalyticsNav\nroute-segment tabs]
  Page --> Filters[Filters\n(date range + supplier)]

  Filters --> State[AnalyticsFilters state\n(from,to,supplierId,quick)]
  State --> URL

  Page --> Blocks[Blocks grid\n(StockValue, LowStock, PriceTrend, Finance...)]
  Blocks --> RQ[React Query\nqueryKey includes filters]
  RQ --> API[Analytics API\n(src/api/analytics/**)]
  API --> Backend[Backend /api/analytics/*]
```

## 4️⃣ Domain Notes (Implementation-facing)

- **Section selection** is URL-driven: `/analytics/:section?` (e.g. `/analytics/pricing`).
- **Filters are URL-synced**: `from`, `to`, and `supplierId` are written back to search params.
- **Supplier list** for the filter is fetched once via React Query (`['analytics','suppliers']`) and then passed into the filter component.
- Many blocks **gate fetching** via `enabled` when a required parameter is missing (e.g., low-stock table requires a supplier).

## 5️⃣ Domain Map (Deep-dives)

- [Analytics URL & Section Routing](./url-and-section-routing.md)
- [Analytics Filters & URL Sync](./filters-and-url-sync.md)
- [Analytics Blocks & Data Fetching](./blocks-and-data-fetching.md)
- [Supplier-Gated Blocks](./supplier-gated-blocks.md)

## Related ADRs

- [ADR-0003: Page model and domain separation](../../adr/adr-0003-page-model-and-domain-separation.md)
- [ADR-0002: API layer abstraction (httpClient + domain modules)](../../adr/adr-0002-api-layer-abstraction-httpclient-and-domain-modules.md)
- [ADR-0005: Application shell split (authenticated vs public)](../../adr/adr-0005-shell-split-authenticated-vs-public.md)

---

[⬅️ Back to Domains Index](../index.md)
