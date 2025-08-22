const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const qrcode = require('qrcode');

// Import our service modules
const credentialService = require('./services/credentialService');
const zkProofService = require('./services/zkProofService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'credential-worker-service',
    timestamp: new Date().toISOString()
  });
});

// Issue credential endpoint
app.post('/issue', async (req, res) => {
  try {
    const { studentName, degree, institution, issueDate, studentId } = req.body;
    
    if (!studentName || !degree || !institution || !issueDate || !studentId) {
      return res.status(400).json({ 
        error: 'Missing required fields: studentName, degree, institution, issueDate, studentId' 
      });
    }

    console.log(`Issuing credential for student: ${studentName} from ${institution}`);

    // Create verifiable credential
    const credential = await credentialService.createCredential({
      studentName,
      degree,
      institution,
      issueDate,
      studentId
    });

    // Generate ZK proof that the credential exists
    const proof = await zkProofService.generateProof(credential);

    // Create QR code for the proof
    const qrCodeDataUrl = await qrcode.toDataURL(JSON.stringify(proof));

    res.json({
      success: true,
      credentialId: credential.id,
      proof: proof,
      qrCode: qrCodeDataUrl,
      message: 'Credential issued successfully'
    });

  } catch (error) {
    console.error('Error issuing credential:', error);
    res.status(500).json({ 
      error: 'Failed to issue credential',
      details: error.message 
    });
  }
});

// Verify ZK proof endpoint
app.post('/verify', async (req, res) => {
  try {
    const { proof, publicInputs } = req.body;
    
    if (!proof || !publicInputs) {
      return res.status(400).json({ 
        error: 'Missing required fields: proof, publicInputs' 
      });
    }

    console.log('Verifying ZK proof...');

    // Verify the ZK proof
    const isValid = await zkProofService.verifyProof(proof, publicInputs);

    res.json({
      success: true,
      isValid: isValid,
      message: isValid ? 'Proof verified successfully' : 'Proof verification failed'
    });

  } catch (error) {
    console.error('Error verifying proof:', error);
    res.status(500).json({ 
      error: 'Failed to verify proof',
      details: error.message 
    });
  }
});

// Get credential by ID endpoint
app.get('/credential/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const credential = await credentialService.getCredentialById(id);
    
    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    res.json({
      success: true,
      credential: credential
    });

  } catch (error) {
    console.error('Error fetching credential:', error);
    res.status(500).json({ 
      error: 'Failed to fetch credential',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Credential Worker Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Issue credentials: POST http://localhost:${PORT}/issue`);
  console.log(`✅ Verify proofs: POST http://localhost:${PORT}/verify`);
});

module.exports = app;
