import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuthStorage } from "./useAuthStorage";

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading, logout: logoutStorage } = useAuthStorage();
  
  // Remover query desnecessária que estava causando loop de validação
  // O useAuthStorage já gerencia o estado de autenticação corretamente
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: false, // Desabilitar para evitar loop de validação
    staleTime: Infinity, // Nunca considerar stale
  });

  const logout = async () => {
    try {
      await logoutStorage();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Limpar cache e redirecionar
      queryClient.clear();
      setLocation('/login');
    }
  };

  return {
    user: user, // Usar apenas o user do useAuthStorage
    isLoading: isLoading, // Usar apenas o isLoading do useAuthStorage
    isAuthenticated,
    logout,
  };
}
