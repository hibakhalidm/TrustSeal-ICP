import React, { useState, useEffect } from 'react';

interface CheckerDashboardProps {
  actor: any;
  identity: any;
}

interface CheckerInfo {
  principal: string;
  organization: string;
  verified: boolean;
  registration_date: number;
  verification_count: number;
}

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
      issued_timestamp: number;
    };
    is_revoked: boolean;
  };
  issuer_verified: boolean;
  revocation_status: string;
  verification_timestamp?: number;
}

const CheckerDashboard: React.FC<CheckerDashboardProps> = ({ actor, identity }) => {
  const [checkerInfo, setCheckerInfo] = useState<CheckerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'verify' | 'history' | 'register'>('verify');

  // Verification form
  const [verifyTokenId, setVerifyTokenId] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verificationHistory, setVerificationHistory] = useState<VerificationResult[]>([]);

  // Registration form
  const [registerForm, setRegisterForm] = useState({
    organization: ''
  });

  useEffect(() => {
    checkRegistrationStatus();
  }, [actor, identity]);

  const checkRegistrationStatus = async () => {
    if (!actor || !identity) return;
    
    try {
      const stats = await actor.getCheckerStats(identity.getPrincipal());
      setCheckerInfo(stats);
    } catch (err) {
      console.log('Checker not registered yet');
    }
  };

  const handleRegisterChecker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await actor.registerChecker(registerForm.organization);
      if ('ok' in result) {
        setSuccess('Registration successful! You can now start verifying credentials.');
        setRegisterForm({ organization: '' });
        await checkRegistrationStatus();
      } else {
        setError('Registration failed: ' + result.err);
      }
    } catch (err) {
      setError('Error registering: ' + String(err));
    }
    setLoading(false);
  };

  const handleVerifyCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    
    setLoading(true);
    setError('');
    setVerificationResult(null);
    
    try {
      const result = await actor.verifyCredentialAsChecker(parseInt(verifyTokenId));
      if (result) {
        setVerificationResult(result);
        setVerificationHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10
        await checkRegistrationStatus(); // Update verification count
      } else {
        setError('Credential not found or invalid token ID');
      }
    } catch (err) {
      setError('Error verifying credential: ' + String(err));
    }
    setLoading(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString();
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(Number(timestamp) / 1000000).toLocaleString();
  };

  const getValidityColor = (isValid: boolean) => {
    return isValid ? '#2ecc71' : '#e74c3c';
  };

  const getCredentialTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Bachelor of Science': '#3498db',
      'Bachelor of Arts': '#9b59b6',
      'Master of Science': '#e67e22',
      'Master of Arts': '#e74c3c',
      'PhD': '#f39c12',
      'Certificate': '#2ecc71'
    };
    return colors[type] || '#95a5a6';
  };

  // Create a mock checker info if not registered to allow immediate verification
  const effectiveCheckerInfo = checkerInfo || {
    principal: identity?.getPrincipal().toString() || 'anonymous',
    organization: 'Guest Verifier',
    verified: true,
    registration_date: Date.now() * 1000000,
    verification_count: 0
  };

  // Checkers don't need verification - they can start verifying immediately

  return (
    <div className="checker-dashboard">
      <div className="dashboard-header">
        <h2>🔍 Checker Dashboard</h2>
        <p>Credential verification for {effectiveCheckerInfo.organization}</p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'verify' ? 'active' : ''}`}
          onClick={() => setActiveTab('verify')}
        >
          🔍 Verify Credential
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📊 Verification History
        </button>
      </div>

      {activeTab === 'verify' && (
        <div className="verify-section">
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-label">Organization:</span>
              <span className="stat-value">{effectiveCheckerInfo.organization}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Verifications:</span>
              <span className="stat-value">{effectiveCheckerInfo.verification_count}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Member Since:</span>
              <span className="stat-value">{formatDate(effectiveCheckerInfo.registration_date)}</span>
            </div>
          </div>

          <div className="verify-form-container">
            <h3>Verify Credential</h3>
            <form onSubmit={handleVerifyCredential} className="verify-form">
              <div className="form-group">
                <label>Token ID</label>
                <input
                  type="number"
                  value={verifyTokenId}
                  onChange={(e) => setVerifyTokenId(e.target.value)}
                  placeholder="Enter credential token ID"
                  required
                />
                <small>Get this ID from the credential holder</small>
              </div>
              <button type="submit" className="btn verify-btn" disabled={loading}>
                {loading ? 'Verifying...' : '🔍 Verify Credential'}
              </button>
            </form>
          </div>

          {verificationResult && (
            <div className="verification-result">
              <div className={`result-header ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
                <h3>
                  {verificationResult.isValid ? '✅ Valid Credential' : '❌ Invalid Credential'}
                </h3>
                <span 
                  className="validity-badge"
                  style={{ backgroundColor: getValidityColor(verificationResult.isValid) }}
                >
                  {verificationResult.isValid ? 'VERIFIED' : 'INVALID'}
                </span>
              </div>

              <div className="credential-details">
                <div className="detail-section">
                  <h4>📋 Credential Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Token ID:</label>
                      <span>{verificationResult.credential.id}</span>
                    </div>
                    <div className="detail-item">
                      <label>Student Name:</label>
                      <span>{verificationResult.credential.metadata.student_name}</span>
                    </div>
                    <div className="detail-item">
                      <label>Credential Type:</label>
                      <span 
                        className="credential-type-badge"
                        style={{ backgroundColor: getCredentialTypeColor(verificationResult.credential.metadata.credential_type) }}
                      >
                        {verificationResult.credential.metadata.credential_type}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Institution:</label>
                      <span>{verificationResult.credential.metadata.institution}</span>
                    </div>
                    <div className="detail-item">
                      <label>Issue Date:</label>
                      <span>{verificationResult.credential.metadata.issue_date}</span>
                    </div>
                    <div className="detail-item">
                      <label>Issued On:</label>
                      <span>{formatDate(verificationResult.credential.metadata.issued_timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>🔐 Verification Details</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Revocation Status:</label>
                      <span className={`status ${verificationResult.revocation_status === 'Active' ? 'active' : 'revoked'}`}>
                        {verificationResult.revocation_status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Issuer Verified:</label>
                      <span className={`status ${verificationResult.issuer_verified ? 'verified' : 'unverified'}`}>
                        {verificationResult.issuer_verified ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Owner Principal:</label>
                      <span className="principal-id">{verificationResult.credential.owner.slice(0, 30)}...</span>
                    </div>
                    <div className="detail-item">
                      <label>Issuer Principal:</label>
                      <span className="principal-id">{verificationResult.credential.issuer.slice(0, 30)}...</span>
                    </div>
                    {verificationResult.verification_timestamp && (
                      <div className="detail-item">
                        <label>Verified At:</label>
                        <span>{formatDateTime(verificationResult.verification_timestamp)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!verificationResult.isValid && (
                <div className="invalid-reasons">
                  <h4>❗ Why is this credential invalid?</h4>
                  <ul>
                    {verificationResult.revocation_status === 'Revoked' && (
                      <li>🚫 The credential has been revoked by the issuer</li>
                    )}
                    {!verificationResult.issuer_verified && (
                      <li>⚠️ The issuing institution is not verified in the system</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-section">
          <h3>Verification History</h3>
          {verificationHistory.length === 0 ? (
            <div className="empty-state">
              <p>No verifications performed yet.</p>
              <button className="btn" onClick={() => setActiveTab('verify')}>
                Verify Your First Credential
              </button>
            </div>
          ) : (
            <div className="history-list">
              {verificationHistory.map((result, index) => (
                <div key={index} className={`history-item ${result.isValid ? 'valid' : 'invalid'}`}>
                  <div className="history-header">
                    <div className="history-info">
                      <strong>Token ID: {result.credential.id}</strong>
                      <span className="student-name">{result.credential.metadata.student_name}</span>
                    </div>
                    <div className="history-status">
                      <span 
                        className="validity-badge"
                        style={{ backgroundColor: getValidityColor(result.isValid) }}
                      >
                        {result.isValid ? 'VALID' : 'INVALID'}
                      </span>
                      {result.verification_timestamp && (
                        <span className="timestamp">{formatDateTime(result.verification_timestamp)}</span>
                      )}
                    </div>
                  </div>
                  <div className="history-details">
                    <span className="credential-type">{result.credential.metadata.credential_type}</span>
                    <span className="institution">{result.credential.metadata.institution}</span>
                    <span className="issue-date">Issued: {result.credential.metadata.issue_date}</span>
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
