const { v4: uuidv4 } = require('uuid');

// In-memory storage for hackathon demo
const credentials = new Map();

class CredentialService {
  
  /**
   * Create a new verifiable credential
   */
  async createCredential(credentialData) {
    const credential = {
      id: uuidv4(),
      type: 'VerifiableCredential',
      issuer: {
        id: 'did:web:trustseal-icp.org',
        name: credentialData.institution
      },
      issuanceDate: credentialData.issueDate,
      credentialSubject: {
        id: `did:web:student:${credentialData.studentId}`,
        name: credentialData.studentName,
        degree: credentialData.degree,
        institution: credentialData.institution,
        studentId: credentialData.studentId
      },
      proof: {
        type: 'EcdsaSecp256k1Signature2019',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:web:trustseal-icp.org#keys-1'
      }
    };

    // Store credential (in production, this would go to ICP blockchain)
    credentials.set(credential.id, credential);
    
    console.log(`Created credential with ID: ${credential.id}`);
    
    return credential;
  }

  /**
   * Get credential by ID
   */
  async getCredentialById(id) {
    return credentials.get(id) || null;
  }

  /**
   * Get all credentials for a student
   */
  async getCredentialsByStudentId(studentId) {
    const studentCredentials = [];
    for (const [id, credential] of credentials) {
      if (credential.credentialSubject.studentId === studentId) {
        studentCredentials.push({ id, ...credential });
      }
    }
    return studentCredentials;
  }

  /**
   * Verify credential authenticity
   */
  async verifyCredential(credentialId) {
    const credential = await this.getCredentialById(credentialId);
    if (!credential) {
      return { isValid: false, reason: 'Credential not found' };
    }

    // In production, this would verify the cryptographic proof
    // For hackathon demo, we'll just check if it exists
    return { 
      isValid: true, 
      credential: credential,
      reason: 'Credential exists and is valid'
    };
  }

  /**
   * Get all credentials (for demo purposes)
   */
  async getAllCredentials() {
    return Array.from(credentials.values());
  }

  /**
   * Delete credential (for demo purposes)
   */
  async deleteCredential(id) {
    return credentials.delete(id);
  }
}

module.exports = new CredentialService();
