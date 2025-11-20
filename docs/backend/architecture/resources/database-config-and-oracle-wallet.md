[⬅️ Back to Resources Index](./index.html)

# Database Configuration & Oracle Wallet

**Overview:** This document explains how database connectivity is configured, including datasource properties, Oracle Wallet integration, and connection pooling strategies for different environments.

---

## Table of Contents

1. [Datasource Configuration Overview](#datasource-configuration-overview)
2. [Configuration by Environment](#configuration-by-environment)
3. [Oracle Wallet Integration](#oracle-wallet-integration)
4. [Connection Pooling (HikariCP)](#connection-pooling-hikaricp)
5. [Database Selection](#database-selection)
6. [Troubleshooting](#troubleshooting)

---

## Datasource Configuration Overview

### Datasource in Spring Boot

The datasource is the **bridge between Java application and database**:

```
Application Code
    ↓
DataSource Bean (from spring.datasource.*)
    ↓
JDBC Driver (Oracle, H2, PostgreSQL, etc.)
    ↓
Physical Database
```

### Configuration Sources

| Source | Configured In | Examples |
|--------|---|---|
| **Base** | `application.yml` | Placeholder values, driver class |
| **Profile Override** | `application-{profile}.yml` | H2 for test, Oracle for prod |
| **Environment Variables** | `.env` or fly.toml secrets | Actual DB credentials |

---

## Configuration by Environment

### Development (Local)

**Configuration Chain:**
```
application.yml (base: ${DB_URL} placeholder)
    ↓
application-{no-profile}.yml (none - uses base)
    ↓
Environment Variables from .env (actual values)
```

**application.yml:**
```yaml
spring:
  datasource:
    url: ${DB_URL}                              # Placeholder
    username: ${DB_USER}                        # Placeholder
    password: ${DB_PASS}                        # Placeholder
    driver-class-name: oracle.jdbc.OracleDriver # Default driver
```

**From .env:**
```bash
# Oracle with Wallet
DB_URL=jdbc:oracle:thin:@service_name
DB_USER=admin
DB_PASS=password
TNS_ADMIN=/path/to/wallet
```

**Result at Runtime:**
```
datasource.url = "jdbc:oracle:thin:@service_name"
datasource.username = "admin"
datasource.password = "password"
```

### Testing

**Configuration Chain:**
```
application.yml (base)
    ↓
application-test.yml (complete override)
    ↓
Environment Variables (not needed - H2 hardcoded)
```

**application-test.yml:**
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:ssp;MODE=Oracle;DATABASE_TO_UPPER=true;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driver-class-name: org.h2.Driver
    username: sa
    password:  # Empty
```

**Why H2?**
- ✅ In-memory (no setup needed)
- ✅ Oracle-compatible (`MODE=Oracle`)
- ✅ Fresh database per test run
- ✅ No credentials needed
- ✅ Fast (no network latency)

### Production (Fly.io)

**Configuration Chain:**
```
application.yml (base)
    ↓
application-prod.yml (overrides)
    ↓
fly.toml (env section + secrets)
```

**application-prod.yml:**
```yaml
spring:
  datasource:
    url: ${DB_URL}                              # From fly secrets
    username: ${DB_USER}                        # From fly secrets
    password: ${DB_PASS}                        # From fly secrets
    driver-class-name: oracle.jdbc.OracleDriver
    hikari:
      connection-timeout: 30000
      validation-timeout: 5000
      maximum-pool-size: 5
      minimum-idle: 2
      max-lifetime: 240000
      idle-timeout: 180000
      connection-test-query: SELECT 1 FROM DUAL
      leak-detection-threshold: 60000
      keepalive-time: 120000
```

**fly.toml (public):**
```toml
[env]
  SPRING_PROFILES_ACTIVE = "prod"
```

**fly secrets (encrypted vault):**
```bash
DB_URL=jdbc:oracle:thin:@prod_db_service
DB_USER=admin
DB_PASS=***
TNS_ADMIN=/etc/oracle_wallet
```

**Result at Runtime:**
```
datasource.url = "jdbc:oracle:thin:@prod_db_service"
datasource.username = "admin"
datasource.password = "***"
datasource.hikari.maximum-pool-size = 5  # Limited for Fly.io 1GB RAM
```

---

## Oracle Wallet Integration

### What is Oracle Wallet?

```
Oracle Wallet
    ↓
Encrypted file directory containing:
  - sqlnet.ora (connection parameters)
  - tnsnames.ora (service names)
  - cwallet.sso (encrypted credentials)
    ↓
Enables secure credential-less connections to Oracle Autonomous DB
```

### How Wallet-Based Connection Works

```
Application
    ↓
Sets: TNS_ADMIN=/path/to/wallet
    ↓
JDBC Driver reads wallet files
    ↓
Driver finds service name in tnsnames.ora
    ↓
Driver retrieves encrypted credentials from cwallet.sso
    ↓
Driver connects to Oracle Autonomous DB (no plaintext password in code!)
```

### Configuration for Wallet

#### Environment Variable

**In .env (local dev):**
```bash
TNS_ADMIN=/Users/yourname/Downloads/Wallet_mydb
```

**In fly.toml secrets (production):**
```bash
fly secrets set TNS_ADMIN="/etc/oracle_wallet"
```

#### JDBC URL Format

**Without Wallet (local Oracle):**
```bash
DB_URL=jdbc:oracle:thin:@localhost:1521/xe
```

**With Wallet (Oracle Autonomous DB):**
```bash
DB_URL=jdbc:oracle:thin:@mydb_high  # Service name from tnsnames.ora
```

Or with explicit wallet path (less common):
```bash
DB_URL=jdbc:oracle:thin:@(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=tcps)(HOST=...)))(CONNECT_DATA=(SERVICE_NAME=...)))
```

#### Wallet File Structure

```
Wallet_mydb/
├── sqlnet.ora              # Connection params
├── tnsnames.ora            # Service name mappings
├── cwallet.sso             # Encrypted credentials
├── ewallet.p12             # PKCS12 keystore (if using mTLS)
├── keystore.jks            # Java keystore (if using mTLS)
└── truststore.jks          # Java truststore
```

### Setting Up Wallet in Fly.io

#### 1. Download Wallet from Oracle Cloud Console

```bash
# Download from Oracle Autonomous Database connection dialog
# Extract to local machine
unzip Wallet_mydb.zip -d /path/to/wallet
```

#### 2. Create Secret in Fly

```bash
fly secrets set TNS_ADMIN="/etc/oracle_wallet"
fly secrets set ORACLE_WALLET_PASSWORD="wallet_password"  # If password-protected
```

#### 3. Copy Wallet into Docker Image

**Dockerfile:**
```dockerfile
FROM maven:3.9-eclipse-temurin-11 as builder
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

FROM eclipse-temurin:11-jre-slim
WORKDIR /app
COPY --from=builder /app/target/inventory-service-*.jar app.jar

# Copy Oracle Wallet
COPY oracle_wallet /etc/oracle_wallet

# Set TNS_ADMIN environment variable
ENV TNS_ADMIN=/etc/oracle_wallet

ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### 4. Deploy

```bash
fly deploy
```

**Runtime:**
- Fly injects TNS_ADMIN secret
- Dockerfile copies wallet to /etc/oracle_wallet
- JDBC driver finds tnsnames.ora and cwallet.sso
- Connection succeeds without plaintext credentials

---

## Connection Pooling (HikariCP)

### What is Connection Pooling?

```
Without Pool (slow):
  Request → Create connection → Execute query → Close connection
  (Each request = ~100-500ms overhead)

With Pool (fast):
  Request → Get from pool → Execute query → Return to pool
  (Each request = ~0-5ms overhead, reuse connections)
```

### HikariCP Configuration

**In application-prod.yml:**

```yaml
spring:
  datasource:
    hikari:
      connection-timeout: 30000          # Max wait for available connection
      validation-timeout: 5000           # Max wait for validation query
      maximum-pool-size: 5               # Max idle connections to maintain
      minimum-idle: 2                    # Min idle connections to maintain
      max-lifetime: 240000               # Max connection age (4 minutes)
      idle-timeout: 180000               # Idle before eviction (3 minutes)
      connection-test-query: SELECT 1 FROM DUAL  # Keep-alive test
      leak-detection-threshold: 60000    # Warn if connection not returned after 60s
      keepalive-time: 120000             # Ping idle connections every 2 minutes
```

### Why These Settings for Fly.io?

| Setting | Value | Reason |
|---------|-------|--------|
| **maximum-pool-size** | 5 | Fly.io has limited RAM (512MB-1GB); 5 concurrent connections is reasonable |
| **minimum-idle** | 2 | Maintain ready connections without wasting memory |
| **max-lifetime** | 240000 (4 min) | Oracle ADB closes idle connections at ~5 min; refresh before that |
| **idle-timeout** | 180000 (3 min) | Evict truly idle connections; keep pool lean |
| **connection-test-query** | `SELECT 1 FROM DUAL` | Test query valid for Oracle (H2 would use `SELECT 1`) |
| **keepalive-time** | 120000 (2 min) | Prevent connection timeout from idle; keep alive with pings |

### Common Pool Issues

#### Issue: "ORA-17008: Closed connection"

**Cause:** Oracle ADB closes idle connections; pool doesn't refresh before timeout

**Solution:** Configure max-lifetime < Oracle timeout
```yaml
max-lifetime: 240000     # 4 minutes (less than Oracle's 5-minute timeout)
keepalive-time: 120000   # Ping every 2 minutes
```

#### Issue: "Connection pool exhausted"

**Cause:** All max-pool-size connections in use; no available for new requests

**Debug:**
```yaml
leak-detection-threshold: 60000  # Log if connection held > 60 seconds
```

**Solution:**
1. Reduce pool size if it's leaking connections
2. Increase max-pool-size if application needs more concurrency
3. Monitor actual usage and adjust accordingly

#### Issue: "too many connections to the database"

**Cause:** Multiple application instances; each creates pool

**Solution:** If scaling horizontally, reduce pool size per instance
```yaml
maximum-pool-size: 3  # If running 3+ instances
```

---

## Database Selection

### H2 vs Oracle vs PostgreSQL

| Aspect | H2 | Oracle | PostgreSQL |
|--------|----|----|-----------|
| **Setup** | None (in-memory) | Wallet + TNS config | docker run postgres |
| **Cost** | Free | Autonomous DB ($$$) | Free (open source) |
| **Performance** | Fast (in-memory) | Fast (network) | Fast |
| **SQL Compatibility** | Partial (MODE=Oracle) | Full Oracle | PostgreSQL |
| **Best For** | Testing | Production | Local dev/staging |

### Decision Tree

```
What environment?
    ├── Local Development
    │   ├── Need to test Oracle behavior? → Use Oracle with wallet
    │   └── Just need working DB? → Use PostgreSQL or H2
    │
    ├── Testing (CI/CD)
    │   └── Use H2 (in-memory, fast, isolated)
    │
    └── Production
        └── Use Oracle Autonomous DB (most secure, scalable)
```

### Example: Switch from H2 to PostgreSQL Locally

**Create application-dev.yml:**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/inventory_db
    driver-class-name: org.postgresql.Driver
    username: postgres
    password: postgres
```

**Activate:**
```bash
export SPRING_PROFILES_ACTIVE=dev
mvn spring-boot:run
```

**Start PostgreSQL:**
```bash
docker run --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:latest
```

---

## Troubleshooting

### Issue: "java.sql.SQLException: Connection refused"

**Cause:** Database not reachable

**Debug:**
```bash
# Check DB_URL is set
echo $DB_URL

# Test connection manually (if Oracle)
sqlplus $DB_USER/$DB_PASS@$DB_URL
```

**Solution:**
1. Verify database is running
2. Check DB_URL is correct (hostname, port, service name)
3. Check firewall allows connection
4. For Oracle Autonomous DB, ensure wallet is accessible

### Issue: "ORA-01017: invalid username/password; logon denied"

**Cause:** Database credentials wrong

**Debug:**
```bash
# Verify credentials
echo $DB_USER $DB_PASS

# Test with sqlplus (Oracle)
sqlplus $DB_USER/$DB_PASS@$DB_URL
```

**Solution:**
1. Update .env or fly secrets with correct credentials
2. Restart application to pick up new values
3. For Oracle Autonomous DB, ensure TNS_ADMIN points to correct wallet

### Issue: "Unexpected Error: java.lang.UnsatisfiedLinkError: no sqljdbc_auth in java.library.path"

**Cause:** SQL Server native auth; doesn't apply to Oracle

**Solution:** Not applicable for Oracle JDBC

### Issue: "The database has not been locked for 1 day and is not available"

**Cause:** Oracle Autonomous DB locked due to 5 days of no activity (Always Free tier)

**Debug:**
```bash
# Check cloud console
# Database state in Oracle Cloud Console
```

**Solution:**
1. Open database in Oracle Cloud Console
2. Click "Start" to reopen
3. Wait for database to become available
4. Retry connection

### Issue: "H2 database locked (test failure)"

**Cause:** Multiple test processes accessing same H2 DB

**Debug:**
```bash
# Check if tests are running in parallel
ps aux | grep java
```

**Solution:**
1. Configure H2 to allow multiple connections:
```yaml
# application-test.yml
spring:
  datasource:
    url: jdbc:h2:mem:ssp;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
```

2. Or disable parallel test execution:
```bash
mvn test -DthreadCount=1
```

---

## Summary

| Environment | Database | Config File | Credentials | Connection Pool |
|-----------|----------|---|---|---|
| **Local Dev** | Oracle/PostgreSQL | application.yml + .env | .env | Default (no pooling config) |
| **Testing** | H2 | application-test.yml | Hardcoded | None (in-memory) |
| **Staging** | Oracle | application-staging.yml | fly secrets | Custom pool config |
| **Production** | Oracle Autonomous | application-prod.yml | fly secrets | HikariCP (5 max, 4-min lifetime) |

---

[⬅️ Back to Resources Index](./index.html)
