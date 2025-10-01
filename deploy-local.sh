#!/bin/bash

# =============================================================================
# Smart Supply Pro - Local Deployment Helper Script
# =============================================================================
# This script helps you deploy to production from your local machine
# while handling the Oracle IP whitelist requirement.
#
# Usage:
#   ./deploy-local.sh [image-tag]
#
# If no image-tag is provided, it will use the latest commit SHA
# =============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Smart Supply Pro - Local Deployment${NC}"
echo "============================================"

# Get current IP
echo -e "${YELLOW}📡 Checking your current IP address...${NC}"
CURRENT_IP=$(curl -s https://ipinfo.io/ip)
echo -e "Your current IP: ${GREEN}$CURRENT_IP${NC}"

# Reminder about Oracle IP whitelist
echo ""
echo -e "${YELLOW}⚠️  Oracle IP Whitelist Reminder:${NC}"
echo "Make sure your current IP ($CURRENT_IP) is whitelisted in Oracle Cloud:"
echo "1. Log into Oracle Cloud Console"
echo "2. Go to your database → Network → Access Control Lists"
echo "3. Add/update IP: $CURRENT_IP/32"
echo ""
read -p "Press Enter after updating Oracle IP whitelist..."

# Determine image tag
if [ -n "$1" ]; then
    IMAGE_TAG="$1"
else
    IMAGE_TAG=$(git rev-parse --short HEAD)
fi

DOCKER_USERNAME=${DOCKER_USERNAME:-"keglev"}  # Your actual Docker Hub username
IMAGE_NAME="$DOCKER_USERNAME/inventory-service:$IMAGE_TAG"

echo ""
echo -e "${BLUE}🐳 Deploying image: ${GREEN}$IMAGE_NAME${NC}"

# Check if image exists locally or pull it
echo -e "${YELLOW}📥 Checking if image exists...${NC}"
if ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
    echo "Image not found locally, pulling from Docker Hub..."
    docker pull "$IMAGE_NAME"
fi

# Deploy to Fly.io
echo ""
echo -e "${YELLOW}🛫 Deploying to Fly.io...${NC}"
fly deploy --image "$IMAGE_NAME" --app inventoryservice

# Health check
echo ""
echo -e "${YELLOW}🏥 Performing health check...${NC}"
sleep 10
if curl -f -s https://inventoryservice.fly.dev/health >/dev/null; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 App is running at: https://inventoryservice.fly.dev${NC}"
else
    echo -e "${RED}⚠️  Health check failed, but app might still be starting...${NC}"
    echo "Check logs with: fly logs --app inventoryservice"
fi

echo ""
echo -e "${BLUE}📋 Useful commands:${NC}"
echo "  View logs:    fly logs --app inventoryservice"
echo "  Check status: fly status --app inventoryservice"
echo "  Open app:     fly open --app inventoryservice"