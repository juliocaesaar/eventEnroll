import {
  users,
  userSubscriptions,
  events,
  tickets,
  registrations,
  templates,
  eventCategories,
  type User,
  type UpsertUser,
  type UserSubscription,
  type InsertUserSubscription,
  type Event,
  type InsertEvent,
  type Ticket,
  type InsertTicket,
  type Registration,
  type InsertRegistration,
  type Template,
  type InsertTemplate,
  type EventCategory,
  type InsertEventCategory,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User>;
  
  // Subscription operations
  getUserSubscription(userId: string): Promise<UserSubscription | undefined>;
  updateUserSubscription(userId: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription>;
  
  // Usage counting for plan limits
  getUserEventCount(userId: string): Promise<number>;
  getUserTemplateCount(userId: string): Promise<number>;
  
  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  getUserEvents(userId: string): Promise<Event[]>;
  deleteEvent(id: string): Promise<void>;
  
  // Ticket operations
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, ticket: Partial<InsertTicket>): Promise<Ticket>;
  getEventTickets(eventId: string): Promise<Ticket[]>;
  deleteTicket(id: string): Promise<void>;
  
  // Registration operations
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  updateRegistration(id: string, registration: Partial<InsertRegistration>): Promise<Registration>;
  getEventRegistrations(eventId: string): Promise<Registration[]>;
  getUserRegistrations(userId: string): Promise<Registration[]>;
  getRegistration(id: string): Promise<Registration | undefined>;
  
  // Template operations
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplates(): Promise<Template[]>;
  getTemplatesByCategory(categoryId: string): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  
  // Category operations
  getEventCategories(): Promise<EventCategory[]>;
  createEventCategory(category: InsertEventCategory): Promise<EventCategory>;
  
  // Analytics operations
  getUserStats(userId: string): Promise<{
    totalEvents: number;
    totalParticipants: number;
    totalRevenue: string;
    conversionRate: string;
  }>;
  
  getEventAnalytics(eventId: string): Promise<{
    registrations: number;
    revenue: string;
    capacity: number;
    conversionRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Subscription operations
  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));
    return subscription;
  }

  async updateUserSubscription(userId: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription> {
    const existingSubscription = await this.getUserSubscription(userId);
    
    if (existingSubscription) {
      const [subscription] = await db
        .update(userSubscriptions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userSubscriptions.userId, userId))
        .returning();
      return subscription;
    } else {
      const [subscription] = await db
        .insert(userSubscriptions)
        .values({ ...data, userId })
        .returning();
      return subscription;
    }
  }

  // Usage counting for plan limits
  async getUserEventCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(eq(events.organizerId, userId));
    return result[0]?.count || 0;
  }

  async getUserTemplateCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(templates)
      .where(eq(templates.categoryId, userId)); // assuming user can create custom templates
    return result[0]?.count || 0;
  }

  // Event operations
  async createEvent(eventData: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(eventData).returning();
    return event;
  }

  async updateEvent(id: string, eventData: Partial<InsertEvent>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set({ ...eventData, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.slug, slug));
    return event;
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.organizerId, userId))
      .orderBy(desc(events.createdAt));
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Ticket operations
  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    const [ticket] = await db.insert(tickets).values(ticketData).returning();
    return ticket;
  }

  async updateTicket(id: string, ticketData: Partial<InsertTicket>): Promise<Ticket> {
    const [ticket] = await db
      .update(tickets)
      .set({ ...ticketData, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket;
  }

  async getEventTickets(eventId: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.eventId, eventId))
      .orderBy(tickets.createdAt);
  }

  async deleteTicket(id: string): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  // Registration operations
  async createRegistration(registrationData: InsertRegistration): Promise<Registration> {
    const qrCode = `REG-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const [registration] = await db
      .insert(registrations)
      .values({ ...registrationData, qrCode })
      .returning();
    return registration;
  }

  async updateRegistration(id: string, registrationData: Partial<InsertRegistration>): Promise<Registration> {
    const [registration] = await db
      .update(registrations)
      .set({ ...registrationData, updatedAt: new Date() })
      .where(eq(registrations.id, id))
      .returning();
    return registration;
  }

  async getEventRegistrations(eventId: string): Promise<Registration[]> {
    return await db
      .select()
      .from(registrations)
      .where(eq(registrations.eventId, eventId))
      .orderBy(desc(registrations.createdAt));
  }

  async getUserRegistrations(userId: string): Promise<Registration[]> {
    return await db
      .select()
      .from(registrations)
      .where(eq(registrations.userId, userId))
      .orderBy(desc(registrations.createdAt));
  }

  async getRegistration(id: string): Promise<Registration | undefined> {
    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, id));
    return registration;
  }

  // Template operations
  async createTemplate(templateData: InsertTemplate): Promise<Template> {
    const [template] = await db.insert(templates).values(templateData).returning();
    return template;
  }

  async getTemplates(): Promise<Template[]> {
    return await db
      .select()
      .from(templates)
      .where(eq(templates.isPublic, true))
      .orderBy(templates.createdAt);
  }

  async getTemplatesByCategory(categoryId: string): Promise<Template[]> {
    return await db
      .select()
      .from(templates)
      .where(and(eq(templates.categoryId, categoryId), eq(templates.isPublic, true)))
      .orderBy(templates.createdAt);
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  // Category operations
  async getEventCategories(): Promise<EventCategory[]> {
    return await db.select().from(eventCategories).orderBy(eventCategories.name);
  }

  async createEventCategory(categoryData: InsertEventCategory): Promise<EventCategory> {
    const [category] = await db.insert(eventCategories).values(categoryData).returning();
    return category;
  }

  // Analytics operations
  async getUserStats(userId: string): Promise<{
    totalEvents: number;
    totalParticipants: number;
    totalRevenue: string;
    conversionRate: string;
  }> {
    // Get total events
    const eventCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(eq(events.organizerId, userId));

    // Get total participants and revenue
    const registrationStats = await db
      .select({
        count: sql<number>`count(*)`,
        revenue: sql<number>`sum(${registrations.amountPaid})`
      })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .where(
        and(
          eq(events.organizerId, userId),
          eq(registrations.paymentStatus, 'paid')
        )
      );

    const totalEvents = eventCount[0]?.count || 0;
    const totalParticipants = registrationStats[0]?.count || 0;
    const totalRevenue = registrationStats[0]?.revenue || 0;

    return {
      totalEvents,
      totalParticipants,
      totalRevenue: new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(totalRevenue),
      conversionRate: totalEvents > 0 ? `${Math.round((totalParticipants / (totalEvents * 100)) * 100)}%` : '0%',
    };
  }

  async getEventAnalytics(eventId: string): Promise<{
    registrations: number;
    revenue: string;
    capacity: number;
    conversionRate: number;
  }> {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    
    const registrationStats = await db
      .select({
        count: sql<number>`count(*)`,
        revenue: sql<number>`sum(${registrations.amountPaid})`
      })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, eventId),
          eq(registrations.paymentStatus, 'paid')
        )
      );

    const registrationCount = registrationStats[0]?.count || 0;
    const totalRevenue = registrationStats[0]?.revenue || 0;
    const capacity = event?.capacity || 0;
    const conversionRate = capacity > 0 ? Math.round((registrationCount / capacity) * 100) : 0;

    return {
      registrations: registrationCount,
      revenue: new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(totalRevenue),
      capacity,
      conversionRate,
    };
  }
}

export const storage = new DatabaseStorage();
