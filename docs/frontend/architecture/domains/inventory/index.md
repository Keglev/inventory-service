[⬅️ Back to Domains Index](../index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Inventory Domain

This domain covers the Inventory Management experience implemented under `frontend/src/pages/inventory`.

## 1️⃣ Domain Purpose

The Inventory domain provides a single place to:
- search and browse inventory items (supplier-scoped)
- filter and sort list results
- perform item actions via dialogs (create/edit/delete/adjust quantity/change price)

## 2️⃣ Scope & Boundaries

Included:
- Page orchestration in `InventoryBoard.tsx`
- Domain-local UI state and handlers (folder structure: `hooks/`, `handlers/`)
- Domain components and dialogs (`components/`, `dialogs/`)
- Domain validation helpers (`validation/`)

Excluded:
- API-level mechanics (React Query caching, axios client, normalization) — see [Data Access](../../data-access/index.md)
- Global auth/role gating rules — see [State](../../state/index.md) and [Routing](../../routing/index.md)
- App layout chrome (header/sidebar) — see [App Shell](../../app-shell/index.md)

## 3️⃣ High-Level Diagram

```mermaid
flowchart TD
  UI[Inventory route renders Inventory domain] --> Board[InventoryBoard\n(page orchestrator)]

  Board --> State[useInventoryState\n(domain UI state)]
  Board --> Handlers[handlers/*\n(event handlers)]
  Board --> Data[useDataFetchingLogic\n(domain data composition)]

  Board --> Toolbar[InventoryToolbar]
  Board --> Filters[InventoryFilterPanel]
  Board --> Table[InventoryTable]
  Board --> Dialogs[InventoryDialogs]

  Data --> API[Inventory API hooks\n(src/api/inventory/**)]
  API --> Backend[Backend /api/inventory]
```

## 4️⃣ Domain Map (Deep-dives)

Leaf docs for how Inventory works:

- [Page orchestration (InventoryBoard)](./page-orchestration.md)
- [State & handlers (reset invariants)](./state-and-handlers.md)
- [Data fetching & filtering](./data-fetching-and-filtering.md)
- [Dialogs & mutations](./dialogs-and-mutations.md)
- [Validation & authorization](./validation-and-authorization.md)

---

[⬅️ Back to Domains Index](../index.md)
