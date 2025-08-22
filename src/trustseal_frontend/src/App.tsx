import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import AdminDashboard from './components/AdminDashboard';
import IssuerDashboard from './components/IssuerDashboard';
import CheckerDashboard from './components/CheckerDashboard';
import './dashboard.css';

// Types
interface Credential {
  id: number;
  owner: Principal;
  issuer: Principal;
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
  principal: Principal;
  role: 'Admin' | 'Issuer' | 'Checker';
  name: string;
  organization: string;
  verified: boolean;
  registration_date: number;
  last_login?: number;
}

interface TrustSealActor {
  // User management
  initializeAdmin: () => Promise<{ ok?: string; err?: string }>;
  registerUser: (userPrincipal: Principal, role: any, name: string, organization: string) => Promise<{ ok?: string; err?: string }>;
  getUserRole: (user: Principal) => Promise<any>;
  getUserProfile: (user: Principal) => Promise<UserProfile | undefined>;
  verifyUser: (userPrincipal: Principal) => Promise<{ ok?: string; err?: string }>;
  updateLastLogin: () => Promise<{ ok?: string; err?: string }>;
  getAllUsers: () => Promise<{ ok?: UserProfile[]; err?: string }>;
  getSystemStats: () => Promise<{ ok?: any; err?: string }>;
  
  // Credential management
  mint: (studentPrincipal: Principal, student_name: string, credential_type: string, institution: string, issue_date: string) => Promise<{ ok?: number; err?: string }>;
  revokeCredential: (tokenId: number, reason: string) => Promise<{ ok?: string; err?: string }>;
  getTokensOfUser: (user: Principal) => Promise<number[]>;
  getCredentialsByIssuer: (issuer: Principal) => Promise<Credential[]>;
  getCredential: (tokenId: number) => Promise<Credential | undefined>;
  getAllCredentials: () => Promise<Credential[]>;
  verifyCredential: (tokenId: number) => Promise<{ isValid: boolean; credential: Credential; verificationTimestamp: number } | undefined>;
  totalSupply: () => Promise<number>;
}

