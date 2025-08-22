import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// Import backend declarations
// Note: In production, generate these with dfx generate
interface BackendService {
  mint: (student_name: string, credential_type: string, institution: string, issue_date: string) => Promise<{ ok?: bigint; err?: string }>;
  getTokensOfUser: (user: Principal) => Promise<Array<bigint>>;
  getCredential: (tokenId: bigint) => Promise<Array<{
    id: bigint;
    owner: Principal;
    issuer: Principal;
    metadata: {
      student_name: string;
      credential_type: string;
      institution: string;
      issue_date: string;
      created_at: bigint;
      verification_hash: string;
    };
    is_revoked: boolean;
  }>>;
  getAllCredentials: () => Promise<Array<{
    id: bigint;
    owner: Principal;
    issuer: Principal;
    metadata: {
      student_name: string;
      credential_type: string;
      institution: string;
      issue_date: string;
      created_at: bigint;
      verification_hash: string;
    };
    is_revoked: boolean;
  }>>;
  verifyCredential: (tokenId: bigint) => Promise<Array<{
    isValid: boolean;
    credential: {
      id: bigint;
      owner: Principal;
      issuer: Principal;
      metadata: {
        student_name: string;
        credential_type: string;
        institution: string;
        issue_date: string;
        created_at: bigint;
        verification_hash: string;
      };
      is_revoked: boolean;
    };
    verification_details: {
      hash_matches: boolean;
      not_revoked: boolean;
      issuer_authorized: boolean;
    };
  }>>;
  getStatistics: () => Promise<{
    total_credentials: bigint;
    active_credentials: bigint;
    total_issuers: bigint;
    revoked_credentials: bigint;
  }>;
  healthCheck: () => Promise<{ status: string; timestamp: bigint }>;
}

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
    created_at: number;
    verification_hash: string;
  };
  is_revoked: boolean;
}

interface VerificationResult {
  isValid: boolean;
  credential: Credential;
  verification_details: {
    hash_matches: boolean;
    not_revoked: boolean;
    issuer_authorized: boolean;
  };
}

interface Statistics {
  total_credentials: number;
  active_credentials: number;
  total_issuers: number;
  revoked_credentials: number;
}

