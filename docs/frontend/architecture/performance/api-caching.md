<a id="top"></a>

[⬅️ Back to Performance Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# API caching (React Query)

The frontend uses TanStack React Query as its **in-memory cache** and request orchestration layer.

This is the primary caching mechanism for API data in the SPA.

## 1) Global defaults

The `QueryClient` is configured with conservative defaults:

- `refetchOnWindowFocus: false` (avoid surprise traffic)
- `retry: 1` (small resilience without long retry storms)
- `staleTime: 60_000` (treat most data as “fresh for 60s”)

These defaults can be overridden per-query.

## 2) Per-query freshness vs memory

React Query distinguishes:

- `staleTime`: how long data is considered “fresh” (no refetch on mount)
- `gcTime`: how long unused cache data remains in memory before being garbage collected

In this repo you’ll see patterns like:

- Analytics trend data: `staleTime` around 5 minutes, `gcTime` around 15 minutes.
- Dashboard KPIs: `staleTime` around 2 minutes, longer `gcTime` to avoid re-fetching when navigating back.

## 3) Query gating (avoid unnecessary requests)

Use `enabled` and input gating to keep expensive queries from firing:

- Only fetch when required inputs exist (e.g., supplierId selected).
- Debounce typeahead search inputs and use the debounced value in the query key.

This reduces backend load under real user behavior (typing, tabbing, fast navigation).

## 4) Query keys and invalidation

Guidelines used across the codebase:

- Query keys are structured arrays (e.g., `['analytics', 'stock-value', params]`).
- Params objects are included when they represent the “identity” of the query.

When a mutation happens (create/update/delete), invalidate only the affected query families (inventory list, supplier list, etc.). This keeps UI responsive and avoids refetching unrelated analytics.

## 5) Relationship to HTTP caching

- Axios requests here are not configured for browser HTTP cache (and many API routes are not safely cacheable by intermediaries).
- The SPA relies primarily on React Query’s in-memory cache for read performance.
- Static assets are cached at the Nginx/browser layer (see build & deployment docs).

---

[Back to top](#top)
