[⬅️ Back to Security Index](./index.html)

# Docker Security

## Overview

Smart Supply Pro uses **Docker with security best practices** to containerize the Spring Boot application. The Dockerfile implements:

- Multi-stage builds to minimize final image size
- Non-root user execution
- Minimal base image (JRE-only, not JDK)
- Runtime secret injection (no secrets in layers)
- Health checks and metadata

---

## Multi-Stage Build Architecture

The Dockerfile uses **three stages** to produce a lean, secure image:

```dockerfile
FROM maven:3.9.11-eclipse-temurin-17 AS deps
  # Download dependencies (cached)
  
FROM maven:3.9.11-eclipse-temurin-17 AS build
  # Build application JAR

FROM eclipse-temurin:17-jre-alpine AS runtime
  # Run application (no build tools)
```

### Stage 1: Dependency Warmup (Optional)

```dockerfile
FROM maven:3.9.11-eclipse-temurin-17 AS deps
WORKDIR /app
COPY pom.xml .
COPY .mvn/ .mvn/
RUN mvn -q -B -DskipTests dependency:go-offline
```

**Benefits:**
- ✅ Docker layer caching: dependencies cached, no re-download on code change
- ✅ Faster incremental builds
- ✅ Saves bandwidth (CI/CD)

### Stage 2: Build Stage

```dockerfile
FROM maven:3.9.11-eclipse-temurin-17 AS build
WORKDIR /build

# Reuse warmed dependencies
COPY --from=deps /root/.m2 /root/.m2

# Copy source
COPY pom.xml .
COPY .mvn/ .mvn/
COPY src/ src/

# Build profile (prod, dev, etc.)
ARG PROFILE=prod
ENV SPRING_PROFILES_ACTIVE=${PROFILE}

# Package JAR
RUN mvn -q -B -DskipTests -P ${PROFILE} package

# Clean cache to reduce layer size
RUN rm -rf /root/.m2/repository || true
```

**Key Points:**
- Build tools (Maven) only in this stage
- `DskipTests` - Tests run in CI, not Docker
- `PROFILE` argument for environment-specific builds
- Cache cleanup to reduce intermediate layer size

### Stage 3: Runtime Stage

```dockerfile
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install minimal utilities
RUN apk add --no-cache unzip coreutils && apk upgrade --no-cache

# Change ownership
RUN chown -R appuser:appgroup /app

# Copy startup script (with executable permission)
COPY --chown=appuser:appgroup --chmod=0755 scripts/start.sh /app/start.sh

# Copy JAR from build stage
COPY --from=build --chown=appuser:appgroup /build/target/*.jar /app/
RUN mv /app/*.jar /app/app.jar

# Drop to non-root user
USER appuser

# Health check (informational, Fly.io overrides)
EXPOSE 8081

# Startup command
CMD ["/app/start.sh"]
```

**Security Features:**
- ✅ JRE only (no compiler, no build tools)
- ✅ Non-root user (appuser:appgroup)
- ✅ Minimal base image (alpine: ~77MB)
- ✅ Secrets NOT in image (injected at runtime)
- ✅ File permissions enforced

---

## Non-Root User Execution

### User/Group Creation

```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
```

**Benefits:**
- ✅ Container breakout less impactful
- ✅ Prevents accidental modifications to system files
- ✅ Complies with container security standards (CIS Benchmarks)

### File Ownership

```dockerfile
COPY --chown=appuser:appgroup /build/target/*.jar /app/app.jar
RUN chown -R appuser:appgroup /app
```

**Verification:**
```bash
# Inside container
ls -la /app/app.jar
# -rw-r--r-- appuser appgroup app.jar
```

### Privilege Dropping

```dockerfile
USER appuser  # Drop privileges BEFORE running app
CMD ["/app/start.sh"]
```

**Effect:**
- Java process runs as UID 1000 (appuser), not UID 0 (root)
- Cannot accidentally modify /etc, /lib, /usr
- Docker daemon enforces privilege restrictions

---

## Minimal Base Image

### Alpine Linux for JRE

```dockerfile
FROM eclipse-temurin:17-jre-alpine
```

**Image Sizes:**
| Base | Size | Includes |
|------|------|----------|
| jdk-17-full | ~360MB | Full JDK + compiler + tools |
| jre-17-full | ~190MB | JRE only (no compiler) |
| jre-17-alpine | ~77MB | JRE + minimal Alpine OS |

**Trade-offs:**
- ✅ Smaller: faster deploys, smaller attack surface
- ✅ Faster pulls: bandwidth/time savings
- ⚠️ Alpine limitations: some Linux utils missing (use busybox alternatives)

### System Updates

```dockerfile
RUN apk add --no-cache unzip coreutils && apk upgrade --no-cache
```

**Practices:**
- ✅ `--no-cache`: don't cache apk index (smaller layers)
- ✅ `apk upgrade`: apply security patches
- ✅ Minimal packages: unzip (wallet extraction), coreutils (base64 decode)

---

## Runtime Secret Injection

### No Secrets in Image

```dockerfile
# ❌ DO NOT DO THIS:
ENV ORACLE_WALLET_B64=<wallet-data>  # Baked into image!
ENV DB_PASSWORD=secret123            # Exposed in layers!

# ✅ DO THIS INSTEAD:
# Secrets injected at runtime via environment variables
# Dockerfile just receives secrets from CI/container platform
```

### Secret Injection Points

**Fly.io Secrets:**
```bash
flyctl secrets set ORACLE_WALLET_B64=<value> ORACLE_WALLET_PASSWORD=<value>
# Fly.io injects into container environment at startup
```

