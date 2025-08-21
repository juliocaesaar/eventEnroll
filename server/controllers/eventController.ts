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
      const userId = req.user.claims.sub;
      const events = await storage.getUserEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  }

  static async createEvent(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      
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

      // Convert string dates to Date objects
      const bodyData = { ...req.body };
      if (bodyData.startDate && typeof bodyData.startDate === 'string') {
        bodyData.startDate = new Date(bodyData.startDate);
      }
      if (bodyData.endDate && typeof bodyData.endDate === 'string') {
        bodyData.endDate = new Date(bodyData.endDate);
      }
      
      const eventData = insertEventSchema.parse({
        ...bodyData,
        organizerId: userId,
        slug: generateSlug(req.body.title),
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Convert string dates to Date objects for updates
      const bodyData = { ...req.body };
      if (bodyData.startDate && typeof bodyData.startDate === 'string') {
        bodyData.startDate = new Date(bodyData.startDate);
      }
      if (bodyData.endDate && typeof bodyData.endDate === 'string') {
        bodyData.endDate = new Date(bodyData.endDate);
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
      
      const userId = req.user.claims.sub;
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
      
      const userId = req.user.claims.sub;
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
      
      const userId = req.user.claims.sub;
      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const ticketData = insertTicketSchema.parse({
        ...req.body,
        eventId: req.params.eventId,
      });
      
      const ticket = await storage.createTicket(ticketData);
      res.json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create ticket" });
      }
    }
  }

  // Registration methods
  static async getEventRegistrations(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const userId = req.user.claims.sub;
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

  static async registerForEvent(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const registrationData = insertRegistrationSchema.parse({
        ...req.body,
        eventId: req.params.eventId,
      });
      
      const registration = await storage.createRegistration(registrationData);
      res.json(registration);
    } catch (error) {
      console.error("Error creating registration:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create registration" });
      }
    }
  }

  static async getEventAnalytics(req: any, res: Response) {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const userId = req.user.claims.sub;
      if (event.organizerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const analytics = await storage.getEventAnalytics(req.params.eventId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
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