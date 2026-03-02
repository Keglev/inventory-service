[⬅️ Back to Domains Index](../index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Suppliers Domain

This domain covers Suppliers Management implemented under `frontend/src/pages/suppliers`.

## 1️⃣ Domain Purpose

The Suppliers domain provides a single place to:
- browse suppliers (paginated)
- search suppliers via a type-ahead search panel
- manage supplier records via dialogs (create/edit/delete)

The page is structured around a “board orchestrator” that composes UI state, data hooks, and presentational components.

## 2️⃣ Scope & Boundaries

Included:
- Page orchestration in `SuppliersBoard.tsx`
- Domain UI state (`hooks/useSuppliersBoardState.ts`)
- Domain data composition (`hooks/useSuppliersBoardData.ts` + `handlers/useDataFetchingLogic.ts`)
- Domain components (`components/*`) and dialog packages (`dialogs/*`)

Excluded:
- API-level mechanics (React Query caching, axios client, normalization) — see [Data Access](../../data-access/index.md)
- Global auth/role gating rules — see [State](../../state/index.md) and [Routing](../../routing/index.md)
- App layout chrome (header/sidebar) — see [App Shell](../../app-shell/index.md)

## 3️⃣ High-Level Diagram

```mermaid
flowchart TD
  UI[Suppliers route renders Suppliers domain] --> Board[SuppliersBoard\n(page orchestrator)]

  Board --> State[useSuppliersBoardState\n(domain UI state)]
  Board --> Handlers[handlers/*\n(event handlers)]
  Board --> Data[useDataFetchingLogic\nparams shaping + data hook]

  Board --> Toolbar[SuppliersToolbar]
  Board --> Search[SuppliersSearchPanel]
  Board --> Filters[SuppliersFilterPanel]
  Board --> Table[SuppliersTable]
  Board --> Dialogs[SuppliersDialogs\nCreate/Edit/Delete]

  Data --> API[Suppliers API hooks\n(src/api/suppliers/**)]
  API --> Backend[Backend /api/suppliers]
```

## 4️⃣ Domain Notes (Implementation-facing)

- The data hook memoizes its return object to avoid re-render loops during router updates.
- The UI supports two display modes:
  - selected search result → show only the selected supplier
  - “show all suppliers” → show the paginated table

## 5️⃣ Domain Map (Planned deep-dives)

These pages are intentionally not written yet; they will be added as leaf docs next:

- Page orchestration: `SuppliersBoard` responsibilities and composition
- Data shaping: page (0-based) → server (1-based) conversion and sort serialization
- Search flow: query length gating, search results, and selection behavior
- Dialog lifecycle: create/edit/delete flows and refresh behavior

---

[⬅️ Back to Domains Index](../index.md)
