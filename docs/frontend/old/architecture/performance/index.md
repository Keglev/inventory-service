[⬅️ Back to Frontend Architecture Index](../index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Performance

## 1️⃣ Purpose

This section documents how the frontend is kept **fast under load** and **predictable in production**.

“Performance” here covers:

- bundle size and code splitting (initial load)
- lazy loading patterns (route-level and interaction-level)
- rendering optimization for large tables, dialog-heavy workflows, and analytics blocks
- API caching and request shaping (React Query)
- build + delivery behavior (Vite output + Nginx caching rules)

## 2️⃣ Scope & Boundaries

Included:
- Vite build configuration (vendor chunking, chunk size warnings)
- SPA delivery via Nginx (asset caching, SPA fallback, API reverse-proxy)
- React rendering guidance (memoization, list/table strategy)
- React Query cache strategy and query gating

Excluded:
- Backend performance tuning (DB indexes, API response optimization)
- Infrastructure sizing and autoscaling (platform concerns)

## 3️⃣ High-Level Diagram

```mermaid
flowchart LR
  User[User] --> Browser[Browser]

  subgraph Delivery[Delivery]
    Nginx[Nginx
    - serves SPA assets
    - caches /assets immutable
    - SPA fallback to index.html]
  end

  subgraph Frontend[Frontend SPA]
    React[React UI]
    RQ[React Query cache]
  end

  Browser --> Nginx
  Nginx --> React
  React --> RQ
  React -->|/api/* (same-origin)| Nginx
  Nginx -->|reverse proxy| Backend[Backend API]
```

## 4️⃣ Contents

- [Bundle strategy](./bundle-strategy.md)
- [Lazy loading](./lazy-loading.md)
- [Rendering optimization](./rendering-optimization.md)
- [API caching (React Query)](./api-caching.md)
- [Build & deployment (delivery)](./build-and-deployment.md)

## Related ADRs

- [ADR-0003: Page orchestration and domain boundaries](../adr/adr-0003-page-orchestration-and-domain-boundaries.md)
- [ADR-0004: Dialog/workflow architecture (domain-owned workflows)](../adr/adr-0004-dialog-workflow-architecture.md)
- [ADR-0002: API layer abstraction and error handling](../adr/adr-0002-api-layer-abstraction-and-error-handling.md)

---

[⬅️ Back to Frontend Architecture Index](../index.md)
