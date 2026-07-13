# §5.1 Inventory Domain

Supplier-scoped item management under `frontend/src/pages/inventory/`: browse,
filter, and mutate items through dialog workflows
([ADR-0004](../09-decisions/adr-0004-dialog-workflow-architecture.md)).

## Orchestration & State

`InventoryBoard.tsx` is the page orchestrator: it instantiates domain state,
assembles handlers and data, owns dialog visibility, and renders the
select-a-supplier prompt until a supplier is chosen. `useInventoryState` is the
single source of truth for filters (`supplierId`, `q`, `belowMinOnly`), MUI
DataGrid pagination/sort models, row selection, and per-dialog open flags.
Handler hooks stay thin and encode the reset invariants: changing supplier clears
selection and query and resets to page 0; toggling below-minimum resets paging;
the refresh handler resets paging and bumps a refetch signal.

## Data Fetching & Filtering

`handlers/useDataFetchingLogic.ts` adapts UI state to server parameters: DataGrid's
0-based page becomes the backend's 1-based page, and the sort model serializes to
`"<field>,<direction>"` (default `name,asc`). Loading is gated on a selected
supplier. Because `GET /api/inventory/search` accepts only `name`, the domain
applies client-side filters after the page loads: a supplier-id safety-net filter,
case-insensitive name search, and the below-minimum filter (`onHand < min`,
defaulting the threshold when absent). Supplier options come from the shared
suppliers query, independent of the selection.

## Dialog Workflows

`InventoryDialogs` is a pure switchboard receiving open/close props, the selected
row, and `isDemo` for read-only enforcement. The flows:

- **Create** (`ItemFormDialog`) — create-only; no edit mode is wired (the dialog
  receives no initial values anywhere in the app). Requires name + supplier;
  quantity/price non-negative; reason limited to `INITIAL_STOCK`/`MANUAL_UPDATE`.
- **Rename** (`EditItemDialog`) — the ONLY edit operation: guided
  supplier → item → new-name flow, admin-gated, name unique per supplier,
  produces no stock-history row.
- **Adjust quantity** (`QuantityAdjustDialog`) — supplier → item → new quantity →
  reason; submit disabled without an item; honors `readOnly`.
- **Change price** (`PriceChangeDialog`) — supplier → item → new price (> 0);
  honors `readOnly`.
- **Delete** (`DeleteItemDialog`) — two-step (form, then warning confirmation);
  admin-gated; the backend enforces the zero-quantity gate (409 otherwise) and
  performs a soft delete retaining full stock history.

Every dialog reports success through a callback the board wires to one reload
handler, so the table refreshes after any mutation.

## Validation & Authorization

Zod schemas in `validation/inventoryValidation.ts` cover all five flows
client-side; the backend remains the source of truth for authorization
(rename/delete are ADMIN) and business invariants (uniqueness, zero-quantity
gate). Demo mode short-circuits mutations before any request is sent.
