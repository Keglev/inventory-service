<a id="top"></a>

[⬅️ Back to Performance Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Build & deployment (delivery)

This page focuses on what happens *after* `vite build`: how the SPA is served and why that matters for performance.

## 1) Build pipeline

Frontend build commands:

- `npm run build` → `tsc -b` then `vite build`

Vite outputs content-hashed static assets under `dist/`, typically including:

- `index.html` (app shell)
- `/assets/*` (hashed JS/CSS chunks)

## 2) Container delivery model

The frontend has a dedicated multi-stage Docker build:

1. Node stage installs deps (`npm ci`)
2. Optional test stage (`vitest --run`)
3. Build stage runs `vite build`
4. Runtime stage serves `dist/` with Nginx

## 3) Nginx: SPA fallback + API reverse proxy

Nginx is configured to:

- serve static assets
- apply SPA routing fallback (`try_files ... /index.html`)
- reverse-proxy same-origin requests:
  - `/api/*` → backend
  - `/oauth2/*` and `/logout` → backend

This enables a production setup where the SPA can call `/api` without hardcoding a backend origin.

## 4) Static asset caching rules

Delivery strategy:

- Cache `/assets/*` for 1 year with `Cache-Control: public, immutable`.
  - This is safe because filenames are content-hashed.
- Do not cache `index.html`.
  - This ensures new deployments are picked up quickly.

Why it matters:

- Returning users re-download only the changed chunks.
- The app becomes much more resilient under load (less bandwidth and fewer asset requests).

## 5) Compression

Nginx gzip is enabled for text assets (JS/CSS/JSON/SVG). This reduces transfer size and improves first-load time on slower connections.

---

[Back to top](#top)
