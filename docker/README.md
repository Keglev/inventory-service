# Backend host runbook

Operational notes for the SmartSupplyPro backend on the shared Hetzner host. The
decision and its alternatives are recorded in
[ADR-0012](../docs/backend/architecture/09-decisions/adr-0012-backend-hosting-on-shared-hetzner-host.md).

## Directory layout

`/opt/smartsupplypro` holds exactly two files:

- `docker-compose.prod.yml` — copied from this repository by `4-deploy-backend.yml`
  on every release. Never edit it on the host; edit `docker/docker-compose.prod.yml`
  here and let a release carry it over.
- `.env.prod` — hand-managed on the host, mode `600`, LF line endings, 12 keys.
  CI never reads, writes, or logs it.

## .env.prod variables

`SPRING_PROFILES_ACTIVE`, `DB_URL`, `DB_USER`, `DB_PASS`, `ORACLE_WALLET_B64`,
`ORACLE_WALLET_PASSWORD`,
`SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID`,
`SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET`,
`APP_ADMIN_EMAILS`, `APP_DEMO_READONLY`, `APP_FRONTEND_BASE_URL`,
`APP_FRONTEND_LANDING_PATH`.

`SERVER_PORT` is set by the compose file, not here. `DEBUG` and `JAVA_OPTS` are
optional and default inside `scripts/start.sh`.

## Host rules

Root creates directories and hands them to `deploy`; `deploy` operates them.
The `deploy` user has no sudo and never gets it. Before overwriting any
hand-deployed file, `ls -l` it first — the release path is allowed to replace
`docker-compose.prod.yml` and nothing else.

## Oracle ACL

The database allow-list is anchored to the host's static IPv4, whose primary IP
is set to not auto-delete. Losing that address means re-whitelisting before the
backend can reach Oracle again.

## Caddy

The `api.smartsupplypro.de` site block belongs to the maintenance-assistant
repository (`docker/caddy/Caddyfile` there, hand-deployed to
`/opt/maintenance-assistant/caddy/Caddyfile`). Removing this service means
removing that block too.

## Memory

The container is capped at 1400 MiB with swap equal to memory. `start.sh` sets
`-XX:MaxRAMPercentage=75`, so the cgroup gives the JVM roughly a 1 GiB heap — a
step above the 768 MiB the previous 1 GB hosting tier allowed. Without a limit the JVM
would size itself against the host's 7.5 GiB and starve the neighbours
(maintenance backend 1536m, Keycloak 1280m). The host swapfile exists for the
neighbours' indexing bursts; a JVM paging its heap is worse than a restart.
Re-measure with `docker stats` after the first day.

## Rollback

```sh
cd /opt/smartsupplypro
export BACKEND_IMAGE=ghcr.io/keglev/inventory-service/backend:<previous-sha>
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d backend
```

## First-start verification

```sh
curl -sI https://api.smartsupplypro.de/api/health   # expect 200
docker logs maintenance-caddy                        # no lookup error for ssp-backend
```
