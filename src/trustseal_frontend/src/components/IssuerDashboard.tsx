import React, { useState, useEffect } from 'react';

interface Credential {
  tokenId: string;
  serialNumber: string;
  owner: string;
  issuer: string;
  metadata: {
    studentName: string;
    credentialType: string;
    institution: string;
    issueDate: string;
    issuer: string;
    issuedAt: number;
    revoked: boolean;
    revocationReason?: string;
  };
  issueTimestamp: number;
}

interface IssuerDashboardProps {
  hederaService: any;
  currentAccountId: string;
}

const IssuerDashboard: React.FC<IssuerDashboardProps> = ({ hederaService, currentAccountId }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'issue' | 'manage'>('overview');
  const [issuedCredentials, setIssuedCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Credential issuance form state
  const [issueForm, setIssueForm] = useState({
    studentAccountId: '',
    studentName: '',
    credentialType: '',
    institution: '',
    issueDate: ''
  });

  useEffect(() => {
    if (activeSection === 'overview' || activeSection === 'manage') {
      loadIssuedCredentials();
    }
  }, [activeSection]);

  const loadIssuedCredentials = async () => {
    setLoading(true);
    try {
      if (hederaService) {
        const credentials = hederaService.getCredentialsByIssuer(currentAccountId);
        setIssuedCredentials(credentials);
      }
    } catch (err) {
      setError('Failed to load issued credentials');
      console.error(err);
    }
    setLoading(false);
  };

  const handleIssueCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!hederaService) {
        throw new Error('Hedera service not available');
      }

      const result = await hederaService.mintCredential(
        issueForm.studentAccountId,
        issueForm.studentName,
        issueForm.credentialType,
        issueForm.institution,
        issueForm.issueDate,
        currentAccountId
      );

      if (result.success) {
        setSuccess(`Credential issued successfully! Token ID: ${result.tokenId}, Serial: ${result.serialNumber}`);
        setIssueForm({
          studentAccountId: '',
          studentName: '',
          credentialType: '',
          institution: '',
          issueDate: ''
        });
        loadIssuedCredentials();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to issue credential: ' + String(err));
    }
    setLoading(false);
  };

  const handleRevokeCredential = async (serialNumber: string) => {
    const reason = prompt('Enter revocation reason:');
    if (!reason) return;

    setLoading(true);
    try {
      if (!hederaService) {
        throw new Error('Hedera service not available');
      }

      const result = await hederaService.revokeCredential(serialNumber, reason, currentAccountId);
      if (result.success) {
        setSuccess('Credential revoked successfully');
        loadIssuedCredentials();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to revoke credential: ' + String(err));
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setIssueForm(prev => ({
      ...prev,
      [name]: value
    }));
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
      <h2>📋 Issuer Overview</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Credentials Issued</h3>
          <p className="stat-number">{issuedCredentials.length}</p>
        </div>
        <div className="stat-card">
          <h3>Active Credentials</h3>
          <p className="stat-number">{issuedCredentials.filter(c => !c.metadata.revoked).length}</p>
        </div>
        <div className="stat-card">
          <h3>Revoked Credentials</h3>
          <p className="stat-number">{issuedCredentials.filter(c => c.metadata.revoked).length}</p>
        </div>
        <div className="stat-card">
          <h3>Institution</h3>
          <p className="stat-text">{issuedCredentials[0]?.metadata.institution || 'Demo University'}</p>
        </div>
      </div>

      <div className="card">
        <h3>Recent Credentials</h3>
        {loading ? (
          <p>Loading credentials...</p>
        ) : issuedCredentials.length > 0 ? (
          <div className="credential-list">
            {issuedCredentials.slice(0, 5).map((credential) => (
              <div key={`${credential.tokenId}-${credential.serialNumber}`} className="credential-item">
                <div className="credential-header">
                  <h4>{credential.metadata.credentialType}</h4>
                  <span className={`status-badge ${credential.metadata.revoked ? 'revoked' : 'active'}`}>
                    {credential.metadata.revoked ? 'Revoked' : 'Active'}
                  </span>
                </div>
                <p><strong>Student:</strong> {credential.metadata.studentName}</p>
                <p><strong>Issue Date:</strong> {credential.metadata.issueDate}</p>
                <p><strong>Serial Number:</strong> {credential.serialNumber}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No credentials issued yet.</p>
        )}
      </div>
    </div>
  );

  const renderIssueForm = () => (
    <div className="dashboard-section">
      <h2>🎓 Issue New Credential</h2>
      <div className="card">
        <form onSubmit={handleIssueCredential}>
          <div className="form-group">
            <label htmlFor="studentAccountId">Student's Hedera Account ID</label>
            <input
              type="text"
              id="studentAccountId"
              name="studentAccountId"
              value={issueForm.studentAccountId}
              onChange={handleInputChange}
              placeholder="0.0.12345"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="studentName">Student Name</label>
            <input
              type="text"
              id="studentName"
              name="studentName"
              value={issueForm.studentName}
              onChange={handleInputChange}
              placeholder="Enter student's full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="credentialType">Credential Type</label>
            <select
              id="credentialType"
              name="credentialType"
              value={issueForm.credentialType}
              onChange={handleInputChange}
              required
            >
              <option value="">Select credential type</option>
              <option value="Bachelor of Science">Bachelor of Science</option>
              <option value="Bachelor of Arts">Bachelor of Arts</option>
              <option value="Master of Science">Master of Science</option>
              <option value="Master of Arts">Master of Arts</option>
              <option value="Master of Business Administration">Master of Business Administration</option>
              <option value="Doctor of Philosophy">Doctor of Philosophy</option>
              <option value="Certificate">Professional Certificate</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="institution">Institution</label>
            <input
              type="text"
              id="institution"
              name="institution"
              value={issueForm.institution}
              onChange={handleInputChange}
              placeholder="Institution name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="issueDate">Issue Date</label>
            <input
              type="date"
              id="issueDate"
              name="issueDate"
              value={issueForm.issueDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Issuing...' : 'Issue Credential'}
          </button>
        </form>
      </div>
    </div>
  );

  const renderManageCredentials = () => (
    <div className="dashboard-section">
      <h2>📊 Manage Credentials</h2>
      <div className="card">
        <h3>All Issued Credentials</h3>
        {loading ? (
          <p>Loading credentials...</p>
        ) : issuedCredentials.length > 0 ? (
          <div className="table-responsive">
            <table className="credentials-table">
              <thead>
                <tr>
                  <th>Serial Number</th>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issuedCredentials.map((credential) => (
                  <tr key={`${credential.tokenId}-${credential.serialNumber}`}>
                    <td>{credential.serialNumber}</td>
                    <td>{credential.metadata.studentName}</td>
                    <td>{credential.metadata.credentialType}</td>
                    <td>{credential.metadata.issueDate}</td>
                    <td>
                      <span className={`status-badge ${credential.metadata.revoked ? 'revoked' : 'active'}`}>
                        {credential.metadata.revoked ? 'Revoked' : 'Active'}
                      </span>
                    </td>
                    <td>
                      {!credential.metadata.revoked && (
                        <button
                          className="btn-danger"
                          onClick={() => handleRevokeCredential(credential.serialNumber)}
                          disabled={loading}
                        >
                          Revoke
                        </button>
                      )}
                      {credential.metadata.revoked && (
                        <span className="revocation-reason">
                          Reason: {credential.metadata.revocationReason}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No credentials found.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="dashboard-header">
        <h1>🏛️ Issuer Dashboard</h1>
        <p>Manage and issue digital credentials on Hedera</p>
      </div>

      <div className="dashboard-nav">
        <button 
          className={`nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          📋 Overview
        </button>
        <button 
          className={`nav-btn ${activeSection === 'issue' ? 'active' : ''}`}
          onClick={() => setActiveSection('issue')}
        >
          🎓 Issue Credential
        </button>
        <button 
          className={`nav-btn ${activeSection === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveSection('manage')}
        >
          📊 Manage Credentials
        </button>
      </div>

      <div className="dashboard-content">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'issue' && renderIssueForm()}
        {activeSection === 'manage' && renderManageCredentials()}
      </div>
    </div>
  );
};

export default IssuerDashboard;