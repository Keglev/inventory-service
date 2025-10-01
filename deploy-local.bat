@echo off
REM =============================================================================
REM Smart Supply Pro - Local Deployment Helper Script (Windows)
REM =============================================================================
REM This script helps you deploy to production from your local Windows machine
REM while handling the Oracle IP whitelist requirement.
REM
REM Usage:
REM   deploy-local.bat [image-tag]
REM
REM If no image-tag is provided, it will use the latest commit SHA
REM =============================================================================

echo 🚀 Smart Supply Pro - Local Deployment
echo ============================================

REM Get current IP
echo 📡 Checking your current IP address...
for /f %%i in ('curl -s https://ipinfo.io/ip') do set CURRENT_IP=%%i
echo Your current IP: %CURRENT_IP%

REM Reminder about Oracle IP whitelist
echo.
echo ⚠️  Oracle IP Whitelist Reminder:
echo Make sure your current IP (%CURRENT_IP%) is whitelisted in Oracle Cloud:
echo 1. Log into Oracle Cloud Console
echo 2. Go to your database → Network → Access Control Lists
echo 3. Add/update IP: %CURRENT_IP%/32
echo.
pause

REM Determine image tag
if "%1"=="" (
    for /f %%i in ('git rev-parse --short HEAD') do set IMAGE_TAG=%%i
) else (
    set IMAGE_TAG=%1
)

set DOCKER_USERNAME=keglev
set IMAGE_NAME=%DOCKER_USERNAME%/inventory-service:%IMAGE_TAG%

echo.
echo 🐳 Deploying image: %IMAGE_NAME%

REM Deploy to Fly.io
echo.
echo 🛫 Deploying to Fly.io...
fly deploy --image %IMAGE_NAME% --app inventoryservice

REM Health check
echo.
echo 🏥 Performing health check...
timeout /t 10 /nobreak >nul
curl -f -s https://inventoryservice.fly.dev/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Deployment successful!
    echo 🌐 App is running at: https://inventoryservice.fly.dev
) else (
    echo ⚠️  Health check failed, but app might still be starting...
    echo Check logs with: fly logs --app inventoryservice
)

echo.
echo 📋 Useful commands:
echo   View logs:    fly logs --app inventoryservice
echo   Check status: fly status --app inventoryservice
echo   Open app:     fly open --app inventoryservice

pause