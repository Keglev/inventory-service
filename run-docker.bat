@echo off
docker run -p 8081:8081 ^
  -v "C:/Users/carlo/Documents/githubprojects/inventory-service/oracle_wallet/Wallet_sspdb:/opt/oracle/wallet" ^
  -e TNS_ADMIN=/opt/oracle/wallet ^
  inventory-service:1.0.0
