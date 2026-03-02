<a id="top"></a>

[⬅️ Back to Analytics Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Supplier-Gated Blocks (enabled + empty states)

Some analytics endpoints require a supplier, so blocks must avoid firing requests when `supplierId` is missing.

## Why gating exists

- It prevents avoidable backend errors (e.g., a finance endpoint that expects a supplier).
- It keeps the UI predictable: the user sees a helper prompt instead of an error.
- It preserves the Rules of Hooks by declaring hooks unconditionally and gating via `enabled`.

## Pattern

1. Declare the query hook at the top of the component.
2. Compute `enabled = Boolean(supplierId)`.
3. Pass `enabled` into the React Query call.
4. Render a helper UI when `enabled` is false.

## Examples in this repo

### LowStockTable

- Location: `frontend/src/pages/analytics/blocks/LowStockTable.tsx`
- `enabled` is `Boolean(supplierId)`
- When disabled: renders “Select a supplier to see low stock” helper text
- Query key encodes supplier + date window:
  - `['analytics','lowStock', supplierId, from ?? null, to ?? null]`

### FinancialSummaryCard

- Location: `frontend/src/pages/analytics/blocks/FinancialSummaryCard.tsx`
- `enabled` is `!!supplierId`
- When disabled: renders a light helper card prompting supplier selection

## UX states checklist (recommended for new blocks)

- Disabled (missing required input): helper prompt
- Loading: skeleton
- Error: lightweight error placeholder (avoid hard crashes)
- Empty: “no data” message (distinct from error)

## Conceptual flow

```mermaid
flowchart TD
  Supplier[supplierId?] --> Enabled{enabled?}
  Enabled -->|no| Helper[Helper UI: select supplier]
  Enabled -->|yes| Query[useQuery(..., enabled: true)]
  Query --> Loading[isLoading → skeleton]
  Query --> Error[isError → placeholder]
  Query --> Data[render table/chart]
```

---

[Back to top](#top)
