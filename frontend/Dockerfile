# Multi-stage Dockerfile for the Vite/React frontend.
# Build context must be the repo root so ops/nginx configs are accessible alongside frontend source.
# Stages: base (deps) → test (CI validation) → build (Vite bundle) → runtime (Nginx static server).

# Installs npm dependencies into a cached layer; subsequent stages inherit from here
# rather than re-running npm ci on every source change.
FROM node:22-bullseye-slim AS base
WORKDIR /app

# Build context is repo root, so package files live under frontend/ relative to context.
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/ .

# VITE_ vars are inlined into the bundle at build time; override at --build-arg for non-default targets.
ARG VITE_API_BASE=""
ENV VITE_API_BASE=$VITE_API_BASE

# Runs the test suite; decoupled from build so CI can fail fast without tainting the build cache.
# Pass --build-arg RUN_TESTS=false when tests run outside Docker (e.g. for GitHub Actions annotations).
FROM base AS test
ARG RUN_TESTS=true
RUN if [ "$RUN_TESTS" = "true" ]; then npm run test --if-present -- --run; else echo "Skipping tests in Docker build"; fi

# Produces the optimised static bundle under /app/dist; nothing else carries forward to the runtime image.
FROM base AS build
RUN npm run build

# Minimal Nginx image that serves the static assets — no node_modules, no source, no build tooling.
FROM nginx:1.27-alpine AS runtime

# Alpine ships without a full CA bundle; needed for HTTPS proxy_pass to upstream services.
RUN apk add --no-cache ca-certificates && update-ca-certificates

# Paths are relative to the repo-root build context, not the container filesystem.
COPY ops/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ops/nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

# Koyeb routes traffic to $PORT; 8080 is the value configured in the platform settings.
ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O- http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
