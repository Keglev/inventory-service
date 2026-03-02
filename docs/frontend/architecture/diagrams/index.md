[⬅️ Back to Frontend Architecture Index](../index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Architectural Diagrams

This directory is the single entry point for architecture diagrams.

## Data Access diagrams

- [Data fetching flow (React Query)](data-fetching-flow.md) - From UI → React Query hooks → domain fetchers → `httpClient` → backend
- [HTTP client 401 redirect flow](http-client-401-redirect-flow.md) - Centralized auth boundary for unauthorized responses
- [List fetching + normalization](list-fetching-and-normalization-flow.md) - Envelope tolerance (`content`/`items`/array) + defensive normalization
- [Connectivity + session probes](connectivity-and-session-probes-flow.md) - `/health/db` and `/api/me` probe behaviors
- [Dashboard metrics parallel fetching](dashboard-metrics-parallel-flow.md) - Analytics KPI aggregation via `Promise.all`
- [Supplier-scoped item search](supplier-scoped-item-search-flow.md) - Client-side supplier filtering due to backend limitation

## Planned (not yet diagrammed)

- System overview
- Frontend module map
- Routing flow

---

[⬅️ Back to Frontend Architecture Index](../index.md)
