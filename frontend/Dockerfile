# =========================
# 1) Base deps (cached)
# =========================
FROM node:20-bullseye-slim AS base
WORKDIR /app

# Install deps with good layer caching
# NOTE: Build context is repo root (.) in CI, so we must copy from frontend/
COPY frontend/package*.json ./
RUN npm ci

# Bring in the rest of the source code
# NOTE: Copy the frontend/ subtree into /app
COPY frontend/ .

# If you use Vite envs at build time, pass them as build args
# @enterprise
# - Default to same-origin `/api` so the SPA hits Nginx (which reverse-proxies to Fly).
# - In Koyeb, you can override this ARG at build time if needed, but `/api` is the stable prod default.
ARG VITE_API_BASE="/api"
ENV VITE_API_BASE=$VITE_API_BASE

# =========================
# 2) Test stage (CI)
# =========================
FROM base AS test
# Only run if you actually have a "test" script; otherwise this is harmless
# Use --run to avoid watch mode (Vitest)
# Allow CI to skip tests here because we run them outside Docker for GitHub annotations
ARG RUN_TESTS=true
RUN if [ "$RUN_TESTS" = "true" ]; then npm run test --if-present -- --run; else echo "Skipping tests in Docker build"; fi

# =========================
# 3) Build stage (prod bundle)
# =========================
FROM base AS build
# Optional: TypeScript sanity (if you keep tsc in your build script)
# RUN npm run typecheck --if-present
RUN npm run build

# =========================
# 4) Runtime (Nginx)
# =========================
FROM nginx:1.27-alpine AS runtime

# Ensure TLS to upstream works (CA bundle for HTTPS proxy_pass)
RUN apk add --no-cache ca-certificates && update-ca-certificates

# Copy Nginx configs from ops/nginx into container
# NOTE: Paths are relative to the build context, do NOT start with "/" but context must be repo root (`.` in CI)
COPY ops/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ops/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy only the built assets — no node_modules, no tests, no sources
COPY --from=build /app/dist /usr/share/nginx/html

# Koyeb/containers best practice: bind to $PORT (we listen on 8080)
ENV PORT=8080
EXPOSE 8080

# Lightweight container healthcheck: index should be reachable
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O- http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
# =========================
