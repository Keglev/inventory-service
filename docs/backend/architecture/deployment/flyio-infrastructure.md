[⬅️ Back to Deployment Index](./index.html)

# Fly.io Infrastructure

## Overview

Smart Supply Pro backend runs on **Fly.io**, a Docker-native hosting platform. The `fly.toml` configuration file defines the app, machine resources, regions, environment variables, and secrets.

This document explains:
- App configuration and deployment strategy
- Machine resources (CPU, memory, storage)
- Networking (ports, health checks, TLS)
- Secrets and environment variable management
- Scaling and instance configuration

## What is Fly.io?

Fly.io is a **container-native PaaS** that:
- Deploys Docker images to global infrastructure
- Handles load balancing, TLS, and routing
- Provides secret management (encrypted vault)
- Supports horizontal scaling (multiple instances per region)
- Offers simple CLI-based deployment (`flyctl deploy`)

**Alternative platforms:** AWS ECS, Azure Container Instances, Google Cloud Run, Heroku, DigitalOcean App Platform.

## Configuration: `fly.toml`

### File Location & Purpose

```toml
app = "inventoryservice"
primary_region = "iad"  # IAD = Washington, DC
```

`fly.toml` is the single source of truth for Fly.io app configuration. It lives in repo root and is version-controlled.

### Complete Example Configuration

```toml
# =============================================================================
# Fly.io App Configuration for Smart Supply Pro Backend
# =============================================================================

app = "inventoryservice"
primary_region = "iad"

# Build configuration (not used if deploying pre-built image)
[build]
  image = "ckbuzin/inventory-service:latest"

# App machine resources
[env]
  # Spring Boot profile: prod for production
  SPRING_PROFILES_ACTIVE = "prod"
  
  # App configuration
  APP_DEMO_READONLY = "false"
  APP_FRONTEND_BASE_URL = "https://inventory-service.koyeb.app"
  
  # Logging
  LOGGING_LEVEL_ROOT = "INFO"
  LOGGING_LEVEL_COM_EXAMPLE = "INFO"

# Secrets (encrypted, not visible in logs)
[env]
  # Database credentials (stored in Fly secrets vault)
  # Set via: flyctl secrets set DB_URL=jdbc:oracle:thin:@...
  # Retrieved: 'flyctl secrets list' (encrypted in logs)
  
  # OAuth2 secrets
  # Set via: flyctl secrets set GOOGLE_CLIENT_ID=...
  # Set via: flyctl secrets set GOOGLE_CLIENT_SECRET=...
  
  # Oracle Wallet
  # Set via: flyctl secrets set ORACLE_WALLET_B64=...
  # (base64-encoded wallet, extracted to /app/oracle_wallet at runtime)

# HTTP/HTTPS service definition
[[services]]
  internal_port = 8080  # Port app listens on
  protocol = "tcp"
  
  # Auto TLS: Fly.io manages HTTPS certificate
  [[services.ports]]
    port = 80
    handlers = ["http"]
  
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
    alpn = ["h2", "http/1.1"]

# Health check: Fly.io polls this endpoint to determine if app is healthy
[[services.http_checks]]
  uri = "/health"
  interval = "10s"
  timeout = "3s"
  grace_period = "30s"  # Wait 30s before starting health checks (app startup)
  method = "GET"

# TCP health check: More robust than HTTP (works if HTTP fails)
[[services.tcp_checks]]
  interval = "10s"
  timeout = "3s"
  grace_period = "30s"

# Machine resources (VM size)
[[vm]]
  cpu_kind = "shared"  # Shared CPU (cost-effective)
  cpus = 1             # 1 vCPU
  memory_mb = 256      # 256 MB RAM

# Volumes (persistent storage)
# Note: Fly.io ephemeral storage is temporary; use volumes for persistence
# [[mounts]]
#   source = "logs"
#   destination = "/app/logs"
#   size_gb = 1
```

### Key Sections

#### App Name & Region

```toml
app = "inventoryservice"                # Unique app name in Fly.io
primary_region = "iad"                  # Washington, DC (low-latency for US East)
```

Available regions: `iad` (DC), `ord` (Chicago), `sfo` (San Francisco), `lhr` (London), `sin` (Singapore), etc.

#### Environment Variables

