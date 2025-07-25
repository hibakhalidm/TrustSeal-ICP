import React, { useState, useEffect } from 'react';

interface AdminDashboardProps {
  actor: any;
  identity: any;
  registerUserWithRole: (principal: string, role: 'Admin' | 'Issuer' | 'Checker', userInfo: any) => Promise<void>;
  registeredUsers: Map<string, 'Admin' | 'Issuer' | 'Checker'>;
}

interface UserProfile {
  principal: string;
  role: 'Admin' | 'Issuer' | 'Checker';
  name: string;
  organization: string;
  verified: boolean;
  registration_date: number;
  last_login?: number;
}

interface DashboardData {
  total_users: number;
  total_issuers: number;
  total_checkers: number;
  pending_verifications: number;
  total_credentials: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ actor, identity, registerUserWithRole, registeredUsers }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'pending' | 'register'>('overview');

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    principal: '',
    name: '',
    organization: '',
    role: 'Issuer' as 'Admin' | 'Issuer' | 'Checker'
  });

  useEffect(() => {
    loadDashboardData();
    loadAllUsers();
  }, [actor]);

  const loadDashboardData = async () => {
    if (!actor) return;
    
    setLoading(true);
    try {
      const data = await actor.getAdminDashboardData();
      setDashboardData(data);
    } catch (err) {
      setError('Error loading dashboard data: ' + String(err));
    }
    setLoading(false);
  };

  const loadAllUsers = async () => {
    if (!actor) return;
    
    try {
      const users = await actor.getAllUsers();
      setAllUsers(users);
      setPendingUsers(users.filter((user: UserProfile) => !user.verified));
    } catch (err) {
      setError('Error loading users: ' + String(err));
    }
  };

  const handleVerifyUser = async (userPrincipal: string) => {
    if (!actor) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await actor.verifyUser({ fromText: userPrincipal });
      if ('ok' in result) {
        setSuccess('User verified successfully!');
        await loadAllUsers();
        await loadDashboardData();
      } else {
        setError('Failed to verify user: ' + result.err);
      }
    } catch (err) {
      setError('Error verifying user: ' + String(err));
    }
    setLoading(false);
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const userInfo = {
        name: registerForm.name,
        organization: registerForm.organization
      };
      
      await registerUserWithRole(registerForm.principal, registerForm.role, userInfo);
      
      setSuccess('User registered successfully!');
      setRegisterForm({ principal: '', name: '', organization: '', role: 'Issuer' });
      await loadAllUsers();
      await loadDashboardData();
    } catch (err) {
      setError('Error registering user: ' + String(err));
    }
    setLoading(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return '#e74c3c';
      case 'Issuer': return '#3498db';
      case 'Checker': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>👑 Administrator Dashboard</h2>
        <p>System management and user oversight</p>
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
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 All Users
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pending ({pendingUsers.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          ➕ Register User
        </button>
      </div>

      {activeTab === 'overview' && dashboardData && (
        <div className="dashboard-overview">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>👥 Total Users</h3>
              <div className="stat-number">{dashboardData.total_users}</div>
            </div>
            <div className="stat-card">
              <h3>🏫 Issuers</h3>
              <div className="stat-number">{dashboardData.total_issuers}</div>
            </div>
            <div className="stat-card">
              <h3>🔍 Checkers</h3>
              <div className="stat-number">{dashboardData.total_checkers}</div>
            </div>
            <div className="stat-card">
              <h3>⏳ Pending</h3>
              <div className="stat-number">{dashboardData.pending_verifications}</div>
            </div>
            <div className="stat-card">
              <h3>🎓 Credentials</h3>
              <div className="stat-number">{dashboardData.total_credentials}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-section">
          <h3>All System Users</h3>
          <div className="users-list">
            {allUsers.map((user, index) => (
              <div key={index} className="user-card">
                <div className="user-info">
                  <div className="user-header">
                    <span className="user-name">{user.name || 'Unknown'}</span>
                    <span 
                      className="user-role"
                      style={{ backgroundColor: getRoleColor(user.role) }}
                    >
                      {user.role}
                    </span>
                    <span className={`verification-status ${user.verified ? 'verified' : 'pending'}`}>
                      {user.verified ? '✅ Verified' : '⏳ Pending'}
                    </span>
                  </div>
                  <p><strong>Organization:</strong> {user.organization}</p>
                  <p><strong>Principal:</strong> {user.principal.slice(0, 20)}...</p>
                  <p><strong>Registered:</strong> {formatDate(user.registration_date)}</p>
                  {user.last_login && (
                    <p><strong>Last Login:</strong> {formatDate(user.last_login)}</p>
                  )}
                </div>
                {!user.verified && (
                  <button 
                    className="verify-btn"
                    onClick={() => handleVerifyUser(user.principal)}
                    disabled={loading}
                  >
                    Verify User
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="pending-section">
          <h3>Pending User Verifications</h3>
          {pendingUsers.length === 0 ? (
            <p>No pending verifications.</p>
          ) : (
            <div className="users-list">
              {pendingUsers.map((user, index) => (
                <div key={index} className="user-card pending">
                  <div className="user-info">
                    <div className="user-header">
                      <span className="user-name">{user.name || 'Unknown'}</span>
                      <span 
                        className="user-role"
                        style={{ backgroundColor: getRoleColor(user.role) }}
                      >
                        {user.role}
                      </span>
                    </div>
                    <p><strong>Organization:</strong> {user.organization}</p>
                    <p><strong>Principal:</strong> {user.principal.slice(0, 20)}...</p>
                    <p><strong>Registered:</strong> {formatDate(user.registration_date)}</p>
                  </div>
                  <button 
                    className="verify-btn"
                    onClick={() => handleVerifyUser(user.principal)}
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify User'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'register' && (
        <div className="register-section">
          <h3>Register New User</h3>
          <form onSubmit={handleRegisterUser} className="register-form">
            <div className="form-group">
              <label>User Principal ID</label>
              <input
                type="text"
                value={registerForm.principal}
                onChange={(e) => setRegisterForm({...registerForm, principal: e.target.value})}
                placeholder="Enter user's principal ID"
                required
              />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                placeholder="Enter user's full name"
                required
              />
            </div>
            <div className="form-group">
              <label>Organization</label>
              <input
                type="text"
                value={registerForm.organization}
                onChange={(e) => setRegisterForm({...registerForm, organization: e.target.value})}
                placeholder="Enter organization name"
                required
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={registerForm.role}
                onChange={(e) => setRegisterForm({...registerForm, role: e.target.value as any})}
              >
                <option value="Issuer">Issuer (University/Institution)</option>
                <option value="Checker">Checker (Employer/Verifier)</option>
                <option value="Admin">Admin (System Administrator)</option>
              </select>
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Registering...' : 'Register User'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
