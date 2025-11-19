[⬅️ Back to Config Overview](./index.md)

# Application Configuration Files

## Overview

Configuration files in `src/main/resources/` define application behavior. These YAML and properties files are loaded by Spring Boot at startup and can be overridden by environment variables.

## File Structure

```
src/main/resources/
├── application.yml                # Base config (all environments)
├── application-prod.yml           # Production overrides
├── application-test.yml           # Test/CI overrides
├── application.properties         # App name
├── static/                        # Static files (CSS, JS, images)
└── templates/                     # Thymeleaf templates (if used)
```

---

## application.yml (Base Configuration)

**Purpose:** Shared defaults across all environments. Override with profile-specific files or environment variables.

### Structure

#### 1. Spring Datasource (Database)

```yaml
spring:
  datasource:
    url: ${DB_URL}                      # Oracle connection string
    username: ${DB_USER}                # Database user
    password: ${DB_PASS}                # Database password
    driver-class-name: oracle.jdbc.OracleDriver  # Oracle JDBC driver
```

- **Defaults to environment variables** for security (no hardcoded credentials)
- Applied to all profiles unless overridden

#### 2. OAuth2 Client Configuration

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID}
            client-secret: ${SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET}
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
            scope:
              - openid
              - profile
              - email
        provider:
          google:
            authorization-uri: https://accounts.google.com/o/oauth2/v2/auth
            token-uri: https://oauth2.googleapis.com/token
            user-info-uri: https://www.googleapis.com/oauth2/v3/userinfo
```

- Secrets injected via **environment variables** (highest priority)
- URLs are public, no secret leakage

#### 3. JPA/Hibernate

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none                    # Don't auto-create schema
    show-sql: true                      # Log SQL (debug builds)
```

- `ddl-auto: none` prevents accidental schema changes in production
- Can be overridden per profile for test environments

#### 4. Session Management

```yaml
server:
  servlet:
    session:
      cookie:
        same-site: none                 # Allow cross-site cookies (OAuth2)
        secure: true                    # Require HTTPS
```

- `same-site: none` needed for OAuth2 redirects across domains
- `secure: true` ensures cookies only sent over HTTPS

#### 5. Logging

```yaml
logging:
  level:
    '[org.springframework.jdbc.core]': DEBUG    # JDBC logging
    '[org.hibernate.SQL]': DEBUG                 # Hibernate SQL logging
```

#### 6. Custom App Configuration

```yaml
app:
  demo-readonly: ${APP_DEMO_READONLY:true}      # Default: demo mode ON
  frontend:
    base-url: ${APP_FRONTEND_BASE_URL:https://localhost:5173}
    landing-path: /auth
```

---

## application-prod.yml (Production Overrides)

**Profile:** `prod` (activated with `SPRING_PROFILES_ACTIVE=prod`)

**Purpose:** Production-specific settings for Oracle, security, and performance.

### Key Differences

#### Database Connection Pool

```yaml
spring:
  datasource:
    hikari:
      connection-timeout: 30000         # 30s to get connection
      validation-timeout: 5000          # 5s to validate
      maximum-pool-size: 5              # Small pool for low-memory environments
      minimum-idle: 2                   # Minimum connections
      max-lifetime: 240000              # 4 minutes (< Oracle's 5-min timeout)
      idle-timeout: 180000              # 3 minutes idle eviction
      connection-test-query: SELECT 1 FROM DUAL  # Oracle health check
      leak-detection-threshold: 60000   # Detect connection leaks
      keepalive-time: 120000            # 2-min keepalive ping
```

**Why these settings?**

- Oracle Autonomous Database closes idle connections after ~5 minutes
- These settings prevent "ORA-17008: Closed connection" errors
- Small pool matches Fly.io's 1GB RAM limitation

#### Logging

```yaml
logging:
  level:
    '[com.smartsupplypro]': INFO               # App logs: informative only
    root: INFO                                 # Framework: suppress debug noise
```

- Reduces log volume in production
- Still captures errors and important events

#### Show SQL

```yaml
spring:
  jpa:
    show-sql: false                    # Disable SQL logging (performance)
```

- SQL logging adds overhead
- Turned off in production

#### Management Endpoints

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health                 # Only expose /actuator/health
  endpoint:
    health:
      show-details: never               # Don't leak internals
```

- Exposes only the health endpoint (for uptime monitoring)
- Hides database, environment, and component details from API

---

## application-test.yml (Test Overrides)

**Profile:** `test` (activated in CI/test environments)

**Purpose:** Use H2 in-memory database instead of Oracle for fast testing.

### Key Differences

#### H2 In-Memory Database

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:ssp;MODE=Oracle;DATABASE_TO_UPPER=true;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driver-class-name: org.h2.Driver
    username: sa
    password:                         # No password in test mode
```

