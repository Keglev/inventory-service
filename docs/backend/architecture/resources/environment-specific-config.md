[⬅️ Back to Resources Index](./index.html)

# Environment-Specific Configuration

**Overview:** This document explains how different environments (local development, testing, production) are configured using Spring profiles, environment variables, and deployment-specific settings.

---

## Table of Contents

1. [Profile System Overview](#profile-system-overview)
2. [Local Development Setup](#local-development-setup)
3. [Test Profile Configuration](#test-profile-configuration)
4. [Production Profile Configuration](#production-profile-configuration)
5. [Environment Variables by Environment](#environment-variables-by-environment)
6. [Configuration Deployment Flows](#configuration-deployment-flows)
7. [Adding Custom Profiles](#adding-custom-profiles)

---

## Profile System Overview

### What is a Profile?

A Spring profile is a **conditional configuration set** that activates when a specific profile name is set.

```
Profile: Conditional activation mechanism for config files
Syntax: application-{profile}.yml

Examples:
  application-test.yml      → Activated by SPRING_PROFILES_ACTIVE=test
  application-prod.yml      → Activated by SPRING_PROFILES_ACTIVE=prod
  application-dev.yml       → Activated by SPRING_PROFILES_ACTIVE=dev
  application-local.yml     → Activated by SPRING_PROFILES_ACTIVE=local
```

### Available Profiles in This Project

| Profile | File | Activation Method | Use Case | Database |
|---------|------|---|---|---|
| **(none/default)** | application.yml | No env var set | Local development | Environment variable controlled |
| **test** | application-test.yml | `SPRING_PROFILES_ACTIVE=test` | Unit & integration tests | H2 in-memory |
| **prod** | application-prod.yml | `SPRING_PROFILES_ACTIVE=prod` | Production (Fly.io) | Oracle Autonomous DB |

---

## Local Development Setup

### Configuration Flow

```
Local Development (No Profile Set)
    ↓
Loads: application.yml + environment variables
    ↓
Database: Controlled by DB_URL, DB_USER, DB_PASS env vars
    ↓
Can be PostgreSQL or Oracle (depending on what's configured locally)
```

### Setup Instructions

#### 1. Copy Environment Template

```bash
cd ~/path/to/inventory-service
cp .env.example .env
```

#### 2. Edit .env with Your Settings

```bash
nano .env  # or edit in your editor
```

**Example .env:**
```bash
# =========================================================
# Oracle Autonomous Database (Wallet-Based Connection)
# =========================================================
TNS_ADMIN=/path/to/your/wallet_directory
ORACLE_WALLET_PASSWORD=your_wallet_password

# Oracle JDBC connection string
DB_URL=jdbc:oracle:thin:@your_db_service_name
DB_USER=your_db_user
DB_PASS=your_db_password

# =========================================================
# Google OAuth2 Credentials
# =========================================================
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID=your_google_client_id
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET=your_google_client_secret

# =========================================================
# Optional Settings
# =========================================================
APP_DEMO_READONLY=true  # Enable demo mode (read-only)
ENABLE_WALLET_TEST=false
```

#### 3. Source Environment Variables

**Option A: Load from .env file**
```bash
export $(cat .env | xargs)
```

**Option B: Set in IDE**
- **IntelliJ IDEA:** Run → Edit Configurations → Environment variables (paste .env contents)
- **VS Code:** Create `.vscode/launch.json` and set environment variables
- **Spring Boot CLI:** Use `-Dspring.profiles.active` system property

#### 4. Run Application

```bash
# Uses application.yml + .env variables
# No profile specified, so application-*.yml NOT loaded
mvn spring-boot:run

# Or with IDE run button (uses env vars from IDE config)
```

### Database Options for Local Dev

#### Option 1: Oracle with Wallet (Recommended for Fly.io Testing)

```bash
# Set in .env
DB_URL=jdbc:oracle:thin:@service_name
DB_USER=admin
DB_PASS=password
TNS_ADMIN=/path/to/wallet
```

**Pros:** Tests production setup locally
**Cons:** Requires wallet download from Oracle Cloud

#### Option 2: Local PostgreSQL

```bash
# Set in .env
DB_URL=jdbc:postgresql://localhost:5432/inventory_db
DB_USER=postgres
DB_PASS=postgres

# Start PostgreSQL (if using Docker)
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres
```

**Pros:** Easy setup, no cloud dependency
**Cons:** Different from production (Oracle)

#### Option 3: H2 In-Memory (Quickest)

```bash
# Use test profile instead
export SPRING_PROFILES_ACTIVE=test
mvn spring-boot:run

# Or create application-dev.yml with H2 config
```

**Pros:** No database setup needed
**Cons:** Data lost on restart

---

## Test Profile Configuration

### Activation

```bash
# Option 1: Maven
mvn clean test                          # Automatically uses test profile

# Option 2: Explicitly set profile
export SPRING_PROFILES_ACTIVE=test
mvn spring-boot:run

# Option 3: Java system property
java -Dspring.profiles.active=test -jar app.jar
```

### What Happens When Test Profile Activates

```
SPRING_PROFILES_ACTIVE=test
    ↓
application-test.yml loads (overrides application.yml)
    ↓
Configuration Applied:
  - Datasource: H2 in-memory database
  - JPA: ddl-auto=create-drop (fresh schema per test)
  - Logging: DEBUG for SQL, TRACE for parameters
  - Server: port 8081
  - Management: health endpoint exposed with details
    ↓
No environment variables needed
```

### Test Profile Settings

```yaml
# application-test.yml
spring:
  datasource:
    url: jdbc:h2:mem:ssp;MODE=Oracle;...    # H2 in-memory
    driver-class-name: org.h2.Driver
    username: sa
    password:  # Empty

  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: create-drop                 # Fresh DB per test

  security:
    oauth2:
      client:
        registration:
          google:
            client-id: test-client-id       # Dummy values
            client-secret: test-client-secret

logging:
  level:
    '[org.hibernate.SQL]': DEBUG             # Show SQL
    '[org.hibernate.type.descriptor.sql]': trace # Show parameters

server:
  port: 8081

management:
  endpoint:
    health:
      show-details: always                   # Show health details
```

### Benefits of Test Profile

✅ **H2 Database:**
- Fast: In-memory, no network latency
- Isolated: Fresh database per test run
- Oracle-compatible: `MODE=Oracle` emulates Oracle SQL
- No setup: No separate database instance needed

✅ **Debug Logging:**
- SQL statements printed to console
- SQL parameters logged (useful for debugging)
- Health details always shown

✅ **No External Dependencies:**
- OAuth2 uses dummy credentials (no real Google API calls)
- No need for environment variables
- Tests are deterministic and isolated

---

## Production Profile Configuration

### How Production Configuration Is Activated

```
Fly.io Deployment
    ↓
Reads fly.toml
    ↓
[env] section sets: SPRING_PROFILES_ACTIVE = "prod"
    ↓
application-prod.yml loads (overrides application.yml)
    ↓
Oracle database configured with connection pooling
```

### fly.toml Configuration

**Location:** Root of project
**Purpose:** Tells Fly.io how to deploy the application

```toml
# fly.toml
[env]
  SPRING_PROFILES_ACTIVE = "prod"
  APP_DEMO_READONLY = "true"
  APP_FRONTEND_BASE_URL = "https://inventoryservice.fly.dev"
  APP_FRONTEND_LANDING_PATH = "/auth"

[vm]
  size = "shared-cpu-1x"        # Lightweight machine
  memory = 1024                 # 1 GB RAM
```

### Secrets Management in fly.toml

**Secrets are NOT in fly.toml** (for security). They're set separately:

```bash
# Set secrets via Fly CLI
fly secrets set DB_URL="jdbc:oracle:thin:@..."
fly secrets set DB_USER="admin"
fly secrets set DB_PASS="password"
fly secrets set SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID="..."
fly secrets set SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET="..."
fly secrets set TNS_ADMIN="/path/to/wallet"
```

**Why Separate?**
- fly.toml is committed to git (public)
- Secrets are stored in Fly's vault (encrypted, private)
- Runtime environment receives both: fly.toml + secrets

### Production Profile Settings

```yaml
# application-prod.yml
spring:
  datasource:
    url: ${DB_URL}                          # From fly secrets
    username: ${DB_USER}                    # From fly secrets
    password: ${DB_PASS}                    # From fly secrets
    driver-class-name: oracle.jdbc.OracleDriver
    hikari:
      maximum-pool-size: 5                  # Small pool for limited RAM
      connection-timeout: 30000             # 30 sec timeout
      max-lifetime: 240000                  # 4 minutes

  jpa:
    hibernate:
      ddl-auto: update                      # Update schema (no data loss)
    show-sql: false                         # No SQL logging (performance)

  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID}
            client-secret: ${SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET}

logging:
  level:
    '[com.smartsupplypro]': INFO            # Application logs only
    root: INFO                              # No framework debug logs

management:
  endpoint:
    health:
      show-details: never                   # Hide details for security
```

### Deployment Process

```
Step 1: Commit & Push Code
  git push origin main
    ↓
Step 2: Fly.io Detects Changes
  GitHub webhook triggers Fly deployment
    ↓
Step 3: Build Docker Image
  Reads Dockerfile
  Compiles Spring Boot application
  Copies application-prod.yml into image
    ↓
Step 4: Start Container
  Sets SPRING_PROFILES_ACTIVE=prod (from fly.toml)
  Injects secrets as environment variables
  Spring loads application.yml + application-prod.yml + secrets
    ↓
Step 5: Application Running in Production
  Using Oracle Autonomous Database
  Connection pooling optimized for Fly.io
  Logging at INFO level (no debug noise)
```

---

## Environment Variables by Environment

### Local Development

**Source:** `.env` file (git-ignored, not committed)

```bash
# Database (Oracle or PostgreSQL)
DB_URL=jdbc:oracle:thin:@localhost:1521/xe
DB_USER=inventory_admin
DB_PASS=dev_password

# OAuth2 (from Google Cloud Console)
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID=abc123.apps.googleusercontent.com
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET=secret_xyz

# Oracle Wallet (if using Oracle)
TNS_ADMIN=/Users/yourname/oracle_wallets/ssp_wallet
ORACLE_WALLET_PASSWORD=wallet_password
```

**Not Set:** `SPRING_PROFILES_ACTIVE` (defaults to no profile)

### Testing

**Source:** `testcontainers.properties` + JUnit setup

```bash
# Set profile
export SPRING_PROFILES_ACTIVE=test

# No environment variables needed
# H2 and dummy OAuth2 configured in application-test.yml
```

### Production

**Source:** `fly.toml` (config) + Fly secrets (encrypted vault)

```toml
# fly.toml (committed to git)
[env]
  SPRING_PROFILES_ACTIVE = "prod"
  APP_DEMO_READONLY = "true"
  APP_FRONTEND_BASE_URL = "https://inventoryservice.fly.dev"
```

```bash
# fly secrets (encrypted, NOT in fly.toml)
fly secrets set DB_URL="jdbc:oracle:thin:@..."
fly secrets set DB_USER="admin"
fly secrets set DB_PASS="***"
fly secrets set SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID="***"
fly secrets set SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET="***"
fly secrets set TNS_ADMIN="/etc/oracle_wallet"
```

---

## Configuration Deployment Flows

### Local Development Flow

```
Developer runs:
  export $(cat .env | xargs)
  mvn spring-boot:run
         ↓
Spring loads: application.yml (base)
              + environment variables from .env
         ↓
Result: Configured with database from .env
```

### Test Execution Flow

```
CI/Developer runs:
  mvn clean test
         ↓
Maven automatically sets: SPRING_PROFILES_ACTIVE=test
         ↓
Spring loads: application.yml (base)
              + application-test.yml (overrides)
         ↓
Result: H2 database, debug logging, test config
```

### Production Deployment Flow

```
Developer pushes:
  git push origin main
         ↓
GitHub webhook → Fly.io
         ↓
Fly reads: fly.toml (config)
           Fly Vault (secrets)
         ↓
Docker build:
  SPRING_PROFILES_ACTIVE=prod (from fly.toml)
  DB_URL=${secret} (from Fly Vault)
         ↓
Spring loads: application.yml (base)
              + application-prod.yml (overrides)
              + environment variables (secrets)
         ↓
Result: Oracle database, INFO logging, production config
```

---

## Adding Custom Profiles

### Example: Adding a "staging" Profile

#### 1. Create File

```bash
touch src/main/resources/application-staging.yml
```

#### 2. Define Configuration

```yaml
# application-staging.yml
spring:
  datasource:
    url: ${DB_URL}                      # Use staging Oracle DB
    hikari:
      maximum-pool-size: 3              # Smaller pool than prod
  
  jpa:
    show-sql: true                      # Debug logging in staging
  
  logging:
    level:
      '[com.smartsupplypro]': DEBUG     # More verbose than prod
```

#### 3. Activate Profile

```bash
# Option 1: Environment variable
export SPRING_PROFILES_ACTIVE=staging
mvn spring-boot:run

# Option 2: Maven command-line
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=staging"

# Option 3: IDE (Run Configuration)
```

#### 4. Update fly.toml (if deploying to Fly)

```toml
[env]
  SPRING_PROFILES_ACTIVE = "staging"
```

---

## Common Issues

### Issue: "Profile Not Applied"

**Problem:** Configuration changes don't take effect

**Debug:**
```bash
# Check active profiles in startup logs
# Look for: "The following profiles are active: prod,test"

# Or check programmatically
curl http://localhost:8081/actuator/env | grep activeProfiles
```

**Solution:** 
1. Verify SPRING_PROFILES_ACTIVE is set correctly
2. Restart application
3. Check for typos in profile name

### Issue: "Environment Variables Not Substituted"

**Problem:** Placeholder shows instead of value (e.g., `${DB_URL}`)

**Cause:** Environment variable not exported

**Solution:**
```bash
# Verify variable is set
echo $DB_URL

# If empty, source .env
export $(cat .env | xargs)

# Restart application
mvn spring-boot:run
```

### Issue: "Wrong Configuration Applied"

**Problem:** Production config accidentally used in development

**Debug:**
```bash
# Check which file is active
ps aux | grep spring.profiles.active
env | grep SPRING_PROFILES

# Check logs for loaded config
```

**Solution:**
1. Explicitly unset profile: `unset SPRING_PROFILES_ACTIVE`
2. Or set correct profile: `export SPRING_PROFILES_ACTIVE=test`
3. Restart application

---

## Summary Table

| Aspect | Local Dev | Test | Production |
|--------|-----------|------|-----------|
| **Profile** | (none) | test | prod |
| **Config File** | application.yml only | application-test.yml | application-prod.yml |
| **Database** | Environment-controlled | H2 in-memory | Oracle Autonomous |
| **DB URL** | From .env | Hardcoded (H2) | From fly secrets |
| **Logging** | DEBUG (verbose) | DEBUG/TRACE | INFO (minimal) |
| **Show SQL** | true | true | false |
| **Activation** | `.env` sourcing | `mvn test` or env var | fly.toml |
| **Secrets** | .env file (git-ignored) | Dummy (test-client-id) | Fly vault (encrypted) |
| **Health Details** | Via Actuator | Always | Never |

---

[⬅️ Back to Resources Index](./index.html)
