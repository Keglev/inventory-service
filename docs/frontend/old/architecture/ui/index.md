[⬅️ Back to Frontend Architecture Index](../index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# UI & UX Building Blocks

## 1️⃣ Section Purpose

This section documents the reusable UI building blocks and UX-supporting modules that are shared across domains.

In this repo, “UI” is not only components—it's also:

- shared hooks that standardize context access and UI behavior
- the help system (topic registry + help trigger button)
- the health-check hook used for status surfaces

## 2️⃣ Scope & Boundaries

Included:
- Shared UI components under `frontend/src/components/ui/*`
- Shared hooks under `frontend/src/hooks/*`
- Help topic registry (`frontend/src/help/topics.ts`)
- Help UI trigger (`frontend/src/features/help/*`)
- Health polling hook (`frontend/src/features/health/*`)

Excluded:
- Theme tokens and component defaults (see [Theming](../theming/index.md))
- Routing/page orchestration (see [Routing](../routing/index.md) and [Domains](../domains/index.md))

## 3️⃣ High-Level Diagram

```mermaid
graph LR
  Domains[Domain pages] --> UI[Shared UI components]
  Domains --> Hooks[Shared hooks]
  Domains --> Help[Help trigger + topics]
  Domains --> Health[Health polling]

  Hooks --> Ctx[Context providers]
  Help --> I18N[Translations (help namespace)]
```

## 4️⃣ Section Map (Links to nested docs)

## Contents

- [Shared UI components](./shared-ui-components.md) - Small reusable building blocks like `StatCard`
- [Hooks & context access pattern](./hooks-and-context-access.md) - `createContextHook()` and the standardized `useAuth/useSettings/useHelp`
- [Help system (topics + trigger button)](./help-system.md) - Registry-driven help topics and how to open them
- [Health check hook](./health-check-hook.md) - Lightweight polling of `/api/health` and runtime validation

## Related ADRs

- [ADR-0006: Global state with Context modules (Help/Toast/Settings/Auth)](../adr/adr-0006-global-state-with-context-modules.md)
- [ADR-0004: Dialog/workflow architecture (domain-owned workflows)](../adr/adr-0004-dialog-workflow-architecture.md)
- [ADR-0001: Frontend folder structure strategy](../adr/adr-0001-frontend-folder-structure-strategy.md)

---

[⬅️ Back to Frontend Architecture Index](../index.md)
