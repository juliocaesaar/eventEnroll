import { Request, Response } from 'express';
import { stripe } from '../config/stripe';
import { storage } from '../storage';
import { 
  sendPusherNotification, 
  sendPusherNotificationToChannels,
  getEventChannel, 
  getUserChannel, 
  PUSHER_EVENTS 
} from '../config/pusher';

// Cache para evitar processar o mesmo webhook múltiplas vezes
const processedWebhooks = new Set<string>();

// Pusher notifications will be handled by the imported functions

export class StripeWebhookController {
  // Processar webhook do Stripe
  static async handleWebhook(req: Request, res: Response) {
    console.log('=== WEBHOOK RECEBIDO ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', Object.keys(req.headers));
    console.log('Body length:', req.body?.length);
    console.log('Body type:', typeof req.body);
    
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    console.log('Signature presente:', !!sig);
    console.log('Endpoint Secret configurado:', !!endpointSecret);
    console.log('Environment:', process.env.NODE_ENV);

    if (!endpointSecret) {
      console.error('STRIPE_WEBHOOK_SECRET não configurado');
      return res.status(500).json({ error: 'Webhook secret não configurado' });
    }

    let event;

    try {
      // Verificar assinatura do webhook
      event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
      console.log('✅ Evento verificado com sucesso:', event.type);
      console.log('Event ID:', event.id);
      console.log('Event created:', new Date(event.created * 1000).toISOString());
    } catch (err: any) {
      console.error('❌ Erro na verificação da assinatura do webhook:', err.message);
      console.error('Erro completo:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // Processar o evento
      console.log('🔄 Iniciando processamento do evento...');
      await StripeWebhookController.processEvent(event);
      console.log('✅ Evento processado com sucesso');
      res.json({ received: true, eventType: event.type, eventId: event.id });
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Processar diferentes tipos de eventos
  static async processEvent(event: any) {
    console.log('🔄 Processando evento Stripe:', event.type);
    console.log('Event ID:', event.id);
    
    // Verificar se já processamos este webhook
    if (processedWebhooks.has(event.id)) {
      console.log('⚠️ Webhook já foi processado, ignorando:', event.id);
      return;
    }
    
    // Marcar webhook como processado
    processedWebhooks.add(event.id);
    console.log('✅ Webhook marcado como processado:', event.id);
    
    console.log('Event data object keys:', Object.keys(event.data.object));

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('📋 Processando checkout.session.completed');
        await StripeWebhookController.handleCheckoutCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        console.log('💳 Processando payment_intent.succeeded');
        await StripeWebhookController.handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        console.log('❌ Processando payment_intent.payment_failed');
        await StripeWebhookController.handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`⚠️ Evento não tratado: ${event.type}`);
        console.log('Evento completo:', JSON.stringify(event, null, 2));
    }
  }

  // Quando o checkout é completado
  private static async handleCheckoutCompleted(session: any) {
    console.log('=== CHECKOUT COMPLETED WEBHOOK ===');
    console.log('Session ID:', session.id);
    console.log('Session metadata:', session.metadata);
    console.log('Session customer_details:', session.customer_details);
    console.log('Timestamp:', new Date().toISOString());
    
    try {
      // Buscar informações do evento e ingressos
      const eventId = session.metadata?.eventId;
      const eventSlug = session.metadata?.eventSlug;
      
      if (!eventId || !eventSlug) {
        console.error('Metadados do evento não encontrados na sessão:', session.metadata);
        return;
      }

      // Buscar o evento
      const event = await storage.getEvent(eventId);
      if (!event) {
        console.error('Evento não encontrado:', eventId);
        return;
      }

      // Buscar os line items da sessão
      const stripe = await import('../config/stripe');
      const lineItems = await stripe.stripe.checkout.sessions.listLineItems(session.id);
      
      console.log('Line items encontrados:', lineItems.data.length);

      // Processar cada item da linha
      for (const item of lineItems.data) {
        const ticketId = item.price?.metadata?.ticketId;
        const quantity = item.quantity || 1;
        
        console.log('Processando item:', { ticketId, quantity, priceMetadata: item.price?.metadata });
        
        if (ticketId) {
          // Buscar o ingresso
          const ticket = await storage.getTicket(ticketId);
          if (!ticket) {
            console.error('Ingresso não encontrado:', ticketId);
            continue;
          }

          // Atualizar inscrição para paga
          await StripeWebhookController.updateRegistrationToPaid(
            session,
            event,
            ticket,
            quantity
          );
        }
      }

      console.log(`Inscrições confirmadas para evento: ${event.title}`);
    } catch (error) {
      console.error('Erro ao processar checkout completado:', error);
    }
  }

  // Quando o pagamento é confirmado
  private static async handlePaymentSucceeded(paymentIntent: any) {
    console.log('Pagamento confirmado:', paymentIntent.id);
    console.log('PaymentIntent metadata:', paymentIntent.metadata);
    
    try {
      // Buscar informações do evento e ingressos
      const eventId = paymentIntent.metadata?.eventId;
      const eventSlug = paymentIntent.metadata?.eventSlug;
      
      if (!eventId || !eventSlug) {
        console.error('Metadados do evento não encontrados no PaymentIntent:', paymentIntent.metadata);
        return;
      }

      // Buscar o evento
      const event = await storage.getEvent(eventId);
      if (!event) {
        console.error('Evento não encontrado:', eventId);
        return;
      }

      // Buscar o ingresso
      const ticketId = paymentIntent.metadata?.ticketId;
      if (ticketId) {
        const ticket = await storage.getTicket(ticketId);
        if (!ticket) {
          console.error('Ingresso não encontrado:', ticketId);
          return;
        }

        // Atualizar inscrição para paga
        await StripeWebhookController.updateRegistrationToPaid(
          paymentIntent,
          event,
          ticket,
          parseInt(paymentIntent.metadata?.quantity || '1')
        );
      }

      console.log(`Inscrição confirmada para evento: ${event.title}`);
    } catch (error) {
      console.error('Erro ao processar pagamento confirmado:', error);
    }
  }

  // Quando o pagamento falha
  private static async handlePaymentFailed(paymentIntent: any) {
    console.log('Pagamento falhou:', paymentIntent.id);
    
    try {
      // Buscar informações do evento e ingressos
      const eventId = paymentIntent.metadata?.eventId;
      const ticketId = paymentIntent.metadata?.ticketId;
      
      if (!eventId || !ticketId) {
        console.error('Metadados do evento não encontrados no PaymentIntent');
        return;
      }

      // Buscar o evento
      const event = await storage.getEvent(eventId);
      if (!event) {
        console.error('Evento não encontrado:', eventId);
        return;
      }

      // Buscar o ingresso
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        console.error('Ingresso não encontrado:', ticketId);
        return;
      }

      // Atualizar status da inscrição para falhou
      // (implementar quando tivermos o sistema de inscrições funcionando)
      console.log(`Pagamento falhou para evento: ${event.title}`);
    } catch (error) {
      console.error('Erro ao processar pagamento falhado:', error);
    }
  }