```toml
[env]
  SPRING_PROFILES_ACTIVE = "prod"
  APP_DEMO_READONLY = "false"
  LOGGING_LEVEL_ROOT = "INFO"
```

- **Non-sensitive config** goes in `[env]` section (visible in logs, git-safe)
- **Sensitive data** (passwords, API keys) goes in `flyctl secrets` (encrypted vault)

#### Services: HTTP/HTTPS

```toml
[[services]]
  internal_port = 8080
  
  [[services.ports]]
    port = 80
    handlers = ["http"]
  
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
    alpn = ["h2", "http/1.1"]
```

- `internal_port = 8080` – Backend listens on port 8080 (inside container)
- `port = 80/443` – Fly.io exposes these publicly
- Fly.io **automatically manages TLS certificates** (HTTPS)
- Requests are automatically redirected: `http://` → `https://`

#### Health Checks

```toml
[[services.http_checks]]
  uri = "/health"
  interval = "10s"
  timeout = "3s"
  grace_period = "30s"
```

- Flies.io polls `/health` every 10 seconds
- Expects HTTP 200 response within 3 seconds
- Doesn't start health checks until 30 seconds after boot (app startup time)
- If health check fails 3 times, instance is marked unhealthy and restarted

**Your `/health` endpoint** (Spring Boot Actuator):
```
GET /health
Response: { "status": "UP" }
```

#### Machine Resources

```toml
[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

- `cpu_kind = "shared"` – CPU is time-sliced with other apps (cost-effective)
- `cpus = 1` – 1 vCPU core (adequate for moderate traffic)
- `memory_mb = 256` – 256 MB RAM (tight; see Troubleshooting)

## Environment-Specific Configuration

### Local Development

```bash
# .env file (not in repo)
DB_URL=jdbc:oracle:thin:@localhost:1521/orcl
DB_USER=inventoryuser
DB_PASS=password123
SPRING_PROFILES_ACTIVE=dev
```

No Fly.io involved; app runs locally or in docker-compose.

### Testing

```bash
# application-test.yml in repo
spring:
  datasource:
    url: jdbc:h2:mem:ssp;MODE=Oracle;...
    username: sa
    password: 
  profiles:
    active: test
```

H2 in-memory database; tests run locally.

### Production (Fly.io)

**fly.toml:**
```toml
[env]
  SPRING_PROFILES_ACTIVE = "prod"

# Secrets (set via CLI):
# flyctl secrets set DB_URL=jdbc:oracle:thin:@...
# flyctl secrets set DB_USER=inventoryuser
# flyctl secrets set DB_PASS=encrypted_password
# flyctl secrets set GOOGLE_CLIENT_ID=...
```

**Result:** App runs with prod profile, using Oracle database, info-level logging.

## Secrets Management

### Setting Secrets

Secrets are stored in Fly.io's encrypted vault and injected as environment variables:

```bash
# Set a secret
flyctl secrets set DB_URL="jdbc:oracle:thin:@db.example.com:1521/service"
flyctl secrets set DB_USER="inventoryuser"
flyctl secrets set DB_PASS="encrypted_password_here"

# Set multiple at once
flyctl secrets set DB_URL=... DB_USER=... DB_PASS=...

# List secrets (encrypted in output)
flyctl secrets list

# Remove a secret
flyctl secrets unset DB_URL
```

### Secret Mapping to Java Properties

Fly.io injects secrets as environment variables; Spring Boot maps them to properties:

```
ENV VARIABLE          →  SPRING PROPERTY
─────────────────────────────────────────────────────
DB_URL                →  spring.datasource.url
DB_USER               →  spring.datasource.username
DB_PASS               →  spring.datasource.password
GOOGLE_CLIENT_ID      →  spring.security.oauth2.client.registration.google.client-id
GOOGLE_CLIENT_SECRET  →  spring.security.oauth2.client.registration.google.client-secret
ORACLE_WALLET_B64     →  (extracted by start.sh to /app/oracle_wallet)
TNS_ADMIN             →  (set by start.sh to /app/oracle_wallet)
```

### Oracle Wallet Secret

The Oracle Wallet (encrypted credentials) is stored as a base64-encoded secret:

```bash
# Locally: create wallet (Oracle Client steps)
# ...

# Encode wallet as base64
tar -czf wallet.tar.gz oracle_wallet/
base64 wallet.tar.gz | tr -d '\n' > wallet_b64.txt

