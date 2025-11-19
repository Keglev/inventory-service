[⬅️ Back to Config Overview](./index.md)

# Database and Oracle Wallet Configuration

## Overview

Database configuration in the Inventory Service spans:

- **Spring Data** properties in `application*.yml`
- **Oracle JDBC Driver** (`oracle.jdbc.OracleDriver`)
- **Oracle Wallet** for secure credential storage
- **Connection pooling** (HikariCP) with Oracle-specific tuning

This document covers how these pieces work together to establish a secure, production-grade database connection.

---

## Spring Datasource Configuration

### Base Configuration (application.yml)

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USER}
    password: ${DB_PASS}
    driver-class-name: oracle.jdbc.OracleDriver
```

**Key points:**

- **No hardcoded credentials**: All sensitive values come from environment variables
- **Oracle JDBC driver** is declared explicitly (included in `pom.xml`)
- **Requires `DB_URL`, `DB_USER`, `DB_PASS` environment variables** to be set

### Production Configuration (application-prod.yml)

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USER}
    password: ${DB_PASS}
    driver-class-name: oracle.jdbc.OracleDriver
    hikari:
      connection-timeout: 30000        # 30 seconds to establish connection
      validation-timeout: 5000         # 5 seconds to validate
      maximum-pool-size: 5             # Small pool for 1GB RAM (Fly.io)
      minimum-idle: 2                  # Keep 2 idle connections ready
      max-lifetime: 240000             # 4 minutes (less than Oracle's 5-min timeout)
      idle-timeout: 180000             # 3 minutes before evicting idle connections
      connection-test-query: SELECT 1 FROM DUAL  # Oracle health check
      leak-detection-threshold: 60000  # 60 seconds - flag leaked connections
      keepalive-time: 120000           # 2-min keepalive ping
```

#### Why These Settings?

Oracle Autonomous Database is aggressive about closing idle connections (5-minute timeout). These settings prevent `ORA-17008: Closed connection` errors:

| Setting | Value | Reason |
|---------|-------|--------|
| `max-lifetime` | 240000 (4 min) | Close connections before Oracle does |
| `idle-timeout` | 180000 (3 min) | Evict idle connections quickly |
| `keepalive-time` | 120000 (2 min) | Ping connections periodically |
| `connection-test-query` | `SELECT 1 FROM DUAL` | Validate Oracle connections |
| `maximum-pool-size` | 5 | Limited by Fly.io's 1GB RAM |

---

## Database URL Format

### Standard Oracle Connection

```
jdbc:oracle:thin:@hostname:port:sid
jdbc:oracle:thin:@hostname:port/service-name
```

### Oracle Autonomous Database (Cloud)

```
jdbc:oracle:thin:@adb-nxxxxxx.database.oraclecloud.com:1521/xxxxx_medium.cloud.oracle.com
```

### Oracle Database in Docker (Local)

```
jdbc:oracle:thin:@localhost:1521/xe
```

### Oracle Wallet Connection

```
jdbc:oracle:thin:@inventorydb_medium?TNS_ADMIN=/opt/oracle_wallet
```

- **`TNS_ADMIN`** environment variable points to wallet directory
- Wallet contains encrypted credentials and connection details

---

## Oracle Wallet Setup

### What is Oracle Wallet?

Oracle Wallet is a encrypted file containing:
- Database credentials (username, password)
- Connection details (host, port, service name)
- SSL certificates (for secure connections)

It eliminates hardcoding credentials in the connection string.

### Wallet Location in This Project

```
oracle_wallet/
├── flysecrets.env                    # Environment variables for Fly
├── oracle_wallet_b64.txt             # Base64-encoded wallet (safe for Git)
└── TNS_ADMIN/
    ├── cwallet.sso                   # Encrypted wallet file
    ├── ewallet.p12                   # PKCS12 format wallet
    ├── sqlnet.ora                    # Oracle client config
    ├── tnsnames.ora                  # Alias definitions
    └── ... (other wallet files)
```

### Decoding the Wallet

The wallet is stored as **Base64** in Git for safety:

```bash
# Decode the wallet
base64 -d oracle_wallet/oracle_wallet_b64.txt > oracle_wallet.tar.gz

# Extract
tar -xzf oracle_wallet.tar.gz

# Set environment variable for Oracle client
export TNS_ADMIN=$(pwd)/TNS_ADMIN
```

### Spring Boot with Wallet

```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@inventorydb_medium?TNS_ADMIN=/opt/oracle_wallet
    # Username and password from wallet, not connection string
    username: ${DB_USER}
    password: ${DB_PASS}
```

