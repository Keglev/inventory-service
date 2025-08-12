#!/bin/sh
set -euo pipefail

# ==========================================================
# Script to decode Oracle Wallet, display configs, and run Spring Boot
# ==========================================================


# Default profile (you can override via env)
: "${SPRING_PROFILES_ACTIVE:=prod}"
# 1) Decode and unzip the wallet (ZIP contains top-level 'Wallet_sspdb_fixed')
echo "$ORACLE_WALLET_B64" | base64 -d > /app/wallet.zip
mkdir -p /app/wallet
unzip -o -q /app/wallet.zip -d /app/wallet || {
  echo "ERROR: unzip failed"; ls -R /app/wallet; exit 1;
}

# 2) Hard-set TNS_ADMIN to the known nested folder
export TNS_ADMIN="/app/wallet/Wallet_sspdb_fixed"

# 3) Sanity check: must have tnsnames.ora and ewallet.p12 here
[ -f "$TNS_ADMIN/tnsnames.ora" ] || { echo "ERROR: tnsnames.ora not found in $TNS_ADMIN"; ls -R /app/wallet; exit 1; }
[ -f "$TNS_ADMIN/ewallet.p12" ] || { echo "ERROR: ewallet.p12 not found in $TNS_ADMIN"; ls -R /app/wallet; exit 1; }

echo "Using TNS_ADMIN=$TNS_ADMIN"
echo "tnsnames.ora content:"
cat "$TNS_ADMIN/tnsnames.ora" || true

# JVM opts
JAVA_OPTS="-Xmx256m -Dserver.address=0.0.0.0 -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} -Doracle.net.tns_admin=${TNS_ADMIN}"

# Wallet password (required for Free Tier)
if [ -n "${ORACLE_WALLET_PASSWORD:-}" ]; then
  JAVA_OPTS="${JAVA_OPTS} -Doracle.net.wallet_password=${ORACLE_WALLET_PASSWORD}"
  echo "Wallet password length: ${#ORACLE_WALLET_PASSWORD}"
else
  echo "ERROR: ORACLE_WALLET_PASSWORD not set"; exit 1
fi

echo "Starting Spring Boot..."
exec java ${JAVA_OPTS} -jar /app/app.jar
# add explicit SSL props
JAVA_OPTS="$JAVA_OPTS \
 -Djavax.net.ssl.keyStore=${TNS_ADMIN}/keystore.jks \
 -Djavax.net.ssl.keyStoreType=JKS \
 -Djavax.net.ssl.keyStorePassword=${ORACLE_WALLET_PASSWORD} \
 -Djavax.net.ssl.trustStore=${TNS_ADMIN}/truststore.jks \
 -Djavax.net.ssl.trustStoreType=JKS \
 -Djavax.net.ssl.trustStorePassword=${ORACLE_WALLET_PASSWORD}"

echo " Starting Spring Boot..."
exec sh -c "java ${JAVA_OPTS} -jar app.jar"

# Note: Ensure that the environment variables ORACLE_WALLET_B64, WALLET_PASSWORD, and SPRING_PROFILES_ACTIVE are set before running this script.