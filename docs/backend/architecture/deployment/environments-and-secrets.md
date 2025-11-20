[⬅️ Back to Deployment Index](./index.html)

# Environments & Secrets

## Overview

Smart Supply Pro uses **environment-specific configuration** and **secret management** to keep code independent from deployment context. This document explains:

- How configuration is provided in each environment (local, CI, production)
- What sensitive values must be protected
- Mapping between environment variables and Spring properties
- Tools and mechanisms for secret management

## The Configuration Problem

**Challenge:** The same code must run in different environments with different settings.

```java
// Same code, different requirements
String dbUrl = ??? // localhost:1521 in dev, oracle.cloud.com in prod
String apiKey = ??? // test-key-123 in test, secret-prod-key in prod
```

**Solution:** Externalize configuration → Read from environment variables → No code changes needed.

## Configuration Across Environments

### Local Development

**File:** `.env` (local file, never committed)

```bash
# Database: Oracle on local machine
DB_URL=jdbc:oracle:thin:@localhost:1521/orcl
DB_USER=inventoryuser
DB_PASS=localpassword123

# OAuth2: Development credentials
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx

# App config
SPRING_PROFILES_ACTIVE=dev
APP_DEMO_READONLY=false
LOGGING_LEVEL_ROOT=DEBUG
```

**How it's used:**
```bash
# IDE: Load .env file
# IntelliJ: Run → Edit Configurations → Environment variables
# Spring Boot: Use spring.config.import=optional:file:.env

# Or docker-compose
docker-compose --env-file .env up
```

**Spring Profile:** `dev` (or no profile, defaults to dev)

**Database:** H2 (local) or Oracle (if local wallet configured)

### Testing (CI Environment)

**File:** `application-test.yml` (in repo)

```yaml
spring:
  profiles:
    active: test
  datasource:
    url: jdbc:h2:mem:ssp;MODE=Oracle;DATABASE_TO_UPPER=true
    username: sa
    password: ""
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        use_sql_comments: true
        jdbc:
          batch_size: 20

logging:
  level:
    root: DEBUG
    org.springframework.security: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

**Secrets:** None needed (hardcoded for testing)

**Database:** H2 in-memory (fresh schema each test run, auto-cleanup)

### Production (Fly.io)

**File:** `fly.toml` (in repo, public config) + Fly secrets (encrypted vault)

**fly.toml (non-sensitive):**
```toml
[env]
  SPRING_PROFILES_ACTIVE = "prod"
  APP_DEMO_READONLY = "false"
  APP_FRONTEND_BASE_URL = "https://inventory-service.koyeb.app"
  LOGGING_LEVEL_ROOT = "INFO"
