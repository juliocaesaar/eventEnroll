import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { authManager } from './authManager';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

// AuthManager singleton gerencia todo o estado de autenticação

export function useAuthStorage() {
  const [, setLocation] = useLocation();
  const [authState, setAuthState] = useState<AuthState>(authManager.getAuthState());

  // Sincronizar com o AuthManager
  useEffect(() => {
    const unsubscribe = authManager.subscribe(() => {
      setAuthState(authManager.getAuthState());
    });

    return unsubscribe;
  }, []);

  // Validar token com o servidor (otimizado para evitar loops)
  const validateToken = async (token: string) => {
    try {
      console.log('🔍 Validating token...');
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token inválido');
      }

      const userData = await response.json();
      console.log('✅ Token validation successful');
      setAuthState(prev => ({
        ...prev,
        user: userData,
        isAuthenticated: true,
      }));
    } catch (error) {
      console.error('❌ Token inválido:', error);
      clearAuth();
      setLocation('/login');
    }
  };

  // Salvar credenciais no localStorage
  const saveAuth = useCallback((user: User, token: string) => {
    authManager.saveAuth(user, token);
  }, []);

  // Limpar credenciais
  const clearAuth = useCallback(() => {
    authManager.clearAuth();
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (authState.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authState.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      clearAuth();
      setLocation('/login');
    }
  }, [authState.token, clearAuth, setLocation]);

  // Obter headers de autenticação
  const getAuthHeaders = useCallback(() => {
    return authManager.getAuthHeaders();
  }, []);

  return {
    ...authState,
    saveAuth,
    clearAuth,
    logout,
    getAuthHeaders,
  };
}
