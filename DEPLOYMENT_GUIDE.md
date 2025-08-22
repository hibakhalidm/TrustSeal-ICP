# 🚀 TrustSeal ICP - Mainnet Deployment Guide

## 📋 Prerequisites for Mainnet Deployment

### Required Tools
- **dfx** (v0.15.0 or higher): `sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"`
- **Node.js** (v18 or higher): For frontend build
- **Cycles Wallet**: For paying deployment costs
- **Internet Identity**: For authentication testing

### Required Resources
- **ICP Tokens**: Convert to cycles for deployment (~5-10 ICP recommended)
- **Cycles Wallet**: Create wallet on mainnet
- **Mainnet Access**: Stable internet connection

## 💰 Cycles Management

### 1. Get ICP Tokens
```bash
# Option 1: Buy ICP on exchanges (Coinbase, Binance, etc.)
# Option 2: Use ICP faucet for testnet (development only)
# Option 3: Use dfx ledger commands for transfers
```

### 2. Create Cycles Wallet
```bash
# Create cycles wallet on mainnet
dfx ledger --network ic create-canister $(dfx identity get-principal) --amount 4.0

# Get the canister ID and set as wallet
dfx identity --network ic set-wallet <CANISTER_ID>

# Verify wallet setup
dfx wallet --network ic balance
```

### 3. Top Up Cycles
```bash
# Convert ICP to cycles (1 ICP ≈ 1T cycles)
dfx ledger --network ic top-up --amount 2.0 $(dfx identity --network ic get-wallet)

# Verify cycles balance
dfx wallet --network ic balance
```

## 🔧 Pre-Deployment Configuration

### 1. Update dfx.json for Production
```json
{
  "version": 1,
  "canisters": {
    "trustseal_backend": {
      "type": "motoko",
      "main": "src/trustseal_backend/main.mo"
    },
    "trustseal_frontend": {
      "type": "assets",
      "source": [
        "src/trustseal_frontend/assets",
        "dist/"
      ]
    }
  },
  "networks": {
    "local": {
      "bind": "127.0.0.1:4943",
      "type": "ephemeral"
    },
    "ic": {
      "providers": ["https://icp-api.io"],
      "type": "persistent"
    }
  },
  "defaults": {
    "build": {
      "args": "",
      "packtool": ""
    }
  }
}
```

### 2. Build Frontend for Production
```bash
# Install dependencies
npm install

# Build production frontend
npm run build

# Verify dist/ folder is created
ls -la dist/
```

### 3. Environment Configuration
Create `.env.production`:
```env
NODE_ENV=production
REACT_APP_BACKEND_CANISTER_ID=<WILL_BE_SET_AFTER_DEPLOYMENT>
REACT_APP_FRONTEND_CANISTER_ID=<WILL_BE_SET_AFTER_DEPLOYMENT>
REACT_APP_INTERNET_IDENTITY_URL=https://identity.ic0.app
REACT_APP_IC_HOST=https://icp-api.io
```

## 🚀 Mainnet Deployment Process

### Step 1: Deploy Backend Canister
```bash
# Deploy backend to mainnet
dfx deploy trustseal_backend --network ic --with-cycles 2000000000000

# Get backend canister ID
dfx canister id trustseal_backend --network ic
# Save this ID: Example output: rrkah-fqaaa-aaaaa-aaaaq-cai
```

### Step 2: Update Frontend Configuration
```bash
# Update environment with backend canister ID
export REACT_APP_BACKEND_CANISTER_ID=$(dfx canister id trustseal_backend --network ic)

# Rebuild frontend with correct canister ID
npm run build
```

### Step 3: Deploy Frontend Canister
```bash
# Deploy frontend to mainnet
dfx deploy trustseal_frontend --network ic --with-cycles 1000000000000

# Get frontend canister ID
dfx canister id trustseal_frontend --network ic
# Save this ID: Example output: rdmx6-jaaaa-aaaaa-aaadq-cai
```

### Step 4: Initialize Backend
```bash
# Initialize admin (run once after deployment)
dfx canister call trustseal_backend initializeAdmin --network ic

# Verify deployment with health check
dfx canister call trustseal_backend healthCheck --network ic
```

## 🔗 Post-Deployment Configuration

### 1. Update README with Canister IDs
Replace placeholders in README.md:
```markdown
## 🔗 Canister IDs (Mainnet)

**Backend Canister**: `rrkah-fqaaa-aaaaa-aaaaq-cai`
**Frontend Canister**: `rdmx6-jaaaa-aaaaa-aaadq-cai`

**Live Demo**: https://rdmx6-jaaaa-aaaaa-aaadq-cai.icp0.app
```

### 2. Test Mainnet Deployment
```bash
# Test backend functions
dfx canister call trustseal_backend totalSupply --network ic
dfx canister call trustseal_backend getStatistics --network ic

# Test frontend access
curl -I https://$(dfx canister id trustseal_frontend --network ic).icp0.app
```

### 3. Configure Cycles Monitoring
```bash
# Check canister status
dfx canister status trustseal_backend --network ic
dfx canister status trustseal_frontend --network ic

# Set up cycles monitoring (optional)
dfx canister update-settings trustseal_backend --add-controller $(dfx identity get-principal) --network ic
```

## 🔄 Continuous Deployment

