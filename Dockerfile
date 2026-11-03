# =============================================================================
# Dockerfile - the backend image: the Spring Boot jar on a JRE-only runtime
# Usage: backend-docker.yml builds it from the repository root with
#        --build-arg BUILD_COMMIT=<sha>; a local `docker build .` records
#        "unknown" as the commit.
# Produces: an eclipse-temurin:21-jre-alpine image that runs scripts/start.sh as
#        the non-root appuser on port 8081. start.sh unpacks the Oracle wallet
#        from the environment at run time, so no secret sits in a layer; the
#        frontend is a separate image.
# Failure mode: a compile or packaging error fails the build stage, and so does
#        a target/ with more than one *.jar (the mv below); the image is not
#        produced.
# =============================================================================

# Stage deps: pom and .mvn only, so the dependency layer survives source edits.
# Build JDK = runtime JDK 21 (runtime stage, <java.version>). Dependabot ignores
# this floating tag: it swapped the JDK suffix to Temurin 26 (.github/dependabot.yml).
FROM maven:3-eclipse-temurin-21 AS deps

WORKDIR /app

COPY pom.xml .
COPY .mvn/ .mvn/

RUN mvn -q -B -DskipTests dependency:go-offline

# Stage build: packages the jar with tests skipped; backend-ci, which a
# backend-docker.yml build follows, runs them. Neither Maven stage ships: the
# runtime stage copies the jar alone.
FROM maven:3-eclipse-temurin-21 AS build
WORKDIR /build

COPY --from=deps /root/.m2 /root/.m2

# Backend sources only, never frontend/.
COPY pom.xml .
COPY .mvn/ .mvn/
COPY src/ src/

# Commit this image is built from, baked into the jar by Maven rather than set as
# a runtime variable. The deploy asserts what the running jar reports, so the
# value has to originate in the build that produced it.
ARG BUILD_COMMIT=unknown

RUN mvn -q -B -DskipTests -Dbuild.commit=${BUILD_COMMIT} package

# Name the jar in this discarded stage: a rename in the runtime stage stores it twice.
# The repackage leaves one *.jar (the original ends in .jar.original); with two, mv
# fails on a non-directory target instead of taking whichever sorted first.
RUN set -eux; \
    mv /build/target/*.jar /build/app.jar

# Stage runtime: JRE only, non-root; no build tools, caches or secrets in a layer.
FROM eclipse-temurin:21-jre-alpine AS runtime

# Holds the jar, start.sh and, at run time, the unpacked wallet.
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# unzip extracts the wallet, coreutils supplies base64 for it. Unpinned on purpose:
# Alpine drops superseded packages within weeks, so a pin breaks the next build and
# would freeze the packages the upgrade on this line exists to move.
# hadolint ignore=DL3018
RUN apk add --no-cache unzip coreutils && apk upgrade --no-cache

LABEL maintainer="https://github.com/Keglev"
LABEL description="Smart Supply Pro Inventory Microservice"
LABEL org.opencontainers.image.source="https://github.com/Keglev/inventory-service"

# start.sh decodes the wallet, sets the JVM flags and launches the jar.
COPY --chown=appuser:appgroup --chmod=0755 scripts/start.sh /app/start.sh

COPY --from=build --chown=appuser:appgroup /build/app.jar /app/app.jar

# start.sh unpacks the wallet into /app at run time, so the non-root user must
# own the directory itself; the files in it already carry --chown.
RUN chown appuser:appgroup /app

# Drop privileges last. A name, not a uid: no host maps uids into this container,
# and the name stays in step with the adduser above.
# hadolint ignore=DL3066
USER appuser

CMD ["/app/start.sh"]

# No HEALTHCHECK: docker/docker-compose.prod.yml defines the probe.
EXPOSE 8081

