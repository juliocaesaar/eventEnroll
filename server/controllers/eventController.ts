import { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { createPaymentLink, createMultiTicketPaymentLink } from "../config/stripe";
import { PlanService } from "../services/planService";
import { 
  insertEventSchema, 
  insertTicketSchema, 
  updateTicketSchema,
  insertRegistrationSchema,
  type InsertEventSchema,
  type InsertTicketSchema,
  type InsertRegistrationSchema,
} from "@shared/schema";
import { 
  sendPusherNotification, 
  sendPusherNotificationToChannels,
  getEventChannel, 
  getUserChannel, 
  PUSHER_EVENTS 
} from "../config/pusher";
import { NotificationService } from "../services/notificationService";

export class EventController {
  // Teste do Pusher
  static async testPusher(req: any, res: Response) {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log('=== TESTE PUSHER ===');
      console.log('User ID:', userId);

      // Testar envio de notificação
      const testData = {
        message: 'Teste de notificação Pusher',
        timestamp: new Date().toISOString(),
        userId: userId
      };

      // Enviar para canal do usuário
      await sendPusherNotification(getUserChannel(userId), 'test_notification', testData, userId);

      res.json({ 
        success: true, 
        message: 'Teste enviado com sucesso',
        userId: userId,
        channel: getUserChannel(userId)
      });
    } catch (error: any) {
      console.error('Erro no teste Pusher:', error);
      res.status(500).json({ message: "Erro no teste", error: error?.message || 'Unknown error' });
    }
  }

  // Pusher authentication endpoint
  static async authenticatePusher(req: any, res: Response) {
    try {
      console.log('=== PUSHER AUTH REQUEST ===');
      console.log('Body:', req.body);
      console.log('Session:', req.session);
      console.log('URL:', req.url);
      console.log('Content-Type:', req.headers['content-type']);
      
      // Extrair socket_id e channel_name do body
      let socket_id, channel_name;
      
      // Se o body está vazio, tentar parsing manual
      if (!req.body || Object.keys(req.body).length === 0) {
        console.log('🔍 Body vazio, tentando parsing manual...');
        
        // Verificar se há dados raw no body
        if (req.body && typeof req.body.toString === 'function') {
          const bodyString = req.body.toString();
          console.log('Body String:', bodyString);
          
          // Se o body é um objeto vazio, tentar acessar o raw body
          if (bodyString === '[object Object]' || bodyString === '{}') {
            console.log('🔍 Body é objeto vazio, tentando acessar raw body...');
            
            // Tentar acessar o raw body diretamente
            const rawBody = (req as any).rawBody;
            if (rawBody) {
              console.log('Raw Body encontrado:', rawBody.toString());
              const params = new URLSearchParams(rawBody.toString());
              socket_id = params.get('socket_id');
              channel_name = params.get('channel_name');
              console.log('Parsed socket_id:', socket_id);
              console.log('Parsed channel_name:', channel_name);
            } else {
              console.log('❌ Raw body não encontrado');
            }
          } else if (bodyString && bodyString !== '[object Object]') {
            const params = new URLSearchParams(bodyString);
            socket_id = params.get('socket_id');
            channel_name = params.get('channel_name');
            console.log('Parsed socket_id:', socket_id);
            console.log('Parsed channel_name:', channel_name);
          }
        }
      } else {
        // Body normal
        socket_id = req.body.socket_id;
        channel_name = req.body.channel_name;
      }
      
      const userId = req.session?.user?.id;

      console.log('Socket ID:', socket_id);
      console.log('Channel Name:', channel_name);
      console.log('User ID:', userId);

      // Para debug, usar um userId fixo se não houver sessão
      const debugUserId = userId;
      console.log('Using User ID:', debugUserId);

      if (!socket_id || !channel_name) {
        console.log('❌ Missing socket_id or channel_name');
        console.log('Available body keys:', Object.keys(req.body || {}));
        return res.status(400).json({ message: "Missing socket_id or channel_name" });
      }

      // Verificar se o usuário tem acesso ao canal
      if (channel_name.startsWith('private-user-')) {
        const channelUserId = channel_name.replace('private-user-', '');
        console.log('Channel User ID:', channelUserId);
        console.log('Current User ID:', debugUserId);
        
        if (channelUserId !== debugUserId) {
          console.log('❌ User ID mismatch for private-user channel');
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      if (channel_name.startsWith('private-event-')) {
        const eventId = channel_name.replace('private-event-', '');
        console.log('Event ID:', eventId);
        
        // Verificar se o usuário tem acesso ao evento
        const event = await storage.getEvent(eventId);
        if (!event || event.organizerId !== debugUserId) {
          console.log('❌ User does not have access to event');
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      // Autenticar com Pusher
      console.log('🔐 Authenticating with Pusher...');
      const pusher = require('../config/pusher').pusher;
      
      const auth = pusher.authenticate(socket_id, channel_name, {
        id: debugUserId,
        user_info: {
          name: req.session?.user?.name || 'User'
        }
      });

      console.log('✅ Pusher authentication successful');
      console.log('Auth response:', auth);
      
      res.json(auth);
    } catch (error: any) {
      console.error('❌ Pusher authentication error:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        body: req.body,
        session: req.session
      });
      res.status(500).json({ message: "Authentication failed", error: error?.message });
    }
  }

  static async getUserEvents(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      
      console.log('=== GET USER EVENTS ===');
      console.log('UserId:', userId);
      console.log('UserRole:', userRole);
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      let events = [];
      
      if (userRole === 'admin') {
        // Admin pode ver todos os eventos
        events = await storage.getAllEvents();
      } else if (userRole === 'organizer') {
        // Organizador vê apenas seus eventos
        events = await storage.getUserEvents(userId);
      } else if (userRole === 'manager') {
        // Gestor vê eventos dos grupos que gerencia
        events = await storage.getUserManagedEvents(userId);
      } else {
        // Usuário comum não vê eventos
        events = [];
      }
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  }

  static async createEvent(req: any, res: Response) {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Check plan limits
      const subscription = await storage.getUserSubscription(userId);
      const planId = subscription?.planId || 'free';
      const currentEventCount = await storage.getUserEventCount(userId);
      
      if (!PlanService.canPerformAction(planId, 'events', currentEventCount)) {
        return res.status(403).json({ 
          message: "Limite de eventos atingido para seu plano atual",
          planLimitReached: true 
        });
      }

      // Convert and validate input data
      const bodyData = { ...req.body };
      
      // Convert string dates to Date objects
      if (bodyData.startDate && typeof bodyData.startDate === 'string') {
        bodyData.startDate = new Date(bodyData.startDate);
      }
      if (bodyData.endDate && typeof bodyData.endDate === 'string') {
        bodyData.endDate = new Date(bodyData.endDate);
      }
      
      // Validate categoryId exists and is not empty
      if (!bodyData.categoryId || bodyData.categoryId.trim() === '') {
        return res.status(400).json({ 
          message: "Categoria é obrigatória",
          errors: [{ path: ['categoryId'], message: 'Category ID is required' }]
        });
      }
      
      // Validate dates are valid (only if provided)
      if (bodyData.startDate && isNaN(bodyData.startDate.getTime())) {
        return res.status(400).json({ 
          message: "Data de início inválida",
          errors: [{ path: ['startDate'], message: 'Invalid start date' }]
        });
      }
      
      if (bodyData.endDate && isNaN(bodyData.endDate.getTime())) {
        return res.status(400).json({ 
          message: "Data de fim inválida",
          errors: [{ path: ['endDate'], message: 'Invalid end date' }]
        });
      }
      
      // Log for debugging
      console.log('Creating event with data:', {
        title: bodyData.title,
        categoryId: bodyData.categoryId,
        startDate: bodyData.startDate,
        endDate: bodyData.endDate,
        capacity: bodyData.capacity
      });
      
      const eventData = insertEventSchema.parse({
        ...bodyData,
        organizerId: userId,
        slug: bodyData.title?.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim() + '-' + Date.now(),
        status: 'active', // Set as active by default so it's publicly accessible
      });
      
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create event" });
      }
    }
  }

  static async getEvent(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if user owns the event
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  }

  static async updateEvent(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if user owns the event
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Convert and validate update data
      const bodyData = { ...req.body };
      
      // Convert string dates to Date objects for updates
      if (bodyData.startDate && typeof bodyData.startDate === 'string') {
        bodyData.startDate = new Date(bodyData.startDate);
      }
      if (bodyData.endDate && typeof bodyData.endDate === 'string') {
        bodyData.endDate = new Date(bodyData.endDate);
      }
      
      // Validate dates if provided (only if provided)
      if (bodyData.startDate && isNaN(bodyData.startDate.getTime())) {
        return res.status(400).json({ 
          message: "Data de início inválida",
          errors: [{ path: ['startDate'], message: 'Invalid start date' }]
        });
      }
      
      if (bodyData.endDate && isNaN(bodyData.endDate.getTime())) {
        return res.status(400).json({ 
          message: "Data de fim inválida",
          errors: [{ path: ['endDate'], message: 'Invalid end date' }]
        });
      }
      
      const updateData = insertEventSchema.partial().parse(bodyData);
      const updatedEvent = await storage.updateEvent(req.params.id, updateData);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update event" });
      }
    }
  }

  static async deleteEvent(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteEvent(req.params.id);
      res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  }

  // Ticket methods
  static async getEventTickets(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const tickets = await storage.getEventTickets(req.params.eventId);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  }

  static async createTicket(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Convert and validate data
      const ticketData = {
        ...req.body,
        eventId: req.params.eventId,
        price: req.body.price ? String(req.body.price) : "0",
        salesStart: req.body.salesStart ? new Date(req.body.salesStart) : null,
        salesEnd: req.body.salesEnd ? new Date(req.body.salesEnd) : null
      };
      
      const validatedData = insertTicketSchema.parse(ticketData);
      
      const ticket = await storage.createTicket(validatedData);
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create ticket" });
      }
    }
  }
  
  static async updateTicket(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Convert and validate data (same as createTicket)
      const ticketData = {
        ...req.body,
        price: req.body.price ? String(req.body.price) : undefined,
        salesStart: req.body.salesStart ? new Date(req.body.salesStart) : undefined,
        salesEnd: req.body.salesEnd ? new Date(req.body.salesEnd) : undefined
      };
      
      const validatedData = updateTicketSchema.parse(ticketData);
      const ticket = await storage.updateTicket(req.params.ticketId, validatedData);
      res.json(ticket);
    } catch (error) {
      console.error("Error updating ticket:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update ticket" });
      }
    }
  }
  
  static async deleteTicket(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteTicket(req.params.ticketId);
      res.json({ success: true, message: "Ticket deleted successfully" });
    } catch (error) {
      console.error("Error deleting ticket:", error);
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  }

  // Public event methods
  static async getPublicEvent(req: any, res: Response) {
    try {
      console.log('getPublicEvent called with slug:', req.params.slug);
      const event = await storage.getEventBySlug(req.params.slug);
      console.log('Event found:', !!event, 'Status:', event?.status);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Accept active, draft, and published events
      if (event.status !== 'active' && event.status !== 'draft' && event.status !== 'published') {
        console.log('Event status not allowed:', event.status);
        return res.status(404).json({ message: "Event not found" });
      }
      
      console.log('Event status allowed, returning event');
      // Include category info
      const category = await storage.getEventCategory(event.categoryId);
      res.json({ ...event, category });
    } catch (error) {
      console.error("Error fetching public event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  }
  
  static async getPublicEventTickets(req: any, res: Response) {
    try {
      const event = await storage.getEventBySlug(req.params.slug);
      if (!event || (event.status !== 'active' && event.status !== 'published')) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const tickets = await storage.getEventTickets(event.id);
      // Only return active tickets that are still on sale
      const activeTickets = tickets.filter(ticket => 
        ticket.status === 'active' && 
        (!ticket.salesEnd || new Date(ticket.salesEnd) > new Date())
      );
      
      // Return only public-safe information
      const publicTickets = activeTickets.map(ticket => ({
        id: ticket.id,
        name: ticket.name,
        description: ticket.description,
        price: ticket.price,
        minPerOrder: ticket.minPerOrder,
        maxPerOrder: ticket.maxPerOrder,
        salesStart: ticket.salesStart,
        salesEnd: ticket.salesEnd,
        status: ticket.status
      }));
      
      res.json(publicTickets);
    } catch (error) {
      console.error("Error fetching public tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  }
  
  // Registrar para evento público
  static async publicRegisterForEvent(req: any, res: Response) {
    try {
      const { slug } = req.params;
      const bodyData = req.body;

      // Buscar evento
      const event = await storage.getEventBySlug(slug);
      if (!event || (event.status !== 'active' && event.status !== 'published')) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Validar dados de inscrição
      const registrationSchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phoneNumber: z.string().optional(),
        groupId: z.string().optional(),
        paymentType: z.enum(['installments', 'cash']).optional().default('installments'),
        tickets: z.array(z.object({
          ticketId: z.string(),
          quantity: z.number().min(1)
        })).min(1)
      });

      const validatedData = registrationSchema.parse(bodyData);

      // Verificar se os ingressos existem e calcular valor total
      let totalAmount = 0;
      const selectedTickets = [];

      console.log('=== DEBUG INSCRIÇÃO ===');
      console.log('Dados recebidos:', validatedData);
      console.log('Evento:', event.title);

      for (const ticketData of validatedData.tickets) {
        const ticket = await storage.getTicket(ticketData.ticketId);
        if (!ticket) {
          return res.status(400).json({ message: `Ticket ${ticketData.ticketId} not found` });
        }

        // Validações de segurança
        if (ticket.eventId !== event.id) {
          return res.status(400).json({ message: "Ticket does not belong to this event" });
        }

        if (ticket.status !== 'active') {
          return res.status(400).json({ message: "Ticket is not available for purchase" });
        }

        // Validar quantidade mínima e máxima
        if (ticketData.quantity < (ticket.minPerOrder || 1)) {
          return res.status(400).json({ 
            message: `Minimum quantity for this ticket is ${ticket.minPerOrder || 1}` 
          });
        }

        if (ticketData.quantity > (ticket.maxPerOrder || 10)) {
          return res.status(400).json({ 
            message: `Maximum quantity for this ticket is ${ticket.maxPerOrder || 10}` 
          });
        }

        // Validar se o ingresso ainda está em período de venda
        const now = new Date();
        
        // Se salesStart não estiver definido, considerar que as vendas já começaram
        if (ticket.salesStart && new Date(ticket.salesStart) > now) {
          return res.status(400).json({ message: "Ticket sales have not started yet" });
        }

        // Se salesEnd não estiver definido, considerar que as vendas não têm fim
        if (ticket.salesEnd && new Date(ticket.salesEnd) < now) {
          return res.status(400).json({ message: "Ticket sales have ended" });
        }
        
        console.log('Ingresso encontrado:', {
          id: ticket.id,
          name: ticket.name,
          price: ticket.price,
          priceType: typeof ticket.price,
          priceRaw: ticket.price,
          quantity: ticketData.quantity
        });
        
        // Calcular valor no backend (SEGURO - não confia no frontend)
        const ticketAmount = parseFloat(ticket.price || '0') * ticketData.quantity;
        console.log('Valor calculado no backend:', ticketAmount);
        console.log('Valor em centavos (Stripe):', Math.round(ticketAmount * 100));
        
        totalAmount += ticketAmount;
        
        selectedTickets.push({
          ...ticketData,
          ticket,
          amount: ticketAmount
        });
      }

      // Aplicar desconto de R$ 20,00 se for pagamento à vista
      if (validatedData.paymentType === 'cash' && totalAmount > 0) {
        totalAmount = Math.max(0, totalAmount - 20); // Não permitir valor negativo
        console.log('Desconto aplicado (à vista): R$ 20,00');
        console.log('Valor final após desconto:', totalAmount);
      }

      console.log('Total calculado:', totalAmount);
      console.log('Total em centavos (Stripe):', Math.round(totalAmount * 100));
      console.log('Tipo de pagamento:', validatedData.paymentType);
      console.log('=== FIM DEBUG INSCRIÇÃO ===');

      // Se o evento é gratuito, criar inscrição diretamente
      if (totalAmount === 0) {
        const registrationData = {
          eventId: event.id,
          ticketId: selectedTickets[0].ticketId,
          firstName: validatedData.name.split(' ')[0],
          lastName: validatedData.name.split(' ').slice(1).join(' ') || '',
          email: validatedData.email,
          phoneNumber: validatedData.phoneNumber || null,
          groupId: validatedData.groupId || null,
          status: 'confirmed',
          amountPaid: '0.00',
          qrCode: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };

        const registration = await storage.createRegistration(registrationData);

        // Send SSE notification for new registration
        console.log('=== ENVIANDO NOTIFICAÇÃO PUSHER ===');
        console.log('Event ID:', event.id);
        console.log('Event Organizer ID:', event.organizerId);
        console.log('Event Type:', PUSHER_EVENTS.NEW_REGISTRATION);
        
        // Construir nomes dos canais
        const eventChannel = getEventChannel(event.id);
        const userChannel = getUserChannel(event.organizerId);
        
        console.log('Event Channel Name:', eventChannel);
        console.log('User Channel Name:', userChannel);
        
        // Enviar para ambos os canais: evento e usuário organizador
        const channels = [eventChannel, userChannel];
        
        await sendPusherNotificationToChannels(channels, PUSHER_EVENTS.NEW_REGISTRATION, {
          registration: {
            id: registration.id,
            firstName: registration.firstName,
            lastName: registration.lastName,
            email: registration.email,
            status: registration.status,
            paymentStatus: registration.paymentStatus,
            amountPaid: registration.amountPaid,
            createdAt: registration.createdAt
          },
          event: {
            id: event.id,
            title: event.title
          }
        });

        return res.json({
          success: true,
          message: "Inscrição confirmada para evento gratuito",
          registration: {
            id: registration.id,
            status: 'confirmed',
            qrCode: registration.qrCode
          },
          totalAmount: 0,
          isFreeEvent: true
        });
      }

      // Para eventos pagos, criar inscrição confirmada e plano de pagamento em parcelas
      try {
        // Criar inscrição confirmada (usuário entra no parcelamento)
        const registrationData = {
          eventId: event.id,
          ticketId: selectedTickets[0].ticketId,
          firstName: validatedData.name.split(' ')[0],
          lastName: validatedData.name.split(' ').slice(1).join(' ') || '',
          email: validatedData.email,
          phoneNumber: validatedData.phoneNumber || null,
          groupId: validatedData.groupId || null,
          status: 'confirmed',
          paymentStatus: 'installment_plan', // Status para parcelamento
          amountPaid: '0.00',
          totalAmount: totalAmount.toString(),
          currency: 'BRL',
          paymentGateway: 'pix_installments',
          qrCode: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };

        const registration = await storage.createRegistration(registrationData);

        // Criar plano de pagamento automático em parcelas mensais
        const { PaymentService } = await import('../services/paymentService');
        
        // Configurar parcelamento baseado no tipo de pagamento
        const installmentCount = validatedData.paymentType === 'cash' ? 1 : (event.pixInstallments || 12);
        const firstInstallmentDate = new Date();
        if (validatedData.paymentType !== 'cash') {
          firstInstallmentDate.setMonth(firstInstallmentDate.getMonth() + 1); // Próximo mês para parcelamento
        }
        
        // Criar plano de pagamento para esta inscrição
        const paymentPlan = await storage.createEventPaymentPlan({
          eventId: event.id,
          name: validatedData.paymentType === 'cash' ? `Pagamento à Vista - ${validatedData.name}` : `Parcelamento - ${validatedData.name}`,
          description: validatedData.paymentType === 'cash' 
            ? `Pagamento à vista com desconto para ${validatedData.name}`
            : `Plano de pagamento em ${installmentCount} parcelas mensais para ${validatedData.name}`,
          installmentCount,
          installmentInterval: 'monthly',
          firstInstallmentDate,
          discountPolicy: {
            earlyPaymentDiscount: {
              enabled: true,
              daysBeforeDue: 5,
              percentage: 5,
              description: '5% de desconto para pagamento antecipado'
            }
          },
          lateFeePolicy: {
            enabled: true,
            gracePeriodDays: 5,
            fixedFee: 10.00,
            interestRate: 2.0,
            description: 'Multa de R$ 10,00 + 2% ao mês após 5 dias de atraso'
          },
          isDefault: false,
          status: 'active',
        });

        // Gerar parcelas para esta inscrição
        const installments = await PaymentService.createInstallmentsForRegistration(
          registration,
          paymentPlan
        );

        // Atualizar inscrição com o plano de pagamento
        await storage.updateRegistration(registration.id, {
          paymentPlanId: paymentPlan.id,
        });

        // Send SSE notification for new pending registration
        console.log('=== ENVIANDO NOTIFICAÇÃO PUSHER ===');
        console.log('Event ID:', event.id);
        console.log('Event Organizer ID:', event.organizerId);
        console.log('Event Type:', PUSHER_EVENTS.NEW_REGISTRATION);
        
        // Construir nomes dos canais
        const eventChannel = getEventChannel(event.id);
        const userChannel = getUserChannel(event.organizerId);
        
        console.log('Event Channel Name:', eventChannel);
        console.log('User Channel Name:', userChannel);
        
        // Enviar para ambos os canais: evento e usuário organizador
        const channels = [eventChannel, userChannel];
        
        await sendPusherNotificationToChannels(channels, PUSHER_EVENTS.NEW_REGISTRATION, {
          registration: {
            id: registration.id,
            firstName: registration.firstName,
            lastName: registration.lastName,
            email: registration.email,
            status: registration.status,
            paymentStatus: registration.paymentStatus,
            amountPaid: registration.amountPaid,
            createdAt: registration.createdAt
          },
          event: {
            id: event.id,
            title: event.title
          }
        });

        // Enviar email de confirmação de inscrição
        try {
          await NotificationService.sendRegistrationConfirmation(registration.id);
        } catch (emailError) {
          console.error('Erro ao enviar email de confirmação:', emailError);
          // Não falhar a inscrição por erro de email
        }

        // Redirecionar para página de confirmação PIX
        const paymentConfirmationUrl = `/payment/confirmation?registrationId=${registration.id}&eventSlug=${event.slug}`;

        return res.json({
          success: true,
          message: validatedData.paymentType === 'cash' 
            ? "Inscrição confirmada! Pagamento à vista com desconto aplicado."
            : `Inscrição confirmada! Você foi incluído em um plano de pagamento em ${installmentCount} parcelas mensais.`,
          paymentUrl: paymentConfirmationUrl,
          registrationId: registration.id,
          totalAmount: totalAmount,
          isFreeEvent: false,
          installmentPlan: {
            totalInstallments: installmentCount,
            monthlyAmount: (totalAmount / installmentCount).toFixed(2),
            firstDueDate: firstInstallmentDate.toISOString().split('T')[0],
            paymentPlanId: paymentPlan.id
          },
          registrations: [{
            id: registration.id,
            firstName: registration.firstName,
            lastName: registration.lastName,
            email: registration.email,
            phoneNumber: registration.phoneNumber,
            status: registration.status,
            amountPaid: registration.amountPaid,
            totalAmount: registration.totalAmount,
            qrCode: registration.qrCode,
            createdAt: registration.createdAt,
          }]
        });

      } catch (pixError) {
        console.error('Erro ao criar inscrição PIX:', pixError);
        return res.status(500).json({ 
          message: "Erro ao processar inscrição. Tente novamente." 
        });
      }

    } catch (error: any) {
      console.error('Erro na inscrição pública:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
  
  
  static async getEventAnalytics(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get analytics data
      const registrations = await storage.getEventRegistrations(req.params.eventId);
      const tickets = await storage.getEventTickets(req.params.eventId);
      
      // Calculate metrics
      const totalRegistrations = registrations.length;
      const totalRevenue = registrations.reduce((sum: number, reg: any) => sum + parseFloat(reg.amount || 0), 0);
      const avgTicketValue = totalRevenue / (totalRegistrations || 1);
      
      // Group by ticket type
      const ticketStats = tickets.map((ticket: any) => ({
        name: ticket.name,
        sold: ticket.sold || 0,
        revenue: (ticket.sold || 0) * parseFloat(ticket.price || 0)
      }));
      
      // Mock additional analytics (in real app, get from proper analytics service)
      const analytics = {
        overview: {
          totalRegistrations,
          totalRevenue,
          avgTicketValue,
          conversionRate: 8.5, // Mock
          registrationsGrowth: 12.5, // Mock
          revenueGrowth: 18.2 // Mock
        },
        ticketTypes: ticketStats,
        registrationsByDay: [], // Mock - would calculate from registration dates
        trafficSources: [] // Mock - would get from analytics service
      };
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  }

  static async registerForEvent(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const { name, email, phone, document, tickets } = req.body;
      
      if (!name || !email || !tickets || tickets.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const registrations = [];
      let totalAmount = 0;
      
      // Process each ticket type and quantity
      for (const ticketRequest of tickets) {
        const ticket = await storage.getTicket(ticketRequest.ticketId);
        if (!ticket) {
          return res.status(404).json({ message: `Ticket not found: ${ticketRequest.ticketId}` });
        }
        
        totalAmount += parseFloat(ticket.price || '0') * ticketRequest.quantity;
        
        // Create registration for each ticket quantity
        for (let i = 0; i < ticketRequest.quantity; i++) {
          const registration = await storage.createRegistration({
            eventId: event.id,
            ticketId: ticket.id,
            email: email,
            firstName: name.split(' ')[0] || name,
            lastName: name.split(' ').slice(1).join(' ') || '',
            phoneNumber: phone,
            customFields: { document: document },
            status: totalAmount > 0 ? 'pending_payment' : 'confirmed',
            paymentStatus: totalAmount > 0 ? 'pending' : 'paid', // Definir baseado no valor
            amountPaid: String(parseFloat(ticket.price || '0')),
            currency: 'BRL',
          });
          registrations.push(registration);
        }
      }
      
      // For paid events, create mock payment (in production, integrate with Asaas)
      // Mock payment flow - in real implementation, create Asaas payment and return URL
      const mockPaymentId = `pay_${Date.now()}`;
      const mockPaymentUrl = `/payment/mock?amount=${totalAmount}&id=${mockPaymentId}&eventSlug=${event.slug}`;
      
      res.json({ 
        success: true,
        paymentUrl: mockPaymentUrl,
        paymentId: mockPaymentId,
        totalAmount,
        registrations 
      });
    } catch (error) {
      console.error("Error creating registration:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid registration data",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create registration" });
    }
  }


  static async checkinParticipant(req: any, res: Response) {
    try {
      const registration = await storage.getRegistration(req.params.registrationId);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      
      const event = await storage.getEvent(registration.eventId);
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (event?.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedRegistration = await storage.updateRegistration(req.params.registrationId, {
        status: 'checked_in',
        checkedInAt: new Date()
      });
      
      res.json(updatedRegistration);
    } catch (error) {
      console.error("Error checking in participant:", error);
      res.status(500).json({ message: "Failed to check in participant" });
    }
  }

  static async sendReminder(req: any, res: Response) {
    try {
      const registration = await storage.getRegistration(req.params.registrationId);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      
      const event = await storage.getEvent(registration.eventId);
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (event?.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      console.log(`📧 Sending reminder to ${registration.email} for event ${event?.title}`);
      
      res.json({ success: true, message: "Reminder sent successfully" });
    } catch (error) {
      console.error("Error sending reminder:", error);
      res.status(500).json({ message: "Failed to send reminder" });
    }
  }

  static async exportParticipants(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const registrations = await storage.getEventRegistrations(req.params.eventId);
      const format = req.params.format;
      
      if (format === 'csv') {
        const csvData = registrations.map((reg: any) => [
          `${reg.firstName} ${reg.lastName}`,
          reg.email,
          reg.phoneNumber || '',
          reg.customFields?.document || '',
          reg.ticket?.name || '',
          `R$ ${parseFloat(reg.amountPaid || 0).toFixed(2)}`,
          reg.status,
          reg.qrCode,
          new Date(reg.createdAt).toLocaleDateString('pt-BR')
        ]);
        
        const headers = [
          'Nome',
          'Email', 
          'Telefone',
          'Documento',
          'Tipo Ingresso',
          'Valor',
          'Status',
          'QR Code',
          'Data Inscrição'
        ];
        
        const csv = [headers, ...csvData]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="participantes-${event.slug}.csv"`);
        res.send(csv);
      } else {
        res.status(400).json({ message: "Unsupported export format" });
      }
    } catch (error) {
      console.error("Error exporting participants:", error);
      res.status(500).json({ message: "Failed to export participants" });
    }
  }

  // Registration methods
  static async getEventRegistrations(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const registrations = await storage.getEventRegistrations(req.params.eventId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  }

  // Get event participants with installments
  static async getEventParticipantsWithInstallments(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const participants = await storage.getEventParticipantsWithInstallments(req.params.eventId);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants with installments:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  }

  static async markInstallmentAsPaid(req: any, res: Response) {
    try {
      const { installmentId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verificar se a parcela existe e se o usuário tem permissão
      const installment = await storage.getInstallmentById(installmentId);
      if (!installment) {
        return res.status(404).json({ message: "Installment not found" });
      }

      // Verificar se o usuário tem permissão (organizador ou gestor do grupo)
      const registration = await storage.getRegistrationById(installment.registrationId);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Verificar se é organizador do evento
      const isOrganizer = event.organizerId === userId;
      
      // Verificar se é gestor do grupo (se a inscrição tem grupo)
      let isGroupManager = false;
      if (registration.groupId) {
        const hasGroupAccess = await storage.checkUserGroupAccess(userId, registration.groupId);
        if (hasGroupAccess) {
          // Verificar se tem permissão de pagamentos
          const managers = await storage.getGroupManagers(registration.groupId);
          const userManager = managers.find(m => m.userId === userId);
          if (userManager) {
            const userPermissions = Array.isArray(userManager.permissions) ? userManager.permissions : [];
            isGroupManager = userPermissions.includes('payments');
          }
        }
      }

      if (!isOrganizer && !isGroupManager) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Marcar parcela como paga
      await storage.markInstallmentAsPaid(installmentId, userId);

      res.json({ 
        success: true, 
        message: "Installment marked as paid successfully" 
      });
    } catch (error) {
      console.error("Error marking installment as paid:", error);
      res.status(500).json({ message: "Failed to mark installment as paid" });
    }
  }

  // Get a specific registration by ID
  static async getRegistration(req: Request, res: Response) {
    try {
      const registration = await storage.getRegistration(req.params.registrationId);
      
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      // Return the registration in the same format as the registration confirmation
      const response = {
        success: true,
        paymentUrl: '',
        paymentId: registration.id,
        totalAmount: parseFloat(registration.totalAmount || '0'),
        registrations: [{
          id: registration.id,
          firstName: registration.firstName,
          lastName: registration.lastName || '',
          email: registration.email,
          phoneNumber: registration.phoneNumber || '',
          status: registration.status,
          amountPaid: registration.amountPaid || '0.00',
          qrCode: registration.qrCode || `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: registration.createdAt,
        }]
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching registration:", error);
      res.status(500).json({ message: "Failed to fetch registration" });
    }
  }
}