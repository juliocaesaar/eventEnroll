import { useEffect, useRef, useState, useCallback } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from './useAuth';
import { globalNotificationManager } from './useGlobalNotifications';

// Configuração do Pusher
const PUSHER_CONFIG = {
  key: 'f0725138d607f195d650',
  cluster: 'sa1',
  authEndpoint: '/api/pusher/auth',
  auth: {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  },
  forceTLS: true,
  enabledTransports: ['ws', 'wss'],
  // Configurações de timeout para evitar travamentos
  activityTimeout: 30000, // 30 segundos
  pongTimeout: 6000, // 6 segundos
  unavailableTimeout: 10000, // 10 segundos
};

export interface PusherNotification {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
  registration?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    paymentStatus: string;
    amountPaid: string;
    paymentId: string;
    updatedAt: string;
  };
  event?: {
    id: string;
    title: string;
  };
}

// Global Pusher Manager
class GlobalPusherManager {
  private static instance: GlobalPusherManager;
  private pusher: Pusher | null = null;
  private isConnected = false;
  private subscribers: Set<() => void> = new Set();
  private isInitialized = false;
  private eventChannels: Map<string, any> = new Map();

  static getInstance(): GlobalPusherManager {
    if (!GlobalPusherManager.instance) {
      GlobalPusherManager.instance = new GlobalPusherManager();
    }
    return GlobalPusherManager.instance;
  }

  // Subscribe to connection status changes
  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Initialize Pusher (only once)
  initialize(userId: string) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('=== INICIALIZANDO PUSHER GLOBAL ===');
      console.log('User ID:', userId);
      console.log('Is Initialized:', this.isInitialized);
    }
    
    if (this.isInitialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Pusher já foi inicializado, pulando...');
      }
      return;
    }

    // Obter token do localStorage
    const token = localStorage.getItem('eventflow_token');
    
    this.pusher = new Pusher(PUSHER_CONFIG.key, {
      cluster: PUSHER_CONFIG.cluster,
      authEndpoint: PUSHER_CONFIG.authEndpoint,
      auth: {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      },
      forceTLS: PUSHER_CONFIG.forceTLS,
      enabledTransports: PUSHER_CONFIG.enabledTransports as any,
    });

    // Connection event handlers
    this.pusher.connection.bind('connected', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Pusher connected successfully');
      }
      this.isConnected = true;
      this.notifySubscribers();
    });

    this.pusher.connection.bind('disconnected', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Pusher disconnected');
      }
      this.isConnected = false;
      this.notifySubscribers();
    });

    // Subscribe to user channel
    const userChannelName = `private-user-${userId}`;
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Subscribing to user channel:', userChannelName);
    }
    
    const userChannel = this.pusher.subscribe(userChannelName);
    
    // Event listeners
    this.setupEventListeners(userChannel, userChannelName);
    
    this.isInitialized = true;
  }

  private setupEventListeners(userChannel: any, userChannelName: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Configurando event listeners para canal:', userChannelName);
    }
    
    // Event listeners (same as before)
    userChannel.bind('new_registration', (notification: PusherNotification) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎉 NEW REGISTRATION NOTIFICATION RECEIVED:', notification);
      }
      
      globalNotificationManager.addNotification({
        type: 'new_registration',
        title: "Nova Inscrição! 🎉",
        message: `${notification.registration?.firstName} ${notification.registration?.lastName} se inscreveu no evento "${notification.event?.title}"`,
        timestamp: notification.timestamp,
        eventId: notification.event?.id,
        eventTitle: notification.event?.title,
      });
    });

    userChannel.bind('payment_confirmed', (notification: PusherNotification) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('💰 PAYMENT CONFIRMED NOTIFICATION RECEIVED:', notification);
      }
      
      globalNotificationManager.addNotification({
        type: 'payment_confirmed',
        title: "Pagamento Confirmado! 💰",
        message: `${notification.registration?.firstName} ${notification.registration?.lastName} confirmou o pagamento de R$ ${parseFloat(notification.registration?.amountPaid || '0').toFixed(2)}`,
        timestamp: notification.timestamp,
        eventId: notification.event?.id,
        eventTitle: notification.event?.title,
      });
    });

    userChannel.bind('registration_updated', (notification: PusherNotification) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 REGISTRATION UPDATED NOTIFICATION RECEIVED:', notification);
      }
      
      globalNotificationManager.addNotification({
        type: 'system',
        title: "Inscrição Atualizada! 📝",
        message: `Inscrição de ${notification.registration?.firstName} ${notification.registration?.lastName} foi atualizada`,
        timestamp: notification.timestamp,
        eventId: notification.event?.id,
        eventTitle: notification.event?.title,
      });
    });

    // Evento de teste
    userChannel.bind('test_notification', (notification: PusherNotification) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 TEST NOTIFICATION RECEIVED:', notification);
      }
      
      globalNotificationManager.addNotification({
        type: 'system',
        title: "Teste Pusher! 🧪",
        message: notification.data?.message || 'Notificação de teste recebida',
        timestamp: notification.timestamp,
      });
    });

    // Log de subscrição bem-sucedida
    userChannel.bind('pusher:subscription_succeeded', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Successfully subscribed to user channel:', userChannelName);
      }
    });

    userChannel.bind('pusher:subscription_error', (error: any) => {
      console.log('❌ Error subscribing to user channel:', error);
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Error details:', JSON.stringify(error, null, 2));
      }
    });

    // Listener genérico para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      userChannel.bind_global((eventName: string, data: any) => {
        console.log('🔍 EVENT RECEIVED on', userChannelName + ':', eventName, data);
      });
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Event listeners configurados com sucesso para:', userChannelName);
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  // Connect to event channel
  connectToEventChannel(eventId: string, callback: (notification: PusherNotification) => void) {
    if (!this.pusher) {
      console.warn('Pusher not initialized');
      return null;
    }

    const channelName = `private-event-${eventId}`;
    console.log('🔗 Connecting to event channel:', channelName);

    // Check if already subscribed
    if (this.eventChannels.has(channelName)) {
      console.log('📡 Already subscribed to event channel:', channelName);
      return this.eventChannels.get(channelName);
    }

    const eventChannel = this.pusher.subscribe(channelName);
    this.eventChannels.set(channelName, eventChannel);

    // Set up event listeners for this specific channel
    eventChannel.bind('new_registration', callback);
    eventChannel.bind('payment_confirmed', callback);
    eventChannel.bind('registration_updated', callback);

    // Log subscription success
    eventChannel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Successfully subscribed to event channel:', channelName);
    });

    eventChannel.bind('pusher:subscription_error', (error: any) => {
      console.log('❌ Error subscribing to event channel:', error);
    });

    return eventChannel;
  }

  // Disconnect from event channel
  disconnectFromEventChannel(eventId: string) {
    const channelName = `private-event-${eventId}`;
    console.log('🔌 Disconnecting from event channel:', channelName);

    if (this.eventChannels.has(channelName)) {
      const channel = this.eventChannels.get(channelName);
      if (channel && this.pusher) {
        this.pusher.unsubscribe(channelName);
        this.eventChannels.delete(channelName);
        console.log('✅ Disconnected from event channel:', channelName);
      }
    }
  }

  // Test Pusher
  async testPusher(userId: string) {
    if (!this.pusher) return;
    
    try {
      const response = await fetch('/api/pusher/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to test Pusher');
      }

      const result = await response.json();
      console.log('✅ Pusher test result:', result);
      return result;
    } catch (error) {
      console.error('❌ Pusher test error:', error);
      throw error;
    }
  }
}

