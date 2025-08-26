/**
 * TrustSeal ICP Frontend Application
 * 
 * Main application component that handles authentication, user role management,
 * and renders role-specific dashboards for Admin, Issuer, and Checker users.
 * 
 * @author TrustSeal Team
 * @version 1.0.0 - WCHL 2025 Submission
 */

import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RequireAdmin, RequireIssuer, RequireChecker } from './components/auth/RequireRole';
import AdminDashboard from './components/AdminDashboard';
import IssuerDashboard from './components/IssuerDashboard';
import CheckerDashboard from './components/CheckerDashboard';
import './dashboard.css';

const AppContent: React.FC = () => {
  const { 
    isAuthenticated, 
    identity, 
    actor, 
    userRole, 
    userProfile,
    loading, 
    error, 
    success, 
    isInitializing,
    login, 
    logout,
    clearMessages 
  } = useAuth();

  if (isInitializing) {
    return (
      <div className="container">
        <div className="header">
          <h1>🔐 TrustSeal ICP</h1>
          <p>Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🔐 TrustSeal ICP</h1>
        <p>Decentralized Credential Verification on Internet Computer</p>
        {isAuthenticated && userRole && (
          <p className="role-indicator">
            Logged in as: <span className={`role-badge ${userRole.toLowerCase()}`}>{userRole}</span>
            {userProfile && (
              <span className="user-info">
                {' '}({userProfile.name} - {userProfile.organization})
              </span>
            )}
          </p>
        )}
      </div>

      {error && (
        <div className="error">
          {error}
          <button onClick={clearMessages} className="close-btn">×</button>
        </div>
      )}
      {success && (
        <div className="success">
          {success}
          <button onClick={clearMessages} className="close-btn">×</button>
        </div>
      )}

      {!isAuthenticated ? (
        <div className="card">
          <h2>Connect with Internet Identity</h2>
          <p>Please authenticate to start using TrustSeal ICP</p>
          <button 
            className="btn" 
            onClick={login} 
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      ) : (
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p><strong>Connected:</strong> {identity?.getPrincipal().toString().slice(0, 20)}...</p>
                <p><strong>Role:</strong> <span className={`role-badge ${userRole?.toLowerCase()}`}>{userRole}</span></p>
                {userProfile && (
                  <p><strong>Organization:</strong> {userProfile.organization}</p>
                )}
              </div>
              <button className="btn" onClick={logout}>Logout</button>
            </div>
          </div>

          {/* Role-based dashboard rendering with proper guards */}
          <RequireAdmin>
            <AdminDashboard actor={actor} identity={identity} />
          </RequireAdmin>
          
          <RequireIssuer>
            <IssuerDashboard actor={actor} identity={identity} />
          </RequireIssuer>
          
          <RequireChecker>
            <CheckerDashboard actor={actor} identity={identity} />
          </RequireChecker>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