# Set as Fly.io secret
flyctl secrets set ORACLE_WALLET_B64="$(cat wallet_b64.txt)"

# In start.sh (at runtime):
echo "${ORACLE_WALLET_B64}" | base64 -d | tar -xzf - -C /app/
export TNS_ADMIN=/app/oracle_wallet
```

## Deployment Methods

### Method 1: Automatic (Recommended)

GitHub Actions `3-deploy-fly.yml` deploys automatically after CI success:

```bash
flyctl deploy --image ckbuzin/inventory-service:${COMMIT_SHA} \
  --strategy immediate \
  --remote-only
```

- Image is pre-built, pre-tested, pre-scanned
- Deployment is atomic (all or nothing)
- No local setup required

### Method 2: Manual from Local Machine

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Authenticate
flyctl auth login

# Deploy pre-built image
flyctl deploy --image ckbuzin/inventory-service:latest --app inventoryservice

# Or build and deploy from source
flyctl deploy --build-only --app inventoryservice
flyctl deploy --image ckbuzin/inventory-service:latest --app inventoryservice
```

### Method 3: Manual via Workflow_Dispatch

```bash
# In GitHub UI: Actions → 3-deploy-fly.yml → Run workflow
# Fill in:
#   - image_tag: latest (or commit SHA)
#   - deployment_strategy: immediate (or canary/rolling)
```

## Deployment Strategies

### Immediate (Default)

```yaml
--strategy immediate
```

- All instances replaced simultaneously
- **Downtime:** Brief (seconds to minutes)
- **Risk:** Higher (all instances new at once)
- **Speed:** Fastest
- **Use case:** Non-critical updates, demos, testing

### Canary

```yaml
--strategy canary
```

- New version deployed to 1 instance
- Health checks run on canary instance
- If healthy, remaining instances updated
- If unhealthy, rollback (old version stays)
- **Downtime:** Zero (old instances still running)
- **Risk:** Lower (canary validates first)
- **Speed:** Slower (staged rollout)
- **Use case:** Critical updates, production safety

### Rolling

```yaml
--strategy rolling
```

- Instances updated one at a time
- At least one instance always running old version initially
- Health checks run after each instance update
- **Downtime:** Zero (rolling replacement)
- **Risk:** Low (gradual, validated rollout)
- **Speed:** Slowest (sequential updates)
- **Use case:** Long-running sessions, zero-downtime requirement

## Scaling & Instances

### Single Instance (Default)

```bash
# Current config: 1 instance in primary_region
flyctl instances list --app inventoryservice
```

Output:
```
ID           	NAME                  	STATE   REGION  CPU  MEMORY  
4d8900b1d9  inventory-service-app-1 RUNNING iad     1    256MB
```

### Multiple Instances

```bash
# Scale to 2 instances
flyctl scale count 2 --app inventoryservice

# Or scale to 0 (stop app)
flyctl scale count 0 --app inventoryservice
```

Benefits:
- **Load balancing:** Traffic distributed across instances
- **Availability:** If one instance fails, others handle requests
- **Zero-downtime deploys:** Old instances can serve while new ones boot

## Networking & TLS

### Public Domain

```
inventoryservice.fly.dev  (Fly.io provided)
```

Your custom domain:
```bash
flyctl certs create inventoryservice.example.com --app inventoryservice
```

### TLS Certificates