const globalPusherManager = GlobalPusherManager.getInstance();

export const usePusher = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 usePusher useEffect executado');
      console.log('User:', (user as any)?.id);
    }
    
    if (!(user as any)?.id) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User ID não encontrado, pulando inicialização');
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Inicializando Pusher global com User ID:', (user as any).id);
    }
    
    // Initialize global Pusher
    globalPusherManager.initialize((user as any).id);

    // Subscribe to connection status changes
    const unsubscribe = globalPusherManager.subscribe(() => {
      const status = globalPusherManager.getConnectionStatus();
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 Status de conexão atualizado:', status);
      }
      setIsConnected(status);
    });

    // Set initial state
    const initialStatus = globalPusherManager.getConnectionStatus();
    if (process.env.NODE_ENV === 'development') {
      console.log('📡 Status inicial de conexão:', initialStatus);
    }
    setIsConnected(initialStatus);

    return unsubscribe;
  }, [(user as any)?.id]);

  const testPusher = useCallback(async () => {
    return globalPusherManager.testPusher((user as any)?.id);
  }, [(user as any)?.id]);

  const connectToEventChannel = useCallback((eventId: string, callback: (notification: PusherNotification) => void) => {
    return globalPusherManager.connectToEventChannel(eventId, callback);
  }, []);

  const disconnectFromEventChannel = useCallback((eventId: string) => {
    return globalPusherManager.disconnectFromEventChannel(eventId);
  }, []);

  return {
    isConnected,
    testPusher,
    connectToEventChannel,
    disconnectFromEventChannel,
  };
};