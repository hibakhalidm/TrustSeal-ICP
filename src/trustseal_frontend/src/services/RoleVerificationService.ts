import { Principal } from '@dfinity/principal';
import { TrustSealActor, UserProfile } from '../contexts/AuthContext';

export interface RolePermissions {
  canManageUsers: boolean;
  canIssueCredentials: boolean;
  canRevokeCredentials: boolean;
  canVerifyCredentials: boolean;
  canViewSystemStats: boolean;
  canViewAllCredentials: boolean;
}

export class RoleVerificationService {
  private actor: TrustSealActor;
  private userPrincipal: Principal;

  constructor(actor: TrustSealActor, userPrincipal: Principal) {
    this.actor = actor;
    this.userPrincipal = userPrincipal;
  }

  /**
   * Get role-based permissions for the current user
   */
  async getRolePermissions(): Promise<RolePermissions> {
    try {
      const roleResult = await this.actor.getUserRole(this.userPrincipal);
      
      if (roleResult?.Admin !== undefined) {
        return {
          canManageUsers: true,
          canIssueCredentials: true,
          canRevokeCredentials: true,
          canVerifyCredentials: true,
          canViewSystemStats: true,
          canViewAllCredentials: true,
        };
      } else if (roleResult?.Issuer !== undefined) {
        return {
          canManageUsers: false,
          canIssueCredentials: true,
          canRevokeCredentials: true,
          canVerifyCredentials: true,
          canViewSystemStats: false,
          canViewAllCredentials: false,
        };
      } else if (roleResult?.Checker !== undefined) {
        return {
          canManageUsers: false,
          canIssueCredentials: false,
          canRevokeCredentials: false,
          canVerifyCredentials: true,
          canViewSystemStats: false,
          canViewAllCredentials: false,
        };
      } else {
        // Default to Checker permissions for unregistered users
        return {
          canManageUsers: false,
          canIssueCredentials: false,
          canRevokeCredentials: false,
          canVerifyCredentials: true,
          canViewSystemStats: false,
          canViewAllCredentials: false,
        };
      }
    } catch (error) {
      console.error('Error getting role permissions:', error);
      // Return minimal permissions on error
      return {
        canManageUsers: false,
        canIssueCredentials: false,
        canRevokeCredentials: false,
        canVerifyCredentials: true,
        canViewSystemStats: false,
        canViewAllCredentials: false,
      };
    }
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(permission: keyof RolePermissions): Promise<boolean> {
    const permissions = await this.getRolePermissions();
    return permissions[permission];
  }

  /**
   * Get user profile with role information
   */
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profile = await this.actor.getUserProfile(this.userPrincipal);
      return profile || null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Check if user is verified
   */
  async isUserVerified(): Promise<boolean> {
    try {
      const profile = await this.actor.getUserProfile(this.userPrincipal);
      return profile?.verified || false;
    } catch (error) {
      console.error('Error checking user verification:', error);
      return false;
    }
  }

  /**
   * Check if user can perform a specific action
   */
  async canPerformAction(action: string): Promise<boolean> {
    const permissions = await this.getRolePermissions();
    
    switch (action) {
      case 'manage_users':
        return permissions.canManageUsers;
      case 'issue_credentials':
        return permissions.canIssueCredentials;
      case 'revoke_credentials':
        return permissions.canRevokeCredentials;
      case 'verify_credentials':
        return permissions.canVerifyCredentials;
      case 'view_system_stats':
        return permissions.canViewSystemStats;
      case 'view_all_credentials':
        return permissions.canViewAllCredentials;
      default:
        return false;
    }
  }

  /**
   * Get allowed actions for the current user
   */
  async getAllowedActions(): Promise<string[]> {
    const permissions = await this.getRolePermissions();
    const actions: string[] = [];
    
    if (permissions.canManageUsers) actions.push('manage_users');
    if (permissions.canIssueCredentials) actions.push('issue_credentials');
    if (permissions.canRevokeCredentials) actions.push('revoke_credentials');
    if (permissions.canVerifyCredentials) actions.push('verify_credentials');
    if (permissions.canViewSystemStats) actions.push('view_system_stats');
    if (permissions.canViewAllCredentials) actions.push('view_all_credentials');
    
    return actions;
  }

  /**
   * Validate user access to a specific resource
   */
  async validateResourceAccess(resourceType: string, resourceId?: string): Promise<boolean> {
    const permissions = await this.getRolePermissions();
    
    switch (resourceType) {
      case 'user_management':
        return permissions.canManageUsers;
      case 'credential_issuance':
        return permissions.canIssueCredentials;
      case 'credential_revocation':
        return permissions.canRevokeCredentials;
      case 'credential_verification':
        return permissions.canVerifyCredentials;
      case 'system_statistics':
        return permissions.canViewSystemStats;
      case 'all_credentials':
        return permissions.canViewAllCredentials;
      default:
        return false;
    }
  }

  /**
   * Get role-based dashboard configuration
   */
  async getDashboardConfig(): Promise<{
    showUserManagement: boolean;
    showCredentialIssuance: boolean;
    showCredentialManagement: boolean;
    showVerificationTools: boolean;
    showSystemStats: boolean;
  }> {
    const permissions = await this.getRolePermissions();
    
    return {
      showUserManagement: permissions.canManageUsers,
      showCredentialIssuance: permissions.canIssueCredentials,
      showCredentialManagement: permissions.canRevokeCredentials,
      showVerificationTools: permissions.canVerifyCredentials,
      showSystemStats: permissions.canViewSystemStats,
    };
  }
}

/**
 * Hook for using role verification service
 */
export const useRoleVerification = (actor: TrustSealActor | null, userPrincipal: Principal | null) => {
  if (!actor || !userPrincipal) {
    return null;
  }
  
  return new RoleVerificationService(actor, userPrincipal);
};