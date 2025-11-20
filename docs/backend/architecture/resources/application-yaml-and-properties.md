[⬅️ Back to Resources Index](./index.html)

# Application YAML & Properties Files

**Overview:** This document explains the structure and purpose of Spring Boot configuration files that define how the application behaves.

---

## Table of Contents

1. [Configuration Files Overview](#configuration-files-overview)
2. [YAML vs Properties Format](#yaml-vs-properties-format)
3. [Major Configuration Sections](#major-configuration-sections)
4. [Profile-Specific Overrides](#profile-specific-overrides)
5. [Best Practices](#best-practices)
6. [Reference](#reference)

---

## Configuration Files Overview

### Files in This Project

| File | Scope | Usage | Environment |
|------|-------|-------|-----------|
| **application.yml** | Base/Shared | All profiles | Dev, Test, Prod |
| **application-prod.yml** | Production | Only when `SPRING_PROFILES_ACTIVE=prod` | Production (Fly.io) |
| **application-test.yml** | Testing | Only when `SPRING_PROFILES_ACTIVE=test` | CI/CD Tests |
| **application.properties** | Minimal | Metadata only | All |

### Loading Order

```
Step 1: Load application.yml (base config for all profiles)
         ↓
Step 2: If SPRING_PROFILES_ACTIVE=prod → Load application-prod.yml (overrides)
         If SPRING_PROFILES_ACTIVE=test → Load application-test.yml (overrides)
         If no profile → Use application.yml only + environment variables
         ↓
Step 3: Apply environment variables (highest priority override)
         ↓
Result: Final merged configuration
```

---

## YAML vs Properties Format

### application.yml (YAML Format)

**Advantages:**
- Hierarchical structure (easier to read)
- Comments are prominent
- No repeated prefixes

**Example:**
```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@localhost:1521/xe
    username: admin
  jpa:
    hibernate:
      ddl-auto: update
```

### application.properties (Properties Format)

**Advantages:**
- Flat key=value format
- Good for simple metadata

**Example:**
```properties
spring.application.name=Inventory Service
```

### In This Project

- **YAML used for:** Main configuration (datasource, JPA, security, logging)
- **Properties used for:** Only application name metadata
- **Reason:** YAML is more readable for complex hierarchies; properties for simple values

---

## Major Configuration Sections

### 1. Spring Datasource Configuration

**Where Configured:** `application.yml`, `application-prod.yml`, `application-test.yml`

#### Base Configuration (application.yml)
```yaml
spring:
  datasource:
    url: ${DB_URL}                              # Placeholder - injected from environment
    username: ${DB_USER}                        # Placeholder - injected from environment
    password: ${DB_PASS}                        # Placeholder - injected from environment
    driver-class-name: oracle.jdbc.OracleDriver # Oracle driver
```

**Key Points:**
- Uses environment variable placeholders (`${...}`)
- Base file doesn't contain actual credentials
- Driver defaults to Oracle

#### Production Override (application-prod.yml)
```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USER}
    password: ${DB_PASS}
    driver-class-name: oracle.jdbc.OracleDriver
    hikari:
      connection-timeout: 30000          # 30 seconds
      validation-timeout: 5000           # 5 seconds
      maximum-pool-size: 5               # Limited for Fly.io (512MB-1GB RAM)
      minimum-idle: 2
      max-lifetime: 240000               # 4 minutes
      idle-timeout: 180000               # 3 minutes
      connection-test-query: SELECT 1 FROM DUAL
      leak-detection-threshold: 60000    # 60 seconds
      keepalive-time: 120000             # 2 minutes
```

**Why These Settings?**
- Oracle Autonomous DB has aggressive 5-minute idle timeout
- HikariCP settings prevent "ORA-17008: Closed connection" errors
- Pool kept small (5 max) for Fly.io memory constraints (512MB-1GB)

#### Test Override (application-test.yml)
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:ssp;MODE=Oracle;DATABASE_TO_UPPER=true;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driver-class-name: org.h2.Driver
    username: sa
    password:  # Empty for H2
```

**Why H2 in Tests?**
- ✅ Fast: In-memory, no network calls
- ✅ Isolated: Fresh database per test run
- ✅ Oracle-compatible: `MODE=Oracle` emulates Oracle syntax
- ✅ No setup: No separate Oracle instance needed

---

### 2. Spring JPA & Hibernate Configuration

**Where Configured:** `application.yml`, `application-prod.yml`, `application-test.yml`

#### Base Configuration (application.yml)
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none                            # Don't auto-create schemas
    show-sql: true                              # Log all SQL (for debugging)
```

#### Production Override (application-prod.yml)
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update                          # Update schema (use Flyway/Liquibase in enterprise)
    show-sql: false                             # No SQL logging (performance, security)
    properties:
      hibernate:
        dialect: org.hibernate.dialect.OracleDialect
```

**Key Points:**
- `ddl-auto: update` modifies schema without dropping data
- SQL logging disabled for performance and security
- Oracle-specific dialect for custom SQL functions

#### Test Override (application-test.yml)
```yaml
spring:
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: create-drop                     # Create fresh schema, drop after tests
    show-sql: true                              # Show SQL for debugging
    properties:
      hibernate:
        '[format_sql]': true                    # Pretty-print SQL
        '[globally_quoted_identifiers]': false  # Keep quoted identifiers
        '[jdbc.time_zone]': UTC                 # Consistent timezone
```

**Why `create-drop`?**
- Fresh database for each test run
- No data leaks between tests
- Automatic cleanup after tests finish

---

### 3. Spring Security & OAuth2 Configuration

**Where Configured:** `application.yml`, `application-test.yml` (no prod override)

#### All Profiles (application.yml)
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

**Key Points:**
- **Client ID & Secret:** Externalized (environment variables, not in config files)
- **Redirect URI:** Uses placeholder `{baseUrl}` (replaced at runtime)
- **Scopes:** Request email and profile from Google
- **Provider URLs:** Hardcoded (public Google endpoints)

#### Test Override (application-test.yml)
```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: test-client-id               # Dummy values for testing
            client-secret: test-client-secret
            scope: openid,profile,email
```

**Why Different for Tests?**
- No real OAuth2 flow needed in tests
- Dummy values prevent external API calls
- Tests mock authentication instead

---

### 4. Logging Configuration

**Where Configured:** `application.yml`, `application-prod.yml`, `application-test.yml`

#### Base Configuration (application.yml)
```yaml
logging:
  level:
    '[org.springframework.jdbc.core]': DEBUG     # Detailed JDBC logs
    '[org.hibernate.SQL]': DEBUG                 # Hibernate SQL statements
```

#### Production Override (application-prod.yml)
```yaml
logging:
  level:
    '[com.smartsupplypro]': INFO                 # Application logs: informative only
    root: INFO                                   # Framework logs: minimal
```

#### Test Override (application-test.yml)
```yaml
logging:
  file:
    name: logs/test-application.log              # Write to file
  level:
    '[org.hibernate.SQL]': DEBUG                 # SQL statements
    '[org.hibernate.type.descriptor.sql]': trace # SQL parameter values
    root: INFO
```

**Why Different Levels?**
- **Dev/Test:** DEBUG/TRACE to understand what's happening
- **Prod:** INFO to reduce noise and log file size

---

### 5. Server & Servlet Configuration

**Where Configured:** `application.yml`, `application-test.yml` (port override)

#### All Profiles (application.yml)
```yaml
server:
  port: 8081                                     # Non-standard port (avoid conflicts)
  address: 0.0.0.0                               # Listen on all interfaces
  forward-headers-strategy: framework            # Respect X-Forwarded-* headers from proxies
  servlet:
    session:
      cookie:
        same-site: none                          # Allow cross-site cookies (OAuth2)
        secure: true                             # Use secure cookies (HTTPS)
```

**Key Points:**
- **Port 8081:** Avoids conflict with port 8080 (common default)
- **Forward-headers:** Important for reverse proxies (Fly.io, nginx)
- **same-site: none:** Allows OAuth2 redirects across origins
- **secure: true:** Cookies only over HTTPS (recommended for prod)

#### Test Override (application-test.yml)
```yaml
server:
  port: 8081                                     # Same port for consistency
```

---

### 6. Custom App Configuration

**Where Configured:** `application.yml`, `application-test.yml`

#### All Profiles (application.yml)
```yaml
app:
  demo-readonly: ${APP_DEMO_READONLY:true}       # Default: true if env var not set
  frontend:
    base-url: ${APP_FRONTEND_BASE_URL:https://localhost:5173}
    landing-path: /auth
```

**What This Does:**
- **demo-readonly:** Enables read-only mode (test data, no modifications)
- **frontend.base-url:** URL of React frontend (for redirects after login)
- **frontend.landing-path:** Frontend route to redirect to after OAuth2 login

#### Test Override (application-test.yml)
```yaml
app:
  demo-readonly: false                           # Allow modifications in tests
  frontend:
    base-url: http://localhost:8081              # Points to backend itself
    landing-path: /api/me                        # Test endpoint instead of frontend
```

**Why Different?**
- Tests need to modify data (set `demo-readonly: false`)
- Tests don't have frontend running (redirect to backend API)

---

### 7. Management & Actuator Configuration

**Where Configured:** `application-prod.yml`, `application-test.yml`

#### Production (application-prod.yml)
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health                          # Only expose health endpoint
  endpoint:
    health:
      show-details: never                        # Hide internal details for security
```

#### Test (application-test.yml)
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health                          # Expose for CI assertions
  endpoint:
    health:
      show-details: always                       # Show details for debugging
```

**Why Different?**
- **Prod:** Minimize exposed endpoints for security
- **Test:** Show details to verify application health in CI

---

### 8. Spring Main Configuration

#### Base (application.yml)
```yaml
spring:
  main:
    allow-bean-definition-overriding: true       # Allows test mocks to override beans
  profiles:
    active: # none (don't force a default)
```

---

## Profile-Specific Overrides

### How Overrides Work

```yaml
# application.yml (Base - ALL profiles)
spring:
  datasource:
    url: ${DB_URL}

# application-test.yml (When profile=test)
spring:
  datasource:
    url: jdbc:h2:mem:ssp...  # OVERRIDES the base url

# Result when SPRING_PROFILES_ACTIVE=test:
# datasource.url = "jdbc:h2:mem:ssp..." (test value wins)
```

### Which Values Are Overridden

**Completely Overridden:**
- datasource.url (base: placeholder, test: H2)
- datasource.driver-class-name (base: Oracle, test: H2)
- jpa.hibernate.ddl-auto (base: none, test: create-drop)

**Merged/Extended:**
- logging.level.* (base: DEBUG for JDBC, test: adds TRACE for SQL params)
- management.endpoints.web.exposure.include (base: not set, test: health)

### Adding New Profile

To add a profile (e.g., `local`):

1. Create `application-local.yml`
2. Set `SPRING_PROFILES_ACTIVE=local` to activate
3. Add only the overrides you need
4. Base config from `application.yml` still applies

---

## Best Practices

### 1. Never Hardcode Secrets in Config Files

**❌ Bad:**
```yaml
spring:
  datasource:
    password: mysecretpassword123
```

**✅ Good:**
```yaml
spring:
  datasource:
    password: ${DB_PASS}  # Injected from environment
```

### 2. Use Placeholders with Defaults for Optional Values

**❌ Bad:**
```yaml
app:
  frontend:
    base-url: https://localhost:5173  # Breaks in production
```

**✅ Good:**
```yaml
app:
  frontend:
    base-url: ${APP_FRONTEND_BASE_URL:https://localhost:5173}  # Default for local dev
```

### 3. Document Why Overrides Exist

**❌ Bad:**
```yaml
# application-prod.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 5
```

**✅ Good:**
```yaml
# application-prod.yml
spring:
  datasource:
    hikari:
      # Fly.io has limited memory (512MB-1GB)
      # Keep pool small to avoid OOM errors
      maximum-pool-size: 5
```

### 4. Keep Base Config Minimal and Shared

Put in `application.yml`:
- ✅ Default values used by all profiles
- ✅ Shared URLs (OAuth2 providers, which don't change)
- ✅ Server port (unless overridden)

Don't put in `application.yml`:
- ❌ Production-specific tuning
- ❌ Database credentials
- ❌ Debug logging settings

---

## Reference

### Environment Variables Used

| Variable | Base Value | Used In | Example |
|----------|-----------|---------|---------|
| `DB_URL` | `${DB_URL}` | application.yml | `jdbc:oracle:thin:@localhost:1521/xe` |
| `DB_USER` | `${DB_USER}` | application.yml | `admin` |
| `DB_PASS` | `${DB_PASS}` | application.yml | `password123` |
| `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID` | `${...}` | application.yml | `abc123.apps.googleusercontent.com` |
| `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET` | `${...}` | application.yml | `secret_xyz` |
| `APP_DEMO_READONLY` | `true` | application.yml | `false` (for tests) |
| `APP_FRONTEND_BASE_URL` | `https://localhost:5173` | application.yml | `https://myapp.com` |
| `APP_ADMIN_EMAILS` | (not set) | Java code (@Value) | `admin@example.com,other@example.com` |
| `TNS_ADMIN` | (not set) | Oracle driver | `/path/to/wallet` |
| `SPRING_PROFILES_ACTIVE` | (none) | Spring Boot | `prod`, `test`, `local` |

### Configuration Properties Map

```
application.yml
├── spring.datasource.*              (Database connection)
├── spring.jpa.*                     (JPA & Hibernate)
├── spring.security.oauth2.*         (OAuth2 registration)
├── spring.main.*                    (Spring Boot behavior)
├── server.*                         (HTTP server)
├── logging.*                        (Log levels)
├── management.*                     (Actuator endpoints)
└── app.*                            (Custom application config)
```

---

## Troubleshooting

### Configuration Not Applied

**Problem:** Config change doesn't take effect

**Solution:** 
1. Stop the application
2. Check correct profile is set: `echo $SPRING_PROFILES_ACTIVE`
3. Restart application
4. Look for log: "The following profiles are active: X"

### Environment Variable Not Substituted

**Problem:** Placeholder shows in output instead of value

**Solution:**
1. Check variable name matches exactly
2. Verify variable is exported: `echo $VAR_NAME`
3. Use default value: `${VAR_NAME:defaultValue}`

### Wrong Profile Applied

**Problem:** Production config applied in development

**Solution:**
1. Check environment variables: `env | grep SPRING_PROFILES_ACTIVE`
2. Clear cached config: `rm -rf ~/.m2/repository/*` (Maven cache)
3. Restart IDE/terminal to apply new env vars

---

[⬅️ Back to Resources Index](./index.html)