The wallet handles encryption; Spring just provides credentials.

---

## Database Selection by Profile

### Test Profile (application-test.yml)

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:ssp;MODE=Oracle;DATABASE_TO_UPPER=true;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driver-class-name: org.h2.Driver
    username: sa
    password:
```

**Why H2?**
- In-memory database
- Fast startup (no network call)
- Oracle-compatible mode (`MODE=Oracle`)
- Isolated per test run
- No credentials needed

### Default Profile (application.yml)

```yaml
spring:
  datasource:
    url: ${DB_URL}
    driver-class-name: oracle.jdbc.OracleDriver
```

**Expects:**
- Environment variables: `DB_URL`, `DB_USER`, `DB_PASS`
- Requires manual setup (local PostgreSQL/Oracle instance)

### Production Profile (application-prod.yml)

```yaml
spring:
  datasource:
    url: ${DB_URL}
    driver-class-name: oracle.jdbc.OracleDriver
    hikari: (pool settings above)
```

**Uses:**
- Oracle Autonomous Database on cloud
- Credentials from secure environment (Fly.io secrets)
- Connection pool tuning for production

---

## Hibernate Configuration

### Base (all profiles)

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none                  # Don't auto-create schema
    show-sql: true                    # Log SQL (disable in prod)
```

### Production

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update                # Update schema if needed
    show-sql: false                   # Disable for performance
    properties:
      hibernate:
        dialect: org.hibernate.dialect.OracleDialect
```

### Test

```yaml
spring:
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: create-drop           # Fresh schema each test
    show-sql: true
    properties:
      hibernate:
        '[format_sql]': true
```

---

## Connection String Examples

### Local Development

```bash
export DB_URL="jdbc:oracle:thin:@localhost:1521/xe"
export DB_USER="inventory_admin"
export DB_PASS="your-password"
export SPRING_PROFILES_ACTIVE=""  # No profile = default
mvn spring-boot:run
```

### Testing

```bash
export SPRING_PROFILES_ACTIVE="test"
mvn clean test
# H2 handles DB; no env vars needed
```

### Production (Fly.io)

```toml
# fly.toml
[env]
  SPRING_PROFILES_ACTIVE = "prod"

# Secrets set separately:
# fly secrets set DB_URL="jdbc:oracle:thin:@..." DB_USER="..." DB_PASS="..."
```

### Docker with Oracle

```dockerfile
FROM eclipse-temurin:17-jre
COPY target/inventory-service-*.jar app.jar
COPY oracle_wallet /opt/oracle_wallet
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "/app.jar"]
```

```bash
docker run \
  -e DB_URL="jdbc:oracle:thin:@oracle-cloud:1521/xe" \
  -e DB_USER="admin" \
  -e DB_PASS="***" \
  inventory-service:latest
```

---

## Troubleshooting

### ORA-17008: Closed Connection

**Cause:** Connection pool doesn't refresh before Oracle closes idle connections.

**Solution:** Adjust `application-prod.yml`:

```yaml
hikari:
  max-lifetime: 240000              # 4 minutes
  keepalive-time: 120000            # 2-min pings
```

### Cannot Create Connection

**Cause:** Missing environment variables or invalid connection string.

**Check:**

```bash
# Verify env vars are set
echo $DB_URL
echo $DB_USER

# Test connection manually
sqlplus $DB_USER/$DB_PASS@$DB_URL
```

### H2 Database Locked

**Cause:** Multiple test processes accessing same in-memory DB.

**Solution:** Configure test profile to allow multiple connections:

```yaml
url: jdbc:h2:mem:ssp;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
```

### No Suitable Driver

**Cause:** JDBC driver not in classpath.

**Check pom.xml:**

```xml
<dependency>
  <groupId>com.oracle.database.jdbc</groupId>
  <artifactId>ojdbc11</artifactId>
</dependency>
```

---

## Summary

| Aspect | Test | Production |
|--------|------|-----------|
| **Database** | H2 in-memory | Oracle Autonomous DB |
| **URL** | `jdbc:h2:mem:...` | `jdbc:oracle:thin:@host:port/sid` |
| **Driver** | `org.h2.Driver` | `oracle.jdbc.OracleDriver` |
| **Credentials** | Hardcoded (safe for test) | From environment (secure) |
| **Pool Size** | Default | 5 (Fly.io limited) |
| **Wallet** | N/A | `/opt/oracle_wallet` |
| **DDL Auto** | `create-drop` | `update` |
| **Show SQL** | true | false |

---

[⬅️ Back to Config Overview](./index.md)
