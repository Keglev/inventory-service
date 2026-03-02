<a id="top"></a>

[⬅️ Back to Analytics Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Analytics URL & Section Routing

Analytics uses the URL as the source of truth for **which section is visible**.

## Routes

- Base route: `/analytics/:section?`
- Supported `:section` values are implemented in the page orchestrator:
  - `overview`
  - `pricing`
  - `inventory`
  - `finance`

If the segment is missing or unknown, the app falls back to `overview`.

## Where it lives

- Route declaration: `frontend/src/routes/AppRouter.tsx` (`/analytics/:section?`)
- Section parsing + rendering: `frontend/src/pages/analytics/Analytics.tsx`
- Tabs: `frontend/src/pages/analytics/components/AnalyticsNav.tsx`

## How section selection works

1. The router provides the optional segment via `useParams()`.
2. `Analytics.tsx` normalizes it to an `AnalyticsSection`.
3. `AnalyticsNav` receives the current section and renders MUI `<Tabs>`.
4. When a tab is clicked, `AnalyticsNav` navigates to `/analytics/<section>`.

## Conceptual flow

```mermaid
flowchart LR
  URL["/analytics/:section?"] --> Params[useParams().section]
  Params --> Normalize[normalize → overview|pricing|inventory|finance]
  Normalize --> Nav[AnalyticsNav (Tabs)]
  Nav -->|onChange| Navigate[navigate("/analytics/<next>")]
  Normalize --> Blocks[Render blocks for section]
```

## Design notes

- The sections are designed to be **deep-linkable** (bookmark/share URLs).
- Blocks are isolated by section so adding a new section is mostly:
  - extend the `AnalyticsSection` union
  - add a `<Tab>` in `AnalyticsNav`
  - add a conditional block group in `Analytics.tsx`

---

[Back to top](#top)
