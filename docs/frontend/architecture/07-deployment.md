# §7 Deployment View

## Build Pipeline

`npm run build` runs `tsc -b` then `vite build`, emitting content-hashed assets
under `dist/`. The Vite config defines manual vendor chunks per dependency family
(React, MUI, router, forms/validation, charts, i18n, utilities) so growth is
attributable, with an 800 KB chunk-size warning limit acknowledging MUI's weight.
The router loads pages eagerly — chunking is by vendor, not by route
(see [§6](06-runtime.md)).

## Container & Delivery

A multi-stage Docker build (context = repo root, so `ops/nginx/` travels with the
frontend source): dependency stage (`npm ci --legacy-peer-deps`), test stage
(vitest), build stage (`vite build`), and an `nginx:1.27-alpine` runtime serving
`dist/` with both Nginx configs copied in.

Nginx delivery rules:

- SPA fallback (`try_files ... /index.html`) for client-side routes.
- `/assets/*` cached one year, `Cache-Control: public, immutable` — safe because
  filenames are content-hashed; `index.html` is never cached, so deployments
  propagate immediately.
- gzip for text assets.
- **Serve-time API-base rewrite + reverse proxy**: the build bakes the Fly.io
  origin into the bundle; Nginx rewrites it to the frontend host as the bundle is
  served and reverse-proxies `/api/*` and the OAuth2 paths to the backend, making
  browser traffic same-origin. Full mechanism, verification, and fragility notes:
  [ADR-0008 (backend)](../../backend/architecture/09-decisions/adr-0008-serve-time-api-base-rewrite.md).

## Hosting & CI/CD

The container runs on **Koyeb**, reachable on the project's own domain
(`https://www.smartsupplypro.de`; the apex redirects to the canonical `www` host —
[ADR-0010 (backend)](../../backend/architecture/09-decisions/adr-0010-custom-domain-and-canonical-host.md)).
Two numbered workflows own the frontend:

- **5-frontend-ci** — build and full Vitest suite on every push to `main`.
- **6-deploy-frontend** — builds and deploys to Koyeb via the Koyeb CLI, then
  polls the platform's service status (up to 60 attempts) until it reports
  healthy — more reliable than probing the URL during edge propagation.

Architecture and API documentation deploy separately via the docs pipeline to
GitHub Pages.

## Runtime Caching Model

The SPA's application-level cache is TanStack React Query, configured globally
with `refetchOnWindowFocus: false`, `retry: 1`, and `staleTime: 60_000`
(per-query overrides where warranted — e.g. dashboard KPIs at 2 minutes, trend
data around 5). Reads are gated (`enabled`) and typeahead inputs debounced before
entering query keys, keeping backend load proportional to real user intent.
Mutations invalidate only their affected query families. HTTP-level caching is
deliberately not relied on for API data; static assets are the Nginx/browser
layer's job as above.
