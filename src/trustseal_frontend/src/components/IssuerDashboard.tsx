import React, { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';

interface IssuerDashboardProps {
  actor: any;
  identity: any;
}

interface Credential {
  id: number;
  owner: Principal;
  issuer: Principal;
  metadata: {
    student_name: string;
    credential_type: string;
    institution: string;
    issue_date: string;
    issued_timestamp: number;
  };
  signature?: any;
  is_revoked: boolean;
}

interface IssuerDashboardData {
  issued_credentials: number;
  active_credentials: number;
  revoked_credentials: number;
  issuer_info: {
    principal: Principal;
    name: string;
    verified: boolean;
    registration_date: number;
  };
}

const IssuerDashboard: React.FC<IssuerDashboardProps> = ({ actor, identity }) => {
  const [dashboardData, setDashboardData] = useState<IssuerDashboardData | null>(null);
  const [issuedCredentials, setIssuedCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'issue' | 'bulk' | 'manage'>('overview');

  // Credential issuance form
  const [issueForm, setIssueForm] = useState({
    student_principal: '',
    student_name: '',
    credential_type: '',
    institution: '',
    issue_date: new Date().toISOString().split('T')[0]
  });

  // Bulk issuance state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, isProcessing: false });
  const [bulkResults, setBulkResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });

  useEffect(() => {
    loadDashboardData();
    loadIssuedCredentials();
  }, [actor, identity]);

  const loadDashboardData = async () => {
    if (!actor || !identity) return;
    
    setLoading(true);
    try {
      const data = await actor.getIssuerDashboardData(identity.getPrincipal());
      setDashboardData(data);
    } catch (err) {
      setError('Error loading dashboard data: ' + String(err));
    }
    setLoading(false);
  };

  const loadIssuedCredentials = async () => {
    if (!actor) return;
    
    try {
      const allCredentials = await actor.getAllCredentials();
      const myCredentials = allCredentials.filter(
        (cred: Credential) => cred.issuer.toString() === identity.getPrincipal().toString()
      );
      setIssuedCredentials(myCredentials);
    } catch (err) {
      setError('Error loading credentials: ' + String(err));
    }
  };

  const handleIssueCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const studentPrincipal = Principal.fromText(issueForm.student_principal);
      const result = await actor.mint(
        studentPrincipal,
        issueForm.student_name,
        issueForm.credential_type,
        issueForm.institution,
        issueForm.issue_date
      );
      
      if ('ok' in result) {
        setSuccess(`Credential issued successfully! Token ID: ${result.ok}`);
        setIssueForm({
          student_principal: '',
          student_name: '',
          credential_type: '',
          institution: '',
          issue_date: new Date().toISOString().split('T')[0]
        });
        await loadDashboardData();
        await loadIssuedCredentials();
      } else {
        setError('Failed to issue credential: ' + result.err);
      }
    } catch (err) {
      setError('Error issuing credential: ' + String(err));
    }
    setLoading(false);
  };

  const handleRevokeCredential = async (tokenId: number) => {
    if (!actor) return;
    
    if (!confirm('Are you sure you want to revoke this credential? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await actor.revokeCredential(tokenId);
      if ('ok' in result) {
        setSuccess('Credential revoked successfully!');
        await loadDashboardData();
        await loadIssuedCredentials();
      } else {
        setError('Failed to revoke credential: ' + result.err);
      }
    } catch (err) {
      setError('Error revoking credential: ' + String(err));
    }
    setLoading(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString();
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

  // CSV parsing function
  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    return data;
  };

  // Handle CSV file upload
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      try {
        const parsedData = parseCSV(csvText);
        setCsvData(parsedData);
        setError('');
      } catch (err) {
        setError('Error parsing CSV file: ' + String(err));
      }
    };
    reader.readAsText(file);
  };

  // Bulk issue credentials
  const handleBulkIssue = async () => {
    if (!actor || csvData.length === 0) return;
    
    setBulkProgress({ current: 0, total: csvData.length, isProcessing: true });
    setBulkResults({ success: 0, failed: 0, errors: [] });
    setError('');
    setSuccess('');
    
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      setBulkProgress({ current: i + 1, total: csvData.length, isProcessing: true });
      
      try {
        // Validate required fields
        if (!row.student_principal || !row.student_name || !row.credential_type || !row.institution) {
          throw new Error(`Row ${i + 1}: Missing required fields`);
        }
        
        const studentPrincipal = Principal.fromText(row.student_principal);
        const result = await actor.mint(
          studentPrincipal,
          row.student_name,
          row.credential_type,
          row.institution,
          row.issue_date || new Date().toISOString().split('T')[0]
        );
        
        if ('ok' in result) {
          successCount++;
        } else {
          failedCount++;
          errors.push(`Row ${i + 1} (${row.student_name}): ${result.err}`);
        }
      } catch (err) {
        failedCount++;
        errors.push(`Row ${i + 1} (${row.student_name || 'Unknown'}): ${String(err)}`);
      }
      
      // Small delay to prevent overwhelming the backend
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setBulkProgress({ current: csvData.length, total: csvData.length, isProcessing: false });
    setBulkResults({ success: successCount, failed: failedCount, errors });
    
    if (successCount > 0) {
      setSuccess(`Bulk issuance completed! ${successCount} credentials issued successfully.`);
      await loadDashboardData();
      await loadIssuedCredentials();
    }
    
    if (failedCount > 0) {
      setError(`${failedCount} credentials failed to issue. Check the results below.`);
    }
  };

  // Reset bulk issuance
  const resetBulkIssuance = () => {
    setCsvFile(null);
    setCsvData([]);
    setBulkProgress({ current: 0, total: 0, isProcessing: false });
    setBulkResults({ success: 0, failed: 0, errors: [] });
    // Reset file input
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="issuer-dashboard">
      <div className="dashboard-header">
        <h2>🏫 Issuer Dashboard</h2>
        <p>Credential issuance and management for {dashboardData?.issuer_info.name}</p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'issue' ? 'active' : ''}`}
          onClick={() => setActiveTab('issue')}
        >
          ➕ Issue Credential
        </button>
        <button 
          className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          📊 Bulk Issuance
        </button>
        <button 
          className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          📋 Manage Issued
        </button>
      </div>

      {activeTab === 'overview' && dashboardData && (
        <div className="dashboard-overview">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>📜 Total Issued</h3>
              <div className="stat-number">{dashboardData.issued_credentials}</div>
            </div>
            <div className="stat-card">
              <h3>✅ Active</h3>
              <div className="stat-number">{dashboardData.active_credentials}</div>
            </div>
            <div className="stat-card">
              <h3>❌ Revoked</h3>
              <div className="stat-number">{dashboardData.revoked_credentials}</div>
            </div>
            <div className="stat-card">
              <h3>📅 Since</h3>
              <div className="stat-date">{formatDate(dashboardData.issuer_info.registration_date)}</div>
            </div>
          </div>

          <div className="issuer-info-card">
            <h3>Institution Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Institution Name:</label>
                <span>{dashboardData.issuer_info.name}</span>
              </div>
              <div className="info-item">
                <label>Verification Status:</label>
                <span className={`status ${dashboardData.issuer_info.verified ? 'verified' : 'pending'}`}>
                  {dashboardData.issuer_info.verified ? '✅ Verified' : '⏳ Pending'}
                </span>
              </div>
              <div className="info-item">
                <label>Principal ID:</label>
                <span className="principal-id">{dashboardData.issuer_info.principal.toString().slice(0, 30)}...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'issue' && (
        <div className="issue-section">
          <h3>Issue New Credential</h3>
          <form onSubmit={handleIssueCredential} className="issue-form">
            <div className="form-row">
              <div className="form-group">
                <label>Student Principal ID</label>
                <input
                  type="text"
                  value={issueForm.student_principal}
                  onChange={(e) => setIssueForm({...issueForm, student_principal: e.target.value})}
                  placeholder="Enter student's Internet Identity principal"
                  required
                />
                <small>The student's Internet Identity principal ID</small>
              </div>
              <div className="form-group">
                <label>Student Full Name</label>
                <input
                  type="text"
                  value={issueForm.student_name}
                  onChange={(e) => setIssueForm({...issueForm, student_name: e.target.value})}
                  placeholder="Enter student's full name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Credential Type</label>
                <select
                  value={issueForm.credential_type}
                  onChange={(e) => setIssueForm({...issueForm, credential_type: e.target.value})}
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
                <label>Institution Name</label>
                <input
                  type="text"
                  value={issueForm.institution}
                  onChange={(e) => setIssueForm({...issueForm, institution: e.target.value})}
                  placeholder="Enter institution name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Issue Date</label>
              <input
                type="date"
                value={issueForm.issue_date}
                onChange={(e) => setIssueForm({...issueForm, issue_date: e.target.value})}
                required
              />
            </div>

            <button type="submit" className="btn issue-btn" disabled={loading}>
              {loading ? 'Issuing Credential...' : '🎓 Issue Credential'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'bulk' && (
        <div className="bulk-section">
          <h3>📊 Bulk Credential Issuance</h3>
          <p>Upload a CSV file to issue multiple credentials at once</p>
          
          <div className="csv-instructions">
            <h4>📋 CSV Format Requirements</h4>
            <div className="format-info">
              <p>Your CSV file must include the following columns (in any order):</p>
              <ul>
                <li><strong>student_principal</strong> - Student's Internet Identity principal ID</li>
                <li><strong>student_name</strong> - Student's full name</li>
                <li><strong>credential_type</strong> - Type of credential (Bachelor of Science, Master of Arts, etc.)</li>
                <li><strong>institution</strong> - Institution name</li>
                <li><strong>issue_date</strong> - Issue date (YYYY-MM-DD format, optional - defaults to today)</li>
              </ul>
              <div className="example-csv">
                <strong>Example CSV:</strong>
                <pre>
student_principal,student_name,credential_type,institution,issue_date
be2us-64aaa-aaaaa-qadbq-cai,John Doe,Bachelor of Science,MIT,2023-06-15
rdmx6-jaaaa-aaaaa-aaadq-cai,Jane Smith,Master of Arts,Harvard,2023-06-20
                </pre>
              </div>
            </div>
          </div>

          <div className="csv-upload-section">
            <div className="upload-area">
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="csv-upload" className="upload-button">
                📄 Choose CSV File
              </label>
              {csvFile && (
                <div className="file-info">
                  <span>📄 {csvFile.name}</span>
                  <button onClick={resetBulkIssuance} className="btn-reset">✕</button>
                </div>
              )}
            </div>
          </div>

          {csvData.length > 0 && (
            <div className="csv-preview">
              <h4>📋 CSV Preview ({csvData.length} records)</h4>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Credential Type</th>
                      <th>Institution</th>
                      <th>Issue Date</th>
                      <th>Principal (Preview)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        <td>{row.student_name || '❌ Missing'}</td>
                        <td>{row.credential_type || '❌ Missing'}</td>
                        <td>{row.institution || '❌ Missing'}</td>
                        <td>{row.issue_date || 'Today'}</td>
                        <td>{row.student_principal ? `${row.student_principal.slice(0, 15)}...` : '❌ Missing'}</td>
                      </tr>
                    ))}
                    {csvData.length > 5 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', fontStyle: 'italic' }}>
                          ... and {csvData.length - 5} more records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="bulk-actions">
                <button 
                  onClick={handleBulkIssue} 
                  className="btn bulk-issue-btn"
                  disabled={bulkProgress.isProcessing || csvData.length === 0}
                >
                  {bulkProgress.isProcessing ? 
                    `🔄 Processing... (${bulkProgress.current}/${bulkProgress.total})` : 
                    `🚀 Issue ${csvData.length} Credentials`
                  }
                </button>
                <button onClick={resetBulkIssuance} className="btn secondary">
                  🗑️ Clear
                </button>
              </div>
            </div>
          )}

          {bulkProgress.isProcessing && (
            <div className="progress-section">
              <h4>⏳ Processing Bulk Issuance</h4>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                ></div>
              </div>
              <p>{bulkProgress.current} of {bulkProgress.total} processed</p>
            </div>
          )}

          {(bulkResults.success > 0 || bulkResults.failed > 0) && !bulkProgress.isProcessing && (
            <div className="bulk-results">
              <h4>📊 Bulk Issuance Results</h4>
              <div className="results-summary">
                <div className="result-stat success">
                  <span className="stat-number">{bulkResults.success}</span>
                  <span className="stat-label">✅ Successful</span>
                </div>
                <div className="result-stat failed">
                  <span className="stat-number">{bulkResults.failed}</span>
                  <span className="stat-label">❌ Failed</span>
                </div>
              </div>
              
              {bulkResults.errors.length > 0 && (
                <div className="error-details">
                  <h5>❌ Failed Issuances:</h5>
                  <div className="error-list">
                    {bulkResults.errors.map((error, index) => (
                      <div key={index} className="error-item">{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="manage-section">
          <h3>Manage Issued Credentials</h3>
          {issuedCredentials.length === 0 ? (
            <div className="empty-state">
              <p>No credentials issued yet.</p>
              <button 
                className="btn" 
                onClick={() => setActiveTab('issue')}
              >
                Issue Your First Credential
              </button>
            </div>
          ) : (
            <div className="credentials-list">
              {issuedCredentials.map((credential) => (
                <div key={credential.id} className={`credential-card ${credential.is_revoked ? 'revoked' : 'active'}`}>
                  <div className="credential-header">
                    <div className="credential-id">
                      <strong>Token ID: {credential.id}</strong>
                      <span className={`status ${credential.is_revoked ? 'revoked' : 'active'}`}>
                        {credential.is_revoked ? '❌ Revoked' : '✅ Active'}
                      </span>
                    </div>
                    <div 
                      className="credential-type"
                      style={{ backgroundColor: getCredentialTypeColor(credential.metadata.credential_type) }}
                    >
                      {credential.metadata.credential_type}
                    </div>
                  </div>
                  
                  <div className="credential-details">
                    <div className="detail-row">
                      <span className="label">Student:</span>
                      <span className="value">{credential.metadata.student_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Institution:</span>
                      <span className="value">{credential.metadata.institution}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Issue Date:</span>
                      <span className="value">{credential.metadata.issue_date}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Issued On:</span>
                      <span className="value">{formatDate(credential.metadata.issued_timestamp)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Owner:</span>
                      <span className="value principal">{credential.owner.toString().slice(0, 30)}...</span>
                    </div>
                  </div>
                  
                  {!credential.is_revoked && (
                    <div className="credential-actions">
                      <button 
                        className="btn revoke-btn"
                        onClick={() => handleRevokeCredential(credential.id)}
                        disabled={loading}
                      >
                        🚫 Revoke Credential
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
