<a id="top"></a>

[⬅️ Back to Diagrams Index](./index.md)

- [Back to Architecture Index](../index.md)
- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)
- [Back to Data Access](../data-access/index.md)

# Dashboard metrics parallel fetching

The dashboard KPI hook aggregates multiple backend calls in parallel.

```mermaid
sequenceDiagram
  autonumber
  participant UI as Dashboard
  participant Hook as useDashboardMetrics
  participant A as getItemCount
  participant B as getSupplierCount
  participant C as getLowStockCount
  participant HC as httpClient
  participant BE as Backend API

  UI->>Hook: render hook
  Hook->>Hook: Promise.all([A(), B(), C()])

  par inventory count
    Hook->>A: call
    A->>HC: GET /api/inventory/count
    HC->>BE: request
    BE-->>HC: number
    HC-->>A: number
    A-->>Hook: number
  and supplier count
    Hook->>B: call
    B->>HC: GET /api/suppliers/count
    HC->>BE: request
    BE-->>HC: number
    HC-->>B: number
    B-->>Hook: number
  and low-stock count
    Hook->>C: call
    C->>HC: GET /api/analytics/low-stock/count
    HC->>BE: request
    BE-->>HC: number
    HC-->>C: number
    C-->>Hook: number
  end

  Hook-->>UI: { inventoryCount, suppliersCount, lowStockCount }
```

---

[Back to top](#top)
