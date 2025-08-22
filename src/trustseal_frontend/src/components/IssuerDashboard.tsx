import React, { useState, useEffect } from 'react';

interface Credential {
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
}

interface IssuerDashboardProps {
  actor: any;
  identity: any;
}

const IssuerDashboard: React.FC<IssuerDashboardProps> = ({ actor, identity }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'issue' | 'manage'>('overview');
  const [issuedCredentials, setIssuedCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Credential issuance form state
  const [issueForm, setIssueForm] = useState({
    studentPrincipal: '',
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
      // Mock implementation for demo
      setIssuedCredentials([
        {
          id: 1,
          owner: 'be2us-64aaa-aaaaa-qadbq-cai',
          issuer: identity.getPrincipal().toString(),
          metadata: {
            student_name: 'John Doe',
            credential_type: 'Bachelor of Science',
            institution: 'Massachusetts Institute of Technology',
            issue_date: '2023-06-15',
            revoked: false
          },
          issue_timestamp: Date.now() - 86400000
        },
        {
          id: 2,
          owner: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
          issuer: identity.getPrincipal().toString(),
          metadata: {
            student_name: 'Jane Smith',
            credential_type: 'Master of Science',
            institution: 'Massachusetts Institute of Technology',
            issue_date: '2023-05-20',
            revoked: false
          },
          issue_timestamp: Date.now() - 172800000
        }
      ]);
    } catch (err) {
      setError('Failed to load issued credentials');
    }
    setLoading(false);
  };

  const handleIssueCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Mock implementation for demo
      const tokenId = Math.floor(Math.random() * 10000);
      setSuccess(`Credential issued successfully! Token ID: ${tokenId}`);
      setIssueForm({
        studentPrincipal: '',
        studentName: '',
        credentialType: '',
        institution: '',
        issueDate: ''
      });
      await loadIssuedCredentials();
    } catch (err) {
      setError('Failed to issue credential');
    }
    setLoading(false);
  };

  const handleRevokeCredential = async (tokenId: number, reason: string) => {
    setLoading(true);
    try {
      // Mock implementation for demo
      setSuccess(`Credential ${tokenId} revoked successfully`);
      await loadIssuedCredentials();
    } catch (err) {
      setError('Failed to revoke credential');
    }
    setLoading(false);
  };

  const getCredentialStats = () => {
    const total = issuedCredentials.length;
    const active = issuedCredentials.filter(c => !c.metadata.revoked).length;
    const revoked = issuedCredentials.filter(c => c.metadata.revoked).length;
    return { total, active, revoked };
  };

  const stats = getCredentialStats();

  return (
    <div className="issuer-dashboard">
      <div className="dashboard-header">
        <h2>🏫 Issuer Dashboard</h2>
        <p>Credential Issuance & Management</p>
      </div>

      <div className="dashboard-nav">
        <button 
          className={`nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`nav-btn ${activeSection === 'issue' ? 'active' : ''}`}
          onClick={() => setActiveSection('issue')}
        >
          ➕ Issue Credential
        </button>
        <button 
          className={`nav-btn ${activeSection === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveSection('manage')}
        >
          📋 Manage Credentials
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {activeSection === 'overview' && (
        <div className="dashboard-section">
          <h3>Institution Overview</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total Issued</h4>
              <div className="stat-number">{stats.total}</div>
            </div>
            <div className="stat-card">
              <h4>Active Credentials</h4>
              <div className="stat-number">{stats.active}</div>
            </div>
            <div className="stat-card revoked">
              <h4>Revoked</h4>
              <div className="stat-number">{stats.revoked}</div>
            </div>
          </div>

          <div className="recent-activity">
            <h4>Recent Credentials</h4>
            {issuedCredentials.slice(0, 3).map((credential) => (
              <div key={credential.id} className="credential-preview">
                <div className="credential-info">
                  <h5>{credential.metadata.student_name}</h5>
                  <p>{credential.metadata.credential_type}</p>
                  <span className="token-id">Token ID: {credential.id}</span>
                </div>
                <div className="credential-status">
                  <span className={`status-badge ${credential.metadata.revoked ? 'revoked' : 'active'}`}>
                    {credential.metadata.revoked ? 'Revoked' : 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'issue' && (
        <div className="dashboard-section">
          <h3>Issue New Credential</h3>
          <form onSubmit={handleIssueCredential} className="issue-form">
            <div className="form-row">
              <div className="form-group">
                <label>Student Principal ID</label>
                <input
                  type="text"
                  value={issueForm.studentPrincipal}
                  onChange={(e) => setIssueForm({...issueForm, studentPrincipal: e.target.value})}
                  placeholder="Student's ICP Principal ID"
                  required
                />
              </div>
              <div className="form-group">
                <label>Student Name</label>
                <input
                  type="text"
                  value={issueForm.studentName}
                  onChange={(e) => setIssueForm({...issueForm, studentName: e.target.value})}
                  placeholder="Full name of student"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Credential Type</label>
                <select
                  value={issueForm.credentialType}
                  onChange={(e) => setIssueForm({...issueForm, credentialType: e.target.value})}
                  required
                >
                  <option value="">Select Credential Type</option>
                  <option value="Bachelor of Science">Bachelor of Science</option>
                  <option value="Bachelor of Arts">Bachelor of Arts</option>
                  <option value="Master of Science">Master of Science</option>
                  <option value="Master of Arts">Master of Arts</option>
                  <option value="PhD">PhD</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Diploma">Diploma</option>
                </select>
              </div>
              <div className="form-group">
                <label>Institution</label>
                <input
                  type="text"
                  value={issueForm.institution}
                  onChange={(e) => setIssueForm({...issueForm, institution: e.target.value})}
                  placeholder="Institution name"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Issue Date</label>
              <input
                type="date"
                value={issueForm.issueDate}
                onChange={(e) => setIssueForm({...issueForm, issueDate: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Issuing...' : '🎓 Issue Credential'}
            </button>
          </form>
        </div>
      )}

      {activeSection === 'manage' && (
        <div className="dashboard-section">
          <h3>Manage Issued Credentials</h3>
          {loading ? (
            <div className="loading">Loading credentials...</div>
          ) : (
            <div className="credentials-list">
              {issuedCredentials.map((credential) => (
                <div key={credential.id} className="credential-card">
                  <div className="credential-details">
                    <h4>{credential.metadata.student_name}</h4>
                    <p><strong>Type:</strong> {credential.metadata.credential_type}</p>
                    <p><strong>Institution:</strong> {credential.metadata.institution}</p>
                    <p><strong>Issue Date:</strong> {credential.metadata.issue_date}</p>
                    <p><strong>Token ID:</strong> {credential.id}</p>
                    <p><strong>Owner:</strong> {credential.owner}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status-badge ${credential.metadata.revoked ? 'revoked' : 'active'}`}>
                        {credential.metadata.revoked ? 'Revoked' : 'Active'}
                      </span>
                    </p>
                    {credential.metadata.revoked && credential.metadata.revocation_reason && (
                      <p><strong>Revocation Reason:</strong> {credential.metadata.revocation_reason}</p>
                    )}
                  </div>
                  {!credential.metadata.revoked && (
                    <div className="credential-actions">
                      <button 
                        className="btn btn-danger"
                        onClick={() => {
                          const reason = prompt('Enter revocation reason:');
                          if (reason) {
                            handleRevokeCredential(credential.id, reason);
                          }
                        }}
                        disabled={loading}
                      >
                        🚫 Revoke
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IssuerDashboard;