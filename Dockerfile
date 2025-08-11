# ==============================
# Build Stage
# ==============================

# /**
#  * Use Maven with Eclipse Temurin JDK 17 to build the Spring Boot application.
#  * This stage compiles the code and packages the JAR.
#  */
FROM maven:3.9.9-eclipse-temurin-17 AS build

# Set Spring profile used during build (default: prod)
ARG PROFILE=prod
ENV SPRING_PROFILES_ACTIVE=${PROFILE}


# Set working directory in the build container
WORKDIR /app

# Copy all project files into the container
COPY . .

# Build the Spring Boot application, skipping tests to speed up container build
RUN mvn clean package -DskipTests \
    #  remove Maven cache after build
    && rm -rf /root/.m2/repository   \ 
    #  remove source JARs 
    && rm -rf target/*-sources.jar   \ 
    #  remove Javadoc JARs  
    && rm -rf target/*-javadoc.jar   \
    #  remove original pre-repackaged JAR   
    && rm -rf target/original-*.jar      

# ==============================
# Runtime Stage
# ==============================

# /**
#  * Use lightweight JRE Alpine image for minimal runtime footprint.
#  * This stage handles running the already-built app in a secure container.
#  */
FROM eclipse-temurin:17-jre-alpine
# WARNING. 1 known high vulnerability (false positive for non-GUI apps)
# Safe for portfolio and internal use. Will switch to jammy or distrolless in future.

# ==========================================================
# SYSTEM SETUP
# ==========================================================

# /**
#  * Create non-root user to follow container security best practices.
#  */
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# /**
#  * Install required system utilities:
#  * - unzip: to extract Oracle Wallet
#  * - coreutils: for base64 decoding
#  */
RUN apk add --no-cache unzip coreutils

# Set working directory for runtime files (wallet + jar)
WORKDIR /app

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
#  * Copy the built application JAR from the build stage.
#  */
COPY --from=build /app/target/inventory-service-0.0.1-SNAPSHOT.jar app.jar

# /**
#  * Copy the startup script with correct ownership and permissions in one step.
#  * Using BuildKit’s --chmod/--chown avoids a separate chmod RUN that can fail under non-root.
#  */
COPY --chown=appuser:appgroup --chmod=0755 start.sh /app/start.sh

# Copy JAR and assign ownership to non-root user
COPY --from=build --chown=appuser:appgroup /app/target/inventory-service-0.0.1-SNAPSHOT.jar /app/app.jar

# Switch to non-root user AFTER copies/chmods
USER appuser

# /**
#  * Set Oracle Wallet environment variable for secure DB connection.
#  * The TNS_ADMIN value must match the directory structure inside the extracted wallet.
#  */
ARG ORACLE_WALLET_B64
ENV TNS_ADMIN=/app/wallet

# /**
#  * Define the startup command: extract Oracle wallet and launch Spring Boot.
#  */
CMD ["/app/start.sh"]

# ==========================================================
# HEALTHCHECK & PORT EXPOSURE
# ==========================================================

# /**
#  * Healthcheck to validate if Spring Boot is running and responding.
#  */
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --spider -q http://localhost:8081/health || exit 1

# /**
#  * Expose port 8081, which Spring Boot uses in this microservice.
#  */
EXPOSE 8081