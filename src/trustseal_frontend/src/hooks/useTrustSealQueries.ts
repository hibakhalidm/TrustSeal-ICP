import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Principal } from '@dfinity/principal';
import { useAppStore } from '../store/useAppStore';

// Query keys for consistent caching
export const queryKeys = {
  userProfile: (principal: string) => ['userProfile', principal],
  systemStats: () => ['systemStats'],
  credentials: () => ['credentials'],
  credentialsByIssuer: (issuer: string) => ['credentials', 'issuer', issuer],
  tokensOfUser: (user: string) => ['tokens', 'user', user],
  users: () => ['users'],
  allCredentials: () => ['credentials', 'all'],
} as const;

// Custom hook for actor access
const useActor = () => {
  const { actor } = useAppStore();
  if (!actor) {
    throw new Error('Actor not initialized. Please authenticate first.');
  }
  return actor;
};

// User profile queries
export const useUserProfile = (principal: Principal) => {
  const actor = useActor();
  
  return useQuery({
    queryKey: queryKeys.userProfile(principal.toString()),
    queryFn: async () => {
      const result = await actor.getUserProfile(principal);
      return result;
    },
    enabled: !!principal && !!actor,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserRole = (principal: Principal) => {
  const actor = useActor();
  
  return useQuery({
    queryKey: ['userRole', principal.toString()],
    queryFn: async () => {
      const result = await actor.getUserRole(principal);
      return result;
    },
    enabled: !!principal && !!actor,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// System statistics queries
export const useSystemStats = () => {
  const actor = useActor();
  const { userRole } = useAppStore();
  
  return useQuery({
    queryKey: queryKeys.systemStats(),
    queryFn: async () => {
      const result = await actor.getSystemStats();
      if ('ok' in result) {
        return result.ok;
      }
      throw new Error(result.err || 'Failed to fetch system statistics');
    },
    enabled: !!actor && userRole === 'Admin',
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// Credential queries
export const useAllCredentials = (params: { offset: number; limit: number }) => {
  const actor = useActor();
  
  return useQuery({
    queryKey: [...queryKeys.allCredentials(), params],
    queryFn: async () => {
      const result = await actor.getAllCredentials(params);
      return result;
    },
    enabled: !!actor,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useCredentialsByIssuer = (
  issuer: Principal,
  params: { offset: number; limit: number }
) => {
  const actor = useActor();
  
  return useQuery({
    queryKey: [...queryKeys.credentialsByIssuer(issuer.toString()), params],
    queryFn: async () => {
      const result = await actor.getCredentialsByIssuer(issuer, params);
      return result;
    },
    enabled: !!actor && !!issuer,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useTokensOfUser = (user: Principal) => {
  const actor = useActor();
  
  return useQuery({
    queryKey: queryKeys.tokensOfUser(user.toString()),
    queryFn: async () => {
      const result = await actor.getTokensOfUser(user);
      return result;
    },
    enabled: !!actor && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCredential = (tokenId: number) => {
  const actor = useActor();
  
  return useQuery({
    queryKey: ['credential', tokenId],
    queryFn: async () => {
      const result = await actor.getCredential(tokenId);
      return result;
    },
    enabled: !!actor && tokenId !== undefined,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// User management queries
export const useAllUsers = (params: { offset: number; limit: number }) => {
  const actor = useActor();
  const { userRole } = useAppStore();
  
  return useQuery({
    queryKey: [...queryKeys.users(), params],
    queryFn: async () => {
      const result = await actor.getAllUsers(params);
      if ('ok' in result) {
        return result.ok;
      }
      throw new Error(result.err || 'Failed to fetch users');
    },
    enabled: !!actor && userRole === 'Admin',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutations
export const useMintCredential = () => {
  const actor = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      student_principal,
      student_name,
      credential_type,
      institution,
      issue_date,
    }: {
      student_principal: Principal;
      student_name: string;
      credential_type: string;
      institution: string;
      issue_date: string;
    }) => {
      const result = await actor.mint(
        student_principal,
        student_name,
        credential_type,
        institution,
        issue_date
      );
      if ('ok' in result) {
        return result.ok;
      }
      throw new Error(result.err || 'Failed to mint credential');
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.credentials() });
      queryClient.invalidateQueries({ queryKey: queryKeys.allCredentials() });
      queryClient.invalidateQueries({ queryKey: queryKeys.systemStats() });
    },
  });
};

export const useRevokeCredential = () => {
  const actor = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      tokenId,
      reason,
    }: {
      tokenId: number;
      reason: string;
    }) => {
      const result = await actor.revokeCredential(tokenId, reason);
      if ('ok' in result) {
        return result.ok;
      }
      throw new Error(result.err || 'Failed to revoke credential');
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.credentials() });
      queryClient.invalidateQueries({ queryKey: queryKeys.allCredentials() });
      queryClient.invalidateQueries({ queryKey: queryKeys.systemStats() });
    },
  });
};

export const useRegisterUser = () => {
  const actor = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userPrincipal,
      role,
      name,
      organization,
    }: {
      userPrincipal: Principal;
      role: any;
      name: string;
      organization: string;
    }) => {
      const result = await actor.registerUser(userPrincipal, role, name, organization);
      if ('ok' in result) {
        return result.ok;
      }
      throw new Error(result.err || 'Failed to register user');
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.systemStats() });
    },
  });
};

export const useVerifyUser = () => {
  const actor = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userPrincipal: Principal) => {
      const result = await actor.verifyUser(userPrincipal);
      if ('ok' in result) {
        return result.ok;
      }
      throw new Error(result.err || 'Failed to verify user');
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.systemStats() });
    },
  });
};

export const useUpdateLastLogin = () => {
  const actor = useActor();
  
  return useMutation({
    mutationFn: async () => {
      const result = await actor.updateLastLogin();
      if ('ok' in result) {
        return result.ok;
      }
      throw new Error(result.err || 'Failed to update last login');
    },
  });
};