import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePusher, PusherNotification } from './usePusher';
import { useAuth } from './useAuth';
import { useMobile } from './useMobile';

// Debounce utility para evitar invalidações excessivas
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const useEventRegistrations = (eventId: string) => {
  const { user, isLoading: authLoading } = useAuth();
  const { isConnected, connectToEventChannel, disconnectFromEventChannel } = usePusher();
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const invalidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useMobile();

  // Query para buscar registrations com configurações otimizadas para mobile
  const { data: registrations, isLoading, error } = useQuery({
    queryKey: ['/api/events', eventId, 'registrations'],
    enabled: !!eventId && !!user && !authLoading,
    // Configurações específicas para mobile
    staleTime: isMobile ? 2 * 60 * 1000 : 5 * 60 * 1000, // 2 min mobile, 5 min desktop
    gcTime: isMobile ? 5 * 60 * 1000 : 10 * 60 * 1000, // 5 min mobile, 10 min desktop
    retry: isMobile ? 1 : 2, // Menos retries em mobile
  });

  // Debounced invalidation para evitar loops
  const debouncedInvalidate = useCallback(
    debounce((queryKey: string[]) => {
      queryClient.invalidateQueries({ queryKey });
    }, isMobile ? 1000 : 500), // 1s debounce em mobile, 500ms desktop
    [queryClient, isMobile]
  );

  useEffect(() => {
    if (!(user as any)?.id || !eventId || !isConnected) return;

    // Conectar ao canal do evento para receber atualizações
    const eventChannel = connectToEventChannel(eventId, (notification: PusherNotification) => {
      console.log('Registration update received:', notification);
      setLastUpdate(new Date());

      // Invalidar e refetch das registrations quando houver mudanças
      if (notification.type === 'new_registration' || 
          notification.type === 'payment_confirmed' || 
          notification.type === 'registration_updated') {
        
        // Usar debounced invalidation para evitar loops
        debouncedInvalidate(['/api/events', eventId, 'registrations']);
        debouncedInvalidate(['/api/events', eventId, 'analytics']);
      }
    });

    return () => {
      if (eventChannel) {
        disconnectFromEventChannel(eventId);
      }
      // Limpar timeout se existir
      if (invalidationTimeoutRef.current) {
        clearTimeout(invalidationTimeoutRef.current);
      }
    };
  }, [(user as any)?.id, eventId, isConnected, connectToEventChannel, disconnectFromEventChannel, debouncedInvalidate]);

  return {
    registrations,
    isLoading,
    error,
    lastUpdate,
    isConnected,
  };
};
