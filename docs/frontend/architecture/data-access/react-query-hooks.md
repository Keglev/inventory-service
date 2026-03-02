<a id="top"></a>

[⬅️ Back to Data Access Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# React Query Hooks

The data-access layer uses **TanStack React Query** to manage server-state (fetching, caching, and request deduplication).

## What hooks own

Hooks under `src/api/**/hooks` typically define:
- a stable `queryKey`
- a `queryFn` that calls a domain API function
- caching policy (`staleTime`, `gcTime`)
- conditional fetching via `enabled`

Examples in this repo:
- Inventory selection flows use `enabled` + minimum search lengths to reduce load.
- Supplier lists cache results for a short time to improve pagination UX.
- Dashboard metrics cache longer to balance freshness and performance.

## Query key conventions

Query keys are structured arrays that encode the “shape” of the request:
- `['suppliers', 'page', page, pageSize, q, sort]`
- `['inventory', 'search', supplierId, searchQuery]`
- `['analytics', 'dashboard-metrics']`

This ensures:
- changes to parameters produce new cache entries
- the same request deduplicates automatically

## Conditional fetching (`enabled`)

Many hooks guard requests so they only run when required prerequisites exist:
- supplier must be selected before searching items
- search query must meet a minimum length
- page visibility (or dialog open state) can gate fetching

## Error handling expectation

React Query will surface errors via `error` / `isError`. Some fetchers also implement **graceful fallbacks** (e.g., returning an empty page on network errors) to avoid breaking UI flows.

---

[Back to top](#top)
