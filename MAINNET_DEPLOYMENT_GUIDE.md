# 🌐 TrustSeal ICP - Mainnet Deployment Guide

## 🎯 **Objective**
Deploy TrustSeal ICP to Internet Computer mainnet to obtain live canister IDs for WCHL 2025 submission.

---

## 📋 **Prerequisites**

### **1. Install DFX SDK**
```bash
# Install DFX (if not already installed)
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Verify installation
dfx --version
```

### **2. Create IC Identity**
```bash
# Create new identity for deployment
dfx identity new deployment-identity
dfx identity use deployment-identity

# Get principal for funding
dfx identity get-principal
```

### **3. Fund Deployment Wallet**
- Visit [NNS Dapp](https://nns.ic0.app) 
- Convert ICP to cycles (minimum 2 ICP recommended)
- Note your wallet principal

---

## 🛠️ **Deployment Steps**

### **Step 1: Prepare Local Environment**
```bash
# Navigate to project directory
cd /path/to/trustseal-icp

# Install dependencies
npm install

# Build frontend assets
npm run build

# Verify build output
ls -la dist/
```

### **Step 2: Configure DFX for Mainnet**
```bash
# Start local replica for testing (optional)
dfx start --background --clean

# Deploy locally first to test
dfx deploy --network local

# Test local deployment
dfx canister --network local call trustseal_backend totalSupply
```

### **Step 3: Deploy to IC Mainnet**
```bash
# Deploy to mainnet with cycles
dfx deploy --network ic --with-cycles 1000000000000

# Alternative: Deploy with specific wallet
dfx deploy --network ic --wallet $(dfx identity get-wallet)
```

### **Step 4: Get Canister IDs**
```bash
# Get backend canister ID
dfx canister --network ic id trustseal_backend

# Get frontend canister ID  
dfx canister --network ic id trustseal_frontend

# Save IDs to file
echo "Backend Canister: $(dfx canister --network ic id trustseal_backend)" > CANISTER_IDS.txt
echo "Frontend Canister: $(dfx canister --network ic id trustseal_frontend)" >> CANISTER_IDS.txt
```

### **Step 5: Initialize Backend**
```bash
# Initialize admin account
dfx canister --network ic call trustseal_backend initializeAdmin

# Verify initialization
dfx canister --network ic call trustseal_backend getUserRole "(principal \"$(dfx identity get-principal)\")"
```

### **Step 6: Update Frontend Configuration**
```bash
# Create environment file
cat > .env.production << EOF
NODE_ENV=production
REACT_APP_BACKEND_CANISTER_ID=$(dfx canister --network ic id trustseal_backend)
REACT_APP_FRONTEND_CANISTER_ID=$(dfx canister --network ic id trustseal_frontend)
REACT_APP_INTERNET_IDENTITY_URL=https://identity.ic0.app
REACT_APP_IC_HOST=https://icp-api.io
EOF
```

### **Step 7: Rebuild and Redeploy Frontend**
```bash
# Rebuild with production config
npm run build

# Redeploy frontend with updated build
dfx deploy --network ic trustseal_frontend
```

---

## 🧪 **Testing Mainnet Deployment**

### **Test 1: Basic Connectivity**
```bash
# Test backend canister
dfx canister --network ic call trustseal_backend totalSupply

# Expected output: (0 : nat) for fresh deployment
```

### **Test 2: Admin Functions**
```bash
# Test admin initialization
dfx canister --network ic call trustseal_backend initializeAdmin

# Test user registration
dfx canister --network ic call trustseal_backend registerUser \
  "(principal \"be2us-64aaa-aaaaa-qadbq-cai\", variant { Issuer }, \"MIT Registrar\", \"Massachusetts Institute of Technology\")"
```

### **Test 3: Frontend Access**
```bash
# Get frontend URL
echo "Frontend URL: https://$(dfx canister --network ic id trustseal_frontend).icp0.io"

# Test in browser
curl -I "https://$(dfx canister --network ic id trustseal_frontend).icp0.io"
```

### **Test 4: End-to-End Workflow**
1. **Access Frontend**: Open frontend URL in browser
2. **Connect Internet Identity**: Authenticate with II
3. **Test Role Assignment**: Verify correct dashboard loads
4. **Test Core Functions**: Mint, verify, and manage credentials
5. **Test Cross-Role Interaction**: Admin approves, Issuer mints, Checker verifies

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Insufficient Cycles**
```bash
# Check canister status
dfx canister --network ic status trustseal_backend

# Add more cycles
dfx canister --network ic deposit-cycles 1000000000000 trustseal_backend
```

#### **Identity Issues**
```bash
# List identities
dfx identity list

# Switch identity
dfx identity use deployment-identity

# Get wallet
dfx identity get-wallet
```

#### **Build Failures**
```bash
# Clean and rebuild
rm -rf dist/
npm run build

# Check for errors
npm run build 2>&1 | grep -i error
```

#### **Canister Upgrade Issues**
```bash
# Force upgrade if needed
dfx canister --network ic install trustseal_backend --mode upgrade

# Check upgrade status
dfx canister --network ic status trustseal_backend
```

---

## 📊 **Post-Deployment Verification**

### **1. Canister Health Check**
```bash
# Check both canisters are running
dfx canister --network ic status trustseal_backend
dfx canister --network ic status trustseal_frontend

# Verify cycle balance
dfx canister --network ic call trustseal_backend __get_cycles
```

### **2. Functional Testing**
```bash
# Test core functions
dfx canister --network ic call trustseal_backend totalSupply
dfx canister --network ic call trustseal_backend getAllCredentials

# Test with real Internet Identity
# (Use frontend interface for this)
```

### **3. Performance Monitoring**
- Monitor canister metrics in NNS dashboard
- Track cycle consumption
- Monitor query/update call performance
- Set up alerts for low cycle balance

---

## 📝 **Documentation Updates**

### **Update README.md**
```markdown
## 🌐 Live Deployment

**Mainnet Canisters:**
- **Backend**: `[INSERT_BACKEND_CANISTER_ID]`
- **Frontend**: `[INSERT_FRONTEND_CANISTER_ID]`

**Live Demo**: https://[INSERT_FRONTEND_CANISTER_ID].icp0.io

### Quick Start (Mainnet)
1. Visit the live demo URL
2. Connect with Internet Identity
3. Register as Issuer or Checker
4. Start using TrustSeal ICP!
```

### **Update dfx.json for Production**
```json
{
  "networks": {
    "ic": {
      "providers": ["https://icp-api.io"],
      "type": "persistent"
    }
  },
  "canisters": {
    "trustseal_backend": {
      "type": "motoko",
      "main": "src/trustseal_backend/main.mo"
    },
    "trustseal_frontend": {
      "type": "assets",
      "source": ["dist/"]
    }
  }
}
```

---

## 🚀 **Expected Outcomes**

### **After Successful Deployment**
1. **Live Canister IDs**: Two working canisters on IC mainnet
2. **Public Access**: Globally accessible application URL
3. **Real Blockchain Integration**: Actual ICP functionality, not mocks
4. **Demonstration Ready**: Working system for video demos
5. **Submission Complete**: All WCHL 2025 requirements met

### **Canister Information for Submission**
```
TrustSeal ICP - WCHL 2025 Submission

Backend Canister ID: [WILL BE GENERATED]
Frontend Canister ID: [WILL BE GENERATED]
Live Demo URL: https://[FRONTEND_ID].icp0.io

Repository: https://github.com/[USERNAME]/ZK-Certify-TrustSeal-ICP
Demo Video: [YOUTUBE/VIMEO URL]
Pitch Video: [YOUTUBE/VIMEO URL]
```

---

## 💰 **Cost Estimation**

### **Deployment Costs**
- **Initial Deployment**: ~0.5 ICP (cycles for deployment)
- **Monthly Operation**: ~0.1 ICP (for moderate usage)
- **Demo Period**: ~0.2 ICP (for hackathon demonstration)

### **Cycle Management**
```bash
# Monitor cycle usage
dfx canister --network ic status trustseal_backend

# Top up when needed
dfx canister --network ic deposit-cycles 500000000000 trustseal_backend
```

---

**🎯 This deployment guide ensures TrustSeal ICP meets all WCHL 2025 technical requirements with live, working canisters on Internet Computer mainnet.**
