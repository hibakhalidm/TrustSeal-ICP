import React, { useState } from 'react';

interface RegistrationFormsProps {
  actor: any;
  identity: any;
  onRegistrationSuccess: (role: 'Admin' | 'Issuer' | 'Checker') => void;
}

const RegistrationForms: React.FC<RegistrationFormsProps> = ({ actor, identity, onRegistrationSuccess }) => {
  const [activeForm, setActiveForm] = useState<'issuer' | 'checker' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Issuer registration form data
  const [issuerData, setIssuerData] = useState({
    name: '',
    organization: '',
    institutionType: '',
    address: '',
    contactEmail: '',
    website: ''
  });

  // Checker registration form data
  const [checkerData, setCheckerData] = useState({
    name: '',
    organization: '',
    organizationType: '',
    contactEmail: '',
    purpose: ''
  });

  const handleIssuerRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !identity) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await actor.registerUser(
        identity.getPrincipal(),
        issuerData.name,
        issuerData.organization,
        { Issuer: null }
      );

      if ('ok' in result) {
        setSuccess('Issuer registration successful! Redirecting to your dashboard...');
        setTimeout(() => {
          onRegistrationSuccess('Issuer');
        }, 2000);
      } else {
        setError('Registration failed: ' + result.err);
      }
    } catch (err) {
      setError('Registration error: ' + String(err));
    }
    setLoading(false);
  };

  const handleCheckerRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !identity) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await actor.registerChecker(checkerData.organization);

      if ('ok' in result) {
        setSuccess('Checker registration successful! Redirecting to your dashboard...');
        setTimeout(() => {
          onRegistrationSuccess('Checker');
        }, 2000);
      } else {
        setError('Registration failed: ' + result.err);
      }
    } catch (err) {
      setError('Registration error: ' + String(err));
    }
    setLoading(false);
  };

  const resetForms = () => {
    setActiveForm(null);
    setError('');
    setSuccess('');
    setIssuerData({
      name: '',
      organization: '',
      institutionType: '',
      address: '',
      contactEmail: '',
      website: ''
    });
    setCheckerData({
      name: '',
      organization: '',
      organizationType: '',
      contactEmail: '',
      purpose: ''
    });
  };

  return (
    <div className="registration-container">
      <div className="card">
        <h2>🎓 Register Your Account</h2>
        <p>Choose your role to get started with TrustSeal ICP</p>

        {!activeForm && (
          <div className="role-selection">
            <div className="role-cards">
              <div className="role-card" onClick={() => setActiveForm('issuer')}>
                <div className="role-icon">🏫</div>
                <h3>Educational Institution</h3>
                <p>Issue and manage academic credentials</p>
                <button className="btn secondary">Register as Issuer</button>
              </div>

              <div className="role-card" onClick={() => setActiveForm('checker')}>
                <div className="role-icon">🔍</div>
                <h3>Employer / Verifier</h3>
                <p>Verify academic credentials</p>
                <button className="btn secondary">Register as Checker</button>
              </div>

              <div className="role-card admin-note">
                <div className="role-icon">👑</div>
                <h3>System Administrator</h3>
                <p>Admin accounts are created manually. Contact support for admin access.</p>
                <button className="btn disabled" disabled>Contact Support</button>
              </div>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {activeForm === 'issuer' && (
          <div className="registration-form">
            <div className="form-header">
              <h3>🏫 Educational Institution Registration</h3>
              <button className="btn-close" onClick={resetForms}>×</button>
            </div>
            
            <form onSubmit={handleIssuerRegistration}>
              <div className="form-group">
                <label>Institution Name *</label>
                <input
                  type="text"
                  value={issuerData.name}
                  onChange={(e) => setIssuerData({ ...issuerData, name: e.target.value })}
                  placeholder="e.g., University of Example"
                  required
                />
              </div>

              <div className="form-group">
                <label>Organization *</label>
                <input
                  type="text"
                  value={issuerData.organization}
                  onChange={(e) => setIssuerData({ ...issuerData, organization: e.target.value })}
                  placeholder="e.g., School of Computer Science"
                  required
                />
              </div>

              <div className="form-group">
                <label>Institution Type</label>
                <select
                  value={issuerData.institutionType}
                  onChange={(e) => setIssuerData({ ...issuerData, institutionType: e.target.value })}
                >
                  <option value="">Select type</option>
                  <option value="university">University</option>
                  <option value="college">College</option>
                  <option value="community_college">Community College</option>
                  <option value="technical_school">Technical School</option>
                  <option value="training_center">Training Center</option>
                </select>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={issuerData.address}
                  onChange={(e) => setIssuerData({ ...issuerData, address: e.target.value })}
                  placeholder="Institution address"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={issuerData.contactEmail}
                  onChange={(e) => setIssuerData({ ...issuerData, contactEmail: e.target.value })}
                  placeholder="contact@institution.edu"
                />
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  value={issuerData.website}
                  onChange={(e) => setIssuerData({ ...issuerData, website: e.target.value })}
                  placeholder="https://www.institution.edu"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={resetForms}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={loading || !issuerData.name || !issuerData.organization}>
                  {loading ? 'Registering...' : 'Register Institution'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeForm === 'checker' && (
          <div className="registration-form">
            <div className="form-header">
              <h3>🔍 Employer / Verifier Registration</h3>
              <button className="btn-close" onClick={resetForms}>×</button>
            </div>
            
            <form onSubmit={handleCheckerRegistration}>
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  value={checkerData.name}
                  onChange={(e) => setCheckerData({ ...checkerData, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  required
                />
              </div>

              <div className="form-group">
                <label>Organization *</label>
                <input
                  type="text"
                  value={checkerData.organization}
                  onChange={(e) => setCheckerData({ ...checkerData, organization: e.target.value })}
                  placeholder="e.g., TechCorp Inc."
                  required
                />
              </div>

              <div className="form-group">
                <label>Organization Type</label>
                <select
                  value={checkerData.organizationType}
                  onChange={(e) => setCheckerData({ ...checkerData, organizationType: e.target.value })}
                >
                  <option value="">Select type</option>
                  <option value="private_company">Private Company</option>
                  <option value="public_company">Public Company</option>
                  <option value="government">Government Agency</option>
                  <option value="nonprofit">Non-profit Organization</option>
                  <option value="startup">Startup</option>
                  <option value="consulting">Consulting Firm</option>
                  <option value="recruitment">Recruitment Agency</option>
                </select>
              </div>

              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={checkerData.contactEmail}
                  onChange={(e) => setCheckerData({ ...checkerData, contactEmail: e.target.value })}
                  placeholder="hr@company.com"
                />
              </div>

              <div className="form-group">
                <label>Purpose of Verification</label>
                <textarea
                  value={checkerData.purpose}
                  onChange={(e) => setCheckerData({ ...checkerData, purpose: e.target.value })}
                  placeholder="e.g., Employment verification, contractor validation, etc."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={resetForms}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={loading || !checkerData.name || !checkerData.organization}>
                  {loading ? 'Registering...' : 'Register as Verifier'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <style>{`
        .registration-container {
          margin: 20px 0;
        }

        .role-selection {
          margin-top: 20px;
        }

        .role-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .role-card {
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }

        .role-card:hover {
          border-color: #007bff;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15);
        }

        .role-card.admin-note {
          border-color: #ffc107;
          background: linear-gradient(135deg, #fff8e1 0%, #ffffff 100%);
          cursor: default;
        }

        .role-card.admin-note:hover {
          transform: none;
          box-shadow: none;
        }

        .role-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .role-card h3 {
          margin: 12px 0;
          color: #333;
          font-size: 1.25rem;
        }

        .role-card p {
          color: #666;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .registration-form {
          margin-top: 20px;
          border-top: 2px solid #e0e0e0;
          padding-top: 20px;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .form-header h3 {
          margin: 0;
          color: #333;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .btn-close:hover {
          background-color: #f0f0f0;
          color: #333;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #007bff;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: #007bff;
          color: white;
        }

        .btn:hover:not(:disabled) {
          background-color: #0056b3;
          transform: translateY(-1px);
        }

        .btn:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
          transform: none;
        }

        .btn.secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn.secondary:hover {
          background-color: #545b62;
        }

        .btn.disabled {
          background-color: #e9ecef;
          color: #6c757d;
          cursor: not-allowed;
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 8px;
          margin: 16px 0;
          border: 1px solid #f5c6cb;
        }

        .success-message {
          background-color: #d4edda;
          color: #155724;
          padding: 12px;
          border-radius: 8px;
          margin: 16px 0;
          border: 1px solid #c3e6cb;
        }
      `}</style>
    </div>
  );
};

export default RegistrationForms;