```

**Fly secrets (encrypted, set via CLI):**
```bash
flyctl secrets set DB_URL=jdbc:oracle:thin:@...
flyctl secrets set DB_USER=inventoryuser
flyctl secrets set DB_PASS=encrypted_password
flyctl secrets set GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
flyctl secrets set GOOGLE_CLIENT_SECRET=xxxxx
```

**Spring Profile:** `prod` (from `SPRING_PROFILES_ACTIVE`)

**Database:** Oracle Autonomous DB (credentials from secrets)

## Sensitive Values: Never Commit These

### Critical Secrets (⚠️ = HIGH RISK if leaked)

| Secret | Example | Storage | Exposure Risk |
|--------|---------|---------|----------------|
| Database password | `myPassword123` | Fly secrets | Unauthorized DB access |
| Database URL (with credentials) | `oracle:thin:@...pwd...` | Fly secrets | Unauthorized DB access |
| OAuth2 client secret | `gcp_secret_abc123def456` | Fly secrets | Unauthorized API access |
| API keys (third-party) | `sk_live_abc123...` | Fly secrets | Billing fraud, data theft |
| JWT signing key | `base64_encoded_key` | Fly secrets | Unauthorized token creation |
| TLS certificate private key | `-----BEGIN PRIVATE KEY-----...` | Fly secrets | Man-in-the-middle attacks |

### Configuration to Protect

```
.env                    ← NEVER commit (git will reject)
.env.local              ← NEVER commit
secrets.yml             ← NEVER commit
private_keys/**         ← NEVER commit
oracle_wallet/**        ← Encrypted; handle carefully
```

### Configuration Safe to Commit

```
.env.example            ← Template (placeholders only, no real values)
application-prod.yml    ← Profile settings (no secrets)
application-test.yml    ← Test config (hardcoded test values)
pom.xml                 ← Dependencies (no secrets)
fly.toml                ← App config (no secrets, just placeholders)
```

## Mapping: ENV VAR → SPRING PROPERTY

Spring Boot automatically converts environment variables to properties using convention:

```
ENVIRONMENT_VARIABLE       →  spring.property.name
────────────────────────────────────────────────
DB_URL                     →  spring.datasource.url
DB_USER                    →  spring.datasource.username
DB_PASS                    →  spring.datasource.password
TNS_ADMIN                  →  spring.datasource.oracle.net.tns_admin
GOOGLE_CLIENT_ID           →  spring.security.oauth2.client.registration.google.client-id
GOOGLE_CLIENT_SECRET       →  spring.security.oauth2.client.registration.google.client-secret
LOGGING_LEVEL_ROOT         →  logging.level.root
SPRING_PROFILES_ACTIVE     →  (special: activates profile)
SPRING_DATASOURCE_DRIVER   →  spring.datasource.driver-class-name
```

**Conversion rule:**
- `SCREAMING_CASE` → `screaming.case` (lowercase, underscores to dots)
- Nested: `DB_URL` → `db.url` OR `spring.datasource.url` (context-dependent)

### Example: Oracle Database Configuration

**Local development (.env):**
```bash
DB_URL=jdbc:oracle:thin:@localhost:1521/orcl
DB_USER=inventoryuser
DB_PASS=password123
TNS_ADMIN=/path/to/oracle_wallet
```

↓

**Spring sees:**
```properties
spring.datasource.url=jdbc:oracle:thin:@localhost:1521/orcl
spring.datasource.username=inventoryuser
spring.datasource.password=password123
spring.datasource.oracle.net.tns_admin=/path/to/oracle_wallet
```

↓

**Java accesses:**
```java
@Value("${spring.datasource.url}")
private String dbUrl;

@Value("${spring.datasource.username}")
private String dbUsername;
```

## GitHub Actions Secrets (CI Environment)

In `.github/workflows/1-ci-test.yml`:

```yaml
- name: Build and Test with Maven
  run: |
    mvn clean verify -Dspring.profiles.active=test
  env:
    DB_URL: ${{ secrets.DB_URL }}
    DB_USER: ${{ secrets.DB_USER }}
    DB_PASS: ${{ secrets.DB_PASS }}
    GOOGLE_CLIENT_ID: ${{ secrets.SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID }}
    GOOGLE_CLIENT_SECRET: ${{ secrets.SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET }}
```

**GitHub Secrets UI:**
- Go to: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
- Add: `DB_URL`, `DB_USER`, `DB_PASS`, OAuth2 credentials, etc.
- These are **encrypted** and never logged

## Fly.io Secrets Management

### Set a Secret

```bash
flyctl secrets set DB_URL="jdbc:oracle:thin:@prod-db:1521/service"
```

### List Secrets (Encrypted in Output)

```bash
flyctl secrets list
```

Output:
```
NAME                         DIGEST
DB_URL                       sha256:abc123...
DB_USER                      sha256:def456...
DB_PASS                      sha256:ghi789...
GOOGLE_CLIENT_ID             sha256:jkl012...
GOOGLE_CLIENT_SECRET         sha256:mno345...
```

### Remove a Secret

```bash
flyctl secrets unset DB_PASS
```

### Secrets Injection at Runtime

When app starts, Fly.io injects secrets as environment variables:

```bash
# Inside container (at startup)
$> printenv | grep DB_
DB_URL=jdbc:oracle:thin:@prod-db:1521/service
DB_USER=inventoryuser
DB_PASS=<decrypted_at_runtime>

# Never visible in logs
$> flyctl logs --app inventoryservice
# DB_PASS is NOT shown in logs (Fly.io redacts it)
```

## Configuration Layering (Priority Order)

When Spring Boot starts, properties are resolved in this order (highest priority first):

```
1. Environment variables          (SPRING_PROFILES_ACTIVE=prod)
2. System properties             (-Dspring.profiles.active=prod)
3. application-{profile}.yml     (application-prod.yml)
4. application.yml               (base config)
5. Default values                (hardcoded in code)
```

**Example: Database URL resolution**

```
1. Check ENV: DB_URL=jdbc:oracle:thin:@prod-db:1521/service  ← USE THIS
2. Check -D flag: -Dspring.datasource.url=...
3. Check application-prod.yml: spring.datasource.url: ...
4. Check application.yml: spring.datasource.url: ...
5. Use default: (none)
```

If multiple layers define the same property, the highest-priority source wins.

## .env.example: Template for Developers

**File:** `.env.example` (in repo, serves as documentation)

```bash
# Database Configuration
# For local development, update these with your Oracle credentials
DB_URL=jdbc:oracle:thin:@localhost:1521/orcl
DB_USER=inventoryuser
DB_PASS=your_password_here

# OAuth2 Configuration (Google SSO)
# Register app at: https://console.cloud.google.com
# Credentials → Create OAuth 2.0 Client ID (Web application)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Spring Profile: dev (default), test, prod
SPRING_PROFILES_ACTIVE=dev

# Logging Level: DEBUG (dev), INFO (prod)
LOGGING_LEVEL_ROOT=DEBUG

# Oracle Wallet (if using wallet for authentication)
TNS_ADMIN=/path/to/oracle_wallet

# Demo Mode: false (production), true (read-only mode for demos)
APP_DEMO_READONLY=false

# Frontend Base URL
APP_FRONTEND_BASE_URL=http://localhost:3000
```

**Usage:**
```bash
# Copy template to local .env
cp .env.example .env

# Edit .env with your local values
vim .env

# IDE will read .env automatically (if configured)
# Or manually set env vars:
export $(cat .env | xargs)
```

## Onboarding Checklist: Setting Up Secrets

### For Local Development

- [ ] Copy `.env.example` to `.env`
- [ ] Fill in Oracle database credentials (DB_URL, DB_USER, DB_PASS)
- [ ] Fill in Google OAuth2 credentials (register app in Google Cloud Console)
- [ ] Verify IDE loads .env (IntelliJ: Run → Edit Configurations → load from .env)
- [ ] Start backend: `./mvnw spring-boot:run`
- [ ] Verify `/health` returns 200 OK

### For GitHub Actions CI

- [ ] Go to: Settings → Secrets and variables → Actions
- [ ] Add secrets:
  - `DB_URL` (test Oracle or H2, for CI integration tests)
  - `DB_USER`
  - `DB_PASS`
  - `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID`
  - `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET`
- [ ] Verify CI workflow reads secrets: `${{ secrets.DB_URL }}`

### For Fly.io Production

- [ ] Install flyctl CLI: `curl -L https://fly.io/install.sh | sh`
- [ ] Authenticate: `flyctl auth login`
- [ ] Set secrets:
  ```bash
  flyctl secrets set DB_URL=jdbc:oracle:thin:@... --app inventoryservice
  flyctl secrets set DB_USER=... --app inventoryservice
  flyctl secrets set DB_PASS=... --app inventoryservice
  flyctl secrets set GOOGLE_CLIENT_ID=... --app inventoryservice
  flyctl secrets set GOOGLE_CLIENT_SECRET=... --app inventoryservice
  ```
- [ ] Verify: `flyctl secrets list --app inventoryservice`

## Troubleshooting

### Locally: "Database connection refused"

**Symptom:**
```
java.sql.SQLException: Connection refused
```

**Causes:**
- DB_URL wrong (localhost vs. hostname)
- Oracle not running
- Credentials wrong

**Resolution:**
```bash
# Check .env has correct values
cat .env | grep DB_

# Verify Oracle is running
sqlplus -V

# Test connection
sqlplus inventoryuser/password123@localhost:1521/orcl

# Update .env and restart app
```

### CI: "Secrets not found in workflow"

**Symptom:**
```
Error: Secrets.DB_URL is undefined
```

**Cause:**
- Secret not added to GitHub repository settings

**Resolution:**
```bash
# Add to GitHub Secrets:
# Settings → Secrets and variables → Actions → New repository secret

# Then reference in workflow:
env:
  DB_URL: ${{ secrets.DB_URL }}
```

### Fly.io: "Secret injection failed"

**Symptom:**
```
Error: Failed to set secret. Invalid key format.
```

**Cause:**
- Secret name contains invalid characters or too long

**Resolution:**
```bash
# Use SCREAMING_SNAKE_CASE only
# Max 255 characters
# Valid: DB_URL, GOOGLE_CLIENT_ID
# Invalid: db-url, google.client.id, my_very_very_very_long_secret_name_that_exceeds_limits

flyctl secrets set DB_URL=value --app inventoryservice
```

### "Secret visible in logs"

**Symptom:**
```
Error: DB_PASS=secretpassword visible in GitHub Actions logs
```

**Cause:**
- Using `echo` to print secrets or logging passwords

**Resolution:**
```bash
# ❌ WRONG: Don't echo secrets
echo "DB_PASS=$DB_PASS"  # Shows password in logs!

# ✅ RIGHT: Just use the variable
java -Dspring.datasource.password=$DB_PASS ...

# ✅ RIGHT: GitHub Actions masks secrets automatically
${{ secrets.DB_PASS }}  # Logs show: ***
```

## Related Documentation

- **[Resources & Configuration](../resources/environment-specific-config.html)** – Detailed profile and config file explanation
- **[Build & Docker Image](./build-and-docker-image.html)** – How secrets are passed to Docker container
- **[Fly.io Infrastructure](./flyio-infrastructure.html)** – Secret management in Fly.io
- **[Deployment Index](./index.html)** – Deployment overview

---

**Last Updated:** November 2025  
**Audience:** Backend developers, DevOps engineers, new team members, SRE