const App: React.FC = () => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<any>(null);
  const [actor, setActor] = useState<TrustSealActor | null>(null);
  const [userRole, setUserRole] = useState<'Admin' | 'Issuer' | 'Checker' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const authClient = await AuthClient.create();
      setAuthClient(authClient);
      
      const isAuthenticated = await authClient.isAuthenticated();
      setIsAuthenticated(isAuthenticated);
      
      if (isAuthenticated) {
        const identity = authClient.getIdentity();
        setIdentity(identity);
        await setupActor(identity);
      }
    } catch (err) {
      setError('Failed to initialize authentication');
      console.error(err);
    }
    setIsInitializing(false);
  };

  const setupActor = async (identity: any) => {
    try {
      const agent = new HttpAgent({
        identity,
        host: process.env.NODE_ENV === 'development' ? 'http://localhost:4943' : 'https://icp-api.io'
      });

      // For local development, disable certificate verification
      if (process.env.NODE_ENV === 'development') {
        await agent.fetchRootKey();
      }

      // Enhanced mock actor with role-based functionality
      const mockActor: TrustSealActor = {
        // User management functions
        initializeAdmin: async () => ({ ok: "Admin initialized successfully" }),
        
        registerUser: async (userPrincipal, role, name, organization) => {
          return { ok: "User registered successfully" };
        },
        
        getUserRole: async (user) => {
          // Mock role detection - in real implementation, this would query the canister
          const principal = user.toString();
          if (principal.includes('admin') || principal === identity.getPrincipal().toString()) {
            return { Admin: null };
          } else if (principal.includes('issuer') || Math.random() > 0.5) {
            return { Issuer: null };
          } else {
            return { Checker: null };
          }
        },
        
        getUserProfile: async (user) => {
          return {
            principal: user,
            role: 'Issuer',
            name: 'Demo User',
            organization: 'Demo Organization',
            verified: true,
            registration_date: Date.now() - 86400000,
            last_login: Date.now() - 3600000
          };
        },
        
        verifyUser: async (userPrincipal) => ({ ok: "User verified successfully" }),
        updateLastLogin: async () => ({ ok: "Login updated" }),
        getAllUsers: async () => ({ ok: [] }),
        getSystemStats: async () => ({ 
          ok: {
            totalCredentials: 45,
            totalUsers: 12,
            totalIssuers: 5,
            totalCheckers: 6,
            revokedCredentials: 2
          }
        }),

        // Credential management functions
        mint: async (studentPrincipal, student_name, credential_type, institution, issue_date) => {
          return { ok: Math.floor(Math.random() * 1000) };
        },
        
        revokeCredential: async (tokenId, reason) => ({ ok: "Credential revoked successfully" }),
        
        getTokensOfUser: async (user) => [1, 2, 3],
        
        getCredentialsByIssuer: async (issuer) => [
          {
            id: 1,
            owner: Principal.fromText('be2us-64aaa-aaaaa-qadbq-cai'),
            issuer: issuer,
            metadata: {
              student_name: 'John Doe',
              credential_type: 'Bachelor of Science',
              institution: 'MIT',
              issue_date: '2023-06-15',
              revoked: false
            },
            issue_timestamp: Date.now() - 86400000
          }
        ],
        
        getCredential: async (tokenId) => ({
          id: tokenId,
          owner: Principal.fromText('be2us-64aaa-aaaaa-qadbq-cai'),
          issuer: identity.getPrincipal(),
          metadata: {
            student_name: 'John Doe',
            credential_type: 'Bachelor of Science',
            institution: 'MIT',
            issue_date: '2023-06-15',
            revoked: false
          },
          issue_timestamp: Date.now() - 86400000
        }),
        
        getAllCredentials: async () => [
          {
            id: 1,
            owner: Principal.fromText('be2us-64aaa-aaaaa-qadbq-cai'),
            issuer: identity.getPrincipal(),
            metadata: {
              student_name: 'John Doe',
              credential_type: 'Bachelor of Science',
              institution: 'MIT',
              issue_date: '2023-06-15',
              revoked: false
            },
            issue_timestamp: Date.now() - 86400000
          },
          {
            id: 2,
            owner: Principal.fromText('rdmx6-jaaaa-aaaaa-aaadq-cai'),
            issuer: identity.getPrincipal(),
            metadata: {
              student_name: 'Jane Smith',
              credential_type: 'Master of Arts',
              institution: 'Harvard',
              issue_date: '2023-05-20',
              revoked: false
            },
            issue_timestamp: Date.now() - 172800000
          }
        ],
        
        verifyCredential: async (tokenId) => {
          const credential = await mockActor.getCredential(tokenId);
          return credential ? { 
            isValid: !credential.metadata.revoked, 
            credential,
            verificationTimestamp: Date.now()
          } : undefined;
        },
        
        totalSupply: async () => 45
      };

      setActor(mockActor);
      
      // Determine user role
      if (identity) {
        const roleResult = await mockActor.getUserRole(identity.getPrincipal());
        if (roleResult?.Admin !== undefined) {
          setUserRole('Admin');
        } else if (roleResult?.Issuer !== undefined) {
          setUserRole('Issuer');
        } else {
          setUserRole('Checker');
        }
        
        // Update last login
        await mockActor.updateLastLogin();
      }
    } catch (err) {
      setError('Failed to setup actor');
      console.error(err);
    }
  };

  const login = async () => {
    if (!authClient) return;
    
    setLoading(true);
    try {
      await authClient.login({
        identityProvider: process.env.NODE_ENV === 'development' 
          ? `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`
          : 'https://identity.ic0.app',
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          setIdentity(identity);
          setIsAuthenticated(true);
          await setupActor(identity);
          setSuccess('Successfully logged in!');
        },
        onError: (err) => {
          setError('Login failed: ' + err);
        }
      });
    } catch (err) {
      setError('Login error: ' + String(err));
    }
    setLoading(false);
  };

  const logout = async () => {
    if (!authClient) return;
    
    await authClient.logout();
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
          </p>
        )}
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

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
