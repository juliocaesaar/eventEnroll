import Pusher from 'pusher';

// Configuração do Pusher
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "2046477",
  key: process.env.PUSHER_KEY || "f0725138d607f195d650",
  secret: process.env.PUSHER_SECRET || "553c5b655a5057236d50",
  cluster: process.env.PUSHER_CLUSTER || "sa1",
  useTLS: true
});

console.log('=== PUSHER CONFIGURADO ===');
console.log('App ID:', process.env.PUSHER_APP_ID || "2046477");
console.log('Key:', process.env.PUSHER_KEY || "f0725138d607f195d650");
console.log('Cluster:', process.env.PUSHER_CLUSTER || "sa1");
console.log('Use TLS:', true);

// Tipos de eventos para notificações
export const PUSHER_EVENTS = {
  NEW_REGISTRATION: 'new_registration',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  REGISTRATION_UPDATED: 'registration_updated',
  EVENT_UPDATED: 'event_updated'
} as const;

// Canais por evento
export const getEventChannel = (eventId: string) => `private-event-${eventId}`;
export const getUserChannel = (userId: string) => `private-user-${userId}`;

// Função helper para enviar notificações
export const sendPusherNotification = async (
  channel: string,
  event: string,
  data: any,
  userId?: string
) => {
  try {
    console.log('=== SEND PUSHER NOTIFICATION ===');
    console.log('Channel:', channel);
    console.log('Event:', event);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('UserId:', userId);

    const notificationData = {
      ...data,
      timestamp: new Date().toISOString(),
      userId,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    console.log('Notification Data:', JSON.stringify(notificationData, null, 2));

    const result = await pusher.trigger(channel, event, notificationData);
    console.log('✅ Pusher trigger result:', result);
    console.log(`✅ Pusher notification sent to ${channel}: ${event}`);
  } catch (error: any) {
    console.error('❌ Error sending Pusher notification:', error);
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      channel,
      event
    });
  }
};

// Função para enviar notificação para múltiplos canais
export const sendPusherNotificationToChannels = async (
  channels: string[],
  event: string,
  data: any,
  userId?: string
) => {
  console.log('=== SEND PUSHER NOTIFICATION TO MULTIPLE CHANNELS ===');
  console.log('Channels:', channels);
  console.log('Event:', event);
  
  const promises = channels.map(channel => 
    sendPusherNotification(channel, event, data, userId)
  );
  
  await Promise.all(promises);
};
