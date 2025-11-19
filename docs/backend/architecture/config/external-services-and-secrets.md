[⬅️ Back to Config Overview](./index.md)

# External Services and Secrets Management

## Overview

External services require secure configuration:

- **Google OAuth2**: Authentication provider
- **Database**: Oracle Autonomous Database
- **Frontend**: Cross-origin requests

Secrets must **never** be hardcoded in source code. Instead, they're injected via environment variables at runtime.

---

## OAuth2 Configuration (Google)

### What is OAuth2?

OAuth2 is an authorization standard where:

1. User clicks "Sign in with Google"
2. Application redirects to Google's login page
3. User authenticates with Google
4. Google redirects back to application with an authorization code
5. Application exchanges code for access token
6. Application fetches user profile (email, name) using token
7. Application creates local session for user

### Configuration

**File:** `src/main/resources/application.yml`

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

### Key Properties

| Property | Purpose |
|----------|---------|
| `client-id` | Google OAuth2 application ID (from Google Cloud Console) |
| `client-secret` | Google OAuth2 secret (from Google Cloud Console) |
| `redirect-uri` | Where Google redirects after login (must be HTTPS in prod) |
| `scope` | What user data to request (profile, email, etc.) |
| `authorization-uri` | Google's login page URL |
| `token-uri` | Endpoint to exchange code for access token |
| `user-info-uri` | Endpoint to fetch logged-in user's profile |

### Secret Injection

Secrets are **never** hardcoded. Instead:

#### Development (Local)

```bash
# In shell or .env file
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID="12345-abc.apps.googleusercontent.com"
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET="GOCSPX-xyz..."
```

#### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
env:
  SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
  SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
```

#### Production (Fly.io)

```bash
# Set secrets in Fly
fly secrets set \
  SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID="12345..." \
  SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET="GOCSPX-..."
```

### Redirect URI Requirements

The `redirect-uri` must match exactly what's registered in Google Cloud Console:

**Format:** `{baseUrl}/login/oauth2/code/google`

**Examples:**

- **Local:** `http://localhost:8081/login/oauth2/code/google`
- **Staging:** `https://staging.inventoryservice.com/login/oauth2/code/google`
- **Production:** `https://inventoryservice.fly.dev/login/oauth2/code/google`

**Important:** Google only allows HTTPS in production (HTTP localhost is exception).

### Setting Up Google OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Google+ API"
4. Create OAuth2 credentials:
   - Application type: "Web application"
   - Authorized redirect URIs: Add all your application URLs
5. Copy Client ID and Client Secret
6. Store as environment variables (never in code)

---

## Database Secrets

### Oracle Autonomous Database Connection

**Configuration:** See [Database and Oracle Wallet](./database-and-oracle-wallet.md)

**Secrets required:**

```bash
export DB_URL="jdbc:oracle:thin:@adb-xyz.database.oraclecloud.com:1521/inventorydb_medium"
export DB_USER="admin"
export DB_PASS="YourSecurePassword123!"
```

**Secret storage:**

#### Development

```bash
# .env file (never committed)
DB_URL="..."
DB_USER="..."
DB_PASS="..."
```

#### CI/CD

```yaml
env:
  DB_URL: ${{ secrets.DB_URL }}
  DB_USER: ${{ secrets.DB_USER }}
  DB_PASS: ${{ secrets.DB_PASS }}
```

#### Production (Fly.io)

```bash
fly secrets set \
  DB_URL="jdbc:oracle:..." \
  DB_USER="admin" \
  DB_PASS="..."
```

### Oracle Wallet Secrets

If using Oracle Wallet (encrypted credential storage):

- Wallet files are in `oracle_wallet/`
- Base64-encoded in Git for safety (`oracle_wallet_b64.txt`)
- At runtime, decoded and mounted at `/opt/oracle_wallet`
- Requires `TNS_ADMIN` environment variable

```bash
export TNS_ADMIN="/opt/oracle_wallet"
# Spring will use wallet for encrypted connection details
```

---

## Frontend URL Configuration

### What is the Frontend URL?

Used for:
- OAuth2 redirect after login
- CORS allowed origins
- Post-authentication redirect destination

### Configuration

```yaml
app:
  frontend:
    base-url: ${APP_FRONTEND_BASE_URL:https://localhost:5173}
    landing-path: /auth
```

