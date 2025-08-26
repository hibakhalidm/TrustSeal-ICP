import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { RequireAdmin, RequireIssuer, RequireChecker, RequireRole } from '../components/auth/RequireRole';
import { RoleVerificationService } from '../services/RoleVerificationService';

// Mock the DFX libraries
jest.mock('@dfinity/auth-client', () => ({
  AuthClient: {
    create: jest.fn().mockResolvedValue({
      isAuthenticated: jest.fn().mockResolvedValue(false),
      login: jest.fn(),
      logout: jest.fn(),
      getIdentity: jest.fn(),
    }),
  },
}));

jest.mock('@dfinity/agent', () => ({
  Actor: {
    createActor: jest.fn(),
  },
  HttpAgent: jest.fn(),
}));

jest.mock('@dfinity/principal', () => ({
  Principal: {
    fromText: jest.fn((text) => ({ toString: () => text })),
  },
}));

// Test component that uses auth context
const TestComponent = () => {
  const { isAuthenticated, userRole, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="user-role">{userRole || 'No Role'}</div>
      <button onClick={login} data-testid="login-btn">Login</button>
      <button onClick={logout} data-testid="logout-btn">Logout</button>
    </div>
  );
};

// Test component for role-based access
const AdminOnlyComponent = () => (
  <RequireAdmin>
    <div data-testid="admin-content">Admin Content</div>
  </RequireAdmin>
);

const IssuerOnlyComponent = () => (
  <RequireIssuer>
    <div data-testid="issuer-content">Issuer Content</div>
  </RequireIssuer>
);

const CheckerOnlyComponent = () => (
  <RequireChecker>
    <div data-testid="checker-content">Checker Content</div>
  </RequireChecker>
);

const RoleSpecificComponent = ({ role }: { role: 'Admin' | 'Issuer' | 'Checker' }) => (
  <RequireRole role={role}>
    <div data-testid={`${role.toLowerCase()}-content`}>{role} Content</div>
  </RequireRole>
);

describe('Authentication Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should provide authentication context', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toBeInTheDocument();
    expect(screen.getByTestId('user-role')).toBeInTheDocument();
    expect(screen.getByTestId('login-btn')).toBeInTheDocument();
    expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
  });

  test('should show initial state correctly', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-role')).toHaveTextContent('No Role');
  });

  test('should handle login flow', async () => {
    const mockAuthClient = {
      isAuthenticated: jest.fn().mockResolvedValue(true),
      login: jest.fn(),
      logout: jest.fn(),
      getIdentity: jest.fn().mockReturnValue({
        getPrincipal: jest.fn().mockReturnValue({ toString: () => 'test-principal' }),
      }),
    };

    jest.requireMock('@dfinity/auth-client').AuthClient.create.mockResolvedValue(mockAuthClient);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
  });
});

describe('Role-Based Access Control', () => {
  const mockActor = {
    getUserRole: jest.fn(),
    getUserProfile: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const mockIdentity = {
    getPrincipal: jest.fn().mockReturnValue({ toString: () => 'test-principal' }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should show loading state while determining role', () => {
    render(
      <AuthProvider>
        <RequireRole role="Admin">
          <div data-testid="admin-content">Admin Content</div>
        </RequireRole>
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Determining your role and permissions...')).toBeInTheDocument();
  });

  test('should show authentication required for unauthenticated users', async () => {
    const mockAuthClient = {
      isAuthenticated: jest.fn().mockResolvedValue(false),
      login: jest.fn(),
      logout: jest.fn(),
      getIdentity: jest.fn(),
    };

    jest.requireMock('@dfinity/auth-client').AuthClient.create.mockResolvedValue(mockAuthClient);

    render(
      <AuthProvider>
        <RequireRole role="Admin">
          <div data-testid="admin-content">Admin Content</div>
        </RequireRole>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please log in to access this section.')).toBeInTheDocument();
    });
  });

  test('should show access denied for wrong role', async () => {
    const mockAuthClient = {
      isAuthenticated: jest.fn().mockResolvedValue(true),
      login: jest.fn(),
      logout: jest.fn(),
      getIdentity: jest.fn().mockReturnValue(mockIdentity),
    };

    jest.requireMock('@dfinity/auth-client').AuthClient.create.mockResolvedValue(mockAuthClient);

    // Mock the actor setup to return a Checker role
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ Checker: null }),
      } as Response)
    );

    render(
      <AuthProvider>
        <RequireRole role="Admin">
          <div data-testid="admin-content">Admin Content</div>
        </RequireRole>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/You do not have permission to access this section/)).toBeInTheDocument();
      expect(screen.getByText(/Required role: Admin/)).toBeInTheDocument();
    });
  });

  test('should allow access for correct role', async () => {
    const mockAuthClient = {
      isAuthenticated: jest.fn().mockResolvedValue(true),
      login: jest.fn(),
      logout: jest.fn(),
      getIdentity: jest.fn().mockReturnValue(mockIdentity),
    };

    jest.requireMock('@dfinity/auth-client').AuthClient.create.mockResolvedValue(mockAuthClient);

    render(
      <AuthProvider>
        <RequireRole role="Admin">
          <div data-testid="admin-content">Admin Content</div>
        </RequireRole>
      </AuthProvider>
    );

    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
  });
});

