/**
 * TrustSeal ICP - Test Setup
 * Configures testing environment for React components and ICP integration
 */

import '@testing-library/jest-dom';

// Mock Internet Computer agent for testing
const mockAgent = {
  fetchRootKey: jest.fn().mockResolvedValue(undefined),
  call: jest.fn(),
  query: jest.fn(),
  readState: jest.fn(),
};

// Mock AuthClient for testing
const mockAuthClient = {
  create: jest.fn().mockResolvedValue({
    isAuthenticated: jest.fn().mockResolvedValue(false),
    login: jest.fn(),
    logout: jest.fn(),
    getIdentity: jest.fn().mockReturnValue({
      getPrincipal: jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue('test-principal-id')
      })
    })
  }),
  isAuthenticated: jest.fn().mockResolvedValue(false),
  login: jest.fn(),
  logout: jest.fn(),
  getIdentity: jest.fn()
};

// Mock Actor for testing
const mockActor = {
  createActor: jest.fn().mockReturnValue({
    mint: jest.fn().mockResolvedValue({ ok: BigInt(123) }),
    getTokensOfUser: jest.fn().mockResolvedValue([BigInt(1), BigInt(2)]),
    getCredential: jest.fn().mockResolvedValue([{
      id: BigInt(1),
      owner: 'test-principal',
      issuer: 'test-issuer',
      metadata: {
        student_name: 'Test Student',
        credential_type: 'Test Degree',
        institution: 'Test University',
        issue_date: '2023-01-01',
        created_at: BigInt(Date.now() * 1000000),
        verification_hash: 'test-hash'
      },
      is_revoked: false
    }]),
    getAllCredentials: jest.fn().mockResolvedValue([]),
    verifyCredential: jest.fn().mockResolvedValue([{
      isValid: true,
      credential: {
        id: BigInt(1),
        owner: 'test-principal',
        issuer: 'test-issuer',
        metadata: {
          student_name: 'Test Student',
          credential_type: 'Test Degree',
          institution: 'Test University',
          issue_date: '2023-01-01',
          created_at: BigInt(Date.now() * 1000000),
          verification_hash: 'test-hash'
        },
        is_revoked: false
      },
      verification_details: {
        hash_matches: true,
        not_revoked: true,
        issuer_authorized: true
      }
    }]),
    getStatistics: jest.fn().mockResolvedValue({
      total_credentials: BigInt(10),
      active_credentials: BigInt(8),
      total_issuers: BigInt(3),
      revoked_credentials: BigInt(2)
    }),
    healthCheck: jest.fn().mockResolvedValue({
      status: 'healthy',
      timestamp: BigInt(Date.now() * 1000000)
    })
  })
};

// Set up global mocks
global.mockAgent = mockAgent;
global.mockAuthClient = mockAuthClient;
global.mockActor = mockActor;

// Mock environment variables
process.env.REACT_APP_BACKEND_CANISTER_ID = 'test-backend-canister';
process.env.REACT_APP_FRONTEND_CANISTER_ID = 'test-frontend-canister';
process.env.REACT_APP_INTERNET_IDENTITY_URL = 'https://identity.ic0.app';

// Mock fetch for API calls
global.fetch = jest.fn();

// Console warnings/errors in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Export test utilities
export const testUtils = {
  mockAgent,
  mockAuthClient,
  mockActor,
  
  // Helper to create mock credentials
  createMockCredential: (overrides = {}) => ({
    id: 1,
    owner: 'test-principal',
    issuer: 'test-issuer',
    metadata: {
      student_name: 'Test Student',
      credential_type: 'Bachelor of Science',
      institution: 'Test University',
      issue_date: '2023-01-01',
      created_at: Date.now(),
      verification_hash: 'test-hash-123'
    },
    is_revoked: false,
    ...overrides
  }),

  // Helper to create mock verification results
  createMockVerification: (isValid = true) => ({
    isValid,
    credential: testUtils.createMockCredential(),
    verification_details: {
      hash_matches: isValid,
      not_revoked: isValid,
      issuer_authorized: isValid
    }
  })
};