Fly.io **automatically manages TLS** (Let's Encrypt):
- Certificates are obtained automatically
- Auto-renewal before expiry
- HTTPS enforced (HTTP redirects to HTTPS)
- HTTP/2 support

### IP Address

```bash
# Get app's public IP
flyctl ips list --app inventoryservice
```

Output:
```
TYPE ADDRESS                                 REGION
v4   203.0.113.45                             iad
v6   2604:1380:0:1::1                        iad
```

This IP is used for:
- DNS records (A/AAAA)
- Firewall rules (allow specific IPs)
- IP whitelisting at database (Oracle)

## Logs & Monitoring

### View Real-Time Logs

```bash
# Last 50 lines
flyctl logs --app inventoryservice -n 50

# Follow in real-time
flyctl logs --app inventoryservice --follow

# Filter by log level
flyctl logs --app inventoryservice | grep ERROR
```

### View App Status

```bash
flyctl status --app inventoryservice
```

Output shows:
- Instances (running/crashed)
- Recent deployments
- Health check status
- Resource usage (CPU, memory)

### Metrics & Monitoring

```bash
# Show current resource usage
flyctl status --detailed --app inventoryservice
```

- CPU usage (%)
- Memory usage (MB)
- Requests per second (if enabled)
- Error rate (if enabled)

Future: Integration with Prometheus, Grafana, Datadog.

## Troubleshooting

### App Won't Start: "Health check failed"

**Symptom:** App crashes immediately after deploy
```
Error: Service started but not responding. Restarting...
```

**Causes:**
1. Database not reachable (Oracle down, IP not whitelisted)
2. Secrets not set (DB_URL, credentials missing)
3. Port mismatch (app listens on 8081, Fly expects 8080)
4. Java heap too small for JVM startup

**Resolution:**
```bash
# Check logs for error message
flyctl logs --app inventoryservice | tail -50

# Verify secrets are set
flyctl secrets list --app inventoryservice

# Scale down to stop repeated restarts
flyctl scale count 0 --app inventoryservice

# Fix the issue, then redeploy
flyctl deploy --image ckbuzin/inventory-service:fixed-sha --app inventoryservice
```

### Out of Memory: "Java heap space"

**Symptom:** Requests fail with `OutOfMemoryError`
```
java.lang.OutOfMemoryError: Java heap space
```

**Cause:** 256 MB machine too small; JVM heap exhausted

**Resolution:**
```toml
[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512  # Increase from 256 to 512 MB
```

In `start.sh`, adjust JVM heap:
```bash
export JAVA_OPTS="-Xmx384m -Xms192m"  # Heap: 192-384 MB (from 256-512 MB RAM)
```

Redeploy and monitor.

### Deployment Stuck: "Waiting for deployment to be healthy"

**Symptom:** Deploy doesn't complete; health check times out
```
Error: Deployment failed. Instance 4d8900b1d9 failed to start.
Timeout waiting for health check to pass.
```

**Causes:**
1. App startup takes > 30 seconds (grace_period too short)
2. Health check endpoint `/health` not implemented
3. Database connectivity issue during startup

**Resolution:**
```toml
[[services.http_checks]]
  grace_period = "60s"  # Increase from 30s to 60s (for slow startup)
```

Or implement `/health` endpoint:
```java
@RestController
public class HealthController {
  @GetMapping("/health")
  public Map<String, String> health() {
    return Map.of("status", "UP");
  }
}
```

Redeploy.

### Can't Connect to Database

**Symptom:** Connection errors in logs
```
ORA-17008: Connection refused
jdbc.SQLRecoverableException: IO Error: Connection refused
```

**Causes:**
1. Oracle IP not whitelisted (Fly.io IP not allowed)
2. Database credentials wrong (DB_PASS, DB_USER)
3. Database down

**Resolution:**
```bash
# Get your Fly.io IP
flyctl ips list --app inventoryservice

# Add to Oracle whitelist (via Oracle Cloud console or SQL*Net)
ALTER SESSION SET EVENTS '10046 trace name context forever, level 12';
-- (Contact DBA to whitelist IP)

# Verify secrets
flyctl secrets list --app inventoryservice

# Re-set if wrong
flyctl secrets set DB_URL=jdbc:oracle:thin:@prod-db.example.com:1521/service
flyctl secrets set DB_PASS=correct_password

# Redeploy
flyctl deploy --image ... --app inventoryservice
```

### Need to Rollback

**Symptom:** Latest deployment introduced a bug
```
ERROR: [Service 4d8900b1d9] endpoint returned HTTP 500
```

**Solution:**
```bash
# Deploy previous version
flyctl deploy --image ckbuzin/inventory-service:previous-commit-sha \
  --app inventoryservice

# Or via GitHub Actions: Manually run 3-deploy-fly.yml with old image_tag
```

## Related Documentation

- **[Deployment Index](./index.html)** – Overview of deployment pipeline
- **[Build & Docker Image](./build-and-docker-image.html)** – How image is created
- **[CI/CD & Docs Pipeline](./ci-cd-and-docs-pipeline.html)** – Automated deployment trigger
- **[Logs & Observability](./logs-and-observability.html)** – Debugging in production

---

**Last Updated:** November 2025  
**Audience:** DevOps engineers, SRE, deployment operators, cloud infrastructure team
