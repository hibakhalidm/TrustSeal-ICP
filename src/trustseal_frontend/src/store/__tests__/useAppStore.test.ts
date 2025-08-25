import { renderHook, act } from '@testing-library/react';
import { useAppStore, useAuthState, useUIState, useDataState, useActions } from '../useAppStore';
import { Principal } from '@dfinity/principal';

// Mock Principal for testing
const mockPrincipal = Principal.fromText('be2us-64aaa-aaaaa-qadbq-cai');

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAppStore());
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.identity).toBe(null);
      expect(result.current.actor).toBe(null);
      expect(result.current.userRole).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(null);
      expect(result.current.isInitializing).toBe(true);
      expect(result.current.userProfile).toBe(null);
      expect(result.current.systemStats).toBe(null);
      expect(result.current.credentials).toEqual([]);
      expect(result.current.users).toEqual([]);
    });
  });

  describe('Authentication Actions', () => {
    it('should update authentication state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setAuthState({
          isAuthenticated: true,
          identity: { id: 'test' },
          actor: { mint: jest.fn() },
          userRole: 'Admin',
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.identity).toEqual({ id: 'test' });
      expect(result.current.actor).toBeDefined();
      expect(result.current.userRole).toBe('Admin');
    });

    it('should partially update authentication state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setAuthState({ userRole: 'Issuer' });
      });

      expect(result.current.userRole).toBe('Issuer');
      expect(result.current.isAuthenticated).toBe(false); // Should remain unchanged
    });
  });

  describe('Data Actions', () => {
    it('should update user profile', () => {
      const { result } = renderHook(() => useAppStore());
      const mockProfile = {
        principal: mockPrincipal,
        role: 'Admin' as const,
        name: 'Test User',
        organization: 'Test Org',
        verified: true,
        registration_date: Date.now(),
      };

      act(() => {
        result.current.setUserProfile(mockProfile);
      });

      expect(result.current.userProfile).toEqual(mockProfile);
    });

    it('should update system stats', () => {
      const { result } = renderHook(() => useAppStore());
      const mockStats = {
        totalCredentials: 100,
        totalUsers: 50,
        totalIssuers: 10,
        totalCheckers: 40,
        revokedCredentials: 5,
      };

      act(() => {
        result.current.setSystemStats(mockStats);
      });

      expect(result.current.systemStats).toEqual(mockStats);
    });

    it('should update credentials', () => {
      const { result } = renderHook(() => useAppStore());
      const mockCredentials = [
        {
          id: 1,
          owner: mockPrincipal,
          issuer: mockPrincipal,
          metadata: {
            student_name: 'John Doe',
            credential_type: 'Degree',
            institution: 'University',
            issue_date: '2023-01-01',
            revoked: false,
          },
          issue_timestamp: Date.now(),
        },
      ];

      act(() => {
        result.current.setCredentials(mockCredentials);
      });

      expect(result.current.credentials).toEqual(mockCredentials);
    });

    it('should update users', () => {
      const { result } = renderHook(() => useAppStore());
      const mockUsers = [
        {
          principal: mockPrincipal,
          role: 'Admin' as const,
          name: 'Admin User',
          organization: 'Admin Org',
          verified: true,
          registration_date: Date.now(),
        },
      ];

      act(() => {
        result.current.setUsers(mockUsers);
      });

      expect(result.current.users).toEqual(mockUsers);
    });
  });

  describe('UI Actions', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);
    });

    it('should update error state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setError('Test error message');
      });

      expect(result.current.error).toBe('Test error message');
    });

    it('should update success state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setSuccess('Test success message');
      });

      expect(result.current.success).toBe('Test success message');
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setError('Test error');
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it('should clear success', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setSuccess('Test success');
        result.current.clearSuccess();
      });

      expect(result.current.success).toBe(null);
    });

    it('should update initializing state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setIsInitializing(false);
      });

      expect(result.current.isInitializing).toBe(false);
    });
  });

  describe('Reset Action', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useAppStore());
      
      // Set some state
      act(() => {
        result.current.setAuthState({ isAuthenticated: true, userRole: 'Admin' });
        result.current.setError('Test error');
        result.current.setSuccess('Test success');
        result.current.setLoading(true);
        result.current.setIsInitializing(false);
      });

      // Verify state was set
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userRole).toBe('Admin');
      expect(result.current.error).toBe('Test error');
      expect(result.current.success).toBe('Test success');
      expect(result.current.loading).toBe(true);
      expect(result.current.isInitializing).toBe(false);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify state was reset
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userRole).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.isInitializing).toBe(true);
    });
  });
});

describe('Store Selectors', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  describe('useAuthState', () => {
    it('should return only authentication state', () => {
      const { result } = renderHook(() => useAuthState());
      
      expect(result.current).toEqual({
        isAuthenticated: false,
        identity: null,
        actor: null,
        userRole: null,
      });
    });
  });

  describe('useUIState', () => {
    it('should return only UI state', () => {
      const { result } = renderHook(() => useUIState());
      
      expect(result.current).toEqual({
        loading: false,
        error: null,
        success: null,
        isInitializing: true,
      });
    });
  });

  describe('useDataState', () => {
    it('should return only data state', () => {
      const { result } = renderHook(() => useDataState());
      
      expect(result.current).toEqual({
        userProfile: null,
        systemStats: null,
        credentials: [],
        users: [],
      });
    });
  });

  describe('useActions', () => {
    it('should return all actions', () => {
      const { result } = renderHook(() => useActions());
      
      expect(result.current.setAuthState).toBeDefined();
      expect(result.current.setUserProfile).toBeDefined();
      expect(result.current.setSystemStats).toBeDefined();
      expect(result.current.setCredentials).toBeDefined();
      expect(result.current.setUsers).toBeDefined();
      expect(result.current.setLoading).toBeDefined();
      expect(result.current.setError).toBeDefined();
      expect(result.current.setSuccess).toBeDefined();
      expect(result.current.setIsInitializing).toBeDefined();
      expect(result.current.clearError).toBeDefined();
      expect(result.current.clearSuccess).toBeDefined();
      expect(result.current.reset).toBeDefined();
    });
  });
});