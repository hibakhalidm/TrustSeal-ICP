import { create } from 'zustand';
import { Principal } from '@dfinity/principal';

export interface UserProfile {
  principal: Principal;
  role: 'Admin' | 'Issuer' | 'Checker';
  name: string;
  organization: string;
  verified: boolean;
  registration_date: number;
  last_login?: number;
}

export interface Credential {
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

export interface SystemStats {
  totalCredentials: number;
  totalUsers: number;
  totalIssuers: number;
  totalCheckers: number;
  revokedCredentials: number;
}

interface AppState {
  // Authentication state
  isAuthenticated: boolean;
  identity: any | null;
  actor: any | null;
  userRole: 'Admin' | 'Issuer' | 'Checker' | null;
  
  // UI state
  loading: boolean;
  error: string | null;
  success: string | null;
  isInitializing: boolean;
  
  // Data state
  userProfile: UserProfile | null;
  systemStats: SystemStats | null;
  credentials: Credential[];
  users: UserProfile[];
  
  // Actions
  setAuthState: (auth: Partial<Pick<AppState, 'isAuthenticated' | 'identity' | 'actor' | 'userRole'>>) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setSystemStats: (stats: SystemStats | null) => void;
  setCredentials: (credentials: Credential[]) => void;
  setUsers: (users: UserProfile[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  setIsInitializing: (initializing: boolean) => void;
  clearError: () => void;
  clearSuccess: () => void;
  reset: () => void;
}

const initialState = {
  isAuthenticated: false,
  identity: null,
  actor: null,
  userRole: null,
  loading: false,
  error: null,
  success: null,
  isInitializing: true,
  userProfile: null,
  systemStats: null,
  credentials: [],
  users: [],
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,
  
  setAuthState: (auth) => set((state) => ({ ...state, ...auth })),
  
  setUserProfile: (profile) => set({ userProfile: profile }),
  
  setSystemStats: (stats) => set({ systemStats: stats }),
  
  setCredentials: (credentials) => set({ credentials }),
  
  setUsers: (users) => set({ users }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setSuccess: (success) => set({ success }),
  
  setIsInitializing: (isInitializing) => set({ isInitializing }),
  
  clearError: () => set({ error: null }),
  
  clearSuccess: () => set({ success: null }),
  
  reset: () => set(initialState),
}));

// Selectors for performance optimization
export const useAuthState = () => useAppStore((state) => ({
  isAuthenticated: state.isAuthenticated,
  identity: state.identity,
  actor: state.actor,
  userRole: state.userRole,
}));

export const useUIState = () => useAppStore((state) => ({
  loading: state.loading,
  error: state.error,
  success: state.success,
  isInitializing: state.isInitializing,
}));

export const useDataState = () => useAppStore((state) => ({
  userProfile: state.userProfile,
  systemStats: state.systemStats,
  credentials: state.credentials,
  users: state.users,
}));

export const useActions = () => useAppStore((state) => ({
  setAuthState: state.setAuthState,
  setUserProfile: state.setUserProfile,
  setSystemStats: state.setSystemStats,
  setCredentials: state.setCredentials,
  setUsers: state.setUsers,
  setLoading: state.setLoading,
  setError: state.setError,
  setSuccess: state.setSuccess,
  setIsInitializing: state.setIsInitializing,
  clearError: state.clearError,
  clearSuccess: state.clearSuccess,
  reset: state.reset,
}));