/**
 * TrustSeal Hedera Frontend Application
 * 
 * Main application component that handles authentication, user role management,
 * and renders role-specific dashboards for Admin, Issuer, and Checker users.
 * 
 * @author TrustSeal Team
 * @version 1.0.0 - WCHL 2025 Submission (Hedera Migration)
 */

import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import IssuerDashboard from './components/IssuerDashboard';
import CheckerDashboard from './components/CheckerDashboard';
import './dashboard.css';

// Types for Hedera-based system
interface Credential {
  tokenId: string;
  serialNumber: string;
  owner: string;
  issuer: string;
  metadata: {
    studentName: string;
    credentialType: string;
    institution: string;
    issueDate: string;
    issuer: string;
    issuedAt: number;
    revoked: boolean;
    revocationReason?: string;
  };
  issueTimestamp: number;
}

interface UserProfile {
  accountId: string;
  role: 'Admin' | 'Issuer' | 'Checker';
  name: string;
  organization: string;
  verified: boolean;
  registrationDate: number;
  lastLogin?: number;
}

interface HederaService {
  // User management
  registerUser: (accountId: string, role: string, name: string, organization: string) => Promise<{ success: boolean; message: string }>;
  getUserProfile: (accountId: string) => UserProfile | null;
  verifyUser: (accountId: string) => Promise<{ success: boolean; message: string }>;
  updateLastLogin: (accountId: string) => { success: boolean; message: string };
  getAllUsers: () => UserProfile[];
  getSystemStats: () => any;
  