  // Atualizar inscrição existente para confirmada
  private static async updateRegistrationToPaid(
    paymentData: any,
    event: any,
    ticket: any,
    quantity: number
  ) {
    try {
      console.log('Atualizando inscrição para paga com dados:', {
        paymentDataId: paymentData.id,
        eventId: event.id,
        ticketId: ticket.id,
        quantity
      });

      // Extrair informações do cliente baseado no tipo de dados de pagamento
      let customerName = 'N/A';
      let customerEmail = 'N/A';
      let customerPhone = null;
      let amountPaid = '0.00';
      let paymentId = paymentData.id;

      if (paymentData.customer_details) {
        // Dados de uma sessão de checkout
        customerName = paymentData.customer_details.name || 'N/A';
        customerEmail = paymentData.customer_details.email || 'N/A';
        customerPhone = paymentData.customer_details.phone || null;
        amountPaid = paymentData.amount_total ? (paymentData.amount_total / 100).toFixed(2) : '0.00';
      } else if (paymentData.receipt_email) {
        // Dados de um PaymentIntent
        customerEmail = paymentData.receipt_email;
        amountPaid = paymentData.amount ? (paymentData.amount / 100).toFixed(2) : '0.00';
      }

      // Buscar inscrição existente pelo registrationId nos metadados ou por email/ticket
      let existingRegistration = null;
      
      // Primeiro, tentar buscar pelo registrationId se estiver nos metadados
      const registrationId = paymentData.metadata?.registrationId;
      console.log('🔍 Metadados da sessão:', paymentData.metadata);
      console.log('🔍 RegistrationId encontrado nos metadados:', registrationId);
      
      if (registrationId && registrationId.trim() !== '') {
        console.log('Buscando inscrição pelo registrationId:', registrationId);
        existingRegistration = await storage.getRegistration(registrationId);
        console.log('Inscrição encontrada pelo registrationId:', existingRegistration ? existingRegistration.id : 'NÃO ENCONTRADA');
        console.log('Status da inscrição encontrada:', existingRegistration ? existingRegistration.paymentStatus : 'N/A');
        
        if (existingRegistration && existingRegistration.paymentStatus === 'pending') {
          console.log('✅ Inscrição válida encontrada pelo registrationId:', existingRegistration.id);
        } else {
          console.log('❌ Inscrição não encontrada ou já processada, continuando busca...');
          existingRegistration = null;
        }
      } else {
        console.log('❌ RegistrationId não encontrado ou vazio nos metadados');
      }
      
      // Se não encontrou pelo registrationId, buscar pelo email e ticket
      if (!existingRegistration) {
        console.log('🔍 Buscando inscrição pelo email e ticket...');
        console.log('Email do cliente:', customerEmail);
        console.log('Ticket ID:', ticket.id);
        
        const existingRegistrations = await storage.getEventRegistrations(event.id);
        console.log('Total de inscrições encontradas para o evento:', existingRegistrations.length);
        
        existingRegistration = existingRegistrations.find(reg => {
          const matches = reg.email === customerEmail && 
                         reg.ticketId === ticket.id && 
                         reg.paymentStatus === 'pending';
          if (matches) {
            console.log('✅ Inscrição encontrada por email/ticket:', reg.id);
          }
          return matches;
        });
        
        if (!existingRegistration) {
          console.log('❌ Nenhuma inscrição pendente encontrada por email/ticket');
        }
      }

      if (existingRegistration) {
        // Atualizar inscrição existente
        const updatedRegistration = await storage.updateRegistration(existingRegistration.id, {
          status: 'confirmed',
          paymentStatus: 'paid',
          amountPaid,
          paymentId,
          phoneNumber: customerPhone,
        });

        console.log(`Inscrição atualizada com sucesso: ${updatedRegistration.id}, paymentStatus: ${updatedRegistration.paymentStatus}`);
        
        // Send SSE notification for payment status update
        console.log('=== ENVIANDO NOTIFICAÇÃO PUSHER (PAGAMENTO) ===');
        console.log('Event ID:', event.id);
        console.log('Event Organizer ID:', event.organizerId);
        console.log('Event Type:', PUSHER_EVENTS.PAYMENT_CONFIRMED);
        
        // Construir nomes dos canais
        const eventChannel = getEventChannel(event.id);
        const userChannel = getUserChannel(event.organizerId);
        
        console.log('Event Channel Name:', eventChannel);
        console.log('User Channel Name:', userChannel);
        
        // Enviar para ambos os canais: evento e usuário organizador
        const channels = [eventChannel, userChannel];
        
        await sendPusherNotificationToChannels(channels, PUSHER_EVENTS.PAYMENT_CONFIRMED, {
          registration: {
            id: updatedRegistration.id,
            firstName: updatedRegistration.firstName,
            lastName: updatedRegistration.lastName,
            email: updatedRegistration.email,
            status: updatedRegistration.status,
            paymentStatus: updatedRegistration.paymentStatus,
            amountPaid: updatedRegistration.amountPaid,
            paymentId: updatedRegistration.paymentId,
            updatedAt: updatedRegistration.updatedAt
          },
          event: {
            id: event.id,
            title: event.title
          }
        });
        
        // Enviar email de confirmação
        await StripeWebhookController.sendConfirmationEmail(updatedRegistration, event, ticket, paymentData);
        
        return updatedRegistration;
      } else {
        // Se não encontrar inscrição existente, verificar se já existe uma inscrição paga para evitar duplicação
        console.log('⚠️ Inscrição existente não encontrada, verificando se já existe uma inscrição paga...');
        
        const allRegistrations = await storage.getEventRegistrations(event.id);
        const existingPaidRegistration = allRegistrations.find(reg => 
          reg.email === customerEmail && 
          reg.ticketId === ticket.id && 
          reg.paymentStatus === 'paid'
        );
        
        if (existingPaidRegistration) {
          console.log('✅ Inscrição já paga encontrada, atualizando paymentId:', existingPaidRegistration.id);
          
          // Atualizar apenas o paymentId se necessário
          const updatedRegistration = await storage.updateRegistration(existingPaidRegistration.id, {
            paymentId,
            amountPaid,
            phoneNumber: customerPhone,
          });
          
          // Enviar email de confirmação
          await StripeWebhookController.sendConfirmationEmail(updatedRegistration, event, ticket, paymentData);
          
          return updatedRegistration;
        }
        
        // Se não existe nenhuma inscrição (nem pendente nem paga), criar nova (fallback)
        console.log('🆕 Nenhuma inscrição encontrada, criando nova como fallback...');
        
        // Dividir nome em primeiro e último nome
        const nameParts = customerName.split(' ');
        const firstName = nameParts[0] || 'N/A';
        const lastName = nameParts.slice(1).join(' ') || 'N/A';

        const registrationData = {
          eventId: event.id,
          ticketId: ticket.id,
          firstName,
          lastName,
          email: customerEmail,
          phoneNumber: customerPhone,
          status: 'confirmed',
          paymentStatus: 'paid',
          amountPaid,
          currency: 'BRL',
          paymentGateway: 'stripe',
          paymentId,
          qrCode: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };

        const registration = await storage.createRegistration(registrationData);
        console.log(`Nova inscrição criada como fallback: ${registration.id}, paymentStatus: ${registration.paymentStatus}`);
        
        // Enviar email de confirmação
        await StripeWebhookController.sendConfirmationEmail(registration, event, ticket, paymentData);
        
        return registration;
      }
    } catch (error) {
      console.error('Erro ao atualizar inscrição:', error);
      throw error;
    }
  }