### Update Deployment Script
Create `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Deploying TrustSeal ICP to Mainnet..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Deploy backend
echo "🔧 Deploying backend canister..."
dfx deploy trustseal_backend --network ic

# Deploy frontend
echo "🎨 Deploying frontend canister..."
dfx deploy trustseal_frontend --network ic

# Get canister IDs
BACKEND_ID=$(dfx canister id trustseal_backend --network ic)
FRONTEND_ID=$(dfx canister id trustseal_frontend --network ic)

echo "✅ Deployment Complete!"
echo "Backend Canister: $BACKEND_ID"
echo "Frontend Canister: $FRONTEND_ID"
echo "Live URL: https://$FRONTEND_ID.icp0.app"

# Test deployment
echo "🧪 Testing deployment..."
dfx canister call trustseal_backend healthCheck --network ic

echo "🎉 TrustSeal ICP is live on IC Mainnet!"
```

Make executable:
```bash
chmod +x deploy.sh
```

## 📊 Monitoring & Maintenance

### 1. Cycles Management
```bash
# Check cycles balance regularly
dfx wallet --network ic balance

# Top up when needed (before reaching 1T cycles)
dfx ledger --network ic top-up --amount 1.0 $(dfx canister id trustseal_backend --network ic)
dfx ledger --network ic top-up --amount 1.0 $(dfx canister id trustseal_frontend --network ic)
```

### 2. Health Monitoring
```bash
# Regular health checks
dfx canister call trustseal_backend healthCheck --network ic

# Monitor canister status
dfx canister status trustseal_backend --network ic
dfx canister status trustseal_frontend --network ic
```

### 3. Performance Monitoring
```bash
# Check canister metrics
dfx canister info trustseal_backend --network ic
dfx canister info trustseal_frontend --network ic

# Monitor query/update call patterns
dfx canister logs trustseal_backend --network ic
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Insufficient Cycles
**Error**: "Canister ran out of cycles"
**Solution**:
```bash
dfx ledger --network ic top-up --amount 2.0 <CANISTER_ID>
```

#### 2. Network Connectivity
**Error**: "Failed to connect to IC network"
**Solution**:
```bash
# Check network configuration
dfx ping ic

# Update dfx
dfx upgrade
```

#### 3. Authentication Issues
**Error**: "Anonymous caller not allowed"
**Solution**:
```bash
# Verify identity
dfx identity whoami

# Check wallet setup
dfx identity --network ic get-wallet
```

#### 4. Frontend Build Errors
**Error**: "Module not found" or build failures
**Solution**:
```bash
# Clean and rebuild
rm -rf node_modules dist/
npm install
npm run build
```

## 🔐 Security Considerations

### 1. Identity Management
- **Backup Identity**: `dfx identity export default > identity-backup.pem`
- **Secure Storage**: Store identity files securely
- **Access Control**: Limit who can deploy updates

### 2. Canister Security
- **Controller Management**: Limit canister controllers
- **Upgrade Paths**: Plan for secure upgrades
- **Cycles Monitoring**: Prevent service interruption

### 3. Frontend Security
- **HTTPS Only**: Ensure all connections use HTTPS
- **CSP Headers**: Implement Content Security Policy
- **Input Validation**: Sanitize all user inputs

## 📈 Performance Optimization

### 1. Canister Optimization
```bash
# Optimize Motoko compilation
dfx build trustseal_backend --network ic --check

# Monitor memory usage
dfx canister status trustseal_backend --network ic
```

### 2. Frontend Optimization
```bash
# Bundle analysis
npm run build -- --analyze

# Optimize assets
# Consider implementing CDN for static assets
```

## 🎯 WCHL 2025 Submission Requirements

### Essential Deliverables
- [ ] **Live Mainnet URL**: `https://<frontend-canister-id>.icp0.app`
- [ ] **Backend Canister ID**: For judges to verify blockchain deployment
- [ ] **GitHub Repository**: Public repo with complete source code
- [ ] **Demo Video**: 10-minute demonstration on live mainnet
- [ ] **Pitch Video**: Project overview and vision
- [ ] **Documentation**: Complete setup and usage guides

### Verification Commands for Judges
```bash
# Verify backend canister on mainnet
dfx canister call <backend-canister-id> healthCheck --network ic

# Check canister info
dfx canister info <backend-canister-id> --network ic

# Test core functionality
dfx canister call <backend-canister-id> totalSupply --network ic
```

## 🏁 Final Deployment Checklist

### Pre-Deployment
- [ ] All code committed to GitHub
- [ ] Frontend builds without errors
- [ ] Backend compiles successfully
- [ ] Sufficient cycles in wallet
- [ ] Network connectivity verified

### Deployment Process
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Canister IDs documented
- [ ] Health checks passing
- [ ] Frontend accessible via HTTPS

### Post-Deployment
- [ ] Full user flow tested on mainnet
- [ ] All features working correctly
- [ ] Performance is acceptable
- [ ] Error handling working
- [ ] Documentation updated with live URLs

### Submission Preparation
- [ ] Demo video recorded on live mainnet
- [ ] Pitch video completed
- [ ] Repository cleaned and documented
- [ ] All canister IDs added to submission
- [ ] Backup deployment plan ready

---

**🎉 Success Indicator**: When you can successfully mint, view, and verify credentials on the live mainnet URL, you're ready for WCHL 2025 submission!

**Support**: If deployment fails, check cycles balance, network connectivity, and dfx version. The IC community on Discord is also very helpful for deployment issues.