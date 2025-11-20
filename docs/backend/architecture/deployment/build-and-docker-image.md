[⬅️ Back to Deployment Index](./index.html)

# Build & Docker Image

## Overview

The backend is compiled using **Maven**, packaged as a **Spring Boot JAR**, and then containerized using a **multi-stage Docker build** for optimization and security.

```
Source Code → Maven Compile → Tests → JAR Package → Docker Image → Registry
```

This document covers:
- Maven build pipeline configuration
- Dockerfile structure and multi-stage strategy
- Container entrypoint and startup
- Docker image validation

## Maven Build Pipeline

### Project Configuration: `pom.xml`

The `pom.xml` defines the complete build process:

```xml
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>inventory-service</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  
  <!-- Spring Boot parent: includes plugins for build, test, Docker -->
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
  </parent>
  
  <!-- Dependencies: Spring, OAuth2, Oracle, TestContainers, etc. -->
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!-- Oracle JDBC -->
    <dependency>
      <groupId>com.oracle.database.jdbc</groupId>
      <artifactId>ojdbc11</artifactId>
    </dependency>
    <!-- Test dependencies -->
  </dependencies>
  
  <!-- Build plugins -->
  <build>
    <plugins>
      <!-- Spring Boot Maven Plugin: builds fat JAR with embedded Tomcat -->
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
      <!-- JaCoCo: test coverage instrumentation -->
      <plugin>
        <groupId>org.jacoco</groupId>
        <artifactId>jacoco-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
```

### Build Lifecycle Stages

When you run `mvn clean verify`:

| Stage | Command | What Happens | Output |
|-------|---------|--------------|--------|
| **Clean** | `clean` | Deletes previous build artifacts from `/target` | Clean slate |
| **Compile** | `compile` | Compiles source code to bytecode | `.class` files in `/target/classes` |
| **Test Compile** | `test-compile` | Compiles test code | Test `.class` files in `/target/test-classes` |
| **Test** | `test` | Runs unit tests (JUnit, Mockito) | Test results, code coverage (JaCoCo) |
| **Integration Test** | `integration-test` | Runs integration tests (TestContainers, @SpringBootTest) | Live database tests |
| **Package** | `package` | Builds JAR file with all dependencies | `/target/inventory-service-0.0.1-SNAPSHOT.jar` |
| **Verify** | `verify` | Runs post-integration-test checks (coverage thresholds, etc.) | Build success/failure |

### Maven Profiles

Spring profiles control which `application-{profile}.yml` gets activated:

```xml
<profiles>
  <!-- Local development (default, no profile specified) -->
  <profile>
    <id>dev</id>
    <activation>
      <activeByDefault>true</activeByDefault>
    </activation>
  </profile>
  
  <!-- Testing profile: H2 in-memory, debug logging -->
  <profile>
    <id>test</id>
    <properties>
      <maven.test.skip>false</maven.test.skip>
    </properties>
  </profile>
  
  <!-- Production profile: Oracle, INFO logging -->
  <profile>
    <id>prod</id>
  </profile>
</profiles>
```

Activate via: `-Dspring.profiles.active=prod` or `SPRING_PROFILES_ACTIVE` environment variable.

### Dependency Management

Key dependencies controlled in `pom.xml`:

```
Spring Framework (Web, Data, Security)
  ├── spring-boot-starter-web (REST APIs, Tomcat)
  ├── spring-boot-starter-data-jpa (Entity management)
  ├── spring-boot-starter-security (Authentication/authorization)
  └── spring-security-oauth2-client (Google SSO)

Data & Persistence
  ├── spring-boot-starter-data-jpa (ORM layer)
  ├── org.hibernate (JPA implementation)
  └── oracle.database.jdbc (JDBC driver)

Testing
  ├── spring-boot-starter-test (JUnit, Mockito, AssertJ)
  ├── testcontainers (Docker-based integration tests)
  └── com.h2database (In-memory testing database)

Build Tools
  ├── spring-boot-maven-plugin (Fat JAR, Docker support)
  ├── jacoco-maven-plugin (Code coverage)
  └── maven-shade-plugin (Optional: fat JAR creation)
```

**Note:** Oracle JDBC driver (`ojdbc11.jar`) is bundled in the Docker image and also available at `/lib/ojdbc11.jar` in the repository.

## Docker Build: Multi-Stage Approach

### Dockerfile Structure

```dockerfile
# ============================================================================
# STAGE 1: BUILD (Compile Maven project)
# ============================================================================
FROM eclipse-temurin:17-jdk-jammy as builder

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
COPY pom.xml .

# Build the application
# ARG PROFILE=prod allows override: docker build --build-arg PROFILE=dev
ARG PROFILE=prod
RUN chmod +x mvnw && \
    ./mvnw clean package -DskipTests -Dspring.profiles.active=${PROFILE}

# ============================================================================
# STAGE 2: RUNTIME (Minimal image with JAR only)
# ============================================================================
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Copy compiled JAR from builder stage (not entire /target directory)
COPY --from=builder /app/target/inventory-service-*.jar app.jar

# Copy start script and scripts
COPY start.sh .
RUN chmod +x start.sh

# Copy Oracle Wallet (mounted at runtime via volumes/env)
COPY oracle_wallet oracle_wallet

# Expose port (8080 or 8081 depending on config)
EXPOSE 8080

# Health check: curl /health endpoint every 30 seconds
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Entrypoint: Start the application
ENTRYPOINT ["./start.sh"]
```

### Why Multi-Stage?

**Stage 1 (Builder):**
- Contains Maven, source code, test dependencies
- Compiles code, runs tests, produces JAR
- Size: ~1.2 GB (Java SDK + Maven + dependencies)
- **Discarded after build** – not in final image

**Stage 2 (Runtime):**
- Contains only Java Runtime (JRE, not JDK)
- Copies JAR from Stage 1
- Size: ~400 MB (JRE + JAR only)
- **This is deployed to production**

**Benefit:** Final image is **~70% smaller**, reducing deployment time and storage.

### Build Arguments

```bash
# Build with prod profile (default)
docker build -t inventory-service:latest .

# Build with dev profile (for local testing)
docker build --build-arg PROFILE=dev -t inventory-service:dev .

# Build with custom tag
docker build --build-arg PROFILE=prod -t ckbuzin/inventory-service:a1b2c3d4 .
```

## Container Entrypoint: `start.sh`

The `start.sh` script launches the Spring Boot application with environment variables:

```bash
#!/bin/bash
set -e

echo "Starting Smart Supply Pro Inventory Service..."
echo "Profile: ${SPRING_PROFILES_ACTIVE:-prod}"
echo "Database: ${DB_URL:-oracle}"

# Export environment variables for Spring Boot
export SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-prod}
export TNS_ADMIN=${TNS_ADMIN:-/app/oracle_wallet}
export JAVA_OPTS="-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} -Xmx512m -Xms256m"

# Start the application
exec java -jar app.jar
```

Key aspects:

- **Profile selection:** Defaults to `prod` if `SPRING_PROFILES_ACTIVE` not set
- **Oracle Wallet path:** Set to `/app/oracle_wallet` (mounted from Fly.io secrets)
- **JVM memory:** Tuned for container constraints (256-512 MB heap)
- **exec** keyword: Replace shell process with Java (proper signal handling)

## Image Contents Verification

After Docker build, verify the image contains what we expect:

```bash
# Inspect image layers and size
docker history ckbuzin/inventory-service:latest

# Check what's inside
docker run --rm ckbuzin/inventory-service:latest sh -c "
  echo '=== App JAR ===' && ls -lh /app/app.jar
  echo '=== Start Script ===' && ls -lh /app/start.sh
  echo '=== Oracle Wallet ===' && ls /app/oracle_wallet
  echo '=== No Source Code ===' && ls /app/src 2>&1 || echo 'Confirmed: src/ not in image'
  echo '=== No Test Files ===' && ls /app/target 2>&1 || echo 'Confirmed: target/ not in image'
"
```

Expected output:
```
=== App JAR ===
-rw-r--r--  1 root root  82M Nov 20 10:30 /app/app.jar

=== Start Script ===
-rwxr-xr-x  1 root root 612B Nov 20 10:30 /app/start.sh

=== No Source Code ===
Confirmed: src/ not in image

=== No Test Files ===
Confirmed: target/ not in image
```

This proves the image is **production-optimized** and doesn't contain unnecessary files.

## Docker Build in CI Pipeline

In `1-ci-test.yml`, the Docker build step:

```yaml
- name: Build Docker image
  run: |
    docker build --no-cache \
      --build-arg PROFILE=prod \
      -t $IMAGE_REPO:latest \
      -t $IMAGE_REPO:${IMAGE_TAG_SHA} \
      .
```

Key flags:

- **`--no-cache`** – Rebuild all layers (ensures fresh build, no stale cache)
- **`--build-arg PROFILE=prod`** – Pass prod profile to Dockerfile
- **`-t TAG1 -t TAG2`** – Tag with both `latest` and commit SHA

After build, the image is:
1. Inspected for contents
2. Pushed to Docker Hub
3. Scanned by Trivy for vulnerabilities

## Troubleshooting

### Build Fails: "Maven command not found"
- Ensure `mvnw` (Maven wrapper) is executable and in repo root
- Check `pom.xml` syntax (XML well-formed)
- Review dependency resolution: `mvn dependency:tree`

### Docker Build Fails: "Dockerfile not found"
- Verify `Dockerfile` exists in repo root or BACKEND_DIR
- Check file is named exactly `Dockerfile` (case-sensitive on Linux)
- Ensure it's not in `.dockerignore`

### Image Push Fails: "Unauthorized"
- Verify Docker Hub credentials in `DOCKER_USERNAME`, `DOCKER_PASSWORD` secrets
- Check user has push permissions to repository
- Ensure image tag matches format: `username/repo:tag`

### Image Size Too Large
- Check `docker history` to find bloated layers
- Ensure multi-stage build is working (Stage 1 should be discarded)
- Remove unnecessary dependencies from `pom.xml`
- Clean up cached Maven dependencies: `.dockerignore` should include `.m2`

### Trivy Scan Blocks Deployment
- Review scan report for HIGH/CRITICAL CVEs
- Update vulnerable dependencies in `pom.xml`
- Run locally: `trivy image ckbuzin/inventory-service:latest`
- See [CI/CD & Docs Pipeline](./ci-cd-and-docs-pipeline.html#security-gates)

## Related Documentation

- **[Deployment Index](./index.html)** – Overview of entire deployment pipeline
- **[Fly.io Infrastructure](./flyio-infrastructure.html)** – How image is used in production
- **[CI/CD & Docs Pipeline](./ci-cd-and-docs-pipeline.html)** – GitHub Actions build automation
- **[Resources & Configuration](../resources/index.html)** – Spring Boot configuration files

---

**Last Updated:** November 2025  
**Audience:** Backend developers, DevOps engineers, build system maintainers
