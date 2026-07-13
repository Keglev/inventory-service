# §5.2 Suppliers Domain

Supplier master data under `frontend/src/pages/suppliers/`: search-first browsing
and CRUD dialogs with an active-stock delete guard.

## Search & Display Modes

The board avoids rendering a large table by default. `SuppliersSearchPanel` offers
a type-ahead (2-character minimum) whose dropdown renders only while results exist
and nothing is selected; selecting a result pins the table to a single-row display,
sets the selection (enabling edit/delete), and resets paging. An explicit
"show all suppliers" toggle switches to the paginated list. Search selection takes
precedence over the toggle; with neither active, the table stays hidden behind a
placeholder.

## Data Access

The list fetcher is deliberately tolerant: it accepts multiple response envelope
shapes and returns an empty page on network errors, so the board keeps rendering
under partial backend failure. `GET /api/suppliers` returns a bare JSON array (no
Spring Page); `/api/suppliers/search?name=` backs the type-ahead.

## Dialog Workflows

`SuppliersDialogs` is pure composition around three dialogs
([ADR-0004](../09-decisions/adr-0004-dialog-workflow-architecture.md)):

- **Create** (`CreateSupplierDialog`) — React Hook Form + Zod; name required;
  contact name/phone/email optional and stored as `null` when empty (email
  validated when provided). Duplicate-name errors map heuristically onto the
  name field.
- **Edit** (`EditSupplierDialog`) — guided flow: search/select → edit contact
  fields → review a change summary → confirm. The client form deliberately
  excludes the supplier name; the backend PUT does accept renames (with a
  uniqueness check), so immutability here is a frontend form decision, not a
  backend rule.
- **Delete** (`DeleteSupplierDialog`) — search/select → confirm; physical delete
  behind the backend's active-stock guard (blocked while active items exist).
  Admin-gated, enforced both client-side in the form hook and server-side.

## Error Handling & Open Items

The supplier form hooks currently match free-text server messages (including the
German 'verknüpften' variant) to classify errors; migrating to the structured
`{error, message, timestamp}` contract is tracked (CB-APP100), as are the shared
help-icon extraction (ST-APP29) and theme-token migration (CB-APP99) noted in the
dialog sources. Unlike Inventory, the supplier dialogs do not take a `readOnly`
prop; demo restriction relies on backend authorization.
