# Multi-stage Dockerfile for the Vite/React frontend.
# Build context must be the repo root so ops/nginx configs are accessible alongside frontend source.
# Stages: base (deps) → build (Vite bundle) → runtime (Nginx static server).

# Installs npm dependencies into a cached layer; subsequent stages inherit from here
# rather than re-running npm ci on every source change.
FROM node:24-bookworm-slim AS base
WORKDIR /app

# The CI workflows install this exact npm before running npm ci, so that lockfile
# metadata does not churn between environments. The image build is the artifact
# users receive, so it installs with the same client. 5-frontend-ci.yml passes its
# NPM_VERSION here; the default below only applies to a manual local build. On
# 2026-09-03 the unpinned image ran npm 11.19.0 while CI ran 11.10.1 against one
# lockfile, and the two printed different install warnings.
ARG NPM_VERSION=11.10.1
RUN npm install -g "npm@${NPM_VERSION}" && npm --version

# Build context is repo root, so package files live under frontend/ relative to context.
# The .npmrc travels with them: it carries the peer-resolution setting this tree needs,
# and copying it here means the image build and a developer's install obey one file
# instead of each carrying its own flag. See frontend/.npmrc for what it works around
# and when it can be deleted.
COPY frontend/package*.json frontend/.npmrc ./
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

# Produces the optimised static bundle under /app/dist; nothing else carries forward to the runtime image.
#
# There is no test stage here. BuildKit builds only the stages the target
# depends on, and the chain to the runtime image is base -> build -> runtime,
# so a stage nothing copies from was never built by any pipeline invocation.
# Vitest runs in 5-frontend-ci before the image is built, where its failures
# become GitHub Actions annotations.
FROM base AS build
RUN npm run build

# Minimal Nginx image that serves the static assets — no node_modules, no source, no build tooling.
# Stable line, pinned like every other version in this repository. Measured with
# Trivy on 2026-09-10: nginx:1.27-alpine carried Alpine 3.21.3 with 2 CRITICAL
# and 34 fixed HIGH findings; nginx:1.30-alpine carries Alpine 3.24.1, the same
# generation the backend runtime runs, with 0 CRITICAL and 7 fixed HIGH.
FROM nginx:1.30-alpine AS runtime

# ca-certificates: Alpine ships without a full CA bundle, needed for HTTPS
# proxy_pass to upstream services.
# apk upgrade: the seven remaining findings above are packages the base image
# lags on, not packages without a fix. Alpine 3.24 publishes libuuid 2.42.3-r1
# against libuuid 2.42.1-r0 in the base. The backend runtime stage has carried
# this same upgrade from the start, which is why its image passes the Trivy gate
# while its own base does not. Without it, a scan of this image reports whatever
# the base was built with, however recently the image itself was built.
# Versions are deliberately unpinned, for the reason the comment above gives:
# pinning would freeze the packages this upgrade exists to move, and Alpine
# drops superseded versions from its index within weeks.
# hadolint ignore=DL3018
RUN apk add --no-cache ca-certificates && update-ca-certificates && apk upgrade --no-cache

# Paths are relative to the repo-root build context, not the container filesystem.
COPY ops/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ops/nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

# Koyeb routes traffic to $PORT; 8080 is the value configured in the platform settings.
ENV PORT=8080
EXPOSE 8080

# Shell form is required here: JSON notation has no shell, and the `|| exit 1`
# is what turns a non-zero wget into an unhealthy verdict instead of an error.
# hadolint ignore=DL3025
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O- http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
