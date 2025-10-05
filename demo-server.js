/**
 * TrustSeal Hedera Demo Server
 * 
 * Express.js server that serves the built React application for demo purposes.
 * Provides offline demonstration capabilities with comprehensive mock data.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Mock Hedera API endpoints for demo purposes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    network: 'testnet',
    message: 'TrustSeal Hedera Demo Server',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: [
      'Hedera Token Service (HTS) Integration',
      'NFT-based Credentials',
      'Role-based Access Control',
      'Real-time Verification',
      'Audit Trail Management'
    ]
  });
});

app.get('/api/network-info', (req, res) => {
  res.json({
    network: 'testnet',
    credentialTokenId: '0.0.5001',
    adminTopicId: '0.0.5002',
    supportedOperations: [
      'mintCredential',
      'verifyCredential', 
      'revokeCredential',
      'registerUser',
      'verifyUser'
    ]
  });
});

// Mock endpoints for credentials
app.get('/api/credentials', (req, res) => {
  res.json({
    success: true,
    credentials: [
      {
        tokenId: '0.0.5001',
        serialNumber: '1',
        owner: '0.0.2001',
        issuer: '0.0.1002',
        metadata: {
          studentName: 'John Doe',
          credentialType: 'Bachelor of Computer Science',
          institution: 'MIT',
          issueDate: '2024-05-15',
          revoked: false
        }
      }
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: 'TrustSeal Hedera',
    version: '1.0.0'
  });
});

// Catch all handler: serve the React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 TrustSeal Hedera Demo Server running on http://localhost:${PORT}`);
  console.log('📋 Features:');
  console.log('   • Hedera Hashgraph Integration');
  console.log('   • NFT-based Credential System');  
  console.log('   • Role-based Dashboards');
  console.log('   • Real-time Verification');
  console.log('   • Comprehensive Demo Data');
  console.log('');
  console.log(`🌐 Demo URL: http://localhost:${PORT}`);
  console.log(`🔗 API Status: http://localhost:${PORT}/api/status`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
});