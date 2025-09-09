import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  redirectTo 
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login');
      return;
    }

    if (allowedRoles.length > 0) {
      const userRole = (user as any)?.role;
      
      if (!userRole || !allowedRoles.includes(userRole)) {
        // Redirecionar baseado no role do usuário
        if (userRole === 'manager') {
          setLocation('/groups/dashboard');
        } else {
          setLocation(redirectTo || '/dashboard');
        }
        return;
      }
    }
  }, [isAuthenticated, user, allowedRoles, redirectTo, setLocation]);

  // Se não está autenticado ou não tem permissão, não renderizar nada
  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles.length > 0) {
    const userRole = (user as any)?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return null;
    }
  }

  return <>{children}</>;
}

// Componentes específicos para cada role
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']} redirectTo="/dashboard">
      {children}
    </ProtectedRoute>
  );
}

export function OrganizerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'organizer']} redirectTo="/groups/dashboard">
      {children}
    </ProtectedRoute>
  );
}

export function ManagerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['manager']} redirectTo="/dashboard">
      {children}
    </ProtectedRoute>
  );
}

export function NonManagerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'organizer']} redirectTo="/groups/dashboard">
      {children}
    </ProtectedRoute>
  );
}
