/**
 * TrustSeal Hedera Frontend Application
 *
 * Main application component that renders role-specific dashboards for
 * Admin, Issuer, and Checker users and communicates with the demo server
 * which integrates with Hedera Hashgraph.
 */

import React, { useState, useEffect } from 'react';
// Hedera migration: remove ICP SDK imports
import AdminDashboard from './components/AdminDashboard';
import IssuerDashboard from './components/IssuerDashboard';
import CheckerDashboard from './components/CheckerDashboard';
import './dashboard.css';

// Types
interface Credential {
  id: string; // Hedera NFT id like 0.0.x/serial or demo id
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

interface UserProfile {
  principal: string;
  role: 'Admin' | 'Issuer' | 'Checker';
  name: string;
  organization: string;
  verified: boolean;
  registration_date: number;
  last_login?: number;
}

interface TrustSealActor {
  // User management (server-backed)
  getAllUsers: () => Promise<{ ok?: UserProfile[]; err?: string }>;
  getSystemStats: () => Promise<{ ok?: any; err?: string }>;
  verifyUser: (userPrincipal: string) => Promise<{ ok?: string; err?: string }>;
  
  // Credential management (server-backed)
  mint: (studentPrincipal: string, student_name: string, credential_type: string, institution: string, issue_date: string) => Promise<{ ok?: string; err?: string; credential?: Credential }>;
  revokeCredential: (tokenId: string, reason: string) => Promise<{ ok?: string; err?: string }>;
  getAllCredentials: () => Promise<Credential[]>;
  getCredential: (tokenId: string) => Promise<Credential | undefined>;
  verifyCredential: (tokenId: string) => Promise<{ isValid: boolean; credential: Credential; verificationTimestamp: number } | undefined>;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<{ getPrincipal: () => string } | null>(null);
  const [actor, setActor] = useState<TrustSealActor | null>(null);
  const [userRole, setUserRole] = useState<'Admin' | 'Issuer' | 'Checker' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'Admin' | 'Issuer' | 'Checker'>('Issuer');

  useEffect(() => {
    // Initialize API actor immediately
    (async () => {
      await setupActor();
      setIsInitializing(false);
    })();
  }, []);

  const setupActor = async () => {
    try {
      const baseUrl = '';
      const apiActor: TrustSealActor = {
        getAllUsers: async () => {
          try {
            const res = await fetch(`${baseUrl}/api/admin/users`);
            const data = await res.json();
            return { ok: data as UserProfile[] };
          } catch (e) {
            return { err: 'Failed to load users' };
          }
        },
        getSystemStats: async () => {
          try {
            const res = await fetch(`${baseUrl}/api/admin/stats`);
            const data = await res.json();
            return { ok: data };
          } catch (e) {
            return { err: 'Failed to load system stats' };
          }
        },
        verifyUser: async (userPrincipal: string) => {
          try {
            const res = await fetch(`${baseUrl}/api/admin/users/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ principal: userPrincipal }),
            });
            if (!res.ok) throw new Error('Verify failed');
            return { ok: 'User verified successfully' };
          } catch (e) {
            return { err: 'Failed to verify user' };
          }
        },
        mint: async (_studentPrincipal, student_name, credential_type, institution, issue_date) => {
          try {
            const res = await fetch(`${baseUrl}/api/issuer/mint`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ student_name, credential_type, institution, issue_date }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error('Mint failed');
            return { ok: 'Credential minted', credential: data.credential };
          } catch (e) {
            return { err: 'Failed to mint credential' };
          }
        },
        revokeCredential: async (tokenId: string, reason: string) => {
          try {
            const res = await fetch(`${baseUrl}/api/issuer/revoke`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tokenId, reason }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error('Revoke failed');
            return { ok: 'Credential revoked successfully' };
          } catch (e) {
            return { err: 'Failed to revoke credential' };
          }
        },
        getAllCredentials: async () => {
          try {
            const res = await fetch(`${baseUrl}/api/issuer/credentials`);
            return await res.json();
          } catch (e) {
            return [] as Credential[];
          }
        },
        getCredential: async (tokenId: string) => {
          try {
            const res = await fetch(`${baseUrl}/api/checker/verify/${encodeURIComponent(tokenId)}`);
            if (!res.ok) return undefined;
            const data = await res.json();
            return data.credential as Credential;
          } catch (e) {
            return undefined;
          }
        },
        verifyCredential: async (tokenId: string) => {
          try {
            const res = await fetch(`${baseUrl}/api/checker/verify/${encodeURIComponent(tokenId)}`);
            if (!res.ok) return undefined;
            return await res.json();
          } catch (e) {
            return undefined;
          }
        },
      };

      setActor(apiActor);
    } catch (err) {
      setError('Failed to setup actor');
      console.error(err);
    }
  };

  const login = async () => {
    setLoading(true);
    try {
      // Demo-only identity placeholder
      const demoIdentity = { getPrincipal: () => 'hedera-demo-operator' };
      setIdentity(demoIdentity);
      setIsAuthenticated(true);
      setUserRole(selectedRole);
      setSuccess('Connected for demo');
    } catch (err) {
      setError('Login error: ' + String(err));
    }
    setLoading(false);
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setIdentity(null);
    setActor(null);
    setUserRole(null);
    setSuccess('Successfully logged out!');
  };

  if (isInitializing) {
    return (
      <div className="container">
        <div className="header">
          <h1>🔐 TrustSeal Hedera</h1>
          <p>Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🔐 TrustSeal Hedera</h1>
        <p>Decentralized Credential Verification on Hedera Hashgraph</p>
        {isAuthenticated && userRole && (
          <p className="role-indicator">
            Logged in as: <span className={`role-badge ${userRole.toLowerCase()}`}>{userRole}</span>
          </p>
        )}
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {!isAuthenticated ? (
        <div className="card">
          <h2>Connect</h2>
          <p>Please choose a role to explore the TrustSeal Hedera demo</p>
          <div className="form-group">
            <label>Role</label>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as any)}>
              <option value="Admin">Admin</option>
              <option value="Issuer">Issuer</option>
              <option value="Checker">Checker</option>
            </select>
          </div>
          <button 
            className="btn" 
            onClick={login} 
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Continue'}
          </button>
        </div>
      ) : (
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p><strong>Connected:</strong> {identity?.getPrincipal().slice(0, 20)}...</p>
                <p><strong>Role:</strong> <span className={`role-badge ${userRole?.toLowerCase()}`}>{userRole}</span></p>
              </div>
              <button className="btn" onClick={logout}>Logout</button>
            </div>
          </div>

          {/* Role-based dashboard rendering */}
          {userRole === 'Admin' && <AdminDashboard actor={actor} identity={identity} />}
          {userRole === 'Issuer' && <IssuerDashboard actor={actor} identity={identity} />}
          {userRole === 'Checker' && <CheckerDashboard actor={actor} identity={identity} />}
          
          {!userRole && (
            <div className="card">
              <h3>Loading your dashboard...</h3>
              <p>Determining your role and permissions...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
