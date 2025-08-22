# 🔐 TrustSeal ICP - Decentralized Credential Verification

**TrustSeal ICP** is a decentralized application (dApp) built on the Internet Computer Protocol (ICP) that enables secure, verifiable, and tamper-proof credential management using NFT technology following the DIP721 standard.

## 🚀 Project Overview

TrustSeal ICP revolutionizes credential verification by leveraging blockchain technology to create immutable, verifiable digital credentials. Universities, certification bodies, and other institutions can mint NFT-based credentials that students own and employers can verify instantly.

### Key Features

- **🏫 Institutional Issuance**: Authorized institutions can mint credential NFTs with cryptographic verification
- **🎓 Student Ownership**: Students own their credentials as NFTs in their Internet Identity wallets
- **🔍 Instant Verification**: Employers can verify credentials in <3 seconds using token IDs
- **🔒 Tamper-Proof**: Blockchain-based immutable storage with cryptographic hashing
- **🌐 Decentralized**: No central authority required for verification
- **🔗 Internet Identity**: Passwordless authentication using ICP's native identity system
- **🛡️ Zero-Knowledge Ready**: Privacy-preserving verification architecture
- **📊 Real-time Analytics**: Live platform statistics and health monitoring
- **🔄 Credential Lifecycle**: Revocation and management capabilities
- **⚡ Web-Speed**: Leverages ICP's unique performance characteristics

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   Internet      │
│   (React)       │◄──►│   (Motoko)       │◄──►│   Identity      │
│                 │    │                  │    │                 │
│ • Credential    │    │ • DIP721 NFTs    │    │ • Authentication│
│   Issuance      │    │ • Metadata       │    │ • Identity      │
│ • Verification  │    │   Storage        │    │   Management    │
│ • User Portal   │    │ • Ownership      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **dfx** (DFX SDK v0.14.0 or higher)
- **Internet Identity** setup for authentication

### Installing dfx

```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

## 🛠️ Setup and Installation

### 1. Clone the Repository

```bash
git clone https://github.com/hibakhalidm/TrustSeal-ICP.git
cd TrustSeal-ICP
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Local Internet Computer Network

```bash
dfx start --background --clean
```

### 4. Deploy Canisters Locally

```bash
# Deploy Internet Identity (for authentication)
dfx deploy internet_identity

# Deploy TrustSeal canisters
dfx deploy
```

### 5. Start Frontend Development Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

### 6. Quick Mainnet Deployment

```bash
# Deploy to IC mainnet (requires cycles wallet setup)
./deploy.sh
```

See `DEPLOYMENT_GUIDE.md` for detailed mainnet deployment instructions.

## 📖 Usage Guide

### For Institutions (Credential Issuers)

1. **Connect Wallet**: Use Internet Identity to authenticate
2. **Navigate to "Mint Credential"** tab
3. **Fill Credential Details**:
   - Student Name
   - Credential Type (Bachelor's, Master's, PhD, Certificate)
   - Institution Name
   - Issue Date
4. **Click "Mint Credential NFT"** to create the credential
5. **Note the Token ID** provided to the student

### For Students (Credential Holders)

1. **Connect Wallet** with the same identity used during issuance
2. **Navigate to "View Credentials"** tab
3. **View Your Credentials**: See all NFTs owned by your identity
4. **Share Token ID**: Provide employers with your credential Token ID for verification

### For Employers (Credential Verifiers)

1. **Navigate to "Verify Credential"** tab
2. **Enter Token ID** provided by the student/candidate
3. **Click "Verify Credential"**
4. **Review Results**: See credential details, validity, and issuing institution

## 🔧 Smart Contract Functions

### Backend Canister (Motoko)

#### Core Functions

```motoko
// Mint a new credential NFT
public shared({ caller }) func mint(
    student_name: Text,
    credential_type: Text,
    institution: Text,
    issue_date: Text
) : async Result.Result<TokenIdentifier, Text>

// Get all tokens owned by a user
public query func getTokensOfUser(user: Principal) : async [TokenIdentifier]

// Get credential metadata
public query func getTokenMetadata(tokenId: TokenIdentifier) : async ?Metadata

// Verify credential authenticity
public query func verifyCredential(tokenId: TokenIdentifier) : async ?{
    isValid: Bool;
    credential: Credential;
}
```

#### Data Structures

