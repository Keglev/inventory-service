<a id="top"></a>

[⬅️ Back to Analytics Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Analytics Filters & URL Sync

Analytics treats filters as **shareable URL state**, not hidden component state.

## Filter model (URL contract)

Filters are serialized into search params:
- `from`: ISO date `YYYY-MM-DD`
- `to`: ISO date `YYYY-MM-DD`
- `supplierId`: supplier identifier

In UI, the filter state also tracks a `quick` selector (`30`/`90`/`180`/`custom`).

## Where it lives

- State + URL sync: `frontend/src/pages/analytics/Analytics.tsx`
- Filter UI (controlled): `frontend/src/pages/analytics/components/filters/*`
  - `Filters.tsx` (orchestrator)
  - `DateRangeFilter.tsx` (quick presets + custom)
  - `SupplierFilter.tsx` (supplier dropdown)
  - `Filters.types.ts` (serializable filter shape)

## Initialization rules

On first render, `Analytics.tsx`:
1. Reads `from/to/supplierId` from `location.search`.
2. If both `from` and `to` exist, treats it as a “custom” range.
3. Otherwise, applies defaults (last 180 days) and marks `quick = '180'`.

This makes fresh visits predictable while still preserving deep links.

## Sync rules

When `filters.from`, `filters.to`, or `filters.supplierId` change, a `useEffect` writes them back to search params.

Key characteristics:
- Only defined values are emitted (missing `supplierId` is removed).
- The URL becomes the canonical representation of the current filter state.

## Reset behavior

The filter bar exposes a reset that:
- resets date range to 180 days
- clears `supplierId`
- sets `quick = '180'`

## Supplier options

The supplier dropdown is populated once per Analytics page load via React Query:
- `queryKey`: `['analytics','suppliers']`
- `queryFn`: `getSuppliersLite`

Then `suppliersQ.data` is passed into `<Filters />`.

## Conceptual flow

```mermaid
flowchart TD
  URL[URL search params
from/to/supplierId] --> Init[Initial filters state]
  Init --> UI[Filters component (controlled)]
  UI --> Change[onChange(nextFilters)]
  Change --> State[filters state]
  State --> Effect[useEffect writes search params]
  Effect --> URL
```

---

[Back to top](#top)
