# Frontend Architecture Index

Welcome to the Smart Supply Pro frontend architecture documentation. This section explains how the React application is structured, how it communicates with the backend, and the conventions used to keep the UI maintainable as the product grows.

## Overview

The frontend is a **React + TypeScript** single-page application built with **Vite**. It uses **React Router** for navigation, **TanStack React Query** for server-state, **Axios** for HTTP, **MUI + Emotion** for UI/theming, **i18next** for localization, and **Vitest/Testing Library** for tests.

## Start Here

- **[High-level Overview (English)](./overview.md)** *(to be added)*
- **[Überblick (German)](./overview-de.md)** *(wird später ergänzt)*

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

- **[Architectural Diagrams](./diagrams/)** *(diagram pages will be added incrementally)*
- **[App Shell](./app-shell/)**
- **[Routing](./routing/)**
- **[State](./state/)**
- **[Data Access](./data-access/)**
- **[Domains](./domains/)**
- **[UI Components](./ui/)**
- **[Theming](./theming/)**
- **[i18n](./i18n/)**
- **[Performance](./performance/)**
- **[Testing](./testing/)**
- **[ADRs](./adr/)**

## High-level diagrams (links)

- **[Diagrams directory](./diagrams/)**
- **[System overview](./diagrams/system-overview.md)** *(planned)*
- **[Frontend module map](./diagrams/module-map.md)** *(planned)*
- **[Routing flow](./diagrams/routing-flow.md)** *(planned)*
- **[Data fetching flow (React Query)](./diagrams/data-fetching-flow.md)** *(planned)*

## Key architectural principles

1. **Feature-first structure** where it helps (pages/features), with shared UI and utilities kept explicit.
2. **Clear separation of concerns** between view components, data access, and domain logic.
3. **Predictable data flow** with React Query for backend data and minimal ad-hoc global state.
4. **Design-system alignment** via MUI theming and reusable components.
5. **Testability** through small units, stable selectors, and realistic integration tests.

---

*Last updated: February 2026*
