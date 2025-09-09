import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { usePusher, PusherNotification } from './usePusher';

export interface NotificationData {
  type: string;
  data: any;
  timestamp: string;
}

export const useEventNotifications = (eventId: string) => {
  const { user } = useAuth();
  const { isConnected, connectToEventChannel, disconnectFromEventChannel } = usePusher();
  const [lastNotification, setLastNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    if (!(user as any)?.id || !eventId || !isConnected) return;

    // Conectar ao canal do evento
    const eventChannel = connectToEventChannel(eventId, (notification: PusherNotification) => {
      console.log('Event notification received:', notification);
      setLastNotification(notification);
    });

    return () => {
      if (eventChannel) {
        disconnectFromEventChannel(eventId);
      }
    };
  }, [(user as any)?.id, eventId, isConnected, connectToEventChannel, disconnectFromEventChannel]);

  return {
    isConnected,
    lastNotification,
  };
};