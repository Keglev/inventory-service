[⬅️ Back to Config Overview](./index.md)

# Profiles and Environments

## What is a Profile?

A **Spring profile** is a named configuration set. Profiles allow you to maintain different property files and bean definitions for different environments without changing code.

When a profile is **active**, Spring Boot loads the corresponding `application-{profile}.yml` file, overriding the base `application.yml`.

## Active Profiles in This Project

### (Default) — Local Development

**When:** No profile is explicitly set; used locally when developing

**Configuration file:** `application.yml` only

**Database:** Requires environment setup
- Expects `DB_URL`, `DB_USER`, `DB_PASS` environment variables
- Can be PostgreSQL or Oracle, depending on your setup

**Demo Mode:** Enabled by default (`APP_DEMO_READONLY=true`)

**Activation:**

```bash
# No SPRING_PROFILES_ACTIVE set
mvn spring-boot:run

# Or explicitly empty
export SPRING_PROFILES_ACTIVE=""
```

---

### test

**When:** Running tests in CI/CD pipeline or locally

**Configuration file:** `application-test.yml` + base `application.yml`

**Database:** H2 in-memory (Oracle-compatible mode)
- Fast, isolated, requires no setup
- Recreated for each test run (`create-drop` mode)

**Logging:** SQL statements logged (`show-sql: true`)

**Demo Mode:** Can be overridden per test

**Activation:**

```bash
# Maven
mvn clean test

# Environment variable
export SPRING_PROFILES_ACTIVE="test"
mvn spring-boot:run

# Java system property
java -Dspring.profiles.active=test -jar app.jar

# Docker
docker run -e SPRING_PROFILES_ACTIVE=test myapp:latest
```

---

### prod

**When:** Production deployment (Fly.io, cloud, or production server)

**Configuration file:** `application-prod.yml` + base `application.yml`

**Database:** Oracle with production-grade connection pooling
- Requires `DB_URL`, `DB_USER`, `DB_PASS` from secure environment
- Connection pool tuned for low-memory environments

**Logging:** Only INFO level and above (`logging.level.root: INFO`)

**Security:**
- SQL logging disabled (`show-sql: false`)
- No internal endpoint details exposed (`management.endpoint.health.show-details: never`)
- Secure cookies enforced (`secure: true`)

**Demo Mode:** Usually disabled in production (`APP_DEMO_READONLY=false`)

**Activation:**

```bash
# Fly.io (fly.toml)
[env]
  SPRING_PROFILES_ACTIVE = "prod"

# Docker
docker run -e SPRING_PROFILES_ACTIVE=prod myapp:latest

# Kubernetes
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    env:
    - name: SPRING_PROFILES_ACTIVE
      value: "prod"
```

---

## How Spring Selects the Active Profile

1. **Environment variable** `SPRING_PROFILES_ACTIVE` (highest priority)
   ```bash
   export SPRING_PROFILES_ACTIVE="prod"
   ```

2. **Java system property**
   ```bash
   java -Dspring.profiles.active=prod -jar app.jar
   ```

3. **application.yml** `spring.profiles.active`
   ```yaml
   spring:
     profiles:
       active: test
   ```

4. **Default** (if none set): Use base `application.yml` only

**⚠️ Important:** Never hardcode `spring.profiles.active` in `application.yml`. Let environment variables control which profile is used.

---

## Profile Comparison

| Aspect | (Default) | test | prod |
|--------|-----------|------|------|
| **Database** | PostgreSQL/Oracle (manual setup) | H2 in-memory | Oracle (Autonomous DB) |
| **Configuration** | `application.yml` | `application-test.yml` | `application-prod.yml` |
| **SQL Logging** | Enabled (DEBUG) | Enabled (DEBUG) | Disabled |
| **Show SQL** | true | true | false |
| **DDL Auto** | none | create-drop | update |
| **Demo Mode** | true (default) | true (default) | true (usually) |
| **Log Level** | DEBUG for frameworks | DEBUG for frameworks | INFO only |
| **Health Endpoint** | Shows all details | Shows all details | Never |
| **Connection Pool** | Default | N/A (H2) | Tuned for Oracle |

---

## Configuration Precedence

When Spring Boot starts, properties are loaded in this order (first match wins):

