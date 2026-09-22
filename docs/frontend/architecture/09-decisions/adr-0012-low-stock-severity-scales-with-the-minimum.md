# ADR-0012: Low-stock severity scales with each item's minimum

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-09-22

## Context
Every item carries a minimum quantity, owned by the backend. Items created
through the dialog get the backend's default of 10; the seeded demo items
carry 25. The backend decides whether an item is low. Its rule,
`quantity < minimumQuantity`, drives the inventory filter "below minimum",
the dashboard low-stock list and the low-stock count. The frontend decides
only how severe a low item looks: the inventory table colours the row, and
the analytics low-stock table shows a Critical or Warning chip.

Severity was a fixed deficit. A deficit (minimum minus quantity) of 5 or more
was critical, any smaller positive deficit a warning. With the default
minimum of 10 that reads well: red at 5 or less, orange from 6 to 9. With any
other minimum it drifts. An item with minimum 25 turned red at 20, still four
fifths of its minimum; an item with minimum 6 turned red only at 1. A
fallback minimum of 5 applied when the row carried none, which the backend
never sends.

## Decision
Severity is a proportion of the item's own minimum, M:

- critical (red) when quantity <= M / 2;
- warning (orange) when M / 2 < quantity < M;
- none when quantity >= M, and when the minimum is missing or not positive.

The inventory row styling and the analytics low-stock chip take the band from
one function, `lowStockSeverity` in `config/inventoryPolicy.ts`, so the two
views cannot disagree. Whether an item is low at all remains the backend's
rule, `quantity < M`, unchanged: every item under "below minimum" has a
colour, and no coloured item is missing from it.

## Alternatives Considered
- **Keep the fixed deficit of 5**: consistent with the backend, but the red
  band means something different for every minimum.
- **Fixed absolute bands** (red at 5 or less, orange up to 10): right for the
  default minimum only; for every other minimum, and at quantity 10, the
  colours would disagree with the filter and the dashboard.
- **Colour a quantity equal to the minimum**: needs the backend's definition
  of low stock to become `<=`, which moves the filter and the dashboard too.
  A separate decision.

## Consequences
- For the default minimum of 10 nothing visible changes: red 0 to 5, orange
  6 to 9, no colour from 10. A new item entered with a stock of 1 is red.
- Items with other minimums change colour. Minimum 25: red at 12 or less
  (previously 20 or less), orange 13 to 24.
- An odd minimum rounds towards orange: the test is `2 * quantity <= M`, so
  minimum 25 is red at 12 and orange at 13.
- `LOW_STOCK_CRITICAL_THRESHOLD` and the fallback minimum
  `DEFAULT_MIN_QUANTITY` are removed. A row without a positive minimum gets no
  colour instead of being measured against an invented one.
- The analytics low-stock table stays ordered by deficit, the shortfall in
  units. When minimums differ, that order is no longer the severity order.
