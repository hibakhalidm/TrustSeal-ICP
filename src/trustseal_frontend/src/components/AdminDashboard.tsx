import React, { useState, useEffect } from 'react';

interface UserProfile {
  principal: string;
  role: 'Admin' | 'Issuer' | 'Checker';
  name: string;
  organization: string;
  verified: boolean;
  registration_date: number;
  last_login?: number;
}

interface SystemStats {
  totalCredentials: number;
  totalUsers: number;
  totalIssuers: number;
  totalCheckers: number;
  revokedCredentials: number;
}

interface AdminDashboardProps {
  actor: any;
  identity: any;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ actor, identity }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'register'>('overview');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    userPrincipal: '',
    role: 'Issuer' as 'Admin' | 'Issuer' | 'Checker',
    name: '',
    organization: ''
  });

  useEffect(() => {
    if (activeSection === 'overview') {
      loadSystemStats();
    } else if (activeSection === 'users') {
      loadAllUsers();
    }
  }, [activeSection]);

  const loadSystemStats = async () => {
    setLoading(true);
    try {
      // Mock implementation for demo
      setStats({
        totalCredentials: 45,
        totalUsers: 12,
        totalIssuers: 5,
        totalCheckers: 6,
        revokedCredentials: 2
      });
    } catch (err) {
      setError('Failed to load system statistics');
    }
    setLoading(false);
  };

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      // Mock implementation for demo
      setUsers([
        {
          principal: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
          role: 'Issuer',
          name: 'MIT Registrar',
          organization: 'Massachusetts Institute of Technology',
          verified: true,
          registration_date: Date.now() - 86400000,
          last_login: Date.now() - 3600000
        },
        {
          principal: 'bkyz2-fmaaa-aaaaa-qaaaq-cai',
          role: 'Checker',
          name: 'TechCorp HR',
          organization: 'TechCorp Inc.',
          verified: false,
          registration_date: Date.now() - 43200000
        }
      ]);
    } catch (err) {
      setError('Failed to load users');
    }
    setLoading(false);
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Mock implementation for demo
      setSuccess(`User ${registerForm.name} registered successfully as ${registerForm.role}`);
      setRegisterForm({
        userPrincipal: '',
        role: 'Issuer',
        name: '',
        organization: ''
      });
      if (activeSection === 'users') {
        await loadAllUsers();
      }
    } catch (err) {
      setError('Failed to register user');
    }
    setLoading(false);
  };

  const handleVerifyUser = async (userPrincipal: string) => {
    setLoading(true);
    try {
      // Mock implementation for demo
      setSuccess('User verified successfully');
      await loadAllUsers();
    } catch (err) {
      setError('Failed to verify user');
    }
    setLoading(false);
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>👑 Administrator Dashboard</h2>
        <p>System Management & Oversight</p>
      </div>

      <div className="dashboard-nav">
        <button 
          className={`nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`nav-btn ${activeSection === 'users' ? 'active' : ''}`}
          onClick={() => setActiveSection('users')}
        >
          👥 User Management
        </button>
        <button 
          className={`nav-btn ${activeSection === 'register' ? 'active' : ''}`}
          onClick={() => setActiveSection('register')}
        >
          ➕ Register User
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {activeSection === 'overview' && (
        <div className="dashboard-section">
          <h3>System Statistics</h3>
          {loading ? (
            <div className="loading">Loading statistics...</div>
          ) : stats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Total Credentials</h4>
                <div className="stat-number">{stats.totalCredentials}</div>
              </div>
              <div className="stat-card">
                <h4>Total Users</h4>
                <div className="stat-number">{stats.totalUsers}</div>
              </div>
              <div className="stat-card">
                <h4>Active Issuers</h4>
                <div className="stat-number">{stats.totalIssuers}</div>
              </div>
              <div className="stat-card">
                <h4>Registered Checkers</h4>
                <div className="stat-number">{stats.totalCheckers}</div>
              </div>
              <div className="stat-card revoked">
                <h4>Revoked Credentials</h4>
                <div className="stat-number">{stats.revokedCredentials}</div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {activeSection === 'users' && (
        <div className="dashboard-section">
          <h3>User Management</h3>
          {loading ? (
            <div className="loading">Loading users...</div>
          ) : (
            <div className="users-list">
              {users.map((user, index) => (
                <div key={index} className="user-card">
                  <div className="user-info">
                    <h4>{user.name}</h4>
                    <p><strong>Role:</strong> <span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span></p>
                    <p><strong>Organization:</strong> {user.organization}</p>
                    <p><strong>Principal:</strong> {user.principal}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status-badge ${user.verified ? 'verified' : 'pending'}`}>
                        {user.verified ? '✅ Verified' : '⏳ Pending'}
                      </span>
                    </p>
                    <p><strong>Registered:</strong> {new Date(user.registration_date).toLocaleDateString()}</p>
                    {user.last_login && (
                      <p><strong>Last Login:</strong> {new Date(user.last_login).toLocaleString()}</p>
                    )}
                  </div>
                  {!user.verified && (
                    <div className="user-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleVerifyUser(user.principal)}
                        disabled={loading}
                      >
                        Verify User
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'register' && (
        <div className="dashboard-section">
          <h3>Register New User</h3>
          <form onSubmit={handleRegisterUser} className="register-form">
            <div className="form-group">
              <label>User Principal ID</label>
              <input
                type="text"
                value={registerForm.userPrincipal}
                onChange={(e) => setRegisterForm({...registerForm, userPrincipal: e.target.value})}
                placeholder="Enter user's Principal ID"
                required
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={registerForm.role}
                onChange={(e) => setRegisterForm({...registerForm, role: e.target.value as any})}
                required
              >
                <option value="Issuer">Issuer (Institution)</option>
                <option value="Checker">Checker (Employer)</option>
                <option value="Admin">Admin (System)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                placeholder="Full name or institution name"
                required
              />
            </div>
            <div className="form-group">
              <label>Organization</label>
              <input
                type="text"
                value={registerForm.organization}
                onChange={(e) => setRegisterForm({...registerForm, organization: e.target.value})}
                placeholder="Organization or company name"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register User'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;