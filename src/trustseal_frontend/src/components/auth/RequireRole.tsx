import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RequireRoleProps {
  role: 'Admin' | 'Issuer' | 'Checker';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Role-based route guard component
 * Only renders children if user has the required role
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ 
  role, 
  children, 
  fallback 
}) => {
  const { userRole, isAuthenticated, isInitializing } = useAuth();

  // Show loading while determining role
  if (isInitializing) {
    return (
      <div className="card">
        <h3>Loading...</h3>
        <p>Determining your role and permissions...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="card">
        <h3>Authentication Required</h3>
        <p>Please log in to access this section.</p>
      </div>
    );
  }

  // Check if user has required role
  if (userRole !== role) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="card error">
        <h3>Access Denied</h3>
        <p>
          You do not have permission to access this section. 
          Required role: <strong>{role}</strong>
          <br />
          Your role: <strong>{userRole || 'None'}</strong>
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Admin-only route guard
 */
export const RequireAdmin: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RequireRole role="Admin" fallback={fallback}>
    {children}
  </RequireRole>
);

/**
 * Issuer-only route guard
 */
export const RequireIssuer: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RequireRole role="Issuer" fallback={fallback}>
    {children}
  </RequireRole>
);

/**
 * Checker-only route guard
 */
export const RequireChecker: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RequireRole role="Checker" fallback={fallback}>
    {children}
  </RequireRole>
);

/**
 * Route guard for multiple allowed roles
 */
interface RequireAnyRoleProps {
  roles: ('Admin' | 'Issuer' | 'Checker')[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireAnyRole: React.FC<RequireAnyRoleProps> = ({ 
  roles, 
  children, 
  fallback 
}) => {
  const { userRole, isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="card">
        <h3>Loading...</h3>
        <p>Determining your role and permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="card">
        <h3>Authentication Required</h3>
        <p>Please log in to access this section.</p>
      </div>
    );
  }

  if (!userRole || !roles.includes(userRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="card error">
        <h3>Access Denied</h3>
        <p>
          You do not have permission to access this section. 
          Required roles: <strong>{roles.join(' or ')}</strong>
          <br />
          Your role: <strong>{userRole || 'None'}</strong>
        </p>
      </div>
    );
  }

  return <>{children}</>;
};