# ==============================
# Build Stage
# ==============================

# /**
#  * Use Maven with Eclipse Temurin JDK 17 to build the Spring Boot application.
#  * This stage compiles the code and packages the JAR.
#  *# =============================================================================
# Smart Supply Pro — Inventory Microservice (Spring Boot)
# Dockerfile (Multi-Stage, Production-oriented)
#
# Objectives
# - Direct-to-prod image (default profile = prod). No dev profile required.
# - Multi-stage build: compile with Maven, run on a slim JRE only.
# - Strict separation: NEVER copy the frontend/ tree into the backend image.
# - Security: do not bake secrets; run as non-root.
# - Operability: preserve compatibility with start.sh (wallet is decoded at runtime).
#
# Build-time inputs (CI passes these via --build-arg):
#   PROFILE=prod            # build profile (default prod)
#   ORACLE_WALLET_B64=...   # accepted for CI parity; NOT used at build time
#
# Runtime is driven by start.sh:
#   - Defaults SPRING_PROFILES_ACTIVE=prod
#   - Requires ORACLE_WALLET_B64 and ORACLE_WALLET_PASSWORD at runtime
#   - Sets SERVER_PORT (defaults to 8081)
# =============================================================================


# -----------------------------------------------------------------------------
# 1) Dependency Warmup (optional but good for speed)
#    Copies only pom + .mvn to leverage Docker layer cache for dependencies.
# -----------------------------------------------------------------------------
FROM maven:3.9.11-eclipse-temurin-17 AS deps

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
# -----------------------------------------------------------------------------
FROM maven:3.9.11-eclipse-temurin-17 AS build
WORKDIR /build

# Reuse warmed dependencies from the previous stage
COPY --from=deps /root/.m2 /root/.m2

# Copy backend sources ONLY (never bring in frontend/)
COPY pom.xml .
COPY .mvn/ .mvn/
COPY src/ src/

# Build profile (defaults to prod). You can still override:
#   docker build --build-arg PROFILE=prod ...
ARG PROFILE=prod
ENV SPRING_PROFILES_ACTIVE=${PROFILE}

# Package the application JAR (skip tests here for faster Docker builds)
RUN mvn -q -B -DskipTests -P ${PROFILE} package

# (Optional) Clean Maven cache to keep intermediate layers lean and reduce memory
# pressure on constrained builders. This does not affect the final runtime image.
RUN rm -rf /root/.m2/repository || true     

# -----------------------------------------------------------------------------
# 3) Runtime Stage (JRE only, non-root)
#    No build tools, no caches, no secrets in layers.
# -----------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine AS runtime

# Set working directory for runtime files (wallet + jar)
WORKDIR /app

# /**
#  * Create non-root user to follow container security best practices.
#  */
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# /**
#  * Install required system utilities:
#  * - unzip: to extract Oracle Wallet
#  * - coreutils: for base64 decoding
#  */
RUN apk add --no-cache unzip coreutils && apk upgrade --no-cache

# Set correct file ownership for the non-root user
RUN chown -R appuser:appgroup /app

# Use non-root user for the rest of the container operations
USER appuser


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

# /**
#  * Copy the startup script with correct ownership and permissions in one step.
#  * Using BuildKit’s --chmod/--chown avoids a separate chmod RUN that can fail under non-root.
#  */
COPY --chown=appuser:appgroup --chmod=0755 start.sh /app/start.sh

# /**
#  * Copy the built application JAR from the build stage.
#  * Normalize the final path to /app/app.jar as expected by start.sh.
#  * We copy via wildcard to avoid hardcoding the artifact version.
#  */
COPY --from=build /app/target/*.jar /app/
RUN set -eux; \
    JAR="$(ls -1 /app/*.jar | head -n1)"; \
    mv "$JAR" /app/app.jar; \
    chown appuser:appgroup /app/app.jar

# Set correct file ownership for the non-root user (covers /app and future wallet dir)
RUN chown -R appuser:appgroup /app

# Drop privileges
USER appuser

# /**
#  * Define the startup command: extract Oracle wallet and launch Spring Boot.
#  * (start.sh defaults SPRING_PROFILES_ACTIVE=prod and SERVER_PORT=8081)
#  */
CMD ["/app/start.sh"]

# ==========================================================
# HEALTHCHECK & PORT EXPOSURE
# ==========================================================

# /**
#  * Healthcheck endpoint must match the app’s actual mapping.
#  * For Spring Boot Actuator defaults: /actuator/health on SERVER_PORT (8081 here).
#  * Health probing is handled by Fly.io (fly.toml). Dockerfile HEALTHCHECK
#  * is optional and ignored by Fly. We omit it here to keep the image lean.
#  */

EXPOSE 8081

