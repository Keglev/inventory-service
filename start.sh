#!/bin/sh

# ==========================================================
# Script to decode Oracle Wallet, display configs, and run Spring Boot
# ==========================================================

# Decode Oracle Wallet from base64 into zip file
echo "$ORACLE_WALLET_B64" | base64 -d > /app/wallet.zip
unzip -o /app/wallet.zip -d /app/wallet

echo " Oracle Wallet extracted"

# Display contents of sqlnet.ora if available
echo " sqlnet.ora content:"
find /app/wallet -name sqlnet.ora -exec cat {} \; 2>/dev/null || echo " sqlnet.ora not found"

# Display contents of tnsnames.ora if available
echo " tnsnames.ora content:"
find /app/wallet -name tnsnames.ora -exec cat {} \; 2>/dev/null || echo " tnsnames.ora not found"

# Start Spring Boot application with JVM tuning
echo " Starting Spring Boot..."
exec java \
  -Xmx256m \
  -Doracle.net.wallet_password="${WALLET_PASSWORD}" \
  -Dspring.profiles.active="${SPRING_PROFILES_ACTIVE}" \
  -Dserver.address=0.0.0.0 \
  -jar app.jar
# Note: Ensure that the environment variables ORACLE_WALLET_B64, WALLET_PASSWORD, and SPRING_PROFILES_ACTIVE are set before running this script.