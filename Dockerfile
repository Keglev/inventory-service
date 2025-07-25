# ==============================
# Build Stage
# ==============================
FROM maven:3.9.9-eclipse-temurin-17 AS build

# Set Spring profile used during build
ARG PROFILE=prod
ENV SPRING_PROFILES_ACTIVE=${PROFILE}

# Set working directory in the build container
WORKDIR /app

# Copy source code into the container
COPY . .

# Optional: use BuildKit caching to speed up Maven builds
RUN mvn clean package -DskipTests

# ==============================
# Runtime Stage
# ==============================
FROM eclipse-temurin:17-jre-alpine

# ==========================================================
# SYSTEM SETUP
# ==========================================================

# Create non-root user for security best practices
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install unzip (needed to extract Oracle Wallet) and coreutils for base64 decoding
# Must be done before switching to non-root user
RUN apk add --no-cache unzip coreutils

# Set working directory where the app and decoded files will live
WORKDIR /app

# Fix permissions so appuser can write to /app (for wallet.zip)
RUN chown -R appuser:appgroup /app

# Switch to non-root user after installing required packages
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

# Copy the final JAR from the build stage
COPY --from=build /app/target/inventory-service-0.0.1-SNAPSHOT.jar app.jar

# Set TNS_ADMIN to point directly to the extracted Wallet directory
# This path must match the subfolder structure inside the .zip file
ARG ORACLE_WALLET_B64
ENV TNS_ADMIN=/app/wallet/Wallet_sspdb_fixed

# Decode the base64 Oracle Wallet into a .zip file
# Unzip it to expose Oracle connection files (e.g., sqlnet.ora, cwallet.sso)
# Then launch the Spring Boot application using the specified profile
# Entry point: unzip wallet and launch app
ENTRYPOINT ["sh", "-c", "\
  echo \"$ORACLE_WALLET_B64\" | base64 -d > /app/wallet.zip && \
  unzip -o /app/wallet.zip -d /app/wallet && \
  echo ' Wallet extracted' && \
  echo 'Contents of sqlnet.ora:' && \
  cat /app/wallet/Wallet_sspdb_fixed/sqlnet.ora || echo ' sqlnet.ora missing' && \
  echo 'Contents of tnsnames.ora:' && \
  cat /app/wallet/Wallet_sspdb_fixed/tnsnames.ora || echo ' tnsnames.ora missing' && \
  echo ' Starting Spring Boot...' && \
  java \
    -Doracle.net.wallet_password=${WALLET_PASSWORD} \
    -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} \
    -Dserver.address=0.0.0.0 \
    -jar app.jar \
"]

# ==========================================================
# HEALTHCHECK & PORT EXPOSURE
# ==========================================================

# Provide Docker/Koyeb with a healthcheck URL to determine if the app is alive
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --spider -q http://localhost:8081/actuator/health || exit 1

# Inform Docker/Koyeb that the app listens on port 8081
EXPOSE 8081





