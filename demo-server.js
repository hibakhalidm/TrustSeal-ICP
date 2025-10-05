const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const {
  Client,
  TokenMintTransaction,
  TokenNftInfoQuery,
  TokenId,
  NftId,
  TokenBurnTransaction,
} = require('@hashgraph/sdk');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Hedera configuration
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || 'testnet';
const HEDERA_OPERATOR_ID = process.env.HEDERA_OPERATOR_ID || '';
const HEDERA_OPERATOR_KEY = process.env.HEDERA_OPERATOR_KEY || '';
const HEDERA_NFT_TOKEN_ID = process.env.HEDERA_NFT_TOKEN_ID || '';
const HEDERA_ALLOW_BURN = (process.env.HEDERA_ALLOW_BURN || 'false').toLowerCase() === 'true';

function createHederaClient() {
  try {
    let client;
    if (HEDERA_NETWORK === 'mainnet') client = Client.forMainnet();
    else if (HEDERA_NETWORK === 'previewnet') client = Client.forPreviewnet();
    else client = Client.forTestnet();
    if (HEDERA_OPERATOR_ID && HEDERA_OPERATOR_KEY) {
      client.setOperator(HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY);
      return client;
    }
    return null;
  } catch (e) {
    console.error('Failed to create Hedera client:', e);
    return null;
  }
}

const hederaClient = createHederaClient();

// In-memory demo data (used when Hedera not fully configured)
const mockCredentials = [
  {
    id: 'cred_001', // when using Hedera, ids will be like 0.0.x/serial
    owner: 'student1',
    issuer: 'University of Technology',
    metadata: {
      student_name: 'Alice Johnson',
      credential_type: 'Computer Science Degree',
      institution: 'University of Technology',
      issue_date: '2024-05-15',
      revoked: false,
      revocation_reason: null
    },
    issue_timestamp: Date.now() - 86400000
  },
  {
    id: 'cred_002',
    owner: 'student2',
    issuer: 'Medical College',
    metadata: {
      student_name: 'Bob Smith',
      credential_type: 'Medical License',
      institution: 'Medical College',
      issue_date: '2024-06-10',
      revoked: false,
      revocation_reason: null
    },
    issue_timestamp: Date.now() - 43200000
  }
];

const mockUsers = [
  {
    principal: 'admin1',
    role: 'Admin',
    name: 'System Administrator',
    organization: 'TrustSeal Platform',
    verified: true,
    registration_date: Date.now() - 2592000000,
    last_login: Date.now() - 3600000
  },
  {
    principal: 'issuer1',
    role: 'Issuer',
    name: 'University Registrar',
    organization: 'University of Technology',
    verified: true,
    registration_date: Date.now() - 1728000000,
    last_login: Date.now() - 7200000
  }
];

// Helper utilities
function parseNftId(nftIdString) {
  // Accept formats like "0.0.12345/6" or "12345/6"
  if (!nftIdString) return null;
  const [token, serial] = String(nftIdString).split('/');
  if (!serial) return null;
  const tokenId = token.includes('.') ? token : `0.0.${token}`;
  return { tokenId, serial: Number(serial) };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TrustSeal Hedera Demo Server',
    timestamp: new Date().toISOString(),
    hedera: {
      network: HEDERA_NETWORK,
      operatorConfigured: Boolean(hederaClient),
      tokenConfigured: Boolean(HEDERA_NFT_TOKEN_ID),
    },
  });
});

// Hedera info endpoint
app.get('/api/hedera/info', async (req, res) => {
  try {
    if (!hederaClient) {
      return res.json({ network: HEDERA_NETWORK, operatorConfigured: false });
    }
    res.json({ network: HEDERA_NETWORK, operatorConfigured: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch Hedera info' });
  }
});

// Admin endpoints
app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalUsers: mockUsers.length,
    totalCredentials: mockCredentials.length,
    activeIssuers: mockUsers.filter(u => u.role === 'Issuer').length,
    recentVerifications: 147
  });
});

app.get('/api/admin/users', (req, res) => {
  res.json(mockUsers);
});

