# §12 Glossary

| Term | Meaning |
|---|---|
| Block | Self-contained analytics card/table owning one query and its UI states ([§5.3](05-domains/analytics.md)) |
| Deficit | `minimumQuantity − quantity`, floored at zero; computed client-side ([§5.3](05-domains/analytics.md)) |
| Demo mode | Client-only read-only session persisted in localStorage; no backend account ([§5.5](05-domains/auth.md)) |
| Domain | A business area module under `pages/` with its own state, handlers, and dialogs ([§5](05-building-blocks.md)) |
| Envelope tolerance | Fetchers accepting multiple response shapes (bare array vs page object) ([§8](08-concepts.md)) |
| German-first | Pre-seeding `i18nextLng='de'` on first visit before detection runs ([§8b](08b-concepts-i18n-theming.md)) |
| Orchestrator | A page component composing state, handlers, data, and dialogs without owning their logic |
| Serve-time rewrite | Nginx rewriting the baked API origin as the bundle is served ([ADR-0008, backend](../../backend/architecture/09-decisions/adr-0008-serve-time-api-base-rewrite.md)) |
| Shell | Top-level chrome wrapper; public and authenticated variants ([§5](05-building-blocks.md)) |
| Session probe | `GET /api/me` used for hydration and validity checks, exempt from 401 redirects ([§8](08-concepts.md)) |
| BUCKET marker | In-source comment recording a tracked observation with its internal ID |