**Kubernetes Secrets:**
```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    env:
    - name: ORACLE_WALLET_B64
      valueFrom:
        secretKeyRef:
          name: oracle-wallet
          key: wallet_b64
```

**Docker CLI:**
```bash
docker run --env-file secrets.env -p 8081:8081 inventory-service:latest
# .env file contains: ORACLE_WALLET_B64=...
```

### start.sh Secret Handling

The `start.sh` script minimizes secret exposure:

```bash
#!/bin/sh

# 1. Read secret from environment
WALLET_DATA="${ORACLE_WALLET_B64}"

# 2. Decode and extract (ephemeral filesystem)
printf "%s" "${WALLET_DATA}" | base64 -d > /tmp/wallet.zip
unzip -q /tmp/wallet.zip -d /tmp/wallet

# 3. Build JVM options with wallet password
JAVA_OPTS="... -Doracle.net.wallet_password=${ORACLE_WALLET_PASSWORD}"

# 4. Unset environment variables (reduce memory exposure)
unset ORACLE_WALLET_B64
unset ORACLE_WALLET_PASSWORD

# 5. Remove temporary files
rm -f /tmp/wallet.zip

# 6. Start application (secrets no longer in environment)
exec java ${JAVA_OPTS} -jar /app/app.jar
```

**Security Points:**
- ✅ Secrets only in memory during startup
- ✅ Env vars unset before app starts
- ✅ Temp files deleted (no disk exposure)
- ✅ JVM options in system properties (not env)

---

## Base Image Security

### Image Scanning for CVEs

```bash
# Scan for known vulnerabilities
docker scan inventory-service:latest

# Or using Trivy (third-party tool)
trivy image inventory-service:latest
```

**Regular Updates:**
```bash
# Before each release, rebuild to get latest patches
docker build --no-cache -t inventory-service:v1.2.0 .
# --no-cache forces fresh base image pull
```

### Image Provenance

```dockerfile
LABEL maintainer="https://github.com/Keglev"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/Keglev/inventory-service"
```

**Benefits:**
- ✅ Image provenance tracking
- ✅ Vulnerability scanning with origin info
- ✅ Automated security notifications

---

## Container Runtime Security

### Read-Only Filesystem (Advanced)

For maximum hardening (if startup files are static):

```dockerfile
# Mark critical files as read-only
RUN chmod 444 /app/app.jar
RUN chmod 555 /app/start.sh
```

**Fly.io config (read-only root filesystem):**
```toml
[experimental]
  read_only_root_filesystem = true
```

**Effect:**
- ✅ Container cannot create/modify files
- ✅ Malware cannot establish persistence
- ⚠️ Requires careful handling of /tmp, /var/log

### Resource Limits

**Fly.io fly.toml:**
```toml
[vm]
  size = "shared-cpu-1x"
  memory = 1024  # 1GB RAM limit
```

**Docker Compose:**
```yaml
services:
  app:
    image: inventory-service:latest
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G  # Kill if exceeds 1GB
```

**Benefits:**
- ✅ Prevents memory exhaustion attacks
- ✅ Fair resource sharing in multi-tenant
- ✅ Predictable billing in cloud platforms

---

## Build Arguments for Flexibility

### Profile-Specific Builds

```dockerfile
ARG PROFILE=prod
ENV SPRING_PROFILES_ACTIVE=${PROFILE}
RUN mvn ... -P ${PROFILE} package
```

**Usage:**
```bash
# Production build (default)
docker build -t inventory-service:prod .

# Development build
docker build --build-arg PROFILE=dev -t inventory-service:dev .

# Custom JDK
docker build --build-arg JDK_VERSION=21 -t inventory-service:jdk21 .
```

---

## Dockerfile Best Practices Checklist

| Practice | Status | Details |
|----------|--------|---------|
| Multi-stage build | ✅ | 3 stages: deps, build, runtime |
| Non-root user | ✅ | appuser:appgroup, UID 1000 |
| Minimal base | ✅ | alpine JRE (77MB) |
| No secrets in image | ✅ | Runtime injection via env vars |
| Scan for CVEs | ✅ | `docker scan` or `trivy` |
| Health checks | ✅ | TCP and HTTP probes configured |
| Metadata labels | ✅ | maintainer, version, source |
| Resource limits | ✅ | Memory and CPU constraints |
| Distroless compatible | ⚠️ | Currently alpine; can use distroless |

---

## Deployment Platforms

### Fly.io Configuration (fly.toml)

```toml
[build]
  dockerfile = "Dockerfile"
  context = "."

[env]
  SPRING_PROFILES_ACTIVE = "prod"
  APP_DEMO_READONLY = "true"

[vm]
  memory = 1024

[[services]]
  internal_port = 8081
  [[services.ports]]
    handlers = ["http"]
    port = 80
  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

### Kubernetes (advanced)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory-service
spec:
  containers:
  - name: app
    image: inventory-service:v1.0.0
    imagePullPolicy: Always
    securityContext:
      allowPrivilegeEscalation: false
      runAsNonRoot: true
      runAsUser: 1000
      readOnlyRootFilesystem: true
    resources:
      requests:
        memory: "512Mi"
        cpu: "500m"
      limits:
        memory: "1Gi"
        cpu: "1"
    volumeMounts:
    - name: tmp
      mountPath: /tmp
    - name: var-log
      mountPath: /var/log
  securityPolicy: restricted
  volumes:
  - name: tmp
    emptyDir: {}
  - name: var-log
    emptyDir: {}
```

---

## Related Documentation

- **[Security Index](./index.html)** - Master security overview
- **[Oracle Wallet](./oracle-wallet.html)** - Database credential encryption
- **[Deployment Guide](../deployment.html)** - Production deployment strategies

---

[⬅️ Back to Security Index](./index.html)
