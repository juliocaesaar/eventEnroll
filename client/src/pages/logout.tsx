import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { useMutation } from '@tanstack/react-query';

export default function Logout() {
  const [, setLocation] = useLocation();
  const { refetch } = useAuth();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer logout');
      }

      return response.json();
    },
    onSuccess: () => {
      refetch();
      setLocation('/login');
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      // Mesmo com erro, redireciona para login
      setLocation('/login');
    },
  });

  useEffect(() => {
    logoutMutation.mutate();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-gray-600">Fazendo logout...</p>
      </div>
    </div>
  );
}
