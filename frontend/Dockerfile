# =============================================================================
# Dockerfile (frontend) - the Vite bundle served by nginx
# Usage: frontend-ci.yml builds it with the repository root as context (so
#        ops/nginx is readable beside frontend/) and build args NPM_VERSION,
#        VITE_API_BASE, VITE_BUILD_ID; a local build from the root works with
#        the defaults below.
# Produces: base (npm ci) -> build (vite build into /app/dist) -> runtime, an
#        nginx:1.30-alpine image that serves dist/ as the unprivileged nginx user
#        on port 8080 with ops/nginx/nginx.conf and default.conf.
# Failure mode: a failed npm ci, type check or vite build fails the build stage;
#        nginx config errors surface when the container starts, and the CI
#        contract gate (verify-image-contract.sh) fails the image before push.
# =============================================================================

# Dependencies in their own layer, so a source change does not re-run npm ci.
FROM node:24-bookworm-slim AS base
WORKDIR /app

# The same npm as CI, so one lockfile installs one way everywhere. frontend-ci.yml
# passes its NPM_VERSION; the default applies to a local build only.
ARG NPM_VERSION=11.10.1
RUN npm install -g "npm@${NPM_VERSION}" && npm --version

# Paths are relative to the repository-root context. No .npmrc: the tree resolves
# its peers without legacy-peer-deps.
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

# VITE_ vars are inlined into the bundle at build time; override at --build-arg for non-default targets.
ARG VITE_API_BASE=""
ENV VITE_API_BASE=$VITE_API_BASE
# Build metadata injected by CI; defaults keep local docker builds working.
ARG VITE_BUILD_ID="dev"
ENV VITE_BUILD_ID=$VITE_BUILD_ID
ARG VITE_APP_ENVIRONMENT="Production (Koyeb)"
ENV VITE_APP_ENVIRONMENT=$VITE_APP_ENVIRONMENT

# Only /app/dist carries forward. No test stage: BuildKit skips a stage the target
# does not depend on, so it would never run; Vitest runs in frontend-ci first,
# where its failures become annotations.
FROM base AS build
RUN npm run build

# Static assets only — no node_modules, source or build tooling. The nginx stable
# line, pinned; add_header_inherit in default.conf needs 1.29.3 or later.
FROM nginx:1.30-alpine AS runtime

# ca-certificates: the bundle default.conf verifies the API's certificate with.
# apk upgrade: fixed packages the base image lags on, as in the backend runtime.
# Unpinned on purpose: a pin would freeze them, and Alpine drops old versions.
# hadolint ignore=DL3018
RUN apk add --no-cache ca-certificates && update-ca-certificates && apk upgrade --no-cache

# Paths are relative to the repo-root build context, not the container filesystem.
COPY ops/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ops/nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

# The base image's unprivileged nginx user, numeric so a runtime can verify non-root
# without /etc/passwd; port 8080 needs no privilege. The user must own its temp
# directories under /var/cache/nginx (nginx.conf moves the pid file to /tmp).
RUN chown -R nginx:nginx /var/cache/nginx
USER 101

# Koyeb's port and health check are set to 8080 in the platform settings;
# nginx listens on a fixed 8080 and nothing in the image reads $PORT.
EXPOSE 8080

# Shell form is required here: JSON notation has no shell, and the `|| exit 1`
# is what turns a non-zero wget into an unhealthy verdict instead of an error.
# hadolint ignore=DL3025
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O- http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
