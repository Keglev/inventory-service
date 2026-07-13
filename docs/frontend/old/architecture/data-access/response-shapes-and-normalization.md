<a id="top"></a>

[⬅️ Back to Data Access Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Response Shapes & Normalization

Backend responses are treated as **untrusted input**: they may differ by endpoint, evolve over time, or vary between environments.

To keep the UI stable, the API layer normalizes backend responses into frontend models.

## Envelope tolerance

List endpoints may return different “envelopes”, for example:
- a plain array: `[dto, dto, ...]`
- a Spring `Page`: `{ content: [...], totalElements: 123, ... }`
- a custom envelope: `{ items: [...] }`

Fetchers in `src/api/inventory/*` and `src/api/suppliers/*` are written to tolerate these shapes, extracting rows and calculating totals defensively.

## Defensive normalization

Normalizers convert `unknown` data to typed models with safe fallbacks.

Typical characteristics in this repo:
- required fields are validated (e.g., `id` must exist)
- optional fields default to safe values
- multiple backend field name variants may be accepted
- invalid records are dropped (`null`) rather than throwing

This approach makes list rendering predictable even when backend data is incomplete.

## Shared extraction helpers

Inventory utilities provide shared helpers like:
- “extract response.data safely”
- “extract array from envelope keys”
- type guards to narrow `unknown` to `Record<string, unknown>`

These keep envelope parsing consistent across domains.

---

[Back to top](#top)
