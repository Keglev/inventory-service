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
  behind the backend's stock guard: blocked while any linked item holds stock
  (`quantity > 0`); zero-quantity items never block, regardless of their active
  flag. Admin-gated, enforced both client-side in the form hook and server-side.

## Error Handling & Open Items

The supplier form hooks classify failures from the structured
`{error, message, timestamp, fieldErrors?}` envelope: the shared
`supplierServerErrors` module keys on the status code and the status token, and
the calling dialog supplies its operation, because 409 means a duplicate name on
create and update but the linked-items rule on delete. A duplicate name arrives
with `fieldErrors.name` and is pinned to the input rather than the form banner.
The dialogs also use
the shared `HelpIconButton` and reference palette tokens rather than fixed hex
values, so they follow the same help and theming contract as the inventory dialogs.
Unlike Inventory, the supplier dialogs do not take a `readOnly` prop; demo
restriction relies on backend authorization.

The dialogs send no audit fields. `createdBy` is assigned server-side from the
authenticated principal, so a client can neither forge it nor omit it; the create
form previously sent nothing and the update form sent the signed-in user's email,
which the backend discarded.