```
1. Environment Variables
2. application-{profile}.yml
3. application.yml
4. Java defaults (@ConfigurationProperties)
```

### Example: Database URL

```
Query: What is spring.datasource.url?

1. Is DB_URL env var set? → Use it (highest priority)
   Example: export DB_URL="jdbc:oracle:thin:@prod.db.com:1521/xe"

2. Is the active profile "prod"? Check application-prod.yml
   (application-prod.yml also references ${DB_URL}, so env var wins anyway)

3. Check application.yml
   spring.datasource.url: ${DB_URL}  ← Still references env var

4. Java default: oracle.jdbc.OracleDriver (just the driver class)
   ← No default for URL; the property is required
```

---

## Profile-Specific Sections in application.yml

You can also add profile-specific properties **within** `application.yml` using `---` separator:

```yaml
# Base config (all profiles)
spring:
  jpa:
    show-sql: true

---
# Only when prod profile is active
spring:
  config:
    activate:
      on-profile: prod
  jpa:
    show-sql: false
```

However, **dedicated files are cleaner** and are used in this project:
- `application-prod.yml`
- `application-test.yml`

---

## Selecting Profiles for Different Scenarios

### Local Development

```bash
# 1. No profile (uses default application.yml)
mvn spring-boot:run

# 2. With test profile (for testing locally with H2)
export SPRING_PROFILES_ACTIVE="test"
mvn spring-boot:run

# 3. With prod profile (for testing prod config locally)
#    Note: You'll need actual DB credentials
export SPRING_PROFILES_ACTIVE="prod"
export DB_URL="jdbc:oracle:thin:@localhost:1521/xe"
export DB_USER="..."
export DB_PASS="..."
mvn spring-boot:run
```

### Continuous Integration (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        env:
          SPRING_PROFILES_ACTIVE: test  # H2 DB, fast, isolated
        run: mvn clean test
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
COPY --from=build /app/target/inventory-service-*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

```bash
# Build and run with prod profile
docker build -t inventory-service .
docker run \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_URL="jdbc:oracle:thin:@oracle.db.example.com:1521/xe" \
  -e DB_USER="admin" \
  -e DB_PASS="***" \
  inventory-service:latest
```

### Fly.io Deployment

```toml
# fly.toml
app = "inventoryservice"
primary_region = "fra"

[env]
  SPRING_PROFILES_ACTIVE = "prod"
  APP_DEMO_READONLY = "true"
  APP_FRONTEND_BASE_URL = "https://inventoryservice.fly.dev"

[[services]]
  internal_port = 8081
```

Secrets are set separately:

```bash
fly secrets set DB_URL="jdbc:oracle:thin:@..." \
              DB_USER="admin" \
              DB_PASS="***" \
              SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID="..." \
              SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET="..."
```

---

## Troubleshooting Profile Issues

### Q: How do I know which profile is active?

**A:** Check the logs on startup:

```
The following profiles are active: prod
```

Or print it programmatically:

```java
@Component
public class ProfileLogger {
    @Autowired
    private Environment env;
    
    @PostConstruct
    public void logProfiles() {
        String[] profiles = env.getActiveProfiles();
        System.out.println("Active profiles: " + Arrays.toString(profiles));
    }
}
```

### Q: My config isn't being loaded. What's wrong?

**A:** Check priority order:

1. Is the **environment variable** set? (Check `echo $DB_URL`)
2. Is the **profile-specific file** correct? (Check `application-{profile}.yml`)
3. Is the **profile active**? (Check `SPRING_PROFILES_ACTIVE`)
4. Is the **property name** spelled correctly? (Hyphens vs underscores matter)

### Q: I can't connect to the database. What profile should I use?

- **Test mode** (`test` profile) → Use H2, no setup needed
- **Local dev** (default) → Set `DB_URL`, `DB_USER`, `DB_PASS` env vars
- **Production** (`prod` profile) → Use Oracle with proper credentials

---

## Related Documentation

- [Application Configuration Files](./application-config-files.md)
- [Database and Oracle Wallet](./database-and-oracle-wallet.md)
- [Deployment Docs](../deployment/) — For environment-specific setup

---

[⬅️ Back to Config Overview](./index.md)
