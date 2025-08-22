const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Mock data
const mockCredentials = [
  {
    id: 'cred_001',
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

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'TrustSeal ICP Demo Server',
    timestamp: new Date().toISOString()
  });
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

app.post('/api/issuer/mint', (req, res) => {
  const { student_name, credential_type, institution, issue_date } = req.body;
  
  const newCredential = {
    id: `cred_${Date.now()}`,
    owner: `student_${Date.now()}`,
    issuer: institution,
    metadata: {
      student_name,
      credential_type,
      institution,
      issue_date,
      revoked: false,
      revocation_reason: null
    },
    issue_timestamp: Date.now()
  };
  
  mockCredentials.push(newCredential);
  
  res.json({
    success: true,
    credential: newCredential,
    message: 'Credential issued successfully'
  });
});

app.post('/api/issuer/revoke', (req, res) => {
  const { tokenId, reason } = req.body;
  const credential = mockCredentials.find(c => c.id === tokenId);
  
  if (credential) {
    credential.metadata.revoked = true;
    credential.metadata.revocation_reason = reason;
    res.json({ success: true, message: 'Credential revoked successfully' });
  } else {
    res.status(404).json({ success: false, message: 'Credential not found' });
  }
});

// Checker endpoints
app.get('/api/checker/verify/:tokenId', (req, res) => {
  const { tokenId } = req.params;
  const credential = mockCredentials.find(c => c.id === tokenId);
  
  if (credential) {
    res.json({
      isValid: !credential.metadata.revoked,
      credential,
      verificationTimestamp: Date.now()
    });
  } else {
    res.status(404).json({ 
      isValid: false, 
      message: 'Credential not found',
      verificationTimestamp: Date.now()
    });
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
  console.log(`🚀 TrustSeal ICP Demo Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`🎯 Frontend served from ./dist directory`);
  console.log(`\n📋 Available API endpoints:`);
  console.log(`   GET  /api/health - Server health check`);
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