describe('Role Verification Service', () => {
  let roleService: RoleVerificationService;
  let mockActor: any;
  let mockPrincipal: any;

  beforeEach(() => {
    mockActor = {
      getUserRole: jest.fn(),
      getUserProfile: jest.fn(),
    };

    mockPrincipal = {
      toString: () => 'test-principal',
    };

    roleService = new RoleVerificationService(mockActor, mockPrincipal);
  });

  test('should return admin permissions for admin role', async () => {
    mockActor.getUserRole.mockResolvedValue({ Admin: null });

    const permissions = await roleService.getRolePermissions();

    expect(permissions.canManageUsers).toBe(true);
    expect(permissions.canIssueCredentials).toBe(true);
    expect(permissions.canRevokeCredentials).toBe(true);
    expect(permissions.canVerifyCredentials).toBe(true);
    expect(permissions.canViewSystemStats).toBe(true);
    expect(permissions.canViewAllCredentials).toBe(true);
  });

  test('should return issuer permissions for issuer role', async () => {
    mockActor.getUserRole.mockResolvedValue({ Issuer: null });

    const permissions = await roleService.getRolePermissions();

    expect(permissions.canManageUsers).toBe(false);
    expect(permissions.canIssueCredentials).toBe(true);
    expect(permissions.canRevokeCredentials).toBe(true);
    expect(permissions.canVerifyCredentials).toBe(true);
    expect(permissions.canViewSystemStats).toBe(false);
    expect(permissions.canViewAllCredentials).toBe(false);
  });

  test('should return checker permissions for checker role', async () => {
    mockActor.getUserRole.mockResolvedValue({ Checker: null });

    const permissions = await roleService.getRolePermissions();

    expect(permissions.canManageUsers).toBe(false);
    expect(permissions.canIssueCredentials).toBe(false);
    expect(permissions.canRevokeCredentials).toBe(false);
    expect(permissions.canVerifyCredentials).toBe(true);
    expect(permissions.canViewSystemStats).toBe(false);
    expect(permissions.canViewAllCredentials).toBe(false);
  });

  test('should return default permissions for unknown role', async () => {
    mockActor.getUserRole.mockResolvedValue(null);

    const permissions = await roleService.getRolePermissions();

    expect(permissions.canManageUsers).toBe(false);
    expect(permissions.canIssueCredentials).toBe(false);
    expect(permissions.canRevokeCredentials).toBe(false);
    expect(permissions.canVerifyCredentials).toBe(true);
    expect(permissions.canViewSystemStats).toBe(false);
    expect(permissions.canViewAllCredentials).toBe(false);
  });

  test('should handle errors gracefully', async () => {
    mockActor.getUserRole.mockRejectedValue(new Error('Network error'));

    const permissions = await roleService.getRolePermissions();

    expect(permissions.canManageUsers).toBe(false);
    expect(permissions.canIssueCredentials).toBe(false);
    expect(permissions.canRevokeCredentials).toBe(false);
    expect(permissions.canVerifyCredentials).toBe(true);
    expect(permissions.canViewSystemStats).toBe(false);
    expect(permissions.canViewAllCredentials).toBe(false);
  });

  test('should check specific permissions correctly', async () => {
    mockActor.getUserRole.mockResolvedValue({ Admin: null });

    const canManageUsers = await roleService.hasPermission('canManageUsers');
    const canIssueCredentials = await roleService.hasPermission('canIssueCredentials');

    expect(canManageUsers).toBe(true);
    expect(canIssueCredentials).toBe(true);
  });

  test('should validate resource access correctly', async () => {
    mockActor.getUserRole.mockResolvedValue({ Issuer: null });

    const canAccessUserManagement = await roleService.validateResourceAccess('user_management');
    const canAccessCredentialIssuance = await roleService.validateResourceAccess('credential_issuance');

    expect(canAccessUserManagement).toBe(false);
    expect(canAccessCredentialIssuance).toBe(true);
  });

  test('should get dashboard configuration correctly', async () => {
    mockActor.getUserRole.mockResolvedValue({ Admin: null });

    const config = await roleService.getDashboardConfig();

    expect(config.showUserManagement).toBe(true);
    expect(config.showCredentialIssuance).toBe(true);
    expect(config.showCredentialManagement).toBe(true);
    expect(config.showVerificationTools).toBe(true);
    expect(config.showSystemStats).toBe(true);
  });
});

describe('Integration Tests', () => {
  test('should enforce role-based access across components', async () => {
    const mockAuthClient = {
      isAuthenticated: jest.fn().mockResolvedValue(true),
      login: jest.fn(),
      logout: jest.fn(),
      getIdentity: jest.fn().mockReturnValue({
        getPrincipal: jest.fn().mockReturnValue({ toString: () => 'checker-principal' }),
      }),
    };

    jest.requireMock('@dfinity/auth-client').AuthClient.create.mockResolvedValue(mockAuthClient);

    render(
      <AuthProvider>
        <div>
          <RequireAdmin>
            <div data-testid="admin-content">Admin Content</div>
          </RequireAdmin>
          <RequireIssuer>
            <div data-testid="issuer-content">Issuer Content</div>
          </RequireIssuer>
          <RequireChecker>
            <div data-testid="checker-content">Checker Content</div>
          </RequireChecker>
        </div>
      </AuthProvider>
    );

    // Wait for authentication to complete
    await waitFor(() => {
      // Checker should only see checker content
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('issuer-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('checker-content')).toBeInTheDocument();
    });
  });
});