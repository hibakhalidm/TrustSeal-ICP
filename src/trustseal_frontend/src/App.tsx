import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import AdminDashboard from './components/AdminDashboard';
import IssuerDashboard from './components/IssuerDashboard';
import CheckerDashboard from './components/CheckerDashboard';
import RegistrationForms from './components/RegistrationForms';

// Types
interface Credential {
  id: number;
  owner: Principal;
  metadata: {
    student_name: string;
    credential_type: string;
    institution: string;
    issue_date: string;
  };
}

interface TrustSealActor {
  mint: (student_principal: any, student_name: string, credential_type: string, institution: string, issue_date: string) => Promise<{ ok?: number; err?: string }>;
  getTokensOfUser: (user: Principal) => Promise<number[]>;
  getCredential: (tokenId: number) => Promise<Credential | undefined>;
  getAllCredentials: () => Promise<Credential[]>;
  verifyCredential: (tokenId: number) => Promise<any>;
  getUserRole?: (user: any) => Promise<any>;
  getUserProfile?: (user: any) => Promise<any>;
  updateLastLogin?: () => Promise<any>;
  getAdminDashboardData?: () => Promise<any>;
  getAllUsers?: () => Promise<any>;
  registerUser?: (principal: any, name: string, org: string, role: any) => Promise<any>;
  verifyUser?: (user: any) => Promise<any>;
  getIssuerDashboardData?: (issuer: any) => Promise<any>;
  revokeCredential?: (tokenId: number) => Promise<any>;
  getCheckerStats?: (checker: any) => Promise<any>;
  registerChecker?: (org: string) => Promise<any>;
  verifyCredentialAsChecker?: (tokenId: number) => Promise<any>;
}

// Global credential store to persist across sessions
let globalCredentialStore: Array<any> = [];
let credentialIdCounter = 1000;

const App: React.FC = () => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<any>(null);
  const [actor, setActor] = useState<TrustSealActor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [userRole, setUserRole] = useState<'Admin' | 'Issuer' | 'Checker' | null>(null);
  const [activeTab, setActiveTab] = useState<'mint' | 'view' | 'verify'>('mint');
  const [showRegistration, setShowRegistration] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  
  // Form states
  const [formData, setFormData] = useState({
    student_name: '',
    credential_type: '',
    institution: '',
    issue_date: ''
  });
  
  const [userCredentials, setUserCredentials] = useState<Credential[]>([]);
  const [allCredentials, setAllCredentials] = useState<Credential[]>([]);
  const [verifyTokenId, setVerifyTokenId] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [registeredUsers, setRegisteredUsers] = useState<Map<string, 'Admin' | 'Issuer' | 'Checker'>>(new Map());

  // Function to check if user already has a role in the system
  const checkExistingUserRole = async (principal: string): Promise<'Admin' | 'Issuer' | 'Checker' | null> => {
    // In a real implementation, this would query the backend canister
    // For demo purposes, we'll check our local state and simulate some users
    
    // Check if user is in our registered users map
    if (registeredUsers.has(principal)) {
      return registeredUsers.get(principal) || null;
    }
    
    // Simulate some pre-existing users for demo
    if (principal.includes('admin')) return 'Admin';
    if (principal.includes('issuer') || principal.includes('university') || principal.includes('college')) return 'Issuer';
    
    // Default all new users to Checker role (they can verify credentials immediately)
    // Only Issuers need explicit registration for credential creation
    return 'Checker';
  };

  // Function to register a user with a specific role
  const registerUserWithRole = async (principal: string, role: 'Admin' | 'Issuer' | 'Checker', userInfo: any) => {
    // Update local state
    const newUsers = new Map(registeredUsers);
    newUsers.set(principal, role);
    setRegisteredUsers(newUsers);
    
    // Set the user's role
    setUserRole(role);
    setIsNewUser(false);
    
    // In a real implementation, this would call the backend canister
    if (actor && actor.registerUser) {
      try {
        await actor.registerUser(principal, userInfo.name, userInfo.organization, { [role]: null });
      } catch (err) {
        console.error('Failed to register user in backend:', err);
      }
    }
  };

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

      // Create actor - in a real implementation, you'd import the generated declarations
      // For now, we'll create a mock actor that simulates the backend functions
      const mockActor = {
        // Basic credential functions
        mint: async (student_principal: any, student_name: string, credential_type: string, institution: string, issue_date: string) => {
          const newCredential = {
            id: credentialIdCounter++,
            owner: student_principal,
            issuer: identity.getPrincipal(),
            metadata: {
              student_name,
              credential_type,
              institution,
              issue_date,
              issued_timestamp: Date.now() * 1000000
            },
            is_revoked: false
          };
          
          // Add to global store
          globalCredentialStore.push(newCredential);
          
          return { ok: newCredential.id };
        },
        getTokensOfUser: async (user: any) => {
          const userPrincipal = user.toString();
          return globalCredentialStore
            .filter(cred => cred.owner.toString() === userPrincipal)
            .map(cred => cred.id);
        },
        getCredential: async (tokenId: number) => {
          return globalCredentialStore.find(cred => cred.id === tokenId);
        },
        getAllCredentials: async () => {
          return globalCredentialStore;
        },
        getCredentialsByIssuer: async (issuer: any) => {
          const issuerPrincipal = issuer.toString();
          return globalCredentialStore.filter(cred => cred.issuer.toString() === issuerPrincipal);
        },
        verifyCredential: async (tokenId: number) => {
          const credential = await mockActor.getCredential(tokenId);
          return credential ? { isValid: true, credential, issuer_verified: true, revocation_status: 'Active' } : null;
        },
        
        // User management functions
        getUserRole: async (user: any) => {
          // Mock role detection - in real app this would query the backend
          const principal = user.toString();
          if (principal.includes('admin') || Math.random() < 0.1) return { Admin: null };
          if (principal.includes('issuer') || Math.random() < 0.4) return { Issuer: null };
          return { Checker: null };
        },
        getUserProfile: async (user: any) => ({
          principal: user.toString(),
          role: { Checker: null },
          name: 'Mock User',
          organization: 'Mock Organization',
          verified: true,
          registration_date: Date.now() * 1000000,
          last_login: Date.now() * 1000000
        }),
        updateLastLogin: async () => ({ ok: 'Login updated' }),
        
        // Admin functions
        getAdminDashboardData: async () => ({
          total_users: 15,
          total_issuers: 5,
          total_checkers: 8,
          pending_verifications: 2,
          total_credentials: 47
        }),
        getAllUsers: async () => [],
        registerUser: async (principal: any, name: string, org: string, role: any) => ({ ok: 'User registered' }),
        verifyUser: async (user: any) => ({ ok: 'User verified' }),
        
        // Issuer functions
        getIssuerDashboardData: async (issuer: any) => ({
          issued_credentials: 12,
          active_credentials: 10,
          revoked_credentials: 2,
          issuer_info: {
            principal: issuer,
            name: 'Mock University',
            verified: true,
            registration_date: Date.now() * 1000000
          }
        }),
        revokeCredential: async (tokenId: number) => ({ ok: 'Credential revoked' }),
        
        // Checker functions
        getCheckerStats: async (checker: any) => ({
          principal: checker.toString(),
          organization: 'Mock Employer',
          verified: true,
          registration_date: Date.now() * 1000000,
          verification_count: 25
        }),
        registerChecker: async (org: string) => ({ ok: 'Checker registered' }),
        verifyCredentialAsChecker: async (tokenId: number) => {
          const credential = await mockActor.getCredential(tokenId);
          return credential ? {
            isValid: true,
            credential,
            issuer_verified: true,
            revocation_status: 'Active',
            verification_timestamp: Date.now() * 1000000
          } : null;
        }
      };

      setActor(mockActor);
      
      // Only detect role if user doesn't already have one assigned
      if (!userRole) {
        try {
          // Update last login
          await mockActor.updateLastLogin();
        } catch (err) {
          console.log('Failed to update last login:', err);
        }
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
      // Use Internet Identity service - redirects to identity.ic0.app or local II
      await authClient.login({
        identityProvider: 'https://identity.ic0.app',
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          setIdentity(identity);
          setIsAuthenticated(true);
          await setupActor(identity);
          
          // Check if user has a role in our system, if not, they're new
          const principal = identity.getPrincipal().toString();
          const existingRole = await checkExistingUserRole(principal);
          
          if (existingRole) {
            setUserRole(existingRole);
            setSuccess('Successfully logged in with Internet Identity!');
          } else {
            setSuccess('Internet Identity connected! Please complete registration to assign your role.');
            setIsNewUser(true);
          }
        },
        onError: (err) => {
          setError('Internet Identity login failed: ' + err);
        }
      });
    } catch (err) {
      setError('Error connecting to Internet Identity: ' + String(err));
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
    setUserCredentials([]);
    setAllCredentials([]);
    setIsNewUser(false);
    setSuccess('Successfully logged out!');
  };

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await actor.mint(
        identity.getPrincipal(), // student_principal
        formData.student_name,
        formData.credential_type,
        formData.institution,
        formData.issue_date
      );
      
      if ('ok' in result) {
        setSuccess(`Credential minted successfully! Token ID: ${result.ok}`);
        setFormData({ student_name: '', credential_type: '', institution: '', issue_date: '' });
        // Refresh credentials
        await loadUserCredentials();
      } else {
        setError('Failed to mint credential: ' + result.err);
      }
    } catch (err) {
      setError('Error minting credential: ' + String(err));
    }
    setLoading(false);
  };

  const loadUserCredentials = async () => {
    if (!actor || !identity) return;
    
    setLoading(true);
    try {
      const tokenIds = await actor.getTokensOfUser(identity.getPrincipal());
      const credentials = await Promise.all(
        tokenIds.map(async (id) => {
          const cred = await actor.getCredential(id);
          return cred;
        })
      );
      setUserCredentials(credentials.filter(Boolean) as Credential[]);
    } catch (err) {
      setError('Error loading credentials: ' + String(err));
    }
    setLoading(false);
  };

  const loadAllCredentials = async () => {
    if (!actor) return;
    
    setLoading(true);
    try {
      const credentials = await actor.getAllCredentials();
      setAllCredentials(credentials);
    } catch (err) {
      setError('Error loading all credentials: ' + String(err));
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    
    setLoading(true);
    setError('');
    setVerificationResult(null);
    
    try {
      const result = await actor.verifyCredential(parseInt(verifyTokenId));
      setVerificationResult(result);
      if (!result) {
        setError('Credential not found');
      }
    } catch (err) {
      setError('Error verifying credential: ' + String(err));
    }
    setLoading(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Admin credentials check (in real app, this would be more secure)
    if (adminCredentials.username === 'admin' && adminCredentials.password === 'trustseal2025') {
      // Create admin identity
      const adminIdentity = {
        getPrincipal: () => ({ toString: () => 'admin-principal-' + Date.now() })
      };
      
      setIdentity(adminIdentity);
      setIsAuthenticated(true);
      setUserRole('Admin');
      await setupActor(adminIdentity);
      setSuccess('Successfully logged in as Administrator!');
      setShowAdminLogin(false);
      setAdminCredentials({ username: '', password: '' });
    } else {
      setError('Invalid admin credentials');
    }
    setLoading(false);
  };

  const handleRegistrationSuccess = async (role: 'Admin' | 'Issuer' | 'Checker', userInfo?: any) => {
    if (identity) {
      const principal = identity.getPrincipal().toString();
      await registerUserWithRole(principal, role, userInfo || { name: 'Unknown', organization: 'Unknown' });
      setSuccess(`Successfully registered as ${role}! Your IC Identity is now associated with this role.`);
    } else {
      setSuccess(`Successfully registered as ${role}!`);
    }
    setShowRegistration(false);
  };

  useEffect(() => {
    if (isAuthenticated && actor) {
      if (activeTab === 'view') {
        loadUserCredentials();
        loadAllCredentials();
      }
    }
  }, [activeTab, isAuthenticated, actor]);

  return (
    <div className="container">
      <div className="header">
        <h1>🔐 TrustSeal ICP</h1>
        <p>Decentralized Credential Verification on Internet Computer</p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="error">
          {error}
          <button 
            onClick={() => setError('')} 
            style={{ float: 'right', background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}
      
      {success && (
        <div className="success">
          {success}
          <button 
            onClick={() => setSuccess('')} 
            style={{ float: 'right', background: 'none', border: 'none', color: '#38a169', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {!isAuthenticated ? (
        <div>
          {showRegistration ? (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Register for TrustSeal</h2>
                <button 
                  className="btn secondary" 
                  onClick={() => setShowRegistration(false)}
                >
                  Back to Login
                </button>
              </div>
              <div className="info-box" style={{ backgroundColor: '#e6f3ff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                <h4>🔒 Internet Identity Required</h4>
                <p>To register for TrustSeal, you must first authenticate with your Internet Identity. This ensures your registration is associated with your unique IC identity.</p>
                <button 
                  className="btn" 
                  onClick={login} 
                  disabled={loading}
                  style={{ marginTop: '10px' }}
                >
                  {loading ? 'Connecting...' : 'Connect IC Identity'}
                </button>
              </div>
              {identity && (
                <RegistrationForms 
                  actor={actor}
                  identity={identity}
                  onRegistrationSuccess={handleRegistrationSuccess}
                />
              )}
            </div>
          ) : showAdminLogin ? (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>👑 Administrator Login</h2>
                <button 
                  className="btn secondary" 
                  onClick={() => setShowAdminLogin(false)}
                >
                  Back to Login
                </button>
              </div>
              
              <form onSubmit={handleAdminLogin}>
                <div className="form-group">
                  <label>Username:</label>
                  <input
                    type="text"
                    value={adminCredentials.username}
                    onChange={(e) => setAdminCredentials({...adminCredentials, username: e.target.value})}
                    required
                    placeholder="Enter admin username"
                  />
                </div>
                
                <div className="form-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials({...adminCredentials, password: e.target.value})}
                    required
                    placeholder="Enter admin password"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn" 
                  disabled={loading}
                  style={{ marginTop: '15px' }}
                >
                  {loading ? 'Logging in...' : 'Login as Admin'}
                </button>
              </form>
              
            </div>
          ) : (
            <div className="card">
              <h2>Welcome to TrustSeal ICP</h2>
              <p>Decentralized Credential Verification on Internet Computer</p>
              
              <div style={{ marginBottom: '20px' }}>
                <h3>👑 Administrator</h3>
                <p>Login as administrator to verify issuers and manage the system</p>
                <button 
                  className="btn admin" 
                  onClick={() => setShowAdminLogin(true)}
                  style={{ marginRight: '10px', backgroundColor: '#dc3545', color: 'white' }}
                >
                  Admin Login
                </button>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <h3>🆕 New User?</h3>
                <p>Register as an Educational Institution (Issuer) or Employer/Verifier (Checker)</p>
                <button 
                  className="btn secondary" 
                  onClick={() => setShowRegistration(true)}
                  style={{ marginRight: '10px' }}
                >
                  Register as Issuer
                </button>
              </div>
              
              <div>
                <h3>🔐 Existing User?</h3>
                <p>Use your Internet Identity to log in. All users can verify credentials immediately!</p>
                <button 
                  className="btn" 
                  onClick={login} 
                  disabled={loading}
                >
                  {loading ? 'Connecting...' : 'Connect IC Identity'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p><strong>Connected:</strong> {identity?.getPrincipal().toString().slice(0, 20)}...</p>
                {userRole && (
                  <p><strong>Role:</strong> 
                    <span className={`role-badge ${userRole.toLowerCase()}`}>
                      {userRole === 'Admin' ? '👑' : userRole === 'Issuer' ? '🏫' : '🔍'} {userRole}
                    </span>
                  </p>
                )}
              </div>
              <button className="btn" onClick={logout}>Logout</button>
            </div>
          </div>

          {/* Role-based Dashboard Routing */}
          {userRole === 'Admin' && (
            <AdminDashboard 
              actor={actor} 
              identity={identity} 
              registerUserWithRole={registerUserWithRole}
              registeredUsers={registeredUsers}
            />
          )}
          
          {userRole === 'Issuer' && (
            <IssuerDashboard actor={actor} identity={identity} />
          )}
          
          {userRole === 'Checker' && (
            <CheckerDashboard actor={actor} identity={identity} />
          )}
          
          {!userRole && !isNewUser && (
            <div className="card">
              <div className="loading-role">
                <h3>🔄 Loading Dashboard...</h3>
                <p>Detecting your role and setting up your personalized dashboard.</p>
              </div>
            </div>
          )}
          
          {isNewUser && (
            <div className="card">
              <div style={{ marginBottom: '20px' }}>
                <h2>🆕 Complete Your Registration</h2>
                <p>Your Internet Identity is connected! Please select your role to complete registration.</p>
                <div className="info-box" style={{ backgroundColor: '#e6f3ff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                  <h4>🔒 IC Identity: {identity?.getPrincipal().toString().slice(0, 30)}...</h4>
                  <p>Your registration will be permanently associated with this Internet Computer identity.</p>
                </div>
              </div>
              
              <RegistrationForms 
                actor={actor}
                identity={identity}
                onRegistrationSuccess={handleRegistrationSuccess}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
