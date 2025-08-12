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

# 1) Decode and unzip the wallet (ZIP contains top-level 'Wallet_sspdb_fixed')
#    (kept exactly as-is; expects ORACLE_WALLET_B64)
echo "${ORACLE_WALLET_B64}" | base64 -d > /app/wallet.zip
mkdir -p /app/wallet
unzip -o -q /app/wallet.zip -d /app/wallet || {
  echo "ERROR: unzip failed"; ls -R /app/wallet; exit 1;
}

# 2) Hard-set TNS_ADMIN to the known nested folder
export TNS_ADMIN="/app/wallet/Wallet_sspdb_fixed"

# 3) Sanity check: must have tnsnames.ora and ewallet.p12 here
[ -f "$TNS_ADMIN/tnsnames.ora" ] || { echo "ERROR: tnsnames.ora not found in $TNS_ADMIN"; ls -R /app/wallet; exit 1; }
[ -f "$TNS_ADMIN/ewallet.p12" ]  || { echo "ERROR: ewallet.p12 not found in $TNS_ADMIN"; ls -R /app/wallet; exit 1; }

echo "Using TNS_ADMIN=$TNS_ADMIN"
echo "tnsnames.ora content:"
cat "$TNS_ADMIN/tnsnames.ora" || true

# Map DB_* -> Spring if provided (keeps your current env names working)
[ -n "${DB_URL:-}"  ] && export SPRING_DATASOURCE_URL="${DB_URL}"
[ -n "${DB_USER:-}" ] && export SPRING_DATASOURCE_USERNAME="${DB_USER}"
[ -n "${DB_PASS:-}" ] && export SPRING_DATASOURCE_PASSWORD="${DB_PASS}"

# Wallet password (required for Free Tier)
if [ -z "${ORACLE_WALLET_PASSWORD:-}" ]; then
  echo "ERROR: ORACLE_WALLET_PASSWORD not set"; exit 1
fi

# JVM opts (single exec; include all props BEFORE exec)
JAVA_OPTS="-Xmx256m \
 -Dserver.address=0.0.0.0 \
 -Dserver.port=${SERVER_PORT} \
 -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} \
 -Doracle.net.tns_admin=${TNS_ADMIN} \
 -Doracle.net.wallet_password=${ORACLE_WALLET_PASSWORD} \
 -Djavax.net.ssl.keyStore=${TNS_ADMIN}/keystore.jks \
 -Djavax.net.ssl.keyStoreType=JKS \
 -Djavax.net.ssl.keyStorePassword=${ORACLE_WALLET_PASSWORD} \
 -Djavax.net.ssl.trustStore=${TNS_ADMIN}/truststore.jks \
 -Djavax.net.ssl.trustStoreType=JKS \
 -Djavax.net.ssl.trustStorePassword=${ORACLE_WALLET_PASSWORD}"

echo "Starting Spring Boot on port ${SERVER_PORT}..."
exec java ${JAVA_OPTS} -jar /app/app.jar
