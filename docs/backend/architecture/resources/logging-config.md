[⬅️ Back to Resources Index](./index.html)

# Logging Configuration

**Overview:** This document explains how logging is configured across different Spring Boot profiles and environments.

---

## Table of Contents

1. [Logging Architecture](#logging-architecture)
2. [Configuration by Profile](#configuration-by-profile)
3. [Logger Levels Explained](#logger-levels-explained)
4. [Log Output Locations](#log-output-locations)
5. [Debugging with Logs](#debugging-with-logs)
6. [Best Practices](#best-practices)

---

## Logging Architecture

### Logging Stack

```
Spring Boot Application
    ↓
SLF4J (Logging Facade)
    ↓
Logback (Default Implementation)
    ↓
Output: Console | File | Both
```

**Why This Stack?**
- **SLF4J:** Abstract logging API (can switch implementations)
- **Logback:** Fast, efficient, XML-free configuration (uses .yml)
- **Spring Boot:** Auto-configures based on application.yml

### Configuration Source

Logging is configured in `application*.yml`:

```yaml
logging:
  level:
    '[org.springframework]': DEBUG      # Specific logger
    root: INFO                         # Default for all
  file:
    name: logs/application.log         # Output file
```

---

## Configuration by Profile

### Base Configuration (application.yml)

```yaml
logging:
  level:
    '[org.springframework.jdbc.core]': DEBUG     # JDBC queries (dev/debugging)
    '[org.hibernate.SQL]': DEBUG                 # Hibernate SQL statements
```

**What This Does:**
- Logs all JDBC queries (useful for understanding database interactions)
- Logs Hibernate SQL (shows what JPA generates)
- Root logger defaults to INFO (not set, uses Spring Boot default)

**Use Case:** Local development - need to understand database operations

### Test Profile (application-test.yml)

```yaml
logging:
  file:
    name: logs/test-application.log
  level:
    '[org.hibernate.SQL]': DEBUG                 # SQL statements
    '[org.hibernate.type.descriptor.sql]': trace # SQL parameter values
    root: INFO
```

**What This Does:**
- Writes logs to file for CI/CD test artifacts
- Logs all SQL statements (useful for test debugging)
- **TRACE level:** Shows SQL parameter values
  - Example: `SELECT * FROM users WHERE id = ?` becomes `... WHERE id = 123`

**Use Case:** Testing - capture detailed logs for failed test diagnostics

### Production Profile (application-prod.yml)

```yaml
logging:
  level:
    '[com.smartsupplypro]': INFO                 # Application logs: informative
    root: INFO                                   # Framework: minimal noise
```

**What This Does:**
- Application logs at INFO level (important events only)
- No DEBUG/TRACE logging (reduces log volume)
- No SQL logging (performance, security)

**Use Case:** Production - minimal logging for performance and security

---

## Logger Levels Explained

### Log Levels (from most to least verbose)

| Level | Use Case | Example | Production? |
|-------|----------|---------|-------------|
| **TRACE** | Most detailed debugging | SQL parameters, detailed method entry/exit | ❌ Never |
| **DEBUG** | Development & debugging | SQL queries, bean initialization, config loading | ❌ No |
| **INFO** | Important business events | User login, batch job completion, warnings | ✅ Yes |
| **WARN** | Something unexpected | Deprecated API use, fallback behavior | ✅ Yes |
| **ERROR** | Error condition | Exception stack traces, failed operations | ✅ Yes |
| **FATAL** | System failure | Application crash, unrecoverable error | ✅ Yes |

### How Levels Work

```
Logger configured at: INFO
Logs output: INFO, WARN, ERROR, FATAL
Logs suppressed: DEBUG, TRACE

Logger configured at: DEBUG
Logs output: DEBUG, INFO, WARN, ERROR, FATAL
Logs suppressed: TRACE

Logger configured at: TRACE
Logs output: ALL (most verbose)
```

### Specific Loggers in This Project

#### Spring Framework Loggers

```yaml
logging:
  level:
    '[org.springframework.jdbc.core]': DEBUG           # JDBC queries
    '[org.springframework.jdbc.core.JdbcTemplate]': DEBUG
    '[org.springframework.security]': DEBUG            # Security debugging
    '[org.springframework.security.web.access]': DEBUG # Security filter chain
    '[org.springframework.boot]': DEBUG                # Boot startup
```

#### Hibernate / JPA Loggers

```yaml
logging:
  level:
    '[org.hibernate.SQL]': DEBUG                       # Generated SQL
    '[org.hibernate.type.descriptor.sql]': TRACE      # SQL parameters
    '[org.hibernate.stat]': DEBUG                      # Statistics
    '[org.hibernate.validator]': DEBUG                 # Validation
```

#### Database Connection Loggers

```yaml
logging:
  level:
    '[org.hibernate.engine.transaction]': DEBUG        # Transaction handling
    '[com.zaxxer.hikari]': DEBUG                       # HikariCP pool
```

#### Custom Application Loggers

```yaml
logging:
  level:
    '[com.smartsupplypro.inventory]': DEBUG            # All app classes
    '[com.smartsupplypro.inventory.security]': TRACE   # Just security package
    '[com.smartsupplypro.inventory.service]': DEBUG    # Just service layer
```

### Logger Hierarchy

```
Loggers follow a hierarchical naming convention:

root (implicit, level: INFO by default)
├── org (Spring framework loggers)
│   ├── springframework
│   │   ├── jdbc
│   │   ├── security
│   │   └── boot
│   ├── hibernate
│   └── ...
├── com (Application loggers)
│   └── smartsupplypro
│       ├── inventory
│       │   ├── service
│       │   ├── security
│       │   └── controller
│       └── ...
└── ...

Setting level on "com.smartsupplypro" affects:
  com.smartsupplypro.inventory.service
  com.smartsupplypro.inventory.controller
  (all child packages)
```

---

## Log Output Locations

### Default: Console Only

**application.yml (Base)**
- Logs go to **console/stdout** only
- Useful for development (watch output in terminal)

**Activation:**
```bash
mvn spring-boot:run
# Logs appear in terminal window
```

### Test: Console + File

**application-test.yml**
```yaml
logging:
  file:
    name: logs/test-application.log
```

**What Happens:**
- Logs go to console AND file
- File: `logs/test-application.log`
- Useful for CI/CD artifact preservation

**Access test logs:**
```bash
tail -f logs/test-application.log
```

### File Naming Convention

```
logs/
├── test-application.log      (test profile)
├── application.log           (prod profile, if configured)
└── application-YYYY-MM-DD.HH.log  (rolling files, if configured)
```

### Log File Rotation (Future Enhancement)

Could be configured:
```yaml
logging:
  file:
    name: logs/application.log
    max-size: 10MB              # Rotate when file reaches 10MB
    max-history: 30             # Keep last 30 files
```

---

## Debugging with Logs

### Scenario 1: Understanding SQL Generation

**Enable:**
```yaml
logging:
  level:
    '[org.hibernate.SQL]': DEBUG
    '[org.hibernate.type.descriptor.sql]': TRACE
```

**Output:**
```
2024-11-20 14:23:45.123 DEBUG 12345 [main] org.hibernate.SQL
  : select inventoryi0_.id as id1_2_0_, inventoryi0_.name as name2_2_0_
    from inventory_item inventoryi0_
    where inventoryi0_.id=?

2024-11-20 14:23:45.456 TRACE 12345 [main] org.hibernate.type.descriptor.sql
  : binding parameter [1] as [VARCHAR] - [item-123]
```

**Useful For:**
- ✅ Finding N+1 query problems
- ✅ Optimizing slow queries
- ✅ Understanding ORM behavior

### Scenario 2: Debugging Security

**Enable:**
```yaml
logging:
  level:
    '[org.springframework.security]': DEBUG
    '[org.springframework.security.web.access]': DEBUG
```

**Output:**
```
2024-11-20 14:24:10.123 DEBUG 12345 [main] org.springframework.security.web.access.AntPathRequestMatcher
  : Checking match of request : '/api/admin/users'; against '/admin/**'

2024-11-20 14:24:10.456 DEBUG 12345 [main] org.springframework.security.config.annotation.web.AbstractRequestMatcherRegistry
  : Configured security contexts using SecurityContextRepository [...]
```

**Useful For:**
- ✅ Understanding which filters are matching
- ✅ Debugging authentication failures
- ✅ Tracing authorization decisions

### Scenario 3: Database Connection Pool Issues

**Enable:**
```yaml
logging:
  level:
    '[com.zaxxer.hikari]': DEBUG
```

**Output:**
```
2024-11-20 14:25:00.123 DEBUG 12345 [main] com.zaxxer.hikari.HikariConfig
  : Maximum pool size is set to 5

2024-11-20 14:25:05.456 DEBUG 12345 [main] com.zaxxer.hikari.pool.HikariPool
  : Connection added to pool. Pool size: 1

2024-11-20 14:25:10.789 WARN 12345 [main] com.zaxxer.hikari.pool.HikariPool
  : Thread starvation or clock leap detected (hc=0, s=2, a=1, sr=0, i=2)
```

**Useful For:**
- ✅ Monitoring connection pool behavior
- ✅ Detecting connection leaks
- ✅ Understanding pool exhaustion issues

### Scenario 4: Application Startup Issues

**Enable:**
```yaml
logging:
  level:
    '[org.springframework.boot]': DEBUG
```

**Output:**
```
2024-11-20 14:26:00.123 INFO  12345 [main] org.springframework.boot.StartupInfoLogger
  : Starting InventoryServiceApplication v0.0.1-SNAPSHOT

2024-11-20 14:26:00.456 INFO  12345 [main] org.springframework.boot.StartupInfoLogger
  : The following profiles are active: test

2024-11-20 14:26:02.789 INFO  12345 [main] org.springframework.boot.StartupInfoLogger
  : Started InventoryServiceApplication in 2.5 seconds (JVM running for 3.1)
```

**Useful For:**
- ✅ Confirming correct profile activation
- ✅ Measuring startup time
- ✅ Finding missing beans or configuration

---

## Best Practices

### 1. Never Set Root Logger to DEBUG in Production

**❌ Bad:**
```yaml
# application-prod.yml
logging:
  level:
    root: DEBUG  # Too verbose!
```

**✅ Good:**
```yaml
# application-prod.yml
logging:
  level:
    '[com.smartsupplypro]': INFO  # Just app logs
    root: INFO                     # Framework at INFO
```

**Why?**
- DEBUG level generates massive log volumes
- Impacts performance (I/O bound)
- Increases storage costs
- Makes real errors hard to find

### 2. Use Hierarchical Logger Names

**❌ Bad:**
```yaml
logging:
  level:
    '[org.springframework.security.web.access.intercept.FilterSecurityInterceptor]': DEBUG
    '[org.springframework.security.web.context.SecurityContextPersistenceFilter]': DEBUG
    '[org.springframework.security.oauth2.client]': DEBUG
```

**✅ Good:**
```yaml
logging:
  level:
    '[org.springframework.security]': DEBUG  # Covers all security loggers
```

**Why?**
- Simpler configuration
- Consistent levels across related loggers
- Easier to understand at a glance

### 3. Include Context in Application Logs

**❌ Bad (code):**
```java
logger.info("User deleted");
```

**✅ Good (code):**
```java
logger.info("User deleted: userId={}, deletedBy={}", userId, currentUser);
```

**Why?**
- Easier to correlate logs
- Better for debugging
- Auditable operations

### 4. Use Appropriate Log Levels

**❌ Bad:**
```java
logger.error("User not found");           // Not an error, more like INFO
logger.debug("Query executed");           // Should be TRACE
```

**✅ Good:**
```java
logger.info("User not found: {}", userId);           // Expected behavior
logger.trace("Executing query: {}", sql);            // Debug details
```

### 5. Log Exceptions with Stack Traces

**❌ Bad:**
```java
catch (Exception e) {
    logger.error("Operation failed");     // No stack trace!
}
```

**✅ Good:**
```java
catch (Exception e) {
    logger.error("Operation failed", e);  // Includes stack trace
}
```

### 6. Use Parameterized Messages (Not String Concatenation)

**❌ Bad:**
```java
logger.debug("Processing user: " + user.getName());  // Always concatenates
```

**✅ Good:**
```java
logger.debug("Processing user: {}", user.getName()); // Only if DEBUG enabled
```

**Why?**
- More efficient (message formatting skipped if level not enabled)
- Less garbage collection pressure

---

## Log File Analysis

### View Test Logs

```bash
# Stream log output
tail -f logs/test-application.log

# Search for errors
grep ERROR logs/test-application.log

# Count log messages by level
grep -c "ERROR" logs/test-application.log
grep -c "WARN" logs/test-application.log
```

### Parse Logs for Metrics

```bash
# Find slowest queries
grep "DEBUG org.hibernate.SQL" logs/test-application.log | head -20

# Find all authentication failures
grep "DEBUG org.springframework.security" logs/test-application.log | grep -i "denied"

# Monitor connection pool
grep "com.zaxxer.hikari" logs/test-application.log
```

---

## Common Issues

### Issue: "Logs are empty or missing"

**Cause:** Wrong log level configured

**Solution:**
1. Verify configuration is loaded: `echo $SPRING_PROFILES_ACTIVE`
2. Check correct profile's application-{profile}.yml is being read
3. Restart application

### Issue: "Too many logs in production"

**Cause:** DEBUG level set in production config

**Solution:**
1. Verify application-prod.yml sets INFO level
2. Check no environment variable overrides it
3. Redeploy to apply changes

### Issue: "Can't find test logs in CI/CD"

**Cause:** Test logs not captured

**Solution:**
1. Verify `logging.file.name` is set in application-test.yml
2. Check CI/CD uploads `logs/` directory as artifact
3. Ensure test runs completed (logs written on shutdown)

---

## Summary Table

| Profile | Root Level | SQL Level | Output | Use Case |
|---------|-----------|-----------|--------|----------|
| **Local (dev)** | INFO | DEBUG | Console | Development |
| **Test** | INFO | DEBUG/TRACE | File | CI/CD diagnostics |
| **Prod** | INFO | OFF | File* | Production monitoring |

*Production file logging not configured in this project (currently console only), but can be added.

---

[⬅️ Back to Resources Index](./index.html)
