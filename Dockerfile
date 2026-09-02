# ==============================
# Build Stage
# ==============================

# Enterprise build notes:
# - Multi-stage pattern: build with Maven (JDK) and produce a minimal JRE runtime.
# - CI should pass build-time args for traceability (PROFILE, but never runtime secrets).
# - Do NOT copy frontend assets into this image; frontend is built separately.
# - Security posture: run as non-root, do not bake secrets, and prefer runtime secret
#   injection via the host's env file or a secret store; never baked in.
#
# Build-time inputs (examples passed by CI):
#   PROFILE=prod            # build profile (default prod)
#   BUILD_COMMIT=<sha>      # commit recorded in build-info.properties (default unknown)
#
# Runtime is driven by scripts/start.sh which performs wallet decoding and secure startup.

# -----------------------------------------------------------------------------
# 1) Dependency Warmup (optional but good for speed)
#    Copies only pom + .mvn to leverage Docker layer cache for dependencies.
# -----------------------------------------------------------------------------
FROM maven:3.9.11-eclipse-temurin-21 AS deps

# Set working directory in the deps container
WORKDIR /app

# Copy Maven descriptors first to maximize cache hits
COPY pom.xml .
COPY .mvn/ .mvn/

# Download dependencies (skip tests). This layer caches Maven deps.
RUN mvn -q -B -DskipTests dependency:go-offline

# -----------------------------------------------------------------------------
# 2) Build Stage
#    Compiles and packages the Spring Boot app. Tests run in CI already.
# Build-stage CVEs are in Maven system packages and have no upstream fix.
# These stages are discarded after packaging — only the JRE runtime stage is deployed.
# Runtime image: eclipse-temurin:21-jre-alpine (no build tools, minimal attack surface).
# -----------------------------------------------------------------------------
FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /build

# Reuse warmed dependencies from the previous stage
COPY --from=deps /root/.m2 /root/.m2

# Copy backend sources ONLY (never bring in frontend/)
COPY pom.xml .
COPY .mvn/ .mvn/
COPY src/ src/

# Spring profile the container starts under (defaults to prod). This is a
# runtime setting only; the pom declares no Maven build profiles, so nothing is
# selected at package time. Override with:
#   docker build --build-arg PROFILE=prod ...
ARG PROFILE=prod
ENV SPRING_PROFILES_ACTIVE=${PROFILE}

# Commit this image is built from, baked into the jar by Maven rather than set as
# a runtime variable. The deploy asserts what the running jar reports, so the
# value has to originate in the build that produced it.
ARG BUILD_COMMIT=unknown

# Package the application JAR (skip tests here for faster Docker builds)
RUN mvn -q -B -DskipTests -Dbuild.commit=${BUILD_COMMIT} package

# (Optional) Clean Maven cache to keep intermediate layers lean and reduce memory
# pressure on constrained builders. This does not affect the final runtime image.
RUN rm -rf /root/.m2/repository || true     

# -----------------------------------------------------------------------------
# 3) Runtime Stage (JRE only, non-root)
#    No build tools, no caches, no secrets in layers.
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime

# Set working directory for runtime files (wallet + jar)
WORKDIR /app

# Create non-root user — container security best practice
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# unzip: extracts Oracle Wallet; coreutils: provides base64 decoding for wallet secrets 
RUN apk add --no-cache unzip coreutils && apk upgrade --no-cache

# ==========================================================
# Metadata for image traceability and maintainability
# ==========================================================

LABEL maintainer="https://github.com/Keglev"
LABEL version="1.0.0"
LABEL description="Smart Supply Pro Inventory Microservice"
LABEL org.opencontainers.image.source="https://github.com/Keglev/inventory-service"


# ==========================================================
# Application Setup
# ==========================================================

# Startup script (handles wallet decode + JVM flags + app launch)
COPY --chown=appuser:appgroup --chmod=0755 scripts/start.sh /app/start.sh

# Copy packaged JAR from build stage with correct ownership
COPY --from=build --chown=appuser:appgroup /build/target/*.jar /app/

# Normalize to /app/app.jar (must run as root before switching user)
RUN set -eux; \
    JAR="$(ls -1 /app/*.jar | head -n1)"; \
    mv "$JAR" /app/app.jar; \
    chown appuser:appgroup /app/app.jar

# Set correct file ownership for the non-root user
RUN chown -R appuser:appgroup /app

# Drop privileges - must be last
USER appuser

# Startup delegates to start.sh: wallet decode + JVM flags + Spring Boot launch
CMD ["/app/start.sh"]

# ==========================================================
# HEALTHCHECK & PORT EXPOSURE
# ==========================================================

# Health probing is defined in docker/docker-compose.prod.yml — HEALTHCHECK omitted to keep the image lean
EXPOSE 8081

