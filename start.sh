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

echo " Oracle Wallet extracted"

# Force sqlnet.ora to the actual directory
cat > "$TNS_ADMIN/sqlnet.ora" <<EOF
WALLET_LOCATION = (SOURCE = (METHOD = file) (METHOD_DATA = (DIRECTORY=$TNS_ADMIN)))
SSL_SERVER_DN_MATCH = yes
EOF

# Display contents of sqlnet.ora if available
echo "sqlnet.ora content:"
cat "$TNS_ADMIN/sqlnet.ora" || echo " sqlnet.ora not found"

# Display contents of tnsnames.ora if available
echo "tnsnames.ora content:"
cat "$TNS_ADMIN/tnsnames.ora" || echo " tnsnames.ora not found"

# JVM opts
JAVA_OPTS="-Xmx256m -Dserver.address=0.0.0.0 -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} -Doracle.net.tns_admin=${TNS_ADMIN}"

# Pass the wallet password if provided (needed for ewallet.p12)
if [ -n "${ORACLE_WALLET_PASSWORD:-}" ]; then
  JAVA_OPTS="${JAVA_OPTS} -Doracle.net.wallet_password=${ORACLE_WALLET_PASSWORD}"
else
  echo " WARN: ORACLE_WALLET_PASSWORD not set. If ewallet.p12 requires it, connection will fail."
fi

# Start Spring Boot application with JVM tuning
echo " Starting Spring Boot..."
exec java ${JAVA_OPTS} -jar app.jar

# Note: Ensure that the environment variables ORACLE_WALLET_B64, WALLET_PASSWORD, and SPRING_PROFILES_ACTIVE are set before running this script.