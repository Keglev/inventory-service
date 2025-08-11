#!/bin/sh
set -euo pipefail

# ==========================================================
# Script to decode Oracle Wallet, display configs, and run Spring Boot
# ==========================================================

# Where the wallet is extracted
: "${TNS_ADMIN:=/app/wallet}"
# Default profile (you can override via env)
: "${SPRING_PROFILES_ACTIVE:=prod}"

# Decode Oracle Wallet from base64 into zip file
echo "$ORACLE_WALLET_B64" | base64 -d > /app/wallet.zip
mkdir -p "$TNS_ADMIN"
unzip -o /app/wallet.zip -d "$TNS_ADMIN"
rm -f /app/wallet.zip

# If the ZIP has a subfolder (e.g. Wallet_sspdb_fixed), detect and use it
CANDIDATE_TNS=$(find "$TNS_ADMIN" -maxdepth 2 -type f -name tnsnames.ora | head -n1 || true)
if [ -n "${CANDIDATE_TNS:-}" ]; then
  TNS_ADMIN_ACTUAL="$(dirname "$CANDIDATE_TNS")"
else
  TNS_ADMIN_ACTUAL="$TNS_ADMIN"
fi
export TNS_ADMIN="$TNS_ADMIN_ACTUAL"

echo " Oracle Wallet extracted"
echo " Using TNS_ADMIN: $TNS_ADMIN"

# Force sqlnet.ora to the actual directory (quote the path)
cat > "$TNS_ADMIN/sqlnet.ora" <<EOF
WALLET_LOCATION = (SOURCE = (METHOD = file) (METHOD_DATA = (DIRECTORY="$TNS_ADMIN")))
SSL_SERVER_DN_MATCH = yes
EOF

# Safe debug (won't exit on missing files)
echo "sqlnet.ora content:";  cat "$TNS_ADMIN/sqlnet.ora"  || true
echo "tnsnames.ora content:"; cat "$TNS_ADMIN/tnsnames.ora" || true

# JVM opts
JAVA_OPTS="-Xmx256m -Dserver.address=0.0.0.0 -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} -Doracle.net.tns_admin=${TNS_ADMIN}"

# Wallet password (required for Free Tier)
if [ -n "${ORACLE_WALLET_PASSWORD:-}" ]; then
  JAVA_OPTS="${JAVA_OPTS} -Doracle.net.wallet_password=${ORACLE_WALLET_PASSWORD}"
  echo " Wallet password length: ${#ORACLE_WALLET_PASSWORD}"
else
  echo "WARN: ORACLE_WALLET_PASSWORD not set."
fi


# sanity check JKS passwords
if ! keytool -list -storetype JKS -keystore "$TNS_ADMIN/keystore.jks" -storepass "$ORACLE_WALLET_PASSWORD" >/dev/null 2>&1; then
  echo "❌ Keystore password does not unlock $TNS_ADMIN/keystore.jks"; exit 1
fi
if ! keytool -list -storetype JKS -keystore "$TNS_ADMIN/truststore.jks" -storepass "$ORACLE_WALLET_PASSWORD" >/dev/null 2>&1; then
  echo "❌ Truststore password does not unlock $TNS_ADMIN/truststore.jks"; exit 1
fi
echo "✅ JKS password validated"

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