const App: React.FC = () => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<any>(null);
  const [actor, setActor] = useState<BackendService | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'mint' | 'view' | 'verify' | 'stats'>('mint');
  
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
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);

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
      setError('Failed to initialize authentication: ' + String(err));
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

      // Get canister ID from environment or use local development ID
      const canisterId = process.env.REACT_APP_BACKEND_CANISTER_ID || 'rrkah-fqaaa-aaaaa-aaaaq-cai';

      // Create real actor (replace with generated declarations in production)
      const backendActor = Actor.createActor<BackendService>(
        ({ IDL }) => IDL.Service({
          mint: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Variant({ ok: IDL.Nat, err: IDL.Text })], []),
          getTokensOfUser: IDL.Func([IDL.Principal], [IDL.Vec(IDL.Nat)], ['query']),
          getCredential: IDL.Func([IDL.Nat], [IDL.Opt(IDL.Record({
            id: IDL.Nat,
            owner: IDL.Principal,
            issuer: IDL.Principal,
            metadata: IDL.Record({
              student_name: IDL.Text,
              credential_type: IDL.Text,
              institution: IDL.Text,
              issue_date: IDL.Text,
              created_at: IDL.Int,
              verification_hash: IDL.Text,
            }),
            is_revoked: IDL.Bool,
          }))], ['query']),
          getAllCredentials: IDL.Func([], [IDL.Vec(IDL.Record({
            id: IDL.Nat,
            owner: IDL.Principal,
            issuer: IDL.Principal,
            metadata: IDL.Record({
              student_name: IDL.Text,
              credential_type: IDL.Text,
              institution: IDL.Text,
              issue_date: IDL.Text,
              created_at: IDL.Int,
              verification_hash: IDL.Text,
            }),
            is_revoked: IDL.Bool,
          }))], ['query']),
          verifyCredential: IDL.Func([IDL.Nat], [IDL.Opt(IDL.Record({
            isValid: IDL.Bool,
            credential: IDL.Record({
              id: IDL.Nat,
              owner: IDL.Principal,
              issuer: IDL.Principal,
              metadata: IDL.Record({
                student_name: IDL.Text,
                credential_type: IDL.Text,
                institution: IDL.Text,
                issue_date: IDL.Text,
                created_at: IDL.Int,
                verification_hash: IDL.Text,
              }),
              is_revoked: IDL.Bool,
            }),
            verification_details: IDL.Record({
              hash_matches: IDL.Bool,
              not_revoked: IDL.Bool,
              issuer_authorized: IDL.Bool,
            }),
          }))], ['query']),
          getStatistics: IDL.Func([], [IDL.Record({
            total_credentials: IDL.Nat,
            active_credentials: IDL.Nat,
            total_issuers: IDL.Nat,
            revoked_credentials: IDL.Nat,
          })], ['query']),
          healthCheck: IDL.Func([], [IDL.Record({ status: IDL.Text, timestamp: IDL.Int })], ['query']),
        }),
        {
          agent,
          canisterId,
        }
      );

      setActor(backendActor as any);
    } catch (err) {
      setError('Failed to setup actor: ' + String(err));
      console.error(err);
    }
  };

  const login = async () => {
    if (!authClient) return;
    
    setLoading(true);
    setError('');
    try {
      await authClient.login({
        identityProvider: process.env.NODE_ENV === 'development' 
          ? `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID || 'rdmx6-jaaaa-aaaaa-aaadq-cai'}`
          : 'https://identity.ic0.app',
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          setIdentity(identity);
          setIsAuthenticated(true);
          await setupActor(identity);
          setSuccess('Successfully logged in with Internet Identity!');
          setTimeout(() => setSuccess(''), 3000);
        },
        onError: (err) => {
          setError('Login failed: ' + String(err));
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
    setUserCredentials([]);
    setAllCredentials([]);
    setStatistics(null);
    setVerificationResult(null);
    setSuccess('Successfully logged out!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) {
      setError('Actor not initialized. Please reconnect.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await actor.mint(
        formData.student_name,
        formData.credential_type,
        formData.institution,
        formData.issue_date
      );
      
      if ('ok' in result && result.ok !== undefined) {
        setSuccess(`🎉 Credential minted successfully! Token ID: ${Number(result.ok)}`);
        setFormData({ student_name: '', credential_type: '', institution: '', issue_date: '' });
        // Refresh credentials and stats
        await Promise.all([loadUserCredentials(), loadStatistics()]);
      } else {
        setError('Failed to mint credential: ' + (result.err || 'Unknown error'));
      }
    } catch (err) {
      setError('Error minting credential: ' + String(err));
      console.error('Mint error:', err);
    }
    setLoading(false);
  };

  const loadUserCredentials = async () => {
    if (!actor || !identity) return;
    
    try {
      const tokenIds = await actor.getTokensOfUser(identity.getPrincipal());
      const credentials = await Promise.all(
        tokenIds.map(async (id) => {
          const credResult = await actor.getCredential(id);
          return credResult.length > 0 ? {
            ...credResult[0],
            id: Number(credResult[0].id),
            metadata: {
              ...credResult[0].metadata,
              created_at: Number(credResult[0].metadata.created_at),
            }
          } : null;
        })
      );
      setUserCredentials(credentials.filter(Boolean) as Credential[]);
    } catch (err) {
      setError('Error loading your credentials: ' + String(err));
      console.error('Load user credentials error:', err);
    }
  };

  const loadAllCredentials = async () => {
    if (!actor) return;
    
    try {
      const credentialsResult = await actor.getAllCredentials();
      const formattedCredentials = credentialsResult.map(cred => ({
        ...cred,
        id: Number(cred.id),
        metadata: {
          ...cred.metadata,
          created_at: Number(cred.metadata.created_at),
        }
      }));
      setAllCredentials(formattedCredentials);
    } catch (err) {
      setError('Error loading public credentials: ' + String(err));
      console.error('Load all credentials error:', err);
    }
  };

  const loadStatistics = async () => {
    if (!actor) return;
    
    try {
      const statsResult = await actor.getStatistics();
      setStatistics({
        total_credentials: Number(statsResult.total_credentials),
        active_credentials: Number(statsResult.active_credentials),
        total_issuers: Number(statsResult.total_issuers),
        revoked_credentials: Number(statsResult.revoked_credentials),
      });
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) {
      setError('Actor not initialized. Please reconnect.');
      return;
    }
    
    setLoading(true);
    setError('');
    setVerificationResult(null);
    
    try {
      const tokenId = BigInt(verifyTokenId);
      const result = await actor.verifyCredential(tokenId);
      
      if (result.length > 0) {
        const verifyData = result[0];
        setVerificationResult({
          ...verifyData,
          credential: {
            ...verifyData.credential,
            id: Number(verifyData.credential.id),
            metadata: {
              ...verifyData.credential.metadata,
              created_at: Number(verifyData.credential.metadata.created_at),
            }
          }
        });
      } else {
        setError('❌ Credential not found or has been revoked');
      }
    } catch (err) {
      setError('Error verifying credential: ' + String(err));
      console.error('Verify error:', err);
    }
    setLoading(false);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString();
  };

  const formatPrincipal = (principal: Principal): string => {
    return principal.toString().slice(0, 10) + '...';
  };

  useEffect(() => {
    if (isAuthenticated && actor) {
      if (activeTab === 'view') {
        Promise.all([loadUserCredentials(), loadAllCredentials()]);
      } else if (activeTab === 'stats') {
        loadStatistics();
      }
    }
  }, [activeTab, isAuthenticated, actor]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="container">
      <div className="header">
        <h1>🔐 TrustSeal ICP</h1>
        <p>Decentralized Credential Verification on Internet Computer</p>
        <div className="badge">WCHL 2025 Submission</div>
      </div>

      {!isAuthenticated ? (
        <div className="card">
          <h2>🌐 Connect with Internet Identity</h2>
          <p>Secure, decentralized authentication powered by Internet Computer</p>
          <div className="features-preview">
            <div className="feature">✅ No passwords needed</div>
            <div className="feature">🔒 Cryptographically secure</div>
            <div className="feature">🌍 Works across all IC dApps</div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={login} 
            disabled={loading}
          >
            {loading ? '🔄 Connecting...' : '🚀 Connect with Internet Identity'}
          </button>
        </div>
      ) : (
        <div>
          <div className="card">
            <div className="user-info">
              <div className="user-details">
                <div className="user-badge">
                  <span className="status-indicator"></span>
                  <strong>Connected:</strong> {formatPrincipal(identity?.getPrincipal())}
                </div>
                <div className="network-info">
                  Network: {process.env.NODE_ENV === 'development' ? '🧪 Local Testnet' : '🌐 IC Mainnet'}
                </div>
              </div>
              <button className="btn btn-secondary" onClick={logout}>Logout</button>
            </div>
          </div>

          <div className="card">
            <div className="tab-navigation">
              <button 
                className={`tab-btn ${activeTab === 'mint' ? 'active' : ''}`}
                onClick={() => setActiveTab('mint')}
              >
                🎓 Issue Credential
              </button>
              <button 
                className={`tab-btn ${activeTab === 'view' ? 'active' : ''}`}
                onClick={() => setActiveTab('view')}
              >
                📜 My Credentials
              </button>
              <button 
                className={`tab-btn ${activeTab === 'verify' ? 'active' : ''}`}
                onClick={() => setActiveTab('verify')}
              >
                🔍 Verify Credential
              </button>
              <button 
                className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                onClick={() => setActiveTab('stats')}
              >
                📊 Statistics
              </button>
            </div>

            {error && <div className="error">❌ {error}</div>}
            {success && <div className="success">✅ {success}</div>}

            {activeTab === 'mint' && (
              <div className="tab-content">
                <h3>🎓 Issue New Credential</h3>
                <p className="tab-description">Create tamper-proof, verifiable credentials as NFTs on the Internet Computer</p>
                <form onSubmit={handleMint} className="credential-form">
                  <div className="form-group">
                    <label>👤 Student Name</label>
                    <input
                      type="text"
                      value={formData.student_name}
                      onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>🎯 Credential Type</label>
                    <select
                      value={formData.credential_type}
                      onChange={(e) => setFormData({...formData, credential_type: e.target.value})}
                      required
                    >
                      <option value="">Select Credential Type</option>
                      <option value="Bachelor of Science">🔬 Bachelor of Science</option>
                      <option value="Bachelor of Arts">🎨 Bachelor of Arts</option>
                      <option value="Master of Science">🧪 Master of Science</option>
                      <option value="Master of Arts">🖼️ Master of Arts</option>
                      <option value="PhD">🎓 PhD</option>
                      <option value="Professional Certificate">📋 Professional Certificate</option>
                      <option value="Bootcamp Certificate">💻 Bootcamp Certificate</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>🏫 Institution</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData({...formData, institution: e.target.value})}
                      placeholder="University or institution name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>📅 Issue Date</label>
                    <input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? '⏳ Minting on Blockchain...' : '🚀 Mint Credential NFT'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'view' && (
              <div className="tab-content">
                <h3>📜 My Credentials</h3>
                <p className="tab-description">View and manage your blockchain-verified credentials</p>
                
                {loading && <div className="loading">🔄 Loading credentials...</div>}
                
                {userCredentials.length === 0 && !loading && (
                  <div className="empty-state">
                    <p>📭 No credentials found</p>
                    <p>Issue your first credential using the "Issue Credential" tab!</p>
                  </div>
                )}
                
                {userCredentials.length > 0 && (
                  <div className="credentials-grid">
                    {userCredentials.map((cred) => (
                      <div key={cred.id} className="credential-card">
                        <div className="credential-header">
                          <h4>🎫 Token ID: {cred.id}</h4>
                          <div className="credential-status">
                            {cred.is_revoked ? '❌ Revoked' : '✅ Active'}
                          </div>
                        </div>
                        <div className="credential-details">
                          <p><strong>👤 Student:</strong> {cred.metadata.student_name}</p>
                          <p><strong>🎯 Credential:</strong> {cred.metadata.credential_type}</p>
                          <p><strong>🏫 Institution:</strong> {cred.metadata.institution}</p>
                          <p><strong>📅 Issue Date:</strong> {cred.metadata.issue_date}</p>
                          <p><strong>🕒 Created:</strong> {formatDate(cred.metadata.created_at)}</p>
                          <p><strong>🔐 Hash:</strong> <code>{cred.metadata.verification_hash.slice(0, 8)}...</code></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="section-divider">
                  <h3>🌍 Public Registry</h3>
                  <p>All verified credentials on the platform</p>
                </div>
                
                {allCredentials.length > 0 && (
                  <div className="credentials-grid">
                    {allCredentials.slice(0, 6).map((cred) => (
                      <div key={cred.id} className="credential-card public">
                        <div className="credential-header">
                          <h4>🎫 Token ID: {cred.id}</h4>
                          <div className="credential-status">
                            {cred.is_revoked ? '❌ Revoked' : '✅ Verified'}
                          </div>
                        </div>
                        <div className="credential-details">
                          <p><strong>👤 Student:</strong> {cred.metadata.student_name}</p>
                          <p><strong>🎯 Credential:</strong> {cred.metadata.credential_type}</p>
                          <p><strong>🏫 Institution:</strong> {cred.metadata.institution}</p>
                          <p><strong>📅 Issue Date:</strong> {cred.metadata.issue_date}</p>
                          <p><strong>👑 Owner:</strong> <code>{formatPrincipal(cred.owner)}</code></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'verify' && (
              <div className="tab-content">
                <h3>🔍 Verify Credential</h3>
                <p className="tab-description">Instantly verify any credential using its Token ID</p>
                
                <form onSubmit={handleVerify} className="verify-form">
                  <div className="form-group">
                    <label>🎫 Token ID</label>
                    <input
                      type="number"
                      value={verifyTokenId}
                      onChange={(e) => setVerifyTokenId(e.target.value)}
                      placeholder="Enter token ID to verify (e.g., 123)"
                      min="0"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? '🔄 Verifying on Blockchain...' : '🔍 Verify Credential'}
                  </button>
                </form>

                {verificationResult && (
                  <div className={`verification-result ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
                    <div className="verification-header">
                      <h4>{verificationResult.isValid ? '✅ Valid Credential' : '❌ Invalid Credential'}</h4>
                      <div className="verification-score">
                        Trust Score: {verificationResult.isValid ? '100%' : '0%'}
                      </div>
                    </div>
                    
                    <div className="verification-details">
                      <h5>📋 Credential Details</h5>
                      <p><strong>👤 Student:</strong> {verificationResult.credential.metadata.student_name}</p>
                      <p><strong>🎯 Credential:</strong> {verificationResult.credential.metadata.credential_type}</p>
                      <p><strong>🏫 Institution:</strong> {verificationResult.credential.metadata.institution}</p>
                      <p><strong>📅 Issue Date:</strong> {verificationResult.credential.metadata.issue_date}</p>
                      <p><strong>👑 Owner:</strong> <code>{verificationResult.credential.owner.toString()}</code></p>
                      <p><strong>🏛️ Issuer:</strong> <code>{formatPrincipal(verificationResult.credential.issuer)}</code></p>
                    </div>

                    <div className="verification-checks">
                      <h5>🔐 Security Validation</h5>
                      <div className="check-item">
                        <span className={verificationResult.verification_details.hash_matches ? 'check-pass' : 'check-fail'}>
                          {verificationResult.verification_details.hash_matches ? '✅' : '❌'} Cryptographic Hash Valid
                        </span>
                      </div>
                      <div className="check-item">
                        <span className={verificationResult.verification_details.not_revoked ? 'check-pass' : 'check-fail'}>
                          {verificationResult.verification_details.not_revoked ? '✅' : '❌'} Not Revoked
                        </span>
                      </div>
                      <div className="check-item">
                        <span className={verificationResult.verification_details.issuer_authorized ? 'check-pass' : 'check-fail'}>
                          {verificationResult.verification_details.issuer_authorized ? '✅' : '❌'} Authorized Issuer
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="tab-content">
                <h3>📊 Platform Statistics</h3>
                <p className="tab-description">Real-time metrics from the TrustSeal ICP network</p>
                
                {loading && <div className="loading">🔄 Loading statistics...</div>}
                
                {statistics && (
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-number">{statistics.total_credentials}</div>
                      <div className="stat-label">Total Credentials</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">{statistics.active_credentials}</div>
                      <div className="stat-label">Active Credentials</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">{statistics.total_issuers}</div>
                      <div className="stat-label">Registered Issuers</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">{statistics.revoked_credentials}</div>
                      <div className="stat-label">Revoked Credentials</div>
                    </div>
                  </div>
                )}
                
                <div className="platform-info">
                  <h4>🏗️ Platform Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>🌐 Network:</strong> {process.env.NODE_ENV === 'development' ? 'Local Development' : 'IC Mainnet'}
                    </div>
                    <div className="info-item">
                      <strong>🏛️ Standard:</strong> DIP721 NFT Compliance
                    </div>
                    <div className="info-item">
                      <strong>🔒 Security:</strong> Internet Identity + Cryptographic Hashing
                    </div>
                    <div className="info-item">
                      <strong>⚡ Performance:</strong> Instant Verification
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="footer">
        <p>Built with ❤️ for WCHL 2025 • Powered by Internet Computer Protocol</p>
        <div className="social-links">
          <a href="https://github.com/hibakhalidm/TrustSeal-ICP" target="_blank" rel="noopener noreferrer">
            📁 GitHub Repository
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
