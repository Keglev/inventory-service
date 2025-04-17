@echo off
SET CONTAINER_NAME=inventory-service-container
SET IMAGE_NAME=inventory-service:1.0.0
SET WALLET_PATH=C:/Users/carlo/Documents/githubprojects/inventory-service/oracle_wallet/Wallet_sspdb
SET CONTAINER_WALLET=/opt/oracle/wallet

echo Stopping old container (if any)...
docker stop %CONTAINER_NAME% >nul 2>&1

echo Removing old container (if any)...
docker rm %CONTAINER_NAME% >nul 2>&1

echo Building Docker image...
docker build -t %IMAGE_NAME% .

echo Starting new container...
docker run -d --name %CONTAINER_NAME% -p 8081:8081 ^
  -v "%WALLET_PATH%:%CONTAINER_WALLET%" ^
  -e TNS_ADMIN=%CONTAINER_WALLET% ^
  %IMAGE_NAME%

echo Done! Your app is running at: http://localhost:8081
