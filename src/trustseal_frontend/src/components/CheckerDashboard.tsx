import React, { useState, useEffect } from 'react';

interface VerificationResult {
  isValid: boolean;
  credential: {
    id: number;
    owner: string;
    issuer: string;
    metadata: {
      student_name: string;
      credential_type: string;
      institution: string;
      issue_date: string;
      revoked: boolean;
      revocation_reason?: string;
    };
    issue_timestamp: number;
  };
  verificationTimestamp: number;
}

interface VerificationHistory {
  tokenId: number;
  result: VerificationResult;
  timestamp: number;
}

interface CheckerDashboardProps {
  actor: any;
  identity: any;
}

const CheckerDashboard: React.FC<CheckerDashboardProps> = ({ actor, identity }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'verify' | 'history' | 'register'>('register');
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userVerified, setUserVerified] = useState(false);

  // Verification form state
  const [verifyTokenId, setVerifyTokenId] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    organization: '',
    contactEmail: '',
    description: ''
  });

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      // Mock implementation for demo
      // In real implementation, check if user is verified
      setUserVerified(false); // Start with registration needed
    } catch (err) {
      console.error('Failed to check user status');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Mock implementation for demo
      setSuccess('Registration submitted successfully! Please wait for admin approval.');
      setUserVerified(true);
      setActiveSection('overview');
    } catch (err) {
      setError('Failed to submit registration');
    }
    setLoading(false);
  };

  const handleVerifyCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      // Mock implementation for demo
      const mockResult: VerificationResult = {
        isValid: true,
        credential: {
          id: parseInt(verifyTokenId),
          owner: 'be2us-64aaa-aaaaa-qadbq-cai',
          issuer: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
          metadata: {
            student_name: 'John Doe',
            credential_type: 'Bachelor of Science',
            institution: 'Massachusetts Institute of Technology',
            issue_date: '2023-06-15',
            revoked: false
          },
          issue_timestamp: Date.now() - 86400000
        },
        verificationTimestamp: Date.now()
      };

      setVerificationResult(mockResult);
      
      // Add to history
      const historyEntry: VerificationHistory = {
        tokenId: parseInt(verifyTokenId),
        result: mockResult,
        timestamp: Date.now()
      };
      setVerificationHistory(prev => [historyEntry, ...prev]);
      
      setVerifyTokenId('');
    } catch (err) {
      setError('Failed to verify credential');
    }
    setLoading(false);
  };

  if (!userVerified) {
    return (
      <div className="checker-dashboard">
        <div className="dashboard-header">
          <h2>🔍 Checker Registration</h2>
          <p>Register your organization to verify credentials</p>
        </div>

        <div className="dashboard-section">
          <form onSubmit={handleRegister} className="register-form">
            <div className="form-group">
              <label>Organization Name</label>
              <input
                type="text"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                placeholder="Your company or organization name"
                required
              />
            </div>
            <div className="form-group">
              <label>Organization Type</label>
              <input
                type="text"
                value={registerForm.organization}
                onChange={(e) => setRegisterForm({...registerForm, organization: e.target.value})}
                placeholder="e.g., Technology Company, HR Agency, Government"
                required
              />
            </div>
            <div className="form-group">
              <label>Contact Email</label>
              <input
                type="email"
                value={registerForm.contactEmail}
                onChange={(e) => setRegisterForm({...registerForm, contactEmail: e.target.value})}
                placeholder="official@yourcompany.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={registerForm.description}
                onChange={(e) => setRegisterForm({...registerForm, description: e.target.value})}
                placeholder="Brief description of your organization and verification needs"
                rows={3}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : '📝 Submit Registration'}
            </button>
          </form>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="checker-dashboard">
      <div className="dashboard-header">
        <h2>🔍 Checker Dashboard</h2>
        <p>Credential Verification & Validation</p>
      </div>

      <div className="dashboard-nav">
        <button 
          className={`nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`nav-btn ${activeSection === 'verify' ? 'active' : ''}`}
          onClick={() => setActiveSection('verify')}
        >
          🔍 Verify Credential
        </button>
        <button 
          className={`nav-btn ${activeSection === 'history' ? 'active' : ''}`}
          onClick={() => setActiveSection('history')}
        >
          📋 Verification History
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {activeSection === 'overview' && (
        <div className="dashboard-section">
          <h3>Verification Overview</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total Verifications</h4>
              <div className="stat-number">{verificationHistory.length}</div>
            </div>
            <div className="stat-card">
              <h4>Valid Credentials</h4>
              <div className="stat-number">
                {verificationHistory.filter(v => v.result.isValid).length}
              </div>
            </div>
            <div className="stat-card">
              <h4>This Month</h4>
              <div className="stat-number">
                {verificationHistory.filter(v => 
                  Date.now() - v.timestamp < 30 * 24 * 60 * 60 * 1000
                ).length}
              </div>
            </div>
          </div>

          <div className="recent-activity">
            <h4>Recent Verifications</h4>
            {verificationHistory.slice(0, 3).map((verification, index) => (
              <div key={index} className="verification-preview">
                <div className="verification-info">
                  <h5>Token ID: {verification.tokenId}</h5>
                  <p>{verification.result.credential.metadata.student_name}</p>
                  <span className="institution">{verification.result.credential.metadata.institution}</span>
                </div>
                <div className="verification-status">
                  <span className={`status-badge ${verification.result.isValid ? 'valid' : 'invalid'}`}>
                    {verification.result.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'verify' && (
        <div className="dashboard-section">
          <h3>Verify Credential</h3>
          <form onSubmit={handleVerifyCredential} className="verify-form">
            <div className="form-group">
              <label>Token ID</label>
              <input
                type="number"
                value={verifyTokenId}
                onChange={(e) => setVerifyTokenId(e.target.value)}
                placeholder="Enter credential Token ID"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : '🔍 Verify Credential'}
            </button>
          </form>

          {verificationResult && (
            <div className="verification-result">
              <h4>Verification Result</h4>
              <div className={`result-card ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
                <div className="result-header">
                  <span className={`status-badge ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
                    {verificationResult.isValid ? '✅ Valid' : '❌ Invalid'}
                  </span>
                  <span className="timestamp">
                    Verified: {new Date(verificationResult.verificationTimestamp).toLocaleString()}
                  </span>
                </div>
                <div className="result-details">
                  <p><strong>Student:</strong> {verificationResult.credential.metadata.student_name}</p>
                  <p><strong>Credential:</strong> {verificationResult.credential.metadata.credential_type}</p>
                  <p><strong>Institution:</strong> {verificationResult.credential.metadata.institution}</p>
                  <p><strong>Issue Date:</strong> {verificationResult.credential.metadata.issue_date}</p>
                  <p><strong>Token ID:</strong> {verificationResult.credential.id}</p>
                  <p><strong>Owner Principal:</strong> {verificationResult.credential.owner}</p>
                  <p><strong>Issuer Principal:</strong> {verificationResult.credential.issuer}</p>
                  {verificationResult.credential.metadata.revoked && (
                    <p><strong>⚠️ Revocation Reason:</strong> {verificationResult.credential.metadata.revocation_reason}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'history' && (
        <div className="dashboard-section">
          <h3>Verification History</h3>
          {verificationHistory.length === 0 ? (
            <p>No verifications performed yet. Start by verifying a credential!</p>
          ) : (
            <div className="history-list">
              {verificationHistory.map((verification, index) => (
                <div key={index} className="history-item">
                  <div className="history-header">
                    <h4>Token ID: {verification.tokenId}</h4>
                    <span className="timestamp">
                      {new Date(verification.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="history-details">
                    <p><strong>Student:</strong> {verification.result.credential.metadata.student_name}</p>
                    <p><strong>Credential:</strong> {verification.result.credential.metadata.credential_type}</p>
                    <p><strong>Institution:</strong> {verification.result.credential.metadata.institution}</p>
                    <span className={`status-badge ${verification.result.isValid ? 'valid' : 'invalid'}`}>
                      {verification.result.isValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckerDashboard;