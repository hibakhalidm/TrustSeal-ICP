#!/bin/bash
set -e

echo "🚀 Deploying TrustSeal ICP to Mainnet..."
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check dfx installation
if ! command -v dfx &> /dev/null; then
    echo -e "${RED}❌ dfx not found. Please install dfx first.${NC}"
    exit 1
fi

# Check dfx version
DFX_VERSION=$(dfx --version | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
echo -e "${GREEN}✅ dfx version: $DFX_VERSION${NC}"

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js version: $NODE_VERSION${NC}"

# Check cycles wallet
echo -e "${BLUE}💰 Checking cycles wallet...${NC}"
if ! dfx wallet --network ic balance &> /dev/null; then
    echo -e "${RED}❌ Cycles wallet not configured. Please set up your cycles wallet first.${NC}"
    echo -e "${YELLOW}💡 Run: dfx ledger --network ic create-canister \$(dfx identity get-principal) --amount 4.0${NC}"
    exit 1
fi

CYCLES_BALANCE=$(dfx wallet --network ic balance | grep -o '[0-9,]\+' | tr -d ',')
echo -e "${GREEN}✅ Cycles balance: $CYCLES_BALANCE${NC}"

if [ "$CYCLES_BALANCE" -lt 3000000000000 ]; then
    echo -e "${YELLOW}⚠️  Warning: Low cycles balance. Consider topping up.${NC}"
    echo -e "${YELLOW}💡 Run: dfx ledger --network ic top-up --amount 2.0 \$(dfx identity --network ic get-wallet)${NC}"
fi

# Build frontend
echo -e "${BLUE}📦 Building frontend...${NC}"
if ! npm run build; then
    echo -e "${RED}❌ Frontend build failed. Please fix build errors.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Deploy backend
echo -e "${BLUE}🔧 Deploying backend canister...${NC}"
if ! dfx deploy trustseal_backend --network ic; then
    echo -e "${RED}❌ Backend deployment failed.${NC}"
    exit 1
fi

BACKEND_ID=$(dfx canister id trustseal_backend --network ic)
echo -e "${GREEN}✅ Backend deployed: $BACKEND_ID${NC}"

# Update frontend with backend canister ID
echo -e "${BLUE}🔄 Updating frontend configuration...${NC}"
export REACT_APP_BACKEND_CANISTER_ID=$BACKEND_ID

# Rebuild frontend with backend ID
if ! npm run build; then
    echo -e "${RED}❌ Frontend rebuild failed.${NC}"
    exit 1
fi

# Deploy frontend
echo -e "${BLUE}🎨 Deploying frontend canister...${NC}"
if ! dfx deploy trustseal_frontend --network ic; then
    echo -e "${RED}❌ Frontend deployment failed.${NC}"
    exit 1
fi

FRONTEND_ID=$(dfx canister id trustseal_frontend --network ic)
echo -e "${GREEN}✅ Frontend deployed: $FRONTEND_ID${NC}"

# Initialize backend
echo -e "${BLUE}⚙️  Initializing backend...${NC}"
if dfx canister call trustseal_backend initializeAdmin --network ic; then
    echo -e "${GREEN}✅ Backend initialized${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may already be initialized${NC}"
fi

# Test deployment
echo -e "${BLUE}🧪 Testing deployment...${NC}"
if dfx canister call trustseal_backend healthCheck --network ic; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

# Generate deployment summary
echo ""
echo -e "${GREEN}🎉 TrustSeal ICP Deployment Complete!${NC}"
echo "========================================="
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "Backend Canister:  $BACKEND_ID"
echo "Frontend Canister: $FRONTEND_ID"
echo "Live URL:          https://$FRONTEND_ID.icp0.app"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Update README.md with canister IDs"
echo "2. Test the live application"
echo "3. Record demo video on mainnet"
echo "4. Submit to WCHL 2025"
echo ""
echo -e "${BLUE}🔗 Quick Links:${NC}"
echo "Live App:     https://$FRONTEND_ID.icp0.app"
echo "IC Dashboard: https://dashboard.internetcomputer.org/canister/$BACKEND_ID"
echo "Repository:   https://github.com/hibakhalidm/TrustSeal-ICP"
echo ""
echo -e "${GREEN}🏆 Ready for WCHL 2025 submission!${NC}"