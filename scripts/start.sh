#!/bin/sh
# =============================================================================
# start.sh — the backend container's entrypoint (BusyBox sh)
# Usage: CMD of the backend image (Dockerfile); the environment comes from the
#        host's .env.prod through docker/docker-compose.prod.yml.
# Produces: the Oracle wallet from ORACLE_WALLET_B64 unpacked under /app/wallet
#        (backend ADR-0009), the zip and the raw variable removed, then the jar
#        started with the prod profile by default and a heap of 75% of the
#        container limit (extra flags through JAVA_OPTS). Nothing secret is
#        printed or passed as a JVM argument.
# Failure mode: a missing ORACLE_WALLET_B64 or ORACLE_WALLET_PASSWORD, a failed
#        unzip or a wallet without tnsnames.ora or ewallet.p12 exits 1 before
#        the JVM starts; the container restarts and the health check stays red.
# =============================================================================

set -eu

# Defaults; each can be overridden from the environment.
: "${SPRING_PROFILES_ACTIVE:=prod}"
: "${SERVER_PORT:=8081}"            # the compose file sets 8081 as well
: "${DEBUG:=0}"                     # set to 1 to enable debug output

umask 077

# --- Require credentials (wallet-only) ---
if [ -z "${ORACLE_WALLET_B64:-}" ]; then
  echo "ERROR: ORACLE_WALLET_B64 is not set (runtime secret required)"; exit 1
fi
# The encrypted wallet needs its password (backend ADR-0009). application-prod.yml
# reads it from the environment, so without this check a missing value would
# surface only as a pool error.
if [ -z "${ORACLE_WALLET_PASSWORD:-}" ]; then
  echo "ERROR: ORACLE_WALLET_PASSWORD is not set (runtime secret required)"; exit 1
fi

# Decode the base64 wallet (delivered as an environment variable) and extract it
mkdir -p /app/wallet
printf "%s" "${ORACLE_WALLET_B64}" | base64 -d > /app/wallet.zip

# Windows ZIP quirk: unzip may return rc=1 yet still extract successfully.
# Accept rc==0, or rc==1 if the expected wallet folder appears.
set +e
unzip -o -q /app/wallet.zip -d /app/wallet
rc=$?
set -e

if [ "$rc" -ne 0 ] && [ "$rc" -ne 1 ]; then
  echo "[start] ERROR: unzip failed (rc=$rc)"; exit 1
fi

# The thin driver reads the wallet location from TNS_ADMIN. The folder name is the
# wallet zip's own (backend ADR-0001, backend ADR-0009).
export TNS_ADMIN="/app/wallet/Wallet_sspdb_fixed"
if [ ! -d "$TNS_ADMIN" ] || [ ! -f "$TNS_ADMIN/tnsnames.ora" ] || [ ! -f "$TNS_ADMIN/ewallet.p12" ]; then
  echo "ERROR: Wallet files missing under $TNS_ADMIN"; exit 1
fi
# Note: we do NOT print tnsnames.ora or list wallet files to avoid secret exposure

# Reduce secret exposure in process dumps: remove zip and unset the raw base64
rm -f /app/wallet.zip
unset ORACLE_WALLET_B64

# Optional debug (non-sensitive)
if [ "${DEBUG}" = "1" ]; then
  echo "[start] profile=${SPRING_PROFILES_ACTIVE} port=${SERVER_PORT} walletDir=${TNS_ADMIN}"
fi

# Map DB_* -> Spring if provided (keeps the current env names working)
[ -n "${DB_URL:-}"  ] && export SPRING_DATASOURCE_URL="${DB_URL}"
[ -n "${DB_USER:-}" ] && export SPRING_DATASOURCE_USERNAME="${DB_USER}"
[ -n "${DB_PASS:-}" ] && export SPRING_DATASOURCE_PASSWORD="${DB_PASS}"

# No fixed -Xmx: the percentage tracks the container limit. No secret on this line:
# ps shows a process's arguments to every host user, its environment only to root
# and its own user (backend ADR-0009 amendment).
JAVA_OPTS="${JAVA_OPTS:-} \
 -Dserver.port=${SERVER_PORT} \
 -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} \
 -Doracle.net.tns_admin=${TNS_ADMIN} \
 -XX:MaxRAMPercentage=75"

echo "[start] Starting Inventory Service on port ${SERVER_PORT}..."
exec java ${JAVA_OPTS} -jar /app/app.jar
