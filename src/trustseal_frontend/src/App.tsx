import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

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
  mint: (student_name: string, credential_type: string, institution: string, issue_date: string) => Promise<{ ok?: number; err?: string }>;
  getTokensOfUser: (user: Principal) => Promise<number[]>;
  getCredential: (tokenId: number) => Promise<Credential | undefined>;
  getAllCredentials: () => Promise<Credential[]>;
  verifyCredential: (tokenId: number) => Promise<{ isValid: boolean; credential: Credential } | undefined>;
}

const App: React.FC = () => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<any>(null);
  const [actor, setActor] = useState<TrustSealActor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'mint' | 'view' | 'verify'>('mint');
  
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
      // For now, we'll create a mock actor for demo purposes
      const mockActor: TrustSealActor = {
        mint: async (student_name, credential_type, institution, issue_date) => {
          // Mock implementation
          return { ok: Math.floor(Math.random() * 1000) };
        },
        getTokensOfUser: async (user) => {
          // Mock implementation
          return [1, 2, 3];
        },
        getCredential: async (tokenId) => {
          // Mock implementation
          return {
            id: tokenId,
            owner: identity.getPrincipal(),
            metadata: {
              student_name: 'John Doe',
              credential_type: 'Bachelor of Science',
              institution: 'MIT',
              issue_date: '2023-06-15'
            }
          };
        },
        getAllCredentials: async () => {
          // Mock implementation
          return [
            {
              id: 1,
              owner: identity.getPrincipal(),
              metadata: {
                student_name: 'John Doe',
                credential_type: 'Bachelor of Science',
                institution: 'MIT',
                issue_date: '2023-06-15'
              }
            },
            {
              id: 2,
              owner: identity.getPrincipal(),
              metadata: {
                student_name: 'Jane Smith',
                credential_type: 'Master of Arts',
                institution: 'Harvard',
                issue_date: '2023-05-20'
              }
            }
          ];
        },
        verifyCredential: async (tokenId) => {
          // Mock implementation
          const credential = await mockActor.getCredential(tokenId);
          return credential ? { isValid: true, credential } : undefined;
        }
      };

      setActor(mockActor);
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
    setUserCredentials([]);
    setAllCredentials([]);
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
              </div>
              <button className="btn" onClick={logout}>Logout</button>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button 
                className={`btn ${activeTab === 'mint' ? '' : 'btn-secondary'}`}
                onClick={() => setActiveTab('mint')}
                style={{ background: activeTab === 'mint' ? '#667eea' : '#ccc' }}
              >
                Mint Credential
              </button>
              <button 
                className={`btn ${activeTab === 'view' ? '' : 'btn-secondary'}`}
                onClick={() => setActiveTab('view')}
                style={{ background: activeTab === 'view' ? '#667eea' : '#ccc' }}
              >
                View Credentials
              </button>
              <button 
                className={`btn ${activeTab === 'verify' ? '' : 'btn-secondary'}`}
                onClick={() => setActiveTab('verify')}
                style={{ background: activeTab === 'verify' ? '#667eea' : '#ccc' }}
              >
                Verify Credential
              </button>
            </div>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            {activeTab === 'mint' && (
              <div>
                <h3>Issue New Credential</h3>
                <form onSubmit={handleMint}>
                  <div className="form-group">
                    <label>Student Name</label>
                    <input
                      type="text"
                      value={formData.student_name}
                      onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Credential Type</label>
                    <select
                      value={formData.credential_type}
                      onChange={(e) => setFormData({...formData, credential_type: e.target.value})}
                      required
                    >
                      <option value="">Select Credential Type</option>
                      <option value="Bachelor of Science">Bachelor of Science</option>
                      <option value="Bachelor of Arts">Bachelor of Arts</option>
                      <option value="Master of Science">Master of Science</option>
                      <option value="Master of Arts">Master of Arts</option>
                      <option value="PhD">PhD</option>
                      <option value="Certificate">Certificate</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Institution</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData({...formData, institution: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Issue Date</label>
                    <input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                      required
                    />
                  </div>
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Minting...' : 'Mint Credential NFT'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'view' && (
              <div>
                <h3>My Credentials</h3>
                {loading && <div className="loading">Loading credentials...</div>}
                {userCredentials.length === 0 && !loading && (
                  <p>No credentials found. Mint your first credential!</p>
                )}
                {userCredentials.map((cred) => (
                  <div key={cred.id} className="credential-item">
                    <h4>Token ID: {cred.id}</h4>
                    <p><strong>Student:</strong> {cred.metadata.student_name}</p>
                    <p><strong>Credential:</strong> {cred.metadata.credential_type}</p>
                    <p><strong>Institution:</strong> {cred.metadata.institution}</p>
                    <p><strong>Issue Date:</strong> {cred.metadata.issue_date}</p>
                  </div>
                ))}

                <h3>All Credentials (Public Registry)</h3>
                {allCredentials.map((cred) => (
                  <div key={cred.id} className="credential-item">
                    <h4>Token ID: {cred.id}</h4>
                    <p><strong>Student:</strong> {cred.metadata.student_name}</p>
                    <p><strong>Credential:</strong> {cred.metadata.credential_type}</p>
                    <p><strong>Institution:</strong> {cred.metadata.institution}</p>
                    <p><strong>Issue Date:</strong> {cred.metadata.issue_date}</p>
                    <p><strong>Owner:</strong> {cred.owner.toString().slice(0, 20)}...</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'verify' && (
              <div>
                <h3>Verify Credential</h3>
                <form onSubmit={handleVerify}>
                  <div className="form-group">
                    <label>Token ID</label>
                    <input
                      type="number"
                      value={verifyTokenId}
                      onChange={(e) => setVerifyTokenId(e.target.value)}
                      placeholder="Enter token ID to verify"
                      required
                    />
                  </div>
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify Credential'}
                  </button>
                </form>

                {verificationResult && (
                  <div className="credential-item" style={{ marginTop: '20px' }}>
                    <h4>✅ Verification Result</h4>
                    <p><strong>Status:</strong> {verificationResult.isValid ? 'Valid' : 'Invalid'}</p>
                    <p><strong>Student:</strong> {verificationResult.credential.metadata.student_name}</p>
                    <p><strong>Credential:</strong> {verificationResult.credential.metadata.credential_type}</p>
                    <p><strong>Institution:</strong> {verificationResult.credential.metadata.institution}</p>
                    <p><strong>Issue Date:</strong> {verificationResult.credential.metadata.issue_date}</p>
                    <p><strong>Owner:</strong> {verificationResult.credential.owner.toString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
