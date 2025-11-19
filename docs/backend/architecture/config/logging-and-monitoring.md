[⬅️ Back to Config Overview](./index.md)

# Logging and Monitoring Configuration

## Overview

Logging configuration controls what messages are captured, at what level, and where they're stored. Monitoring configuration exposes application health and metrics via HTTP endpoints.

---

## Logging Configuration

### Base Configuration (application.yml)

```yaml
logging:
  level:
    '[org.springframework.jdbc.core]': DEBUG     # JDBC operations (SQL execution)
    '[org.hibernate.SQL]': DEBUG                 # Hibernate SQL generation
```

**Effect:** Logs all SQL statements with full debugging information.

### Production Configuration (application-prod.yml)

```yaml
logging:
  level:
    '[com.smartsupplypro]': INFO                # Application logs: only INFO and above
    root: INFO                                   # All other frameworks: INFO and above
```

**Effect:** Suppress DEBUG noise, keep only important events.

### Test Configuration (application-test.yml)

```yaml
spring:
  jpa:
    show-sql: true                              # Hibernate also logs SQL
    properties:
      hibernate:
        '[format_sql]': true                    # Pretty-print SQL in logs
```

---

## Log Levels (Severity Order)

From lowest to highest severity:

| Level | Use Case | Example |
|-------|----------|---------|
| **TRACE** | Extremely detailed debugging | Variable assignments, loop iterations |
| **DEBUG** | Detailed information for troubleshooting | SQL statements, method entries, config loading |
| **INFO** | High-level application flow | Application started, bean created, user logged in |
| **WARN** | Potentially harmful situations | Deprecation warnings, unusual conditions |
| **ERROR** | Error events that might still allow continuation | Database connection failed, but retry scheduled |
| **FATAL** | Very severe error events that will cause shutdown | OutOfMemoryError, disk full |

### Example

Setting `logging.level.root: INFO` means:

- ✅ Show: INFO, WARN, ERROR, FATAL
- ❌ Suppress: TRACE, DEBUG

---

## Log Output

### Console Output

By default, logs go to **stdout** (console). Example:

```
2025-11-19T14:32:15.123Z  INFO 12345 --- [main] c.s.i.InventoryServiceApplication : Starting InventoryServiceApplication
2025-11-19T14:32:15.456Z  INFO 12345 --- [main] o.s.s.w.SecurityFilterChain : Setting up security filter chain
2025-11-19T14:32:16.789Z  INFO 12345 --- [main] c.s.i.InventoryServiceApplication : Started InventoryServiceApplication in 1.234 seconds
```

### Log Directory

Logs are stored in the root `/logs/` directory:

```
/logs/
├── application.log          # Main application log
├── error.log               # Errors only
└── archive/                # Rotated logs
```

Currently **not configured** in the application property files, but the directory exists for potential file-based logging setup.

---

## Package-Specific Logging

Control logging level for specific packages:

```yaml
logging:
  level:
    # Application packages
    '[com.smartsupplypro.inventory]': DEBUG
    '[com.smartsupplypro.inventory.security]': DEBUG
    '[com.smartsupplypro.inventory.controller]': INFO
    '[com.smartsupplypro.inventory.service]': DEBUG
    
    # Spring Framework packages
    '[org.springframework.security]': DEBUG          # Spring Security internals
    '[org.springframework.boot]': INFO               # Spring Boot startup
    '[org.springframework.web.servlet]': DEBUG       # Request routing
    '[org.springframework.data]': DEBUG              # Spring Data JPA
    
    # Database packages
    '[org.hibernate.SQL]': DEBUG                    # Hibernate SQL
    '[org.hibernate.type.descriptor.sql.BasicBinder]': TRACE  # Bind parameters
    '[org.springframework.jdbc.core]': DEBUG        # JDBC core
    
    # Third-party libraries
    '[org.h2.server]': INFO                        # H2 database console
    '[io.r2dbc]': DEBUG                            # R2DBC (reactive)
    
    # All others
    root: WARN                                      # Default level
```

---

## Structured Logging

The application can log structured data (JSON) for better parsing in log aggregation systems. Example:

```json
{
  "timestamp": "2025-11-19T14:32:15.123Z",
  "level": "INFO",
  "thread": "main",
  "logger": "com.smartsupplypro.inventory.service.SupplierService",
  "message": "Created supplier",
  "supplierId": "SUP-001",
  "userId": "user@example.com"
}
```

Not currently configured, but can be enabled with Logback Jackson dependency.

---

## Management Endpoints (Monitoring)

### Base Configuration (application.yml)

```yaml
server:
  port: 8081
```

### Production Configuration (application-prod.yml)

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health              # Only expose /actuator/health
  endpoint:
    health:
      show-details: never            # Hide internals from API
```

### Available Endpoints

| Endpoint | Purpose | Enabled in Prod? |
|----------|---------|------------------|
| `/actuator/health` | Overall application health | ✅ Yes |
| `/actuator/metrics` | Performance metrics (CPU, memory, requests) | ❌ No |
| `/actuator/env` | Active configuration and environment variables | ❌ No |
| `/actuator/beans` | List all Spring beans | ❌ No |
| `/actuator/configprops` | Configuration properties | ❌ No |

### Health Endpoint Details

**Request:**

```bash
GET /actuator/health
```

**Response (prod):**

```json
{
  "status": "UP"
}
```

**Response (dev, with details):**

```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "Oracle",
        "result": 1
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 107374182400,
        "free": 54687091200
      }
    }
  }
}
```

---

## Correlation IDs (Request Tracing)

Not currently implemented, but recommended for production.

### What They Do

Add a unique ID to each request so logs from the same user action can be grouped:

```
Request-ID: abc123def456
↓
[2025-11-19 14:32:15] [abc123def456] Request received: GET /api/suppliers
[2025-11-19 14:32:16] [abc123def456] Query: SELECT * FROM SUPPLIER
[2025-11-19 14:32:16] [abc123def456] Response: 200 OK, 5 suppliers found
```

### Implementation

Would involve:

1. **Filter** to generate request ID on each request
2. **MDC (Mapped Diagnostic Context)** to store in thread-local
3. **Logback configuration** to include in log pattern

---

## Logging for Security Events

Currently logged at DEBUG level:

- OAuth2 login attempts
- Authorization failures (401, 403)
- Admin-only endpoint access
- Demo mode toggles

**Enhancement opportunity:** Log security events at WARN level always, regardless of logging configuration.

---

## Log Configuration Examples

### Debug a Specific Service

```yaml
logging:
  level:
    root: WARN                                    # Suppress everything else
    '[com.smartsupplypro.inventory.service.SupplierService]': DEBUG  # Focus on one class
```

### Debug OAuth2

```yaml
logging:
  level:
    '[org.springframework.security.oauth2]': DEBUG
    '[org.springframework.security.authentication]': DEBUG
```

### Debug Database Issues

```yaml
logging:
  level:
    '[org.hibernate.SQL]': DEBUG
    '[org.hibernate.type.descriptor.sql.BasicBinder]': TRACE  # Show bind parameters
    '[org.springframework.jdbc.core]': DEBUG
    '[com.zaxxer.hikari]': DEBUG                 # Connection pool
```

### Monitor Application Startup

```yaml
logging:
  level:
    '[org.springframework.boot.actuate]': DEBUG  # Startup events
    '[org.springframework.context]': DEBUG       # Context initialization
```

---

## File-Based Logging (Future Enhancement)

To enable file logging, add to `application.yml`:

```yaml
logging:
  file:
    name: logs/application.log         # Log file location
    max-size: 10MB                     # Rotate after 10MB
    max-history: 30                    # Keep 30 days of logs
    total-size-cap: 1GB                # Max total size before cleanup
  pattern:
    file: '%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n'
    console: '%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n'
```

---

## Logback Configuration (Behind the Scenes)

Spring Boot uses **Logback** by default. Configuration is auto-generated but can be customized by adding `logback-spring.xml` to `src/main/resources/`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <!-- Console appender -->
  <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
    </encoder>
  </appender>
  
  <!-- File appender with rotation -->
  <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/application.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
      <fileNamePattern>logs/application-%d{yyyy-MM-dd}.%i.log</fileNamePattern>
      <maxFileSize>10MB</maxFileSize>
      <maxHistory>30</maxHistory>
    </rollingPolicy>
    <encoder>
      <pattern>%d{yyyy-MM-dd HH:mm:ss} %-5level %logger{36} - %msg%n</pattern>
    </encoder>
  </appender>
  
  <!-- Root logger -->
  <root level="INFO">
    <appender-ref ref="CONSOLE" />
    <appender-ref ref="FILE" />
  </root>
  
  <!-- Package-specific loggers -->
  <logger name="com.smartsupplypro.inventory" level="DEBUG" />
  <logger name="org.springframework.security" level="DEBUG" />
</configuration>
```

---

## Summary Table

| Aspect | Base | Test | Production |
|--------|------|------|-----------|
| **Root Level** | (none; use default) | DEBUG | INFO |
| **SQL Logging** | DEBUG | DEBUG | OFF (show-sql: false) |
| **Framework Logging** | DEBUG | DEBUG | WARN |
| **Output** | Console | Console | Console (stdout in containers) |
| **File Logging** | No | No | Not configured (but `/logs/` exists) |
| **Management Endpoints** | All exposed (default) | All exposed | Health only |
| **Health Details** | Shows all | Shows all | Never shown |
| **Correlation IDs** | Not implemented | Not implemented | Not implemented |

---

[⬅️ Back to Config Overview](./index.md)
