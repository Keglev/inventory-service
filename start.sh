# /**
#  * BusyBox /bin/sh note:
#  * - Avoids `set -o pipefail` (unsupported in BusyBox sh).
#  * - Uses a single `exec` after assembling all JAVA_OPTS.
#  * - Honors SERVER_PORT (CI preflight uses 8081).
#  * - Bridges DB_URL/DB_USER/DB_PASS -> SPRING_DATASOURCE_* if present.
#  * - Keeps wallet path at /app/wallet/Wallet_sspdb_fixed unchanged.
#  */

#!/bin/sh
set -eu
# ==========================================================
# Script to decode Oracle Wallet, display configs, and run Spring Boot
# ==========================================================

# Default profile (you can override via env)
: "${SPRING_PROFILES_ACTIVE:=prod}"
: "${SERVER_PORT:=8081}"  # honor CI's 8081 preflight; defaults to 8081
: "${DEBUG:=0}"           # set to 1 to enable debug output

# harden file perms for anything we create
umask 077

# 1) Decode and unzip the wallet (ZIP contains top-level 'Wallet_sspdb_fixed')
#    (kept exactly as-is; expects ORACLE_WALLET_B64)
# echo "${ORACLE_WALLET_B64}" | base64 -d > /app/wallet.zip
printf "%s" "${ORACLE_WALLET_B64}" | base64 -d > /app/wallet.zip
mkdir -p /app/wallet


# /**
#  * Windows-zip quirk:
#  * - Some ZIPs store paths with backslashes. `unzip` may return rc=1 with a warning
#  *   even though extraction succeeded. We treat rc==1 as non-fatal if the expected
#  *   /app/wallet/Wallet_sspdb_fixed folder exists.
#  */
# -- Windows ZIP quirk: unzip may return rc=1 yet still extract successfully.
#    We accept rc==0, or rc==1 *if* the expected folder appears.
set +e
unzip -o -q /app/wallet.zip -d /app/wallet
rc=$?
set -e

#if [ "$rc" -ne 0 ]; then
#  if [ "$rc" -eq 1 ] && [ -d /app/wallet/Wallet_sspdb_fixed ]; then
#    echo "[start.sh] unzip returned 1 (Windows path separators) but files are present; continuing."
#  else
#    echo "[start.sh] ERROR: unzip failed (rc=$rc)"; ls -R /app/wallet; exit 1
#  fi
#fi
# Verify extraction
if [ "$rc" -ne 0 ] && [ "$rc" -ne 1 ]; then
  echo "[start] ERROR: unzip failed (rc=$rc)"; exit 1
fi

# 2) Hard-set TNS_ADMIN to the known nested folder
export TNS_ADMIN="/app/wallet/Wallet_sspdb_fixed"
if [ ! -d "$TNS_ADMIN" ] || [ ! -f "$TNS_ADMIN/tnsnames.ora" ] || [ ! -f "$TNS_ADMIN/ewallet.p12" ]; then
  echo "ERROR: Wallet files missing under $TNS_ADMIN"; exit 1
fi

# 3) Sanity check: must have tnsnames.ora and ewallet.p12 here
#[ -f "$TNS_ADMIN/tnsnames.ora" ] || { echo "ERROR: tnsnames.ora not found in $TNS_ADMIN"; ls -R /app/wallet; exit 1; }
#[ -f "$TNS_ADMIN/ewallet.p12" ]  || { echo "ERROR: ewallet.p12 not found in $TNS_ADMIN"; ls -R /app/wallet; exit 1; }

# Reduce secret exposure in process dumps: remove zip and unset the raw base64
rm -f /app/wallet.zip
unset ORACLE_WALLET_B64

#echo "Using TNS_ADMIN=$TNS_ADMIN"
#echo "tnsnames.ora content:"
#cat "$TNS_ADMIN/tnsnames.ora" || true

# Optional debug (non-sensitive)
if [ "${DEBUG}" = "1" ]; then
  echo "[start] profile=${SPRING_PROFILES_ACTIVE} port=${SERVER_PORT} walletDir=${TNS_ADMIN}"
fi

# Map DB_* -> Spring if provided (keeps your current env names working)
[ -n "${DB_URL:-}"  ] && export SPRING_DATASOURCE_URL="${DB_URL}"
[ -n "${DB_USER:-}" ] && export SPRING_DATASOURCE_USERNAME="${DB_USER}"
[ -n "${DB_PASS:-}" ] && export SPRING_DATASOURCE_PASSWORD="${DB_PASS}"

# Wallet password (required for Free Tier)
#if [ -z "${ORACLE_WALLET_PASSWORD:-}" ]; then
#  echo "ERROR: ORACLE_WALLET_PASSWORD not set"; exit 1
#fi

# JVM opts (single exec; include all props BEFORE exec)
JAVA_OPTS="${JAVA_OPTS:-} \
 -Dserver.address=0.0.0.0 \
 -Dserver.port=${SERVER_PORT} \
 -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} \
 -Doracle.net.tns_admin=${TNS_ADMIN} \
 -Doracle.net.wallet_password=${ORACLE_WALLET_PASSWORD} \
 -XX:MaxRAMPercentage=75"

 # JKS flags only if present (many wallets do not include .jks)
if [ -f "${TNS_ADMIN}/keystore.jks" ] && [ -f "${TNS_ADMIN}/truststore.jks" ]; then
  JAVA_OPTS="$JAVA_OPTS \
   -Djavax.net.ssl.keyStore=${TNS_ADMIN}/keystore.jks \
   -Djavax.net.ssl.keyStoreType=JKS \
   -Djavax.net.ssl.keyStorePassword=${ORACLE_WALLET_PASSWORD} \
   -Djavax.net.ssl.trustStore=${TNS_ADMIN}/truststore.jks \
   -Djavax.net.ssl.trustStoreType=JKS \
   -Djavax.net.ssl.trustStorePassword=${ORACLE_WALLET_PASSWORD}"
fi

# Minimize exposure: we can safely unset the password env var after building JAVA_OPTS
unset ORACLE_WALLET_PASSWORD

echo "Starting Spring Boot on port ${SERVER_PORT}..."
exec java ${JAVA_OPTS} -jar /app/app.jar
