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
frontend source): a base stage that installs dependencies with `npm ci`, a build
stage that runs `vite build`, and an `nginx:1.30-alpine` runtime serving `dist/`
with both Nginx configs copied in. There is no test stage: Vitest runs in
`frontend-ci` ahead of the image build, where a failure surfaces as a GitHub
annotation. Peer resolution comes from `frontend/.npmrc`, which the build copies
alongside the package files, rather than from a flag on the command line.

Nginx delivery rules:

- SPA fallback (`try_files ... /index.html`) for client-side routes.
- `/assets/*` cached one year, `Cache-Control: public, immutable` — safe because
  filenames are content-hashed; `index.html` is never cached, so deployments
  propagate immediately.
- gzip for text assets.
- **Serve-time API-base rewrite + reverse proxy**: the build bakes the backend
  origin into the bundle; Nginx rewrites it to the frontend host as the bundle is
  served and reverse-proxies `/api/*` and the OAuth2 paths to the backend, making
  browser traffic same-origin. Full mechanism, verification, and fragility notes:
  [ADR-0008 (backend)](../../backend/architecture/09-decisions/adr-0008-serve-time-api-base-rewrite.md).

## Hosting & CI/CD

The container runs on **Koyeb**, reachable on the project's own domain
(`https://www.smartsupplypro.de`; the apex redirects to the canonical `www` host —
[ADR-0010 (backend)](../../backend/architecture/09-decisions/adr-0010-custom-domain-and-canonical-host.md)).
Two workflows own the frontend:

- **frontend-ci** — audits the shipped dependency tree (gate), lints, runs
  the full Vitest suite, then builds and Trivy-scans the runtime image before
  it can reach Docker Hub.
- **frontend-deploy** — deploys by image digest, then waits for the commit's
  build id to appear in the served bundle before trusting the platform's own
  status, which stays `healthy` throughout a rolling update and cannot verify
  a release on its own
  ([ADR-0010](09-decisions/adr-0010-verifying-frontend-deploys.md)).

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