app.post('/api/admin/users/verify', (req, res) => {
  const { principal } = req.body;
  const user = mockUsers.find(u => u.principal === principal);
  if (user) {
    user.verified = true;
    res.json({ success: true, message: `User ${principal} verified successfully` });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

// Issuer endpoints
app.get('/api/issuer/credentials', (req, res) => {
  res.json(mockCredentials);
});

app.post('/api/issuer/mint', async (req, res) => {
  const { student_name, credential_type, institution, issue_date } = req.body;
  try {
    let mintedId = `cred_${Date.now()}`;
    const metadata = {
      student_name,
      credential_type,
      institution,
      issue_date,
      revoked: false,
      revocation_reason: null,
    };

    if (hederaClient && HEDERA_NFT_TOKEN_ID) {
      const mintTx = new TokenMintTransaction()
        .setTokenId(TokenId.fromString(HEDERA_NFT_TOKEN_ID))
        .addMetadata(Buffer.from(JSON.stringify(metadata)));
      const submit = await mintTx.execute(hederaClient);
      const receipt = await submit.getReceipt(hederaClient);
      const serials = receipt.serials || receipt.serialsList || [];
      const serial = Number(serials[0] || 0);
      if (serial > 0) mintedId = `${HEDERA_NFT_TOKEN_ID}/${serial}`;
    }

    const newCredential = {
      id: mintedId,
      owner: `student_${Date.now()}`,
      issuer: institution,
      metadata,
      issue_timestamp: Date.now(),
    };

    mockCredentials.push(newCredential);
    res.json({ success: true, credential: newCredential, message: 'Credential issued successfully' });
  } catch (e) {
    console.error('Mint failed:', e);
    res.status(500).json({ success: false, message: 'Mint failed', error: String(e) });
  }
});

app.post('/api/issuer/revoke', async (req, res) => {
  const { tokenId, reason } = req.body; // tokenId can be a cred_* or 0.0.x/serial
  try {
    const credential = mockCredentials.find((c) => c.id === tokenId);
    if (!credential) return res.status(404).json({ success: false, message: 'Credential not found' });

    if (hederaClient && tokenId.includes('/')) {
      const parsed = parseNftId(tokenId);
      if (parsed && HEDERA_ALLOW_BURN) {
        const burnTx = new TokenBurnTransaction()
          .setTokenId(TokenId.fromString(parsed.tokenId))
          .setSerials([parsed.serial]);
        await (await burnTx.execute(hederaClient)).getReceipt(hederaClient);
      }
    }

    credential.metadata.revoked = true;
    credential.metadata.revocation_reason = reason;
    res.json({ success: true, message: 'Credential revoked successfully' });
  } catch (e) {
    console.error('Revoke failed:', e);
    res.status(500).json({ success: false, message: 'Revoke failed', error: String(e) });
  }
});

// Checker endpoints
app.get('/api/checker/verify/:tokenId', async (req, res) => {
  const { tokenId } = req.params; // supports cred_* or 0.0.x/serial
  try {
    // Try local cache first
    let credential = mockCredentials.find((c) => c.id === tokenId);

    // Optionally fetch from Hedera mirror via SDK for NFT info if formatted id
    if (!credential && hederaClient && tokenId.includes('/')) {
      const parsed = parseNftId(tokenId);
      if (parsed) {
        const nftInfo = await new TokenNftInfoQuery()
          .setNftId(NftId.fromString(tokenId))
          .execute(hederaClient);
        const info = nftInfo[0];
        const metaJson = JSON.parse(Buffer.from(info.metadata).toString());
        credential = {
          id: tokenId,
          owner: info.accountId.toString(),
          issuer: 'Unknown',
          metadata: metaJson,
          issue_timestamp: Date.now(),
        };
      }
    }

    if (credential) {
      res.json({ isValid: !credential.metadata.revoked, credential, verificationTimestamp: Date.now() });
    } else {
      res.status(404).json({ isValid: false, message: 'Credential not found', verificationTimestamp: Date.now() });
    }
  } catch (e) {
    console.error('Verify failed:', e);
    res.status(500).json({ isValid: false, message: 'Verification error', error: String(e), verificationTimestamp: Date.now() });
  }
});

app.get('/api/checker/history', (req, res) => {
  const mockHistory = [
    {
      id: 'verify_001',
      credentialId: 'cred_001',
      timestamp: Date.now() - 3600000,
      result: 'valid',
      checkedBy: 'checker1'
    },
    {
      id: 'verify_002',
      credentialId: 'cred_002',
      timestamp: Date.now() - 7200000,
      result: 'valid',
      checkedBy: 'checker1'
    }
  ];
  
  res.json(mockHistory);
});

// Catch all handler: send back React's index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 TrustSeal Hedera Demo Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`🎯 Frontend served from ./dist directory`);
  console.log(`\n📋 Available API endpoints:`);
  console.log(`   GET  /api/health - Server health check`);
  console.log(`   GET  /api/hedera/info - Hedera client info`);
  console.log(`   GET  /api/admin/stats - System statistics`);
  console.log(`   GET  /api/admin/users - List all users`);
  console.log(`   POST /api/admin/users/verify - Verify a user`);
  console.log(`   GET  /api/issuer/credentials - List credentials`);
  console.log(`   POST /api/issuer/mint - Issue new credential`);
  console.log(`   POST /api/issuer/revoke - Revoke credential`);
  console.log(`   GET  /api/checker/verify/:id - Verify credential`);
  console.log(`   GET  /api/checker/history - Verification history`);
});

module.exports = app;