  // Enviar email de confirmação de inscrição
  private static async sendConfirmationEmail(registration: any, event: any, ticket: any, session?: any) {
    try {
      console.log('📧 Preparando envio de email de confirmação...');
      
      const { EmailService } = await import('../services/emailService');
      
      // Preparar dados para o email
      const emailData = {
        eventName: event.title || 'Evento',
        eventDate: event.startDate ? new Date(event.startDate).toLocaleDateString('pt-BR') : 'Data não informada',
        eventTime: event.startDate ? new Date(event.startDate).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : 'Horário não informado',
        eventLocation: event.venueName || null,
        eventAddress: event.venueAddress ? (typeof event.venueAddress === 'string' ? event.venueAddress : JSON.stringify(event.venueAddress)) : null,
        eventImageUrl: event.imageUrl,
        participantName: `${registration.firstName} ${registration.lastName}`.trim(),
        participantEmail: registration.email,
        participantPhone: registration.phoneNumber,
        ticketName: ticket.name,
        ticketPrice: parseFloat(ticket.price),
        totalAmount: parseFloat(registration.amountPaid),
        qrCode: registration.qrCode,
        registrationId: registration.id,
        paymentStatus: registration.paymentStatus,
        isFreeEvent: parseFloat(ticket.price) === 0,
        eventSlug: event.slug,
        sessionId: session?.id || null
      };

      // Enviar email
      const emailSent = await EmailService.sendRegistrationConfirmation(emailData);
      
      if (emailSent) {
        console.log('✅ Email de confirmação enviado com sucesso para:', registration.email);
      } else {
        console.error('❌ Falha ao enviar email de confirmação para:', registration.email);
      }
    } catch (error) {
      console.error('❌ Erro ao enviar email de confirmação:', error);
      // Não falhar o processo principal se o email falhar
    }
  }
}
