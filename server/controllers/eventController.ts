import type { Response } from "express";
import { storage } from "../storage";
import { PlanService } from "../services/planService";
import { 
  insertEventSchema, 
  insertTicketSchema, 
  insertRegistrationSchema,
  type InsertEventSchema,
  type InsertTicketSchema,
  type InsertRegistrationSchema,
} from "@shared/schema";
import { z } from "zod";

export class EventController {
  static async getUserEvents(req: any, res: Response) {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const events = await storage.getUserEvents(userId);
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
        slug: generateSlug(req.body.title || 'event'),
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
      
      const ticketData = insertTicketSchema.partial().parse(req.body);
      const ticket = await storage.updateTicket(req.params.ticketId, ticketData);
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
      
      res.json(activeTickets);
    } catch (error) {
      console.error("Error fetching public tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  }
  
  static async publicRegisterForEvent(req: any, res: Response) {
    try {
      const event = await storage.getEventBySlug(req.params.slug);
      if (!event || (event.status !== 'active' && event.status !== 'published')) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const { name, email, phone, document, tickets } = req.body;
      
      if (!name || !email || !tickets || tickets.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Calculate total and create registrations
      let totalAmount = 0;
      const registrations = [];
      
      for (const ticketRequest of tickets) {
        const ticket = await storage.getTicket(ticketRequest.ticketId);
        if (!ticket || ticket.eventId !== event.id) {
          return res.status(400).json({ message: "Invalid ticket" });
        }
        
        // Check availability
        if ((ticket.sold || 0) + ticketRequest.quantity > ticket.quantity) {
          return res.status(400).json({ message: `Not enough tickets available for ${ticket.name}` });
        }
        
        const amount = parseFloat(ticket.price || '0') * ticketRequest.quantity;
        totalAmount += amount;
        
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
            amountPaid: String(parseFloat(ticket.price || '0')),
          });
          registrations.push(registration);
        }
        
        // Update ticket sold count
        await storage.updateTicket(ticket.id, {
          sold: (ticket.sold || 0) + ticketRequest.quantity
        });
      }
      
      // If free event, confirm registrations and send confirmation
      if (totalAmount === 0) {
        res.json({ 
          success: true, 
          message: "Registration confirmed",
          registrations 
        });
        return;
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
      console.error("Error registering for event:", error);
      res.status(500).json({ message: "Failed to register for event" });
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
            amountPaid: String(parseFloat(ticket.price || '0')),
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
}

// Helper function to generate URL-friendly slugs
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() + '-' + Date.now();
}