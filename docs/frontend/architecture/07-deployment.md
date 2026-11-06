# §7 Deployment View

## Build Pipeline

`npm run build` runs `tsc -b` then `vite build`, emitting content-hashed assets
under `dist/`. The Vite config groups vendor code into one chunk per dependency
family (Rolldown `codeSplitting` groups: React, MUI, the MUI data grid, router,
forms/validation, charts, i18n, utilities) so growth is attributable. Vite's
default chunk-size warning (500 kB) applies: every chunk fits it.
The router loads pages eagerly — chunking is by vendor, not by route
(see [§6](06-runtime.md)).

## Container & Delivery

A multi-stage Docker build (context = repo root, so `ops/nginx/` travels with the
frontend source): a base stage that installs dependencies with `npm ci`, a build
stage that runs `vite build`, and an `nginx:1.30-alpine` runtime serving `dist/`
with both Nginx configs copied in. There is no test stage: Vitest runs in
`frontend-ci` ahead of the image build, where a failure surfaces as a GitHub
annotation. The dependency tree resolves its peers without `legacy-peer-deps`
(no `.npmrc`) since i18next 26 and react-i18next 17 accept TypeScript 6.

Nginx delivery rules:

- SPA fallback (`try_files ... /index.html`) for client-side routes.
- `/assets/*` cached one year, `Cache-Control: public, immutable` — safe because
  filenames are content-hashed; `index.html` is never cached, so deployments
  propagate immediately.
- gzip for text assets, with one `gzip_types` list in `nginx.conf`: a list in
  `default.conf` would replace it for that server, not extend it.
- **Serve-time API-base rewrite + reverse proxy**: the build bakes the backend
  origin into the bundle; Nginx rewrites it to the frontend host as the bundle is
  served and reverse-proxies `/api/*` and the OAuth2 paths to the backend, making
  browser traffic same-origin. Full mechanism, verification, and fragility notes:
  [ADR-0008 (backend)](../../backend/architecture/09-decisions/adr-0008-serve-time-api-base-rewrite.md).
  `sub_filter_types` lists both JavaScript types: nginx maps `.js` to
  `application/javascript`, but the type is chosen by whatever serves the bytes,
  and a filter matching one type would stop rewriting in silence if it changed.
  Retiring the rewrite means a relative `VITE_API_BASE` and also reworking
  httpClient's blank-value fallback (`/api`), which would send the OAuth2 start to
  `/api/oauth2/authorization/google`, a path no location serves.
- **Plain http to https**: TLS ends at the Koyeb edge, so Nginx only sees http and
  reads the visitor's scheme from `X-Forwarded-Proto`. Only the literal value
  `http` redirects; a request without the header (the image `HEALTHCHECK`, the CI
  contract gate on 127.0.0.1) is served, so a platform that stopped sending it
  would lose the redirect but never loop. Without the redirect, a first plain-http
  visit could be served the whole app and have script injected on the path.
- **Security headers and HSTS** are sent once for every response the image serves,
  and the proxied paths keep only the backend's own:
  [ADR-0011](09-decisions/adr-0011-gating-the-frontend-image-on-its-http-contract.md).
- **Upstream certificate check**: `proxy_ssl_verify on` at server level (nginx's
  default is off, which would accept any certificate on the hop that carries the
  session cookies and OAuth codes). Depth 2, measured 2026-10-15: the API sends
  leaf <- Let's Encrypt YE2 <- ISRG Root YE (cross-signed by ISRG Root X2), and
  Alpine 3.24's bundle trusts X1 and X2 but not Root YE, so the chain verifies at
  depth 2 and fails at nginx's default of 1. A chain that stops verifying answers
  502 on every proxied path, and the error log says "upstream SSL certificate
  verify error".
- **Logout**: only the logout form's POST is proxied. A reload or typed URL would
  get Spring's English confirmation page and a new session; it gets the app shell,
  whose `/logout` route posts the real logout.
- **Locale files** are revalidated on every load (`no-cache`, ETag -> 304): the
  i18n load path carries no version, and without a `Cache-Control` the browser
  applies heuristic freshness and can show raw keys for hours after a deploy. A
  missing file is a 404, not the app shell, so i18next reports it.
- **Images and the favicon** keep one day: stable names, so a long lifetime would
  pin an old picture, and none would leave the lifetime to heuristics.
- **Content Security Policy** on the app shell, the one location every SPA route
  and the GET of `/logout` end in: `'unsafe-inline'` for styles only (MUI/emotion
  injects `<style>` tags at run time), no `'unsafe-eval'` (`config/zodConfig.ts`
  turns off zod's eval probe), `'self'` for everything else because the API, the
  OAuth start and the locale files all go through this host.

## Hosting & CI/CD

The container runs on **Koyeb**, reachable on the project's own domain
(`https://www.smartsupplypro.de`; the apex redirects to the canonical `www` host —
[ADR-0010 (backend)](../../backend/architecture/09-decisions/adr-0010-custom-domain-and-canonical-host.md)).
Two workflows own the frontend:

- **frontend-ci** — audits the shipped dependency tree (gate), lints, runs
  the full Vitest suite, then builds and Trivy-scans the runtime image before
  it can reach Docker Hub.
- **frontend-deploy** — skips merges that changed only test, lint or CI
  files; otherwise deploys by image digest, then waits for the commit's build
  id to appear in the served bundle instead of trusting the platform's own
  status, which stays `healthy` throughout a rolling update and cannot verify
  a release on its own. A failed rollout prints Koyeb's own view of the
  service ([ADR-0010](09-decisions/adr-0010-verifying-frontend-deploys.md)).

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
