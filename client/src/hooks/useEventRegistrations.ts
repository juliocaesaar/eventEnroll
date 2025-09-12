import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePusher, PusherNotification } from './usePusher';
import { useAuth } from './useAuth';

export const useEventRegistrations = (eventId: string) => {
  const { user, isLoading: authLoading } = useAuth();
  const { isConnected, connectToEventChannel, disconnectFromEventChannel } = usePusher();
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Query para buscar registrations
  const { data: registrations, isLoading, error } = useQuery({
    queryKey: ['/api/events', eventId, 'registrations'],
    enabled: !!eventId && !!user && !authLoading,
  });

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
        
        // Invalidar a query de registrations para forçar refetch
        queryClient.invalidateQueries({
          queryKey: ['/api/events', eventId, 'registrations']
        });

        // Também invalidar outras queries relacionadas
        queryClient.invalidateQueries({
          queryKey: ['/api/events', eventId, 'analytics']
        });
      }
    });

    return () => {
      if (eventChannel) {
        disconnectFromEventChannel(eventId);
      }
    };
  }, [(user as any)?.id, eventId, isConnected, connectToEventChannel, disconnectFromEventChannel, queryClient]);

  return {
    registrations,
    isLoading,
    error,
    lastUpdate,
    isConnected,
  };
};
