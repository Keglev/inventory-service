# ==============================
# Build Stage
# ==============================
FROM maven:3.9.9-eclipse-temurin-17 AS build

ARG PROFILE=prod
ENV SPRING_PROFILES_ACTIVE=${PROFILE}

WORKDIR /app

# Copy source code
COPY . .

# Optional: use BuildKit caching to speed up Maven builds
# RUN --mount=type=cache,target=/root/.m2 \
RUN mvn clean package -DskipTests

# ==============================
# Runtime Stage
# ==============================
FROM eclipse-temurin:17-jre-alpine

# Create non-root user for security best practices
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app

# Metadata for image traceability
LABEL maintainer="https://github.com/Keglev"
LABEL version="1.0.0"
LABEL description="Smart Supply Pro Inventory Microservice"
LABEL org.opencontainers.image.source="https://github.com/Keglev/inventory-service"

# Copy built app
COPY --from=build /app/target/inventory-service-0.0.1-SNAPSHOT.jar app.jar

# Expose Spring Boot app port
EXPOSE 8081

# Use shell form to allow variable expansion
ENTRYPOINT ["sh", "-c", "java -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} -jar app.jar"]

# Healthcheck (for Docker and CI/CD orchestration)
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --spider -q http://localhost:8081/actuator/health || exit 1





