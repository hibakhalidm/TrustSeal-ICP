/**
 * Admin Dashboard Component
 * 
 * Provides administrative functionality including user management,
 * system statistics, and user verification workflows for Hedera-based system.
 * 
 * @author TrustSeal Team
 */

import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationSystem from './NotificationSystem';

interface UserProfile {
  accountId: string;
  role: 'Admin' | 'Issuer' | 'Checker';
  name: string;
  organization: string;
  verified: boolean;
  registrationDate: number;
  lastLogin?: number;
}

interface SystemStats {
  totalCredentials: number;
  totalUsers: number;
  totalIssuers: number;
  totalCheckers: number;
  revokedCredentials: number;
  verifications: number;
}

interface AdminDashboardProps {
  hederaService: any;
  currentAccountId: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ hederaService, currentAccountId }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'register'>('overview');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Enhanced notification system
  const { 
    notifications, 
    dismissNotification, 
    showSuccess, 
    showError, 
    showWarning 
  } = useNotifications();

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    accountId: '',
    role: 'Checker' as 'Admin' | 'Issuer' | 'Checker',
    name: '',
    organization: ''
  });

  // Filters
  const [userFilter, setUserFilter] = useState<'all' | 'verified' | 'pending'>('all');

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    setLoading(true);
    try {
      if (hederaService) {
        // Load system statistics
        const systemStats = hederaService.getSystemStats();
        setStats(systemStats);

        // Load all users
        const allUsers = hederaService.getAllUsers();
        setUsers(allUsers);
      }
    } catch (err) {
      showError('Failed to load system data');
      console.error(err);
    }
    setLoading(false);
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!hederaService) {
        throw new Error('Hedera service not available');
      }

      const result = await hederaService.registerUser(
        registerForm.accountId,
        registerForm.role,
        registerForm.name,
        registerForm.organization
      );

      if (result.success) {
        showSuccess(`${registerForm.role} registered successfully!`);
        setRegisterForm({
          accountId: '',
          role: 'Checker',
          name: '',
          organization: ''
        });
        loadSystemData();
      } else {
        showError(result.message);
      }
    } catch (err) {
      showError('Registration failed: ' + String(err));
    }
    setLoading(false);
  };

  const handleVerifyUser = async (accountId: string) => {
    setLoading(true);
    try {
      if (!hederaService) {
        throw new Error('Hedera service not available');
      }

      const result = await hederaService.verifyUser(accountId);
      if (result.success) {
        showSuccess('User verified successfully!');
        loadSystemData();
      } else {
        showError(result.message);
      }
    } catch (err) {
      showError('Verification failed: ' + String(err));
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredUsers = users.filter(user => {
    switch (userFilter) {
      case 'verified':
        return user.verified;
      case 'pending':
        return !user.verified;
      default:
        return true;
    }
  });

  const renderOverview = () => (
    <div className="dashboard-section">
      <h2>📊 System Overview</h2>
      
      {stats && (
        <div className="stats-grid">
          <div className="stat-card primary">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
            <p className="stat-subtitle">Registered accounts</p>
          </div>
          <div className="stat-card success">
            <h3>Total Credentials</h3>
            <p className="stat-number">{stats.totalCredentials}</p>
            <p className="stat-subtitle">Issued on Hedera</p>
          </div>
          <div className="stat-card info">
            <h3>Issuers</h3>
            <p className="stat-number">{stats.totalIssuers}</p>
            <p className="stat-subtitle">Educational institutions</p>
          </div>
          <div className="stat-card warning">
            <h3>Checkers</h3>
            <p className="stat-number">{stats.totalCheckers}</p>
            <p className="stat-subtitle">Verification entities</p>
          </div>
          <div className="stat-card danger">
            <h3>Revoked</h3>
            <p className="stat-number">{stats.revokedCredentials}</p>
            <p className="stat-subtitle">Cancelled credentials</p>
          </div>
          <div className="stat-card">
            <h3>Verifications</h3>
            <p className="stat-number">{stats.verifications}</p>
            <p className="stat-subtitle">Total verifications</p>
          </div>
        </div>
      )}

      <div className="card">
        <h3>🌐 Hedera Network Status</h3>
        <div className="network-info">
          <div className="network-item">
            <span className="network-label">Network:</span>
            <span className="network-value">{process.env.REACT_APP_HEDERA_NETWORK || 'testnet'}</span>
          </div>
          <div className="network-item">
            <span className="network-label">Token ID:</span>
            <span className="network-value">{process.env.REACT_APP_CREDENTIAL_TOKEN_ID || 'Not Set'}</span>
          </div>
          <div className="network-item">
            <span className="network-label">Admin Account:</span>
            <span className="network-value">{currentAccountId}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>📈 Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-icon">👤</span>
            <span className="activity-text">System administrator logged in</span>
            <span className="activity-time">Just now</span>
          </div>
          <div className="activity-item">
            <span className="activity-icon">🎓</span>
            <span className="activity-text">New credential issued by MIT</span>
            <span className="activity-time">2 hours ago</span>
          </div>
          <div className="activity-item">
            <span className="activity-icon">✅</span>
            <span className="activity-text">Credential verified by Google</span>
            <span className="activity-time">3 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="dashboard-section">
      <h2>👥 User Management</h2>
      
      <div className="filters">
        <button 
          className={`filter-btn ${userFilter === 'all' ? 'active' : ''}`}
          onClick={() => setUserFilter('all')}
        >
          All Users ({users.length})
        </button>
        <button 
          className={`filter-btn ${userFilter === 'verified' ? 'active' : ''}`}
          onClick={() => setUserFilter('verified')}
        >
          Verified ({users.filter(u => u.verified).length})
        </button>
        <button 
          className={`filter-btn ${userFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setUserFilter('pending')}
        >
          Pending ({users.filter(u => !u.verified).length})
        </button>
      </div>

      <div className="card">
        <h3>Registered Users</h3>
        {loading ? (
          <p>Loading users...</p>
        ) : filteredUsers.length > 0 ? (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Account ID</th>
                  <th>Name</th>
                  <th>Organization</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.accountId}>
                    <td>{user.accountId}</td>
                    <td>{user.name}</td>
                    <td>{user.organization}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.verified ? 'verified' : 'pending'}`}>
                        {user.verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td>{new Date(user.registrationDate).toLocaleDateString()}</td>
                    <td>
                      {!user.verified && user.role !== 'Checker' && (
                        <button
                          className="btn-sm btn-success"
                          onClick={() => handleVerifyUser(user.accountId)}
                          disabled={loading}
                        >
                          Verify
                        </button>
                      )}
                      {user.verified && (
                        <span className="verified-checkmark">✓ Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No users found matching the current filter.</p>
        )}
      </div>
    </div>
  );

  const renderRegistrationForm = () => (
    <div className="dashboard-section">
      <h2>➕ Register New User</h2>
      <div className="card">
        <h3>Add User to TrustSeal Hedera</h3>
        <form onSubmit={handleRegisterUser}>
          <div className="form-group">
            <label htmlFor="accountId">Hedera Account ID</label>
            <input
              type="text"
              id="accountId"
              name="accountId"
              value={registerForm.accountId}
              onChange={handleInputChange}
              placeholder="0.0.12345"
              pattern="0\.0\.\d+"
              title="Please enter a valid Hedera Account ID (e.g., 0.0.12345)"
              required
            />
            <small>Enter the user's Hedera Account ID</small>
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={registerForm.name}
              onChange={handleInputChange}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="organization">Organization</label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={registerForm.organization}
              onChange={handleInputChange}
              placeholder="Organization or institution name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={registerForm.role}
              onChange={handleInputChange}
              required
            >
              <option value="Checker">Checker (Employer/Verifier)</option>
              <option value="Issuer">Issuer (University/Institution)</option>
              <option value="Admin">Admin (System Administrator)</option>
            </select>
            <small>
              Checkers verify credentials, Issuers create them, Admins manage the system
            </small>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Registering...' : 'Register User'}
          </button>
        </form>

        <div className="registration-info">
          <h4>📋 Registration Notes:</h4>
          <ul>
            <li><strong>Checkers:</strong> Auto-verified, can immediately verify credentials</li>
            <li><strong>Issuers:</strong> Require manual verification before issuing credentials</li>
            <li><strong>Admins:</strong> Full system access, auto-verified</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <NotificationSystem 
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      <div className="dashboard-header">
        <h1>⚡ Admin Dashboard</h1>
        <p>TrustSeal Hedera System Administration</p>
      </div>

      <div className="dashboard-nav">
        <button 
          className={`nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          📊 System Overview
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

      <div className="dashboard-content">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'users' && renderUserManagement()}
        {activeSection === 'register' && renderRegistrationForm()}
      </div>
    </div>
  );
};

export default AdminDashboard;