- **`MODE=Oracle`**: H2 emulates Oracle syntax (e.g., DUAL table)
- **`DB_CLOSE_DELAY=-1`**: Keep DB alive between test classes
- **`DB_CLOSE_ON_EXIT=FALSE`**: Don't close on process exit
- **Fast and isolated**: Each test run gets a fresh DB

#### Hibernate

```yaml
spring:
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: create-drop             # Create schema, drop after tests
    show-sql: true                      # Log all SQL for debugging
    properties:
      hibernate:
        '[format_sql]': true            # Pretty-print SQL
        '[jdbc.time_zone]': UTC         # Consistent timezone
```

- `create-drop` ensures clean database for each test run
- `show-sql: true` helps debug test failures

#### H2 Console

```yaml
spring:
  h2:
    console:
      enabled: true                     # Enable H2 web console
      path: /h2-console                 # Accessible during test runs
```

- Allows debugging via browser console at `http://localhost:8080/h2-console`

---

## application.properties (App Name)

**Minimal file** — just the app name:

```properties
spring.application.name=Inventory Service
```

- Used by Spring Boot for logging and identification
- Could be expanded for other global properties

---

## Configuration Lookup Order

Spring Boot loads properties in this **priority** (highest to lowest):

1. **Environment variables** (e.g., `DB_URL=...`)
2. **Profile-specific files** (e.g., `application-prod.yml`)
3. **Base file** (`application.yml`)
4. **Java defaults** (in `@ConfigurationProperties` classes)

### Example

For `spring.datasource.url`:

1. If `DB_URL` environment variable is set → use it
2. Else if `application-prod.yml` defines it → use it
3. Else if `application.yml` defines it → use it
4. Else → error (URL is required)

---

## Configuration Properties by Section

### Database (`spring.datasource.*`)

| Property | Default | Purpose |
|----------|---------|---------|
| `url` | `${DB_URL}` | Oracle connection string |
| `username` | `${DB_USER}` | Database user |
| `password` | `${DB_PASS}` | Database password |
| `driver-class-name` | `oracle.jdbc.OracleDriver` | JDBC driver |

### OAuth2 (`spring.security.oauth2.*`)

| Property | Default | Purpose |
|----------|---------|---------|
| `client.registration.google.client-id` | env var | Google OAuth2 client ID |
| `client.registration.google.client-secret` | env var | Google OAuth2 secret |
| `client.provider.google.authorization-uri` | Public URL | Google authorization endpoint |

### JPA (`spring.jpa.*`)

| Property | Default | Purpose |
|----------|---------|---------|
| `hibernate.ddl-auto` | `none` | Schema auto-creation (`none`, `create`, `update`) |
| `show-sql` | `true` | Log SQL statements |

### Server (`server.*`)

| Property | Default | Purpose |
|----------|---------|---------|
| `port` | `8081` | HTTP port |
| `address` | `0.0.0.0` | Listen on all interfaces |
| `servlet.session.cookie.same-site` | `none` | Cross-site cookie policy |
| `servlet.session.cookie.secure` | `true` | HTTPS-only cookies |

### Custom App (`app.*`)

| Property | Default | Purpose |
|----------|---------|---------|
| `demo-readonly` | `${APP_DEMO_READONLY:true}` | Enable demo mode |
| `frontend.base-url` | `https://localhost:5173` | Frontend URL for OAuth2 redirects |
| `frontend.landing-path` | `/auth` | Post-login landing page |

---

## Managing Configuration Across Environments

### Local Development

```bash
# .env file (not committed) or shell exports:
export DB_URL="jdbc:oracle:thin:@localhost:1521/xe"
export DB_USER="inventory_user"
export DB_PASS="password"
export APP_DEMO_READONLY="true"
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID="..."
```

### CI/CD (GitHub Actions)

```yaml
env:
  SPRING_PROFILES_ACTIVE: test  # Use test profile
  # H2 connection details are in application-test.yml (no secrets needed)
```

### Production (Fly.io)

```toml
# fly.toml
[env]
  SPRING_PROFILES_ACTIVE = "prod"
  APP_DEMO_READONLY = "true"
  APP_FRONTEND_BASE_URL = "https://inventoryservice.fly.dev"
  # Secrets (DB_URL, DB_USER, DB_PASS, OAuth2 keys) are set separately
```

---

## Summary

| File | When Loaded | Purpose | Overrides |
|------|-------------|---------|-----------|
| `application.yml` | Always | Base defaults | Overridden by profile files & env vars |
| `application-prod.yml` | When `SPRING_PROFILES_ACTIVE=prod` | Production settings | Overrides base file |
| `application-test.yml` | When `SPRING_PROFILES_ACTIVE=test` | Test settings (H2 DB) | Overrides base file |
| `application.properties` | Always | App name | None |

---

[⬅️ Back to Config Overview](./index.md)
