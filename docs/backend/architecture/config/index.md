[⬅️ Back to Architecture](../index.md)

# Configuration Overview

This section documents how the Inventory Service is configured through Spring Boot, property files, environment variables, and Java configuration classes. Configuration drives behavior across environments (local, test, production) without code changes.

## What is Configuration?

In Spring Boot, **configuration** means:

- **Property files** (`application.yml`, `application-prod.yml`, etc.) define environment-specific values
- **Java classes** with `@Configuration` and `@ConfigurationProperties` create beans and bind properties
- **Environment variables** override properties at runtime (highest priority)
- **Profiles** select which property files and beans are active

## Configuration Layers

```
Environment Variables (highest priority)
    ↓
application-{profile}.yml
    ↓
application.yml (base defaults)
    ↓
Java Configuration Classes (@Configuration)
    ↓
Default Values (lowest priority)
```

## Directory Structure

Configuration sources are organized across two main areas:

### Property Files (`src/main/resources/`)

```
src/main/resources/
├── application.yml              # Base config, shared across all environments
├── application-prod.yml         # Production overrides
├── application-test.yml         # Test/CI overrides
└── application.properties       # App name (used by Spring Boot)
```

### Java Configuration (`src/main/java/.../config/`)

```
src/main/java/com/smartsupplypro/inventory/config/
├── AppProperties.java           # Custom app properties (demo mode, frontend URLs)
├── SecurityConfig.java          # OAuth2 and method-level security setup
├── SecurityAuthorizationHelper.java  # Authorization rules for endpoints
├── SecurityEntryPointHelper.java     # Authentication failure handling
├── SecurityFilterHelper.java         # API vs browser request detection
└── SecuritySpelBridgeConfig.java    # SpEL bridge for security expressions
```

## Quick Links

### Configuration by Topic

| Topic | File | Purpose |
|-------|------|---------|
| **Spring Config Classes** | [spring-config-classes.md](./spring-config-classes.md) | Beans, mappers, security setup |
| **Property Files** | [application-config-files.md](./application-config-files.md) | YAML/properties structure |
| **Profiles & Environments** | [profiles-and-environments.md](./profiles-and-environments.md) | How profiles control behavior |
| **Database & Oracle** | [database-and-oracle-wallet.md](./database-and-oracle-wallet.md) | Connection, wallet, credentials |
| **Logging & Monitoring** | [logging-and-monitoring.md](./logging-and-monitoring.md) | Log levels, output paths |
| **Feature Flags** | [feature-flags-and-demo-mode.md](./feature-flags-and-demo-mode.md) | Demo mode, custom flags |
| **External Services** | [external-services-and-secrets.md](./external-services-and-secrets.md) | OAuth2, secret injection |

## Common Configuration Tasks

### Running with Different Profiles

```bash
# Local development (default, no profile)
mvn spring-boot:run

# With test profile (H2 in-memory DB)
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=test"

# With prod profile (Oracle DB)
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=prod"
```

### Setting Environment Variables

Configuration priorities (highest to lowest):

```bash
# 1. Environment variables override everything
export DB_URL="jdbc:oracle:thin:@..."
export APP_DEMO_READONLY="true"

# 2. Profile-specific files (application-prod.yml)
#    Use these for profile defaults

# 3. Base config file (application.yml)
#    Use for shared defaults

# 4. Java defaults in code
#    Use as fallback
```

### Key Environment Variables

These are the primary knobs for runtime configuration:

| Variable | Default | Purpose |
|----------|---------|---------|
| `SPRING_PROFILES_ACTIVE` | (none) | Which profile(s) to activate |
| `DB_URL` | (required in prod) | Oracle database URL |
| `DB_USER` | (required in prod) | Database username |
| `DB_PASS` | (required in prod) | Database password |
| `APP_DEMO_READONLY` | `true` | Enable read-only demo mode |
| `APP_FRONTEND_BASE_URL` | `https://localhost:5173` | Frontend redirect URL for OAuth2 |
| `APP_ADMIN_EMAILS` | (empty) | Comma-separated admin email list |
| `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID` | (required) | Google OAuth2 client ID |
| `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET` | (required) | Google OAuth2 secret |

## How Configuration Flows Through the App

```
Environment Variables
        ↓
    Spring Boot loads properties
        ↓
    @ConfigurationProperties classes bind values
        ↓
    @Configuration classes create beans
        ↓
    Controllers & Services @Autowired inject beans
        ↓
    Application behavior adapts to config
```

### Example: Demo Mode

1. **Config value**: `APP_DEMO_READONLY=true` (environment variable)
2. **Binding**: `AppProperties.isDemoReadonly` field receives value
3. **Bean creation**: `SecurityConfig` uses `props.isDemoReadonly()` when building filter chain
4. **Authorization**: `SecurityAuthorizationHelper.configureAuthorization()` permits GET requests without login
5. **Result**: Public can read inventory without login; writes still require admin role

## Configuration Profiles Used

| Profile | Database | Use Case | When Active |
|---------|----------|----------|-------------|
| (default) | PostgreSQL/Oracle | Local dev (requires .env setup) | When `SPRING_PROFILES_ACTIVE` is not set |
| `test` | H2 in-memory | CI/CD, unit tests | In test environments |
| `prod` | Oracle | Production (Fly.io, cloud) | `SPRING_PROFILES_ACTIVE=prod` |

## Related Documentation

- [Architecture Overview](../index.md)
- [Layers Overview](../layers/index.md)
- [Security Overview](../security/index.md)
- [Deployment Docs](../deployment/) — For production environment setup

---

[⬅️ Back to Architecture](../index.md)
