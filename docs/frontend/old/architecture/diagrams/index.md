[⬅️ Back to Frontend Architecture Index](../index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Architectural Diagrams

This directory is the single entry point for architecture diagrams.

## System diagrams

- [System overview](./system/system-overview.md) - System context for the SPA (browser → frontend → backend → DB)
- [Frontend module map](./system/module-map.md) - Major frontend directories and intended dependency direction

## Routing diagrams

- [Routing flow](./routing/routing-flow.md) - Public vs authenticated routing, guards, and 404 fallback

## Domains diagrams

- [Domains overview (page orchestration)](./domains/domains-overview.md) - The recurring “page orchestrator” shape across domains
- [Dashboard metrics parallel fetching](./domains/dashboard-metrics-parallel-flow.md) - Analytics KPI aggregation via `Promise.all`
- [Supplier-scoped item search](./domains/supplier-scoped-item-search-flow.md) - Client-side supplier filtering due to backend limitation

## Data Access diagrams

- [Data fetching flow (React Query)](./data-access/data-fetching-flow.md) - From UI → React Query hooks → domain fetchers → `httpClient` → backend
- [HTTP client 401 redirect flow](./data-access/http-client-401-redirect-flow.md) - Centralized auth boundary for unauthorized responses
- [List fetching + normalization](./data-access/list-fetching-and-normalization-flow.md) - Envelope tolerance (`content`/`items`/array) + defensive normalization
- [Connectivity + session probes](./data-access/connectivity-and-session-probes-flow.md) - `/health/db` and `/api/me` probe behaviors

## State diagrams

- [Provider composition (conceptual)](./state/provider-composition-flow.md) - Provider placement and shell-provided UX services

## App Shell diagrams

- [App shell variants & layout](./app-shell/shell-variants-and-layout.md) - Public pages vs authenticated AppShell composition

## UI diagrams

- [Help system flow](./ui/help-system-flow.md) - Help button → context → registry → i18n keys

## i18n diagrams

- [i18n boot flow (German-first)](./i18n/i18n-boot-flow.md) - Language selection and namespace loading

## Theming diagrams

- [Theme build & locale flow](./theming/theme-build-and-locale-flow.md) - `buildTheme` + locale pack merging

---

[⬅️ Back to Frontend Architecture Index](../index.md)