  // Credential management
  mintCredential: (studentAccountId: string, studentName: string, credentialType: string, institution: string, issueDate: string, issuerAccountId: string) => Promise<{ success: boolean; message: string; tokenId?: string; serialNumber?: string }>;
  revokeCredential: (serialNumber: string, reason: string, revokerAccountId: string) => Promise<{ success: boolean; message: string }>;
  getCredentialsByIssuer: (issuerAccountId: string) => Credential[];
  getCredentialsByOwner: (ownerAccountId: string) => Credential[];
  getAllCredentials: () => Credential[];
  verifyCredential: (tokenId: string, serialNumber: string) => Promise<{ success: boolean; verification?: any; message?: string }>;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAccountId, setCurrentAccountId] = useState<string>('');
  const [hederaService, setHederaService] = useState<HederaService | null>(null);
  const [userRole, setUserRole] = useState<'Admin' | 'Issuer' | 'Checker' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initHederaService();
  }, []);

  const initHederaService = async () => {
    try {
      // Create a mock Hedera service for demo purposes
      // In production, this would connect to the actual Hedera backend
      const mockHederaService: HederaService = {
        // User management functions
        registerUser: async (accountId, role, name, organization) => {
          return { success: true, message: 'User registered successfully' };
        },
        
        getUserProfile: (accountId) => {
          // Demo profiles based on account ID
          if (accountId === '0.0.1001') {
            return {
              accountId: '0.0.1001',
              role: 'Admin',
              name: 'System Administrator',
              organization: 'TrustSeal Hedera',
              verified: true,
              registrationDate: Date.now() - 86400000,
              lastLogin: Date.now() - 3600000
            };
          } else if (accountId === '0.0.1002') {
            return {
              accountId: '0.0.1002',
              role: 'Issuer',
              name: 'MIT',
              organization: 'Massachusetts Institute of Technology',
              verified: true,
              registrationDate: Date.now() - 86400000,
              lastLogin: Date.now() - 3600000
            };
          } else if (accountId === '0.0.1005') {
            return {
              accountId: '0.0.1005',
              role: 'Checker',
              name: 'Google',
              organization: 'Google LLC',
              verified: true,
              registrationDate: Date.now() - 86400000,
              lastLogin: Date.now() - 3600000
            };
          }
          return null;
        },
        
        verifyUser: async (accountId) => ({ success: true, message: 'User verified successfully' }),
        updateLastLogin: (accountId) => ({ success: true, message: 'Login updated' }),
        getAllUsers: () => [
          {
            accountId: '0.0.1001',
            role: 'Admin',
            name: 'System Administrator',
            organization: 'TrustSeal Hedera',
            verified: true,
            registrationDate: Date.now() - 86400000,
            lastLogin: Date.now() - 3600000
          },
          {
            accountId: '0.0.1002',
            role: 'Issuer',
            name: 'MIT',
            organization: 'Massachusetts Institute of Technology',
            verified: true,
            registrationDate: Date.now() - 86400000,
            lastLogin: Date.now() - 3600000
          },
          {
            accountId: '0.0.1005',
            role: 'Checker',
            name: 'Google',
            organization: 'Google LLC',
            verified: true,
            registrationDate: Date.now() - 86400000,
            lastLogin: Date.now() - 3600000
          }
        ],
        
        getSystemStats: () => ({
          totalCredentials: 48,
          totalUsers: 15,
          totalIssuers: 6,
          totalCheckers: 8,
          revokedCredentials: 3,
          verifications: 127
        }),

        // Credential management functions
        mintCredential: async (studentAccountId, studentName, credentialType, institution, issueDate, issuerAccountId) => {
          const serialNumber = Math.floor(Math.random() * 10000).toString();
          return { 
            success: true, 
            message: 'Credential minted successfully',
            tokenId: process.env.REACT_APP_CREDENTIAL_TOKEN_ID || '0.0.5001',
            serialNumber: serialNumber
          };
        },
        
        revokeCredential: async (serialNumber, reason, revokerAccountId) => ({ 
          success: true, 
          message: 'Credential revoked successfully' 
        }),
        
        getCredentialsByIssuer: (issuerAccountId) => [
          {
            tokenId: '0.0.5001',
            serialNumber: '1',
            owner: '0.0.2001',
            issuer: issuerAccountId,
            metadata: {
              studentName: 'John Doe',
              credentialType: 'Bachelor of Computer Science',
              institution: 'MIT',
              issueDate: '2024-05-15',
              issuer: issuerAccountId,
              issuedAt: Date.now() - 86400000,
              revoked: false
            },
            issueTimestamp: Date.now() - 86400000
          }
        ],
        
        getCredentialsByOwner: (ownerAccountId) => [],
        
        getAllCredentials: () => [
          {
            tokenId: '0.0.5001',
            serialNumber: '1',
            owner: '0.0.2001',
            issuer: '0.0.1002',
            metadata: {
              studentName: 'John Doe',
              credentialType: 'Bachelor of Computer Science',
              institution: 'MIT',
              issueDate: '2024-05-15',
              issuer: '0.0.1002',
              issuedAt: Date.now() - 86400000,
              revoked: false
            },
            issueTimestamp: Date.now() - 86400000
          },
          {
            tokenId: '0.0.5001',
            serialNumber: '2',
            owner: '0.0.2002',
            issuer: '0.0.1003',
            metadata: {
              studentName: 'Jane Smith',
              credentialType: 'Master of Business Administration',
              institution: 'Stanford University',
              issueDate: '2024-06-20',
              issuer: '0.0.1003',
              issuedAt: Date.now() - 172800000,
              revoked: false
            },
            issueTimestamp: Date.now() - 172800000
          }
        ],
        
        verifyCredential: async (tokenId, serialNumber) => {
          const credentials = mockHederaService.getAllCredentials();
          const credential = credentials.find(c => c.tokenId === tokenId && c.serialNumber === serialNumber);
          
          if (credential) {
            return {
              success: true,
              verification: {
                isValid: !credential.metadata.revoked,
                credential: credential,
                verificationTimestamp: Date.now(),
                onChainOwner: credential.owner,
                metadata: credential.metadata
              }
            };
          }
          return { success: false, message: 'Credential not found' };
        }
      };

      setHederaService(mockHederaService);
      
    } catch (err) {
      setError('Failed to initialize Hedera service');
      console.error(err);
    }
    setIsInitializing(false);
  };

  const connectWallet = async () => {
    setLoading(true);
    try {
      // Simulate wallet connection - in production this would integrate with Hedera wallets
      // like HashPack, Blade, or other Hedera-compatible wallets
      const demoAccountId = '0.0.1001'; // Demo admin account
      
      setCurrentAccountId(demoAccountId);
      setIsAuthenticated(true);
      
      // Get user profile and role
      if (hederaService) {
        const profile = hederaService.getUserProfile(demoAccountId);
        if (profile) {
          setUserRole(profile.role);
          hederaService.updateLastLogin(demoAccountId);
        }
      }
      
      setSuccess('Successfully connected to Hedera!');
      
    } catch (err) {
      setError('Connection error: ' + String(err));
    }
    setLoading(false);
  };

  const disconnect = async () => {
    setIsAuthenticated(false);
    setCurrentAccountId('');
    setUserRole(null);
    setSuccess('Successfully disconnected!');
  };

  // Demo function to switch between different user roles
  const switchDemoRole = (role: 'Admin' | 'Issuer' | 'Checker') => {
    let accountId = '';
    switch (role) {
      case 'Admin':
        accountId = '0.0.1001';
        break;
      case 'Issuer':
        accountId = '0.0.1002';
        break;
      case 'Checker':
        accountId = '0.0.1005';
        break;
    }
    
    setCurrentAccountId(accountId);
    setUserRole(role);
    setSuccess(`Switched to ${role} role!`);
  };

  if (isInitializing) {
    return (
      <div className="container">
        <div className="header">
          <h1>🔐 TrustSeal Hedera</h1>
          <p>Initializing Hedera connection...</p>
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
            Connected as: <span className={`role-badge ${userRole.toLowerCase()}`}>{userRole}</span>
          </p>
        )}
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {!isAuthenticated ? (
        <div className="card">
          <h2>Connect to Hedera Network</h2>
          <p>Connect your Hedera wallet to start using TrustSeal</p>
          <button 
            className="btn" 
            onClick={connectWallet} 
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <h3>Demo Mode</h3>
            <p>For demonstration purposes, you can connect as different user types:</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button className="btn-secondary" onClick={() => { connectWallet(); setTimeout(() => switchDemoRole('Admin'), 500); }}>
                Demo Admin
              </button>
              <button className="btn-secondary" onClick={() => { connectWallet(); setTimeout(() => switchDemoRole('Issuer'), 500); }}>
                Demo Issuer
              </button>
              <button className="btn-secondary" onClick={() => { connectWallet(); setTimeout(() => switchDemoRole('Checker'), 500); }}>
                Demo Checker
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p><strong>Account ID:</strong> {currentAccountId}</p>
                <p><strong>Role:</strong> <span className={`role-badge ${userRole?.toLowerCase()}`}>{userRole}</span></p>
                <p><strong>Network:</strong> {process.env.REACT_APP_HEDERA_NETWORK || 'testnet'}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {/* Demo role switcher */}
                <select onChange={(e) => switchDemoRole(e.target.value as any)} value={userRole || ''}>
                  <option value="Admin">Admin</option>
                  <option value="Issuer">Issuer</option>
                  <option value="Checker">Checker</option>
                </select>
                <button className="btn" onClick={disconnect}>Disconnect</button>
              </div>
            </div>
          </div>

          {/* Role-based dashboard rendering */}
          {userRole === 'Admin' && <AdminDashboard hederaService={hederaService} currentAccountId={currentAccountId} />}
          {userRole === 'Issuer' && <IssuerDashboard hederaService={hederaService} currentAccountId={currentAccountId} />}
          {userRole === 'Checker' && <CheckerDashboard hederaService={hederaService} currentAccountId={currentAccountId} />}
          
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