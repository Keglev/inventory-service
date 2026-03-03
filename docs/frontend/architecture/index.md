# Frontend Architecture Index

Welcome to the Smart Supply Pro frontend architecture documentation. This section explains how the React application is structured, how it communicates with the backend, and the conventions used to keep the UI maintainable as the product grows.

## Overview

The frontend is a **React + TypeScript** single-page application built with **Vite**. It uses **React Router** for navigation, **TanStack React Query** for server-state, **Axios** for HTTP, **MUI + Emotion** for UI/theming, **i18next** for localization, and **Vitest/Testing Library** for tests.

## Start Here

- **[High-level Overview (English)](./overview.md)** - High-level introduction to the frontend architecture, scope of this documentation, and links to the main topics
- **[Überblick (German)](./overview-de.md)** - Deutschsprachiger Überblick über die Frontend-Architektur, Umfang der Dokumentation und Einstiegspunkte zu den Hauptthemen

## What’s inside (map)

1. App shell layout and global composition (providers, error boundaries, navigation)
2. Routing patterns (route tree, guards, lazy loading, navigation conventions)
3. State model (server-state vs client-state; when to use which)
4. Data access (API client, request/response shapes, caching, retries, error handling)
5. Domains/features (how business areas are split into modules and pages)
6. UI system (shared components, forms, tables, charts, accessibility conventions)
7. Theming & styling (MUI theme tokens, Emotion usage, CSS conventions)
8. i18n (translation files, language detection, formatting, testing)

## Major sections

- **[Architectural Diagrams](./diagrams/index.md)**
- **[App Shell](./app-shell/index.md)**
- **[Routing](./routing/index.md)**
- **[State](./state/index.md)**
- **[Data Access](./data-access/index.md)**
- **[Domains](./domains/index.md)**
- **[UI & UX Building Blocks](./ui/index.md)**
- **[Theme & Styling](./theming/index.md)**
- **[Internationalization (i18n)](./i18n/index.md)**
- **[Performance](./performance/)**
- **[Testing](./testing/)**
- **[ADRs](./adr/index.md)**

## High-level diagrams (links)

- **[Diagrams directory](./diagrams/index.md)**
- **[System overview](./diagrams/system/system-overview.md)**
- **[Frontend module map](./diagrams/system/module-map.md)**
- **[Routing flow](./diagrams/routing/routing-flow.md)**
- **[Domains overview](./diagrams/domains/domains-overview.md)**
- **[Provider composition](./diagrams/state/provider-composition-flow.md)**
- **[Data fetching flow (React Query)](./diagrams/data-access/data-fetching-flow.md)**
- **[HTTP client 401 redirect flow](./diagrams/data-access/http-client-401-redirect-flow.md)**
- **[List fetching + normalization](./diagrams/data-access/list-fetching-and-normalization-flow.md)**
- **[Connectivity + session probes](./diagrams/data-access/connectivity-and-session-probes-flow.md)**
- **[Dashboard metrics parallel fetching](./diagrams/domains/dashboard-metrics-parallel-flow.md)**
- **[Supplier-scoped item search](./diagrams/domains/supplier-scoped-item-search-flow.md)**

## Key architectural principles

1. **Feature-first structure** where it helps (pages/features), with shared UI and utilities kept explicit.
2. **Clear separation of concerns** between view components, data access, and domain logic.
3. **Predictable data flow** with React Query for backend data and minimal ad-hoc global state.
4. **Design-system alignment** via MUI theming and reusable components.
5. **Testability** through small units, stable selectors, and realistic integration tests.

---

*Last updated: February 2026*
