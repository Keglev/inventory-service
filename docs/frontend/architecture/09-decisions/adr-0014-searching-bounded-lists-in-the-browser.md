# ADR-0014: Searching bounded lists in the browser

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-10-06

## Context
The supplier board and the edit and delete supplier dialogs each had their own
search field, and each sent `GET /api/suppliers/search?name=` on every keystroke
from the second character: typing "Nordbay" cost six requests. The backend
returns every match with no limit, so a short fragment against many suppliers
opened a long dropdown.

At the same time the app already loads the full supplier list
(`GET /api/suppliers`, a plain array) for the suppliers grid and keeps it in the
React Query cache. A supplier is about 205 bytes of JSON: 50 suppliers are about
10 KB, 500 about 100 KB, against a 185 KB main bundle.

The inventory dialogs (quantity, price, edit, delete) pick an item after a
supplier and search `GET /api/inventory/search?supplierId=&name=` per keystroke
in the same way.

## Decision
A list that is bounded and already, or cheaply, in the browser is searched in
the browser.

- **Suppliers.** `matchSuppliers` filters the cached supplier list: the fragment
  anywhere in the name, ignoring case, from two characters on, the backend's own
  rule. One shared `SupplierSearchField` (MUI Autocomplete) serves the board and
  both dialogs; it shows at most six results with a count of the rest.
- **Items of one supplier (to follow).** After a supplier is chosen, its items
  load once (`/api/inventory/search?supplierId=X&size=2000`) and are filtered by
  name or SKU in the browser. Choosing another supplier drops the previous list.
  When the page reports more items than it returned, the picker falls back to
  the server search.
- **Unbounded searches stay on the server.** The analytics item pickers search
  across all suppliers and keep the debounced server search; the inventory grid
  keeps its paged server query.

Thresholds: browser filtering is meant for lists up to roughly 1,000-2,000 rows.
The backend caps a page at 2,000 rows, which is also the item-list limit above.

## Alternatives Considered
- **Server search with a debounce, a three-character minimum and a result
  cap**: about one request per word instead of one per character, but still a
  database round trip for data the browser already holds.
- **Keep three separate search fields**: they had drifted apart (a disabled
  input that lost keystrokes, an empty message under a result, rows not
  reachable by keyboard, hard-coded English).

## Consequences
- Typing in a supplier search sends no request; results appear without
  latency once the list is loaded (one request per minute at most, the list
  query's stale time).
- The full supplier list reaches the browser, as it already did for the grid.
  Access control stays on the server, which decides who may read the list; the
  cache is in memory only and is never written to browser storage.
- `GET /api/suppliers/search` is no longer called by the frontend. It stays in
  the backend under the removal rule (troubleshooting use).
- When a list outgrows the thresholds, this decision is revisited: the server
  search with a debounce and a cap is the documented fallback.