**Environment variable:** `APP_FRONTEND_BASE_URL`

### Secret Injection

Not a "secret" (public URL), but environment-dependent:

#### Development

```bash
export APP_FRONTEND_BASE_URL="http://localhost:5173"
```

#### Production

```bash
# Fly.toml
[env]
  APP_FRONTEND_BASE_URL = "https://inventoryservice-ui.fly.dev"
```

---

## Secret Management Best Practices

### ✅ DO

- Store secrets in **environment variables**
- Use **secret management systems** (Fly.io Secrets, GitHub Secrets, HashiCorp Vault)
- **Never commit** secrets to Git (even in .env files)
- **Rotate secrets** regularly (especially database passwords)
- **Log secret usage** for audit trails
- Use **HTTPS only** for sensitive communications
- Implement **least privilege** (each app gets only needed secrets)

### ❌ DON'T

- Hardcode secrets in Java code
- Commit secrets in configuration files
- Share secrets via email or chat
- Use the same secret across multiple environments
- Leave secrets in production logs
- Use weak passwords (min 16 characters, mix of types)

---

## Secrets in Different Environments

### Local Development

```bash
# .env (don't commit)
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID="dev-client-id"
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET="dev-secret"
DB_URL="jdbc:oracle:thin:@localhost:1521/xe"
DB_USER="local_user"
DB_PASS="local_password"
APP_FRONTEND_BASE_URL="http://localhost:5173"

# Load in shell
set -a
source .env
set +a

# Run application
mvn spring-boot:run
```

### Testing (CI/CD)

```yaml
# .github/workflows/test.yml
env:
  SPRING_PROFILES_ACTIVE: test
  # No secrets needed for H2 test DB

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: mvn clean test
```

### Staging

```bash
# Fly staging secrets
fly --app inventoryservice-staging secrets set \
  SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID="staging-client-id" \
  SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET="staging-secret" \
  DB_URL="jdbc:oracle:thin:@staging-db:1521/xe" \
  DB_USER="staging_admin" \
  DB_PASS="staging_password" \
  APP_FRONTEND_BASE_URL="https://staging.inventoryui.dev"
```

### Production

```bash
# Fly production secrets (most secure)
fly --app inventoryservice secrets set \
  SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID="prod-client-id" \
  SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET="prod-secret" \
  DB_URL="jdbc:oracle:thin:@prod-db:1521/xe" \
  DB_USER="prod_admin" \
  DB_PASS="prod_password" \
  APP_FRONTEND_BASE_URL="https://inventoryui.fly.dev"
```

---

## Secret Rotation

### OAuth2 Secret Rotation

1. Go to Google Cloud Console
2. Create new credential set (keep old one temporarily)
3. Update `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET` env var
4. Test in staging first
5. Deploy to production
6. Delete old credential from Google Console

### Database Password Rotation

1. Set new password in Oracle
2. Update `DB_PASS` environment variable
3. Restart application (picks up new password)
4. Verify connectivity
5. Delete old password from Oracle

---

## Troubleshooting Secrets

### Q: "Unauthorized OAuth2 client"

**A:** Check OAuth2 secrets:

```bash
# Verify env vars are set
echo $SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID
echo $SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET

# Check values match Google Cloud Console
# Check redirect URI matches exactly (HTTP vs HTTPS, port numbers)
```

### Q: "Cannot create JDBC connection"

**A:** Check database secrets:

```bash
# Verify DB credentials
echo $DB_URL
echo $DB_USER
echo $DB_PASS

# Test connection manually
sqlplus $DB_USER/$DB_PASS@$DB_URL

# Check network access (firewall, security groups)
```

### Q: "No qualifying bean of type 'AppProperties'"

**A:** Check property names:

- YAML uses hyphens: `frontend-base-url`
- Environment variables use underscores: `APP_FRONTEND_BASE_URL`
- Spring converts automatically

---

## Related Documentation

- [Profiles and Environments](./profiles-and-environments.md)
- [Database and Oracle Wallet](./database-and-oracle-wallet.md)
- [Security Overview](../security/) — For OAuth2 flow details
- [Deployment Docs](../deployment/) — For production secret management

---

[⬅️ Back to Config Overview](./index.md)
