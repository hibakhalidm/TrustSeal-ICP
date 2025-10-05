/**
 * Checker Dashboard Component
 * 
 * Provides verification functionality for employers and other verifiers
 * to authenticate credentials on the Hedera network.
 * 
 * @author TrustSeal Team
 */

import React, { useState, useEffect } from 'react';

interface VerificationResult {
  isValid: boolean;
  credential: any;
  verificationTimestamp: number;
  onChainOwner: string;
  metadata: any;
}

interface CheckerDashboardProps {
  hederaService: any;
  currentAccountId: string;
}

const CheckerDashboard: React.FC<CheckerDashboardProps> = ({ hederaService, currentAccountId }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'verify' | 'history'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Verification form state
  const [verifyForm, setVerifyForm] = useState({
    tokenId: '',
    serialNumber: ''
  });

  // Verification result
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Mock verification history (in production, this would come from the service)
  const [verificationHistory, setVerificationHistory] = useState([
    {
      id: 1,
      tokenId: '0.0.5001',
      serialNumber: '1',
      studentName: 'John Doe',
      credentialType: 'Bachelor of Computer Science',
      institution: 'MIT',
      verificationDate: new Date().toISOString(),
      result: 'Valid'
    },
    {
      id: 2,
      tokenId: '0.0.5001',
      serialNumber: '2',
      studentName: 'Jane Smith',
      credentialType: 'Master of Business Administration',
      institution: 'Stanford University',
      verificationDate: new Date(Date.now() - 86400000).toISOString(),
      result: 'Valid'
    }
  ]);

  const handleVerifyCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setVerificationResult(null);

    try {
      if (!hederaService) {
        throw new Error('Hedera service not available');
      }

      const result = await hederaService.verifyCredential(
        verifyForm.tokenId,
        verifyForm.serialNumber
      );

      if (result.success) {
        setVerificationResult(result.verification);
        setSuccess('Credential verification completed!');
        
        // Add to history
        const newHistoryItem = {
          id: verificationHistory.length + 1,
          tokenId: verifyForm.tokenId,
          serialNumber: verifyForm.serialNumber,
          studentName: result.verification.credential.metadata.studentName,
          credentialType: result.verification.credential.metadata.credentialType,
          institution: result.verification.credential.metadata.institution,
          verificationDate: new Date().toISOString(),
          result: result.verification.isValid ? 'Valid' : 'Invalid'
        };
        
        setVerificationHistory(prev => [newHistoryItem, ...prev]);
      } else {
        setError(result.message || 'Verification failed');
      }
    } catch (err) {
      setError('Verification error: ' + String(err));
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVerifyForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuickVerify = (tokenId: string, serialNumber: string) => {
    setVerifyForm({ tokenId, serialNumber });
    setActiveSection('verify');
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const renderOverview = () => (
    <div className="dashboard-section">
      <h2>🔍 Verification Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card primary">
          <h3>Total Verifications</h3>
          <p className="stat-number">{verificationHistory.length}</p>
          <p className="stat-subtitle">Credentials checked</p>
        </div>
        <div className="stat-card success">
          <h3>Valid Credentials</h3>
          <p className="stat-number">{verificationHistory.filter(v => v.result === 'Valid').length}</p>
          <p className="stat-subtitle">Successfully verified</p>
        </div>
        <div className="stat-card warning">
          <h3>Invalid/Revoked</h3>
          <p className="stat-number">{verificationHistory.filter(v => v.result === 'Invalid').length}</p>
          <p className="stat-subtitle">Failed verification</p>
        </div>
        <div className="stat-card info">
          <h3>Today's Verifications</h3>
          <p className="stat-number">
            {verificationHistory.filter(v => 
              new Date(v.verificationDate).toDateString() === new Date().toDateString()
            ).length}
          </p>
          <p className="stat-subtitle">Checked today</p>
        </div>
      </div>

      <div className="card">
        <h3>🚀 Quick Actions</h3>
        <div className="quick-actions">
          <button 
            className="action-btn primary"
            onClick={() => setActiveSection('verify')}
          >
            🔍 Verify New Credential
          </button>
          <button 
            className="action-btn secondary"
            onClick={() => setActiveSection('history')}
          >
            📊 View History
          </button>
        </div>
      </div>

      <div className="card">
        <h3>📈 Recent Verifications</h3>
        {verificationHistory.length > 0 ? (
          <div className="verification-list">
            {verificationHistory.slice(0, 5).map((verification) => (
              <div key={verification.id} className="verification-item">
                <div className="verification-header">
                  <h4>{verification.studentName}</h4>
                  <span className={`status-badge ${verification.result.toLowerCase()}`}>
                    {verification.result}
                  </span>
                </div>
                <p><strong>Credential:</strong> {verification.credentialType}</p>
                <p><strong>Institution:</strong> {verification.institution}</p>
                <p><strong>Verified:</strong> {new Date(verification.verificationDate).toLocaleString()}</p>
                <button 
                  className="btn-sm"
                  onClick={() => handleQuickVerify(verification.tokenId, verification.serialNumber)}
                >
                  Re-verify
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No verifications performed yet.</p>
        )}
      </div>
    </div>
  );

  const renderVerificationForm = () => (
    <div className="dashboard-section">
      <h2>🔍 Verify Credential</h2>
      
      <div className="card">
        <h3>Enter Credential Details</h3>
        <form onSubmit={handleVerifyCredential}>
          <div className="form-group">
            <label htmlFor="tokenId">Token ID</label>
            <input
              type="text"
              id="tokenId"
              name="tokenId"
              value={verifyForm.tokenId}
              onChange={handleInputChange}
              placeholder="0.0.5001"
              required
            />
            <small>The Hedera Token ID for TrustSeal credentials</small>
          </div>

          <div className="form-group">
            <label htmlFor="serialNumber">Serial Number</label>
            <input
              type="text"
              id="serialNumber"
              name="serialNumber"
              value={verifyForm.serialNumber}
              onChange={handleInputChange}
              placeholder="Enter credential serial number"
              required
            />
            <small>The unique serial number of the credential NFT</small>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Credential'}
          </button>
        </form>

        <div className="verification-info">
          <h4>📋 How to Verify:</h4>
          <ol>
            <li>Get the Token ID and Serial Number from the credential holder</li>
            <li>Enter the details in the form above</li>
            <li>Click "Verify Credential" to check authenticity</li>
            <li>Review the verification result and details</li>
          </ol>
        </div>
      </div>

      {verificationResult && (
        <div className="card">
          <h3>🎯 Verification Result</h3>
          <div className={`verification-result ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
            <div className="result-header">
              <h4>
                {verificationResult.isValid ? '✅ Valid Credential' : '❌ Invalid/Revoked Credential'}
              </h4>
              <span className="verification-timestamp">
                Verified on: {new Date(verificationResult.verificationTimestamp).toLocaleString()}
              </span>
            </div>

            <div className="credential-details">
              <h5>Credential Information:</h5>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Student Name:</span>
                  <span className="value">{verificationResult.metadata.studentName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Credential Type:</span>
                  <span className="value">{verificationResult.metadata.credentialType}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Institution:</span>
                  <span className="value">{verificationResult.metadata.institution}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Issue Date:</span>
                  <span className="value">{verificationResult.metadata.issueDate}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Current Owner:</span>
                  <span className="value">{verificationResult.onChainOwner}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className="value">
                    {verificationResult.metadata.revoked ? 
                      `Revoked: ${verificationResult.metadata.revocationReason}` : 
                      'Active'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="verification-actions">
              <button 
                className="btn-secondary"
                onClick={() => setVerificationResult(null)}
              >
                Clear Result
              </button>
              <button 
                className="btn"
                onClick={() => window.print()}
              >
                Print Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderVerificationHistory = () => (
    <div className="dashboard-section">
      <h2>📊 Verification History</h2>
      
      <div className="card">
        <div className="history-header">
          <h3>All Verifications</h3>
          <div className="history-actions">
            <button className="btn-secondary">
              📥 Export CSV
            </button>
            <button className="btn-secondary">
              🔄 Refresh
            </button>
          </div>
        </div>

        {verificationHistory.length > 0 ? (
          <div className="table-responsive">
            <table className="verification-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Credential</th>
                  <th>Institution</th>
                  <th>Token/Serial</th>
                  <th>Result</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {verificationHistory.map((verification) => (
                  <tr key={verification.id}>
                    <td>{new Date(verification.verificationDate).toLocaleDateString()}</td>
                    <td>{verification.studentName}</td>
                    <td>{verification.credentialType}</td>
                    <td>{verification.institution}</td>
                    <td>
                      <div className="token-info">
                        <div>{verification.tokenId}</div>
                        <div className="serial">#{verification.serialNumber}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${verification.result.toLowerCase()}`}>
                        {verification.result}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-sm"
                        onClick={() => handleQuickVerify(verification.tokenId, verification.serialNumber)}
                      >
                        Re-verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No verification history available.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="dashboard-header">
        <h1>🔍 Checker Dashboard</h1>
        <p>Verify credentials on Hedera Network</p>
      </div>

      <div className="dashboard-nav">
        <button 
          className={`nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          🔍 Overview
        </button>
        <button 
          className={`nav-btn ${activeSection === 'verify' ? 'active' : ''}`}
          onClick={() => setActiveSection('verify')}
        >
          ✅ Verify Credential
        </button>
        <button 
          className={`nav-btn ${activeSection === 'history' ? 'active' : ''}`}
          onClick={() => setActiveSection('history')}
        >
          📊 History
        </button>
      </div>

      <div className="dashboard-content">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'verify' && renderVerificationForm()}
        {activeSection === 'history' && renderVerificationHistory()}
      </div>
    </div>
  );
};

export default CheckerDashboard;