```motoko
public type Metadata = {
    student_name: Text;
    credential_type: Text;
    institution: Text;
    issue_date: Text;
};

public type Credential = {
    id: TokenIdentifier;
    owner: Principal;
    metadata: Metadata;
};
```

## 🚀 Deployment

### Local Development

```bash
# Start local replica
dfx start --background

# Deploy locally
dfx deploy --network local

# Get canister URLs
dfx canister --network local id trustseal_frontend
```

### Mainnet Deployment

```bash
# Deploy to Internet Computer mainnet
dfx deploy --network ic --with-cycles 1000000000000

# Note canister IDs for frontend configuration
dfx canister --network ic id trustseal_backend
dfx canister --network ic id trustseal_frontend
```

### Environment Configuration

Create `.env` file for production:

```env
NODE_ENV=production
REACT_APP_BACKEND_CANISTER_ID=<your_backend_canister_id>
REACT_APP_FRONTEND_CANISTER_ID=<your_frontend_canister_id>
REACT_APP_INTERNET_IDENTITY_URL=https://identity.ic0.app
```

## 🧪 Testing

### Run Tests

```bash
# Backend tests
dfx test

# Frontend tests
npm test
```

### Manual Testing Checklist

- [ ] Connect with Internet Identity
- [ ] Mint a credential
- [ ] View minted credentials
- [ ] Verify credential by Token ID
- [ ] Test with different user identities
- [ ] Validate error handling

## 📊 Demo Script

See `demo_script.md` for a step-by-step demonstration guide.

## 🏆 WCHL 2025 Submission Notes

### Problem Statement
Traditional credential verification is slow, expensive, and prone to fraud. Paper certificates can be forged, and centralized verification systems create bottlenecks.

### Solution
TrustSeal ICP leverages blockchain technology to create:
- **Immutable credentials** that cannot be forged
- **Instant verification** without contacting issuing institutions
- **Decentralized architecture** with no single point of failure
- **Student ownership** of their credentials as NFTs

### Innovation Highlights
1. **DIP721 Compliance**: Standards-based NFT implementation
2. **Internet Identity Integration**: Seamless, secure authentication
3. **Zero-Knowledge Ready**: Architecture supports future ZK implementations
4. **Institutional Adoption**: Simple workflow for universities and employers

### Technical Stack
- **Frontend**: React + TypeScript + Webpack
- **Backend**: Motoko smart contracts
- **Blockchain**: Internet Computer Protocol (ICP)
- **Authentication**: Internet Identity
- **Standards**: DIP721 NFT standard

## 📁 Project Structure

```
trustseal-icp/
├── dfx.json                 # DFX configuration
├── package.json             # NPM dependencies
├── webpack.config.js        # Webpack configuration
├── tsconfig.json           # TypeScript configuration
├── src/
│   ├── trustseal_backend/
│   │   └── main.mo         # Motoko smart contract
│   └── trustseal_frontend/
│       ├── assets/
│       │   └── index.html  # HTML template
│       └── src/
│           ├── index.tsx   # React entry point
│           └── App.tsx     # Main application
├── screenshots/            # Demo screenshots
├── README.md              # This file
├── demo_script.md         # Demo guide
└── pitch_summary.md       # Project pitch
```

## 🔗 Canister IDs (Mainnet)

**Backend Canister**: `[UPDATE AFTER RUNNING ./deploy.sh]`
**Frontend Canister**: `[UPDATE AFTER RUNNING ./deploy.sh]`

**Live Demo**: `https://[frontend-canister-id].icp0.app`

> **Note**: Run `./deploy.sh` to deploy to mainnet and get actual canister IDs for WCHL 2025 submission

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For questions about this submission or technical issues:

- **Team**: TrustSeal Team
- **Event**: Web3 Champions League (WCHL) 2025
- **Category**: DeFi/Infrastructure
- **Platform**: DoraHacks

## 🚀 Roadmap

### Phase 1 (Current - WCHL 2025)
- [x] Basic credential minting and verification
- [x] Internet Identity integration
- [x] DIP721 NFT standard compliance
- [x] React frontend with verification tools

### Phase 2 (Post-Hackathon)
- [ ] Multi-institution onboarding
- [ ] Advanced credential templates
- [ ] Mobile application
- [ ] Integration with existing university systems

### Phase 3 (Future)
- [ ] Zero-knowledge proof integration
- [ ] Cross-chain compatibility
- [ ] AI-powered fraud detection
- [ ] Decentralized governance model

---

**Built with ❤️ for WCHL 2025 on Internet Computer Protocol**
