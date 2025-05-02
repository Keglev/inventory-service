# Use an official Maven image to build the app
FROM maven:3.9.9-eclipse-temurin-17 AS build
ARG PROFILE=prod
ENV SPRING_PROFILES_ACTIVE=${PROFILE}

WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Use a smaller JRE image to run the app
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Add metadata labels here
LABEL maintainer="https://github.com/Keglev"
LABEL version="1.0.0"
LABEL description="Smart Supply Pro Inventory Microservice"
LABEL org.opencontainers.image.source="https://github.com/Keglev/inventory-service"

# Copy the built jar from the build stage
COPY --from=build /app/target/inventory-service-0.0.1-SNAPSHOT.jar app.jar

# Run the application
# Important: use shell form so $SPRING_PROFILES_ACTIVE expands
EXPOSE 8081
ENTRYPOINT java -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} -jar app.jar



