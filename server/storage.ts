import {
  users,
  userSubscriptions,
  events,
  tickets,
  registrations,
  templates,
  eventCategories,
  eventGroups,
  groupManagers,
  eventOrganizers,
  groupPermissions,
  eventPaymentPlans,
  paymentInstallments,
  paymentTransactions,
  notifications,
  notificationPreferences,
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
  type EventGroup,
  type InsertEventGroup,
  type GroupManager,
  type InsertGroupManager,
  type EventOrganizer,
  type InsertEventOrganizer,
  type GroupPermission,
  type InsertGroupPermission,
  type EventPaymentPlan,
  type InsertEventPaymentPlan,
  type PaymentInstallment,
  type InsertPaymentInstallment,
  type PaymentTransaction,
  type InsertPaymentTransaction,
  type Notification,
  type InsertNotification,
  type NotificationPreference,
  type InsertNotificationPreference,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  
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
  getTicket(id: string): Promise<Ticket | undefined>;
  
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

  // Event Groups operations
  createEventGroup(group: InsertEventGroup): Promise<EventGroup>;
  updateEventGroup(id: string, group: Partial<InsertEventGroup>): Promise<EventGroup>;
  getEventGroup(id: string): Promise<EventGroup | undefined>;
  getEventGroups(eventId: string): Promise<EventGroup[]>;
  deleteEventGroup(id: string): Promise<void>;

  // Group Managers operations
  createGroupManager(manager: InsertGroupManager): Promise<GroupManager>;
  updateGroupManager(id: string, manager: Partial<InsertGroupManager>): Promise<GroupManager>;
  getGroupManager(id: string): Promise<GroupManager | undefined>;
  getGroupManagers(groupId: string): Promise<GroupManager[]>;
  getUserGroupManagers(userId: string): Promise<(GroupManager & { group?: EventGroup })[]>;
  deleteGroupManager(id: string): Promise<void>;
  updateAllManagerPermissions(): Promise<number>;

  // Event Organizers operations
  createEventOrganizer(organizer: InsertEventOrganizer): Promise<EventOrganizer>;
  updateEventOrganizer(id: string, organizer: Partial<InsertEventOrganizer>): Promise<EventOrganizer>;
  getEventOrganizer(id: string): Promise<EventOrganizer | undefined>;
  getEventOrganizers(eventId: string): Promise<EventOrganizer[]>;
  getUserEventOrganizers(userId: string): Promise<(EventOrganizer & { event?: Event })[]>;
  deleteEventOrganizer(id: string): Promise<void>;

  // Group Dashboard operations
  getGroupParticipants(groupId: string): Promise<any[]>;
  getGroupPendingPayments(groupId: string): Promise<number>;
  getGroupTotalRevenue(groupId: string): Promise<number>;
  getGroupOverduePayments(groupId: string): Promise<number>;
  getGroupConfirmedParticipants(groupId: string): Promise<number>;
  checkUserGroupAccess(userId: string, groupId: string): Promise<boolean>;
  getGroupPayments(groupId: string): Promise<PaymentTransaction[]>;
  getUserEvents(userId: string): Promise<Event[]>;
  getAllEvents(): Promise<Event[]>;
  getUserManagedEvents(userId: string): Promise<Event[]>;

  // Group Permissions operations
  createGroupPermission(permission: InsertGroupPermission): Promise<GroupPermission>;
  getGroupPermission(id: string): Promise<GroupPermission | undefined>;
  getGroupPermissions(): Promise<GroupPermission[]>;

  // Event Payment Plans operations
  createEventPaymentPlan(plan: InsertEventPaymentPlan): Promise<EventPaymentPlan>;
  updateEventPaymentPlan(id: string, plan: Partial<InsertEventPaymentPlan>): Promise<EventPaymentPlan>;
  getEventPaymentPlan(id: string): Promise<EventPaymentPlan | undefined>;
  getEventPaymentPlans(eventId: string): Promise<EventPaymentPlan[]>;
  getDefaultEventPaymentPlan(eventId: string): Promise<EventPaymentPlan | undefined>;
  deleteEventPaymentPlan(id: string): Promise<void>;

  // Payment Installments operations
  createPaymentInstallment(installment: InsertPaymentInstallment): Promise<PaymentInstallment>;
  updatePaymentInstallment(id: string, installment: Partial<InsertPaymentInstallment>): Promise<PaymentInstallment>;
  getPaymentInstallment(id: string): Promise<PaymentInstallment | undefined>;
  getRegistrationInstallments(registrationId: string): Promise<PaymentInstallment[]>;
  getEventInstallments(eventId: string): Promise<PaymentInstallment[]>;
  getGroupInstallments(groupId: string): Promise<PaymentInstallment[]>;
  getOverdueInstallments(eventId?: string): Promise<PaymentInstallment[]>;
  getUpcomingInstallments(dueDate: Date): Promise<PaymentInstallment[]>;
  deletePaymentInstallment(id: string): Promise<void>;

  // Payment Transactions operations
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined>;
  getInstallmentTransactions(installmentId: string): Promise<PaymentTransaction[]>;
  getRegistrationTransactions(registrationId: string): Promise<PaymentTransaction[]>;

  // Payment Analytics operations
  getPaymentAnalytics(eventId: string): Promise<{
    totalExpected: string;
    totalPaid: string;
    totalRemaining: string;
    overdueAmount: string;
    overdueCount: number;
    paidCount: number;
    pendingCount: number;
  }>;

  // Notifications operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotification(id: string): Promise<Notification | undefined>;
  getUserNotifications(userId: string, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: string;
    eventId?: string;
    groupId?: string;
  }): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  archiveNotification(id: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Notification Preferences operations
  createNotificationPreference(preference: InsertNotificationPreference): Promise<NotificationPreference>;
  getNotificationPreference(userId: string): Promise<NotificationPreference | undefined>;
  updateNotificationPreference(userId: string, preference: Partial<InsertNotificationPreference>): Promise<NotificationPreference>;

  getGroupPaymentAnalytics(groupId: string): Promise<{
    totalExpected: string;
    totalPaid: string;
    totalRemaining: string;
    overdueAmount: string;
    overdueCount: number;
    paidCount: number;
    pendingCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          asaasCustomerId: userData.asaasCustomerId,
          currentPlan: userData.currentPlan,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    return allUsers;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Subscription operations
  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt));
    return subscription;
  }

  async updateUserSubscription(userId: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription> {
    const [subscription] = await db
      .update(userSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userSubscriptions.userId, userId))
      .returning();
    return subscription;
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
      .where(eq(templates.isPublic, true));
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

  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  // Registration operations
  async getRegistration(id: string): Promise<Registration | undefined> {
    const [registration] = await db.select().from(registrations).where(eq(registrations.id, id));
    return registration;
  }

  async updateRegistration(id: string, data: Partial<InsertRegistration>): Promise<Registration> {
    const [registration] = await db
      .update(registrations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(registrations.id, id))
      .returning();
    return registration;
  }
  
  async getEventAnalytics(eventId: string): Promise<any> {
    // Get registrations and calculate analytics
    const registrations = await this.getEventRegistrations(eventId);
    const tickets = await this.getEventTickets(eventId);
    
    const totalRegistrations = registrations.length;
    const totalRevenue = registrations.reduce((sum: number, reg: any) => sum + parseFloat(reg.amount || 0), 0);
    const avgTicketValue = totalRevenue / (totalRegistrations || 1);
    
    return {
      overview: {
        totalRegistrations,
        totalRevenue,
        avgTicketValue,
        conversionRate: 8.5, // Mock
        registrationsGrowth: 12.5, // Mock
        revenueGrowth: 18.2 // Mock
      },
      ticketTypes: tickets.map((ticket: any) => ({
        name: ticket.name,
        sold: ticket.sold || 0,
        revenue: (ticket.sold || 0) * parseFloat(ticket.price || 0)
      })),
      registrationsByDay: [], // Mock
      trafficSources: [] // Mock
    };
  }
  
  // Category operations
  async getEventCategory(id: string | null): Promise<EventCategory | undefined> {
    if (!id) return undefined;
    const [category] = await db.select().from(eventCategories).where(eq(eventCategories.id, id));
    return category;
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

  // Event Groups operations
  async createEventGroup(groupData: InsertEventGroup): Promise<EventGroup> {
    const [group] = await db.insert(eventGroups).values(groupData).returning();
    return group;
  }

  async updateEventGroup(id: string, groupData: Partial<InsertEventGroup>): Promise<EventGroup> {
    const [group] = await db
      .update(eventGroups)
      .set({ ...groupData, updatedAt: new Date() })
      .where(eq(eventGroups.id, id))
      .returning();
    return group;
  }

  async getEventGroup(id: string): Promise<EventGroup | undefined> {
    const [group] = await db.select().from(eventGroups).where(eq(eventGroups.id, id));
    return group;
  }

  async getEventGroups(eventId: string): Promise<EventGroup[]> {
    const groups = await db
      .select()
      .from(eventGroups)
      .where(eq(eventGroups.eventId, eventId))
      .orderBy(eventGroups.name);

    // Para cada grupo, calcular o número atual de participantes
    const groupsWithCount = await Promise.all(
      groups.map(async (group) => {
        const participants = await this.getGroupParticipants(group.id);
        return {
          ...group,
          currentCount: participants.length
        };
      })
    );

    return groupsWithCount;
  }

  async deleteEventGroup(id: string): Promise<void> {
    await db.delete(eventGroups).where(eq(eventGroups.id, id));
  }

  // Group Managers operations
  async createGroupManager(managerData: InsertGroupManager): Promise<GroupManager> {
    const [manager] = await db.insert(groupManagers).values(managerData).returning();
    return manager;
  }

  async updateGroupManager(id: string, managerData: Partial<InsertGroupManager>): Promise<GroupManager> {
    const [manager] = await db
      .update(groupManagers)
      .set({ ...managerData, updatedAt: new Date() })
      .where(eq(groupManagers.id, id))
      .returning();
    return manager;
  }

  async getGroupManager(id: string): Promise<GroupManager | undefined> {
    const [manager] = await db.select().from(groupManagers).where(eq(groupManagers.id, id));
    return manager;
  }

  async getGroupManagers(groupId: string): Promise<GroupManager[]> {
    try {
      console.log('=== GET GROUP MANAGERS DEBUG ===');
      console.log('GroupId:', groupId);
      
      const managers = await db
        .select()
        .from(groupManagers)
        .where(eq(groupManagers.groupId, groupId));
      
      console.log('Managers found:', managers);
      return managers;
    } catch (error) {
      console.error('Error fetching group managers:', error);
      return [];
    }
  }

  async getUserGroupManagers(userId: string): Promise<(GroupManager & { group?: EventGroup })[]> {
    const managers = await db
      .select()
      .from(groupManagers)
      .where(eq(groupManagers.userId, userId))
      .orderBy(desc(groupManagers.assignedAt));

    // Buscar dados dos grupos para cada manager
    const managersWithGroups = await Promise.all(
      managers.map(async (manager) => {
        const group = await this.getEventGroup(manager.groupId);
        return { ...manager, group };
      })
    );

    return managersWithGroups;
  }

  async deleteGroupManager(id: string): Promise<void> {
    await db.delete(groupManagers).where(eq(groupManagers.id, id));
  }

  async updateAllManagerPermissions(): Promise<number> {
    const result = await db
      .update(groupManagers)
      .set({ 
        permissions: ['read', 'write', 'participants', 'payments'],
        updatedAt: new Date()
      })
      .where(eq(groupManagers.role, 'manager'))
      .returning();
    
    return result.length;
  }

  // Event Organizers operations
  async createEventOrganizer(organizer: InsertEventOrganizer): Promise<EventOrganizer> {
    const [newOrganizer] = await db.insert(eventOrganizers).values(organizer).returning();
    return newOrganizer;
  }

  async updateEventOrganizer(id: string, organizer: Partial<InsertEventOrganizer>): Promise<EventOrganizer> {
    const [updatedOrganizer] = await db
      .update(eventOrganizers)
      .set({ ...organizer, updatedAt: new Date() })
      .where(eq(eventOrganizers.id, id))
      .returning();
    return updatedOrganizer;
  }

  async getEventOrganizer(id: string): Promise<EventOrganizer | undefined> {
    const [organizer] = await db.select().from(eventOrganizers).where(eq(eventOrganizers.id, id));
    return organizer;
  }

  async getEventOrganizers(eventId: string): Promise<EventOrganizer[]> {
    const organizers = await db
      .select()
      .from(eventOrganizers)
      .where(eq(eventOrganizers.eventId, eventId))
      .orderBy(eventOrganizers.assignedAt);
    return organizers;
  }

  async getUserEventOrganizers(userId: string): Promise<(EventOrganizer & { event?: Event })[]> {
    const organizers = await db
      .select({
        id: eventOrganizers.id,
        eventId: eventOrganizers.eventId,
        userId: eventOrganizers.userId,
        role: eventOrganizers.role,
        permissions: eventOrganizers.permissions,
        assignedAt: eventOrganizers.assignedAt,
        createdAt: eventOrganizers.createdAt,
        updatedAt: eventOrganizers.updatedAt,
        event: {
          id: events.id,
          title: events.title,
          description: events.description,
          slug: events.slug,
          status: events.status,
          startDate: events.startDate,
          endDate: events.endDate,
          organizerId: events.organizerId,
          categoryId: events.categoryId,
          timezone: events.timezone,
          venueName: events.venueName,
          venueAddress: events.venueAddress,
          onlineUrl: events.onlineUrl,
          capacity: events.capacity,
          templateId: events.templateId,
          customDomain: events.customDomain,
          seoSettings: events.seoSettings,
          pageComponents: events.pageComponents,
          imageUrl: events.imageUrl,
          whatsappNumber: events.whatsappNumber,
          pixUrl: events.pixUrl,
          pixKeyType: events.pixKeyType,
          pixKey: events.pixKey,
          pixInstallments: events.pixInstallments,
          createdAt: events.createdAt,
          updatedAt: events.updatedAt,
        }
      })
      .from(eventOrganizers)
      .leftJoin(events, eq(eventOrganizers.eventId, events.id))
      .where(eq(eventOrganizers.userId, userId))
      .orderBy(eventOrganizers.assignedAt);
    
    return organizers.map(organizer => ({
      ...organizer,
      event: organizer.event || undefined
    }));
  }

  async deleteEventOrganizer(id: string): Promise<void> {
    await db.delete(eventOrganizers).where(eq(eventOrganizers.id, id));
  }

  // Group Permissions operations
  async createGroupPermission(permissionData: InsertGroupPermission): Promise<GroupPermission> {
    const [permission] = await db.insert(groupPermissions).values(permissionData).returning();
    return permission;
  }

  async getGroupPermission(id: string): Promise<GroupPermission | undefined> {
    const [permission] = await db.select().from(groupPermissions).where(eq(groupPermissions.id, id));
    return permission;
  }

  async getGroupPermissions(): Promise<GroupPermission[]> {
    return await db.select().from(groupPermissions).orderBy(groupPermissions.name);
  }

  // Event Payment Plans operations
  async createEventPaymentPlan(planData: InsertEventPaymentPlan): Promise<EventPaymentPlan> {
    const [plan] = await db.insert(eventPaymentPlans).values(planData).returning();
    return plan;
  }

  async updateEventPaymentPlan(id: string, planData: Partial<InsertEventPaymentPlan>): Promise<EventPaymentPlan> {
    const [plan] = await db
      .update(eventPaymentPlans)
      .set({ ...planData, updatedAt: new Date() })
      .where(eq(eventPaymentPlans.id, id))
      .returning();
    return plan;
  }

  async getEventPaymentPlan(id: string): Promise<EventPaymentPlan | undefined> {
    const [plan] = await db.select().from(eventPaymentPlans).where(eq(eventPaymentPlans.id, id));
    return plan;
  }

  async getEventPaymentPlans(eventId: string): Promise<EventPaymentPlan[]> {
    return await db
      .select()
      .from(eventPaymentPlans)
      .where(eq(eventPaymentPlans.eventId, eventId))
      .orderBy(eventPaymentPlans.name);
  }

  async getDefaultEventPaymentPlan(eventId: string): Promise<EventPaymentPlan | undefined> {
    const [plan] = await db
      .select()
      .from(eventPaymentPlans)
      .where(and(
        eq(eventPaymentPlans.eventId, eventId),
        eq(eventPaymentPlans.isDefault, true)
      ));
    return plan;
  }

  async deleteEventPaymentPlan(id: string): Promise<void> {
    await db.delete(eventPaymentPlans).where(eq(eventPaymentPlans.id, id));
  }

  // Payment Installments operations
  async createPaymentInstallment(installmentData: InsertPaymentInstallment): Promise<PaymentInstallment> {
    const [installment] = await db.insert(paymentInstallments).values(installmentData).returning();
    return installment;
  }

  async updatePaymentInstallment(id: string, installmentData: Partial<InsertPaymentInstallment>): Promise<PaymentInstallment> {
    const [installment] = await db
      .update(paymentInstallments)
      .set({ ...installmentData, updatedAt: new Date() })
      .where(eq(paymentInstallments.id, id))
      .returning();
    return installment;
  }

  async getPaymentInstallment(id: string): Promise<PaymentInstallment | undefined> {
    const [installment] = await db.select().from(paymentInstallments).where(eq(paymentInstallments.id, id));
    return installment;
  }

  async getRegistrationInstallments(registrationId: string): Promise<PaymentInstallment[]> {
    return await db
      .select()
      .from(paymentInstallments)
      .where(eq(paymentInstallments.registrationId, registrationId))
      .orderBy(paymentInstallments.installmentNumber);
  }

  async getEventInstallments(eventId: string): Promise<PaymentInstallment[]> {
    return await db
      .select()
      .from(paymentInstallments)
      .innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id))
      .where(eq(registrations.eventId, eventId))
      .orderBy(paymentInstallments.dueDate);
  }

  async getGroupInstallments(groupId: string): Promise<PaymentInstallment[]> {
    return await db
      .select()
      .from(paymentInstallments)
      .innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id))
      .where(eq(registrations.groupId, groupId))
      .orderBy(paymentInstallments.dueDate);
  }

  async getOverdueInstallments(eventId?: string): Promise<PaymentInstallment[]> {
    const now = new Date();
    let query = db
      .select()
      .from(paymentInstallments)
      .where(and(
        eq(paymentInstallments.status, 'pending'),
        sql`${paymentInstallments.dueDate} < ${now}`
      ));

    if (eventId) {
      query = query
        .innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id))
        .where(and(
          eq(registrations.eventId, eventId),
          eq(paymentInstallments.status, 'pending'),
          sql`${paymentInstallments.dueDate} < ${now}`
        ));
    }

    return await query.orderBy(paymentInstallments.dueDate);
  }

  async getUpcomingInstallments(dueDate: Date): Promise<PaymentInstallment[]> {
    const startOfDay = new Date(dueDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(dueDate);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(paymentInstallments)
      .where(and(
        eq(paymentInstallments.status, 'pending'),
        gte(paymentInstallments.dueDate, startOfDay),
        lte(paymentInstallments.dueDate, endOfDay)
      ))
      .orderBy(paymentInstallments.dueDate);
  }

  async deletePaymentInstallment(id: string): Promise<void> {
    await db.delete(paymentInstallments).where(eq(paymentInstallments.id, id));
  }

  // Payment Transactions operations
  async createPaymentTransaction(transactionData: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [transaction] = await db.insert(paymentTransactions).values(transactionData).returning();
    return transaction;
  }

  async getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined> {
    const [transaction] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id));
    return transaction;
  }

  async getInstallmentTransactions(installmentId: string): Promise<PaymentTransaction[]> {
    return await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.installmentId, installmentId))
      .orderBy(desc(paymentTransactions.createdAt));
  }

  async getRegistrationTransactions(registrationId: string): Promise<PaymentTransaction[]> {
    return await db
      .select()
      .from(paymentTransactions)
      .innerJoin(paymentInstallments, eq(paymentTransactions.installmentId, paymentInstallments.id))
      .where(eq(paymentInstallments.registrationId, registrationId))
      .orderBy(desc(paymentTransactions.createdAt));
  }

  // Payment Analytics operations
  async getPaymentAnalytics(eventId: string): Promise<{
    totalExpected: string;
    totalPaid: string;
    totalRemaining: string;
    overdueAmount: string;
    overdueCount: number;
    paidCount: number;
    pendingCount: number;
  }> {
    const now = new Date();
    
    const [stats] = await db
      .select({
        totalExpected: sql<number>`COALESCE(SUM(${paymentInstallments.originalAmount}), 0)`,
        totalPaid: sql<number>`COALESCE(SUM(${paymentInstallments.paidAmount}), 0)`,
        totalRemaining: sql<number>`COALESCE(SUM(${paymentInstallments.remainingAmount}), 0)`,
        overdueAmount: sql<number>`COALESCE(SUM(CASE WHEN ${paymentInstallments.dueDate} < ${now} AND ${paymentInstallments.status} = 'pending' THEN ${paymentInstallments.remainingAmount} ELSE 0 END), 0)`,
        overdueCount: sql<number>`COUNT(CASE WHEN ${paymentInstallments.dueDate} < ${now} AND ${paymentInstallments.status} = 'pending' THEN 1 END)`,
        paidCount: sql<number>`COUNT(CASE WHEN ${paymentInstallments.status} = 'paid' THEN 1 END)`,
        pendingCount: sql<number>`COUNT(CASE WHEN ${paymentInstallments.status} = 'pending' THEN 1 END)`,
      })
      .from(paymentInstallments)
      .innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id))
      .where(eq(registrations.eventId, eventId));

    return {
      totalExpected: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalExpected),
      totalPaid: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalPaid),
      totalRemaining: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRemaining),
      overdueAmount: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.overdueAmount),
      overdueCount: stats.overdueCount,
      paidCount: stats.paidCount,
      pendingCount: stats.pendingCount,
    };
  }

  async getGroupPaymentAnalytics(groupId: string): Promise<{
    totalExpected: string;
    totalPaid: string;
    totalRemaining: string;
    overdueAmount: string;
    overdueCount: number;
    paidCount: number;
    pendingCount: number;
  }> {
    const now = new Date();
    
    const [stats] = await db
      .select({
        totalExpected: sql<number>`COALESCE(SUM(${paymentInstallments.originalAmount}), 0)`,
        totalPaid: sql<number>`COALESCE(SUM(${paymentInstallments.paidAmount}), 0)`,
        totalRemaining: sql<number>`COALESCE(SUM(${paymentInstallments.remainingAmount}), 0)`,
        overdueAmount: sql<number>`COALESCE(SUM(CASE WHEN ${paymentInstallments.dueDate} < ${now} AND ${paymentInstallments.status} = 'pending' THEN ${paymentInstallments.remainingAmount} ELSE 0 END), 0)`,
        overdueCount: sql<number>`COUNT(CASE WHEN ${paymentInstallments.dueDate} < ${now} AND ${paymentInstallments.status} = 'pending' THEN 1 END)`,
        paidCount: sql<number>`COUNT(CASE WHEN ${paymentInstallments.status} = 'paid' THEN 1 END)`,
        pendingCount: sql<number>`COUNT(CASE WHEN ${paymentInstallments.status} = 'pending' THEN 1 END)`,
      })
      .from(paymentInstallments)
      .innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id))
      .where(eq(registrations.groupId, groupId));

    return {
      totalExpected: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalExpected),
      totalPaid: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalPaid),
      totalRemaining: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRemaining),
      overdueAmount: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.overdueAmount),
      overdueCount: stats.overdueCount,
      paidCount: stats.paidCount,
      pendingCount: stats.pendingCount,
    };
  }

  // Notifications operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async getUserNotifications(userId: string, options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: string;
    eventId?: string;
    groupId?: string;
  } = {}): Promise<Notification[]> {
    const { limit = 50, offset = 0, unreadOnly = false, type, eventId, groupId } = options;
    
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));

    if (unreadOnly) {
      query = query.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    }

    if (type) {
      query = query.where(and(eq(notifications.userId, userId), eq(notifications.type, type)));
    }

    if (eventId) {
      query = query.where(and(eq(notifications.userId, userId), eq(notifications.eventId, eventId)));
    }

    if (groupId) {
      query = query.where(and(eq(notifications.userId, userId), eq(notifications.groupId, groupId)));
    }

    return await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async archiveNotification(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isArchived: true })
      .where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    
    return result.count;
  }

  // Notification Preferences operations
  async createNotificationPreference(preferenceData: InsertNotificationPreference): Promise<NotificationPreference> {
    const [preference] = await db.insert(notificationPreferences).values(preferenceData).returning();
    return preference;
  }

  async getNotificationPreference(userId: string): Promise<NotificationPreference | undefined> {
    const [preference] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    return preference;
  }

  async updateNotificationPreference(userId: string, preferenceData: Partial<InsertNotificationPreference>): Promise<NotificationPreference> {
    const [preference] = await db
      .update(notificationPreferences)
      .set({ ...preferenceData, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, userId))
      .returning();
    return preference;
  }

  // Group Dashboard operations
  async getGroupParticipants(groupId: string): Promise<any[]> {
    const participants = await db
      .select()
      .from(registrations)
      .where(eq(registrations.groupId, groupId))
      .orderBy(desc(registrations.createdAt));
    
    // Carregar parcelas para cada participante
    const participantsWithInstallments = await Promise.all(
      participants.map(async (participant) => {
        const installments = await db
          .select()
          .from(paymentInstallments)
          .where(eq(paymentInstallments.registrationId, participant.id))
          .orderBy(paymentInstallments.installmentNumber);
        
        return {
          ...participant,
          installments: installments.map(installment => ({
            id: installment.id,
            installmentNumber: installment.installmentNumber,
            amount: installment.originalAmount,
            dueDate: installment.dueDate,
            paidDate: installment.paidDate,
            status: installment.status
          }))
        };
      })
    );
    
    return participantsWithInstallments;
  }

  async getGroupParticipantById(groupId: string, participantId: string): Promise<any | null> {
    const participant = await db
      .select()
      .from(registrations)
      .where(
        and(
          eq(registrations.id, participantId),
          eq(registrations.groupId, groupId)
        )
      )
      .limit(1);
    
    if (participant.length === 0) {
      return null;
    }

    const participantData = participant[0];
    
    // Carregar parcelas
    const installments = await db
      .select()
      .from(paymentInstallments)
      .where(eq(paymentInstallments.registrationId, participantId))
      .orderBy(paymentInstallments.installmentNumber);
    
    // Calcular valores pagos
    let totalPaid = 0;
    const installmentsWithPayments = await Promise.all(
      installments.map(async (installment) => {
        // Buscar transações de pagamento para esta parcela
        const payments = await db
          .select()
          .from(paymentTransactions)
          .where(
            and(
              eq(paymentTransactions.installmentId, installment.id),
              eq(paymentTransactions.type, 'payment')
            )
          );
        
        const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        totalPaid += paidAmount;
        
        return {
          id: installment.id,
          installmentNumber: installment.installmentNumber,
          amount: installment.originalAmount,
          dueDate: installment.dueDate,
          paidDate: installment.paidDate,
          status: installment.status,
          paidAmount: paidAmount
        };
      })
    );
    
    // Carregar dados do grupo e evento
    const group = await db
      .select()
      .from(eventGroups)
      .where(eq(eventGroups.id, groupId))
      .limit(1);
    
    const event = group.length > 0 ? await db
      .select()
      .from(events)
      .where(eq(events.id, group[0].eventId))
      .limit(1) : [];
    
    return {
      ...participantData,
      amountPaid: totalPaid,
      totalAmount: installments.reduce((sum, inst) => sum + Number(inst.originalAmount), 0),
      installments: installmentsWithPayments,
      group: group[0] || null,
      event: event[0] || null
    };
  }

  // Event participants with installments
  async getEventParticipantsWithInstallments(eventId: string): Promise<any[]> {
    const participants = await db
      .select()
      .from(registrations)
      .where(eq(registrations.eventId, eventId))
      .orderBy(desc(registrations.createdAt));
    
    // Carregar parcelas para cada participante
    const participantsWithInstallments = await Promise.all(
      participants.map(async (participant) => {
        const installments = await db
          .select()
          .from(paymentInstallments)
          .where(eq(paymentInstallments.registrationId, participant.id))
          .orderBy(paymentInstallments.installmentNumber);
        
        
        return {
          ...participant,
          installments: installments.map(installment => ({
            id: installment.id,
            installmentNumber: installment.installmentNumber,
            amount: installment.originalAmount,
            dueDate: installment.dueDate,
            paidDate: installment.paidDate,
            status: installment.status
          }))
        };
      })
    );
    
    return participantsWithInstallments;
  }

  async getGroupPendingPayments(groupId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentInstallments)
      .innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id))
      .where(
        and(
          eq(registrations.groupId, groupId),
          eq(paymentInstallments.status, 'pending')
        )
      );
    return result[0]?.count || 0;
  }

  async getGroupTotalRevenue(groupId: string): Promise<number> {
    try {
      console.log('=== GET GROUP TOTAL REVENUE ===');
      console.log('GroupId:', groupId);
      
      // Buscar receita de parcelas pagas (transações)
      const installmentRevenue = await db
        .select({ total: sql<number>`coalesce(sum(${paymentTransactions.amount}), 0)` })
        .from(paymentTransactions)
        .innerJoin(paymentInstallments, eq(paymentTransactions.installmentId, paymentInstallments.id))
        .innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id))
        .where(
          and(
            eq(registrations.groupId, groupId),
            eq(paymentTransactions.type, 'payment')
          )
        );

      console.log('Installment revenue result:', installmentRevenue);

      // Buscar receita de parcelas pagas diretamente (status = 'paid')
      // Usar CASE para usar originalAmount quando paidAmount é 0
      const paidInstallmentsRevenue = await db
        .select({ 
          total: sql<number>`coalesce(sum(
            case 
              when ${paymentInstallments.paidAmount} > 0 then ${paymentInstallments.paidAmount}
              else ${paymentInstallments.originalAmount}
            end
          ), 0)` 
        })
        .from(paymentInstallments)
        .innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id))
        .where(
          and(
            eq(registrations.groupId, groupId),
            eq(paymentInstallments.status, 'paid')
          )
        );

      console.log('Paid installments revenue result:', paidInstallmentsRevenue);

      // Buscar todas as parcelas do grupo para debug
      const allInstallments = await db
        .select()
        .from(paymentInstallments)
        .innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id))
        .where(eq(registrations.groupId, groupId));

      console.log('All installments for group:', allInstallments.length);
      allInstallments.forEach((inst, index) => {
        console.log(`Installment ${index + 1}:`, {
          id: inst.payment_installments.id,
          originalAmount: inst.payment_installments.originalAmount,
          paidAmount: inst.payment_installments.paidAmount,
          remainingAmount: inst.payment_installments.remainingAmount,
          status: inst.payment_installments.status,
          registrationId: inst.payment_installments.registrationId
        });
      });

      // Contar parcelas pagas manualmente
      const paidInstallments = allInstallments.filter(inst => inst.payment_installments.status === 'paid');
      console.log('Paid installments count:', paidInstallments.length);
      
      let manualTotal = 0;
      paidInstallments.forEach(inst => {
        let paidAmount = parseFloat(inst.payment_installments.paidAmount || '0');
        
        // Se status é 'paid' mas paidAmount é 0, usar originalAmount
        if (inst.payment_installments.status === 'paid' && paidAmount === 0) {
          paidAmount = parseFloat(inst.payment_installments.originalAmount || '0');
        }
        
        manualTotal += paidAmount;
        console.log(`Manual calculation: ${inst.payment_installments.id} = ${paidAmount} (status: ${inst.payment_installments.status})`);
      });
      console.log('Manual total calculation:', manualTotal);

      const installmentTotal = parseFloat(installmentRevenue[0]?.total?.toString() || '0');
      const paidInstallmentsTotal = parseFloat(paidInstallmentsRevenue[0]?.total?.toString() || '0');
      
      // Usar o maior valor entre transações e parcelas pagas
      const finalTotal = Math.max(installmentTotal, paidInstallmentsTotal);
      
      console.log('Installment total (transactions):', installmentTotal);
      console.log('Paid installments total:', paidInstallmentsTotal);
      console.log('Final total:', finalTotal);
      
      return finalTotal;
    } catch (error) {
      console.error('Error in getGroupTotalRevenue:', error);
      return 0;
    }
  }

  async getGroupOverduePayments(groupId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentInstallments)
      .innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id))
      .where(
        and(
          eq(registrations.groupId, groupId),
          eq(paymentInstallments.status, 'pending'),
          sql`${paymentInstallments.dueDate} < ${new Date()}`
        )
      );
    return result[0]?.count || 0;
  }

  async getGroupConfirmedParticipants(groupId: string): Promise<number> {
    const participants = await db
      .select()
      .from(registrations)
      .where(eq(registrations.groupId, groupId));

    let confirmedCount = 0;

    for (const participant of participants) {
      // Carregar parcelas do participante
      const installments = await db
        .select()
        .from(paymentInstallments)
        .where(eq(paymentInstallments.registrationId, participant.id))
        .orderBy(paymentInstallments.installmentNumber);

      if (installments.length === 0) {
        // Se não tem parcelas, verificar se tem pagamento à vista confirmado
        if (participant.paymentStatus === 'paid' && Number(participant.amountPaid) > 0) {
          confirmedCount++;
        }
      } else {
        // Se tem parcelas, verificar se pelo menos uma está paga
        const hasPaidInstallment = installments.some(installment => installment.status === 'paid');
        if (hasPaidInstallment) {
          confirmedCount++;
        }
      }
    }

    return confirmedCount;
  }

  // Obter um grupo por ID
  async getGroupById(groupId: string) {
    try {
      console.log('=== GET GROUP BY ID DEBUG ===');
      console.log('GroupId:', groupId);
      
      // Primeiro, buscar o grupo básico
      const [group] = await db
        .select()
        .from(eventGroups)
        .where(eq(eventGroups.id, groupId))
        .limit(1);

      if (!group) {
        console.log('Grupo não encontrado');
        return null;
      }

      console.log('Grupo encontrado:', group);
      
      // Buscar dados do evento separadamente
      const [event] = await db
        .select({
          id: events.id,
          name: events.title,
        })
        .from(events)
        .where(eq(events.id, group.eventId))
        .limit(1);

      // Retornar o grupo com dados do evento
      return {
        ...group,
        event: event || null
      };
    } catch (error) {
      console.error('Erro ao buscar grupo por ID:', error);
      throw error;
    }
  }

  async checkUserGroupAccess(userId: string, groupId: string): Promise<boolean> {
    // Verificar se é organizador do evento
    const group = await db
      .select()
      .from(eventGroups)
      .where(eq(eventGroups.id, groupId))
      .limit(1);

    if (group.length === 0) return false;

    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, group[0].eventId))
      .limit(1);

    if (event.length > 0 && event[0].organizerId === userId) {
      return true;
    }

    // Verificar se é gestor do grupo
    const groupManager = await db
      .select()
      .from(groupManagers)
      .where(
        and(
          eq(groupManagers.userId, userId),
          eq(groupManagers.groupId, groupId)
        )
      )
      .limit(1);

    return groupManager.length > 0;
  }

  async getGroupPayments(groupId: string): Promise<PaymentTransaction[]> {
    const payments = await db
      .select({
        id: paymentTransactions.id,
        installmentId: paymentTransactions.installmentId,
        amount: paymentTransactions.amount,
        type: paymentTransactions.type,
        paymentMethod: paymentTransactions.paymentMethod,
        transactionId: paymentTransactions.transactionId,
        notes: paymentTransactions.notes,
        createdBy: paymentTransactions.createdBy,
        createdAt: paymentTransactions.createdAt,
        updatedAt: paymentTransactions.updatedAt
      })
      .from(paymentTransactions)
      .innerJoin(paymentInstallments, eq(paymentTransactions.installmentId, paymentInstallments.id))
      .innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id))
      .where(eq(registrations.groupId, groupId))
      .orderBy(desc(paymentTransactions.createdAt));
    
    return payments;
  }


  async getAllEvents(): Promise<Event[]> {
    const allEvents = await db
      .select()
      .from(events)
      .orderBy(desc(events.createdAt));
    
    return allEvents;
  }

  async getUserManagedEvents(userId: string): Promise<Event[]> {
    // Buscar eventos dos grupos que o usuário gerencia
    const managedEvents = await db
      .select()
      .from(events)
      .innerJoin(eventGroups, eq(events.id, eventGroups.eventId))
      .innerJoin(groupManagers, eq(eventGroups.id, groupManagers.groupId))
      .where(eq(groupManagers.userId, userId))
      .orderBy(desc(events.createdAt));
    
    return managedEvents;
  }


  async findUserByEmail(email: string) {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user[0] || null;
  }

  async getEventById(eventId: string) {
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    return event[0] || null;
  }

  // Get installment by ID
  async getInstallmentById(installmentId: string): Promise<any> {
    const result = await db
      .select()
      .from(paymentInstallments)
      .where(eq(paymentInstallments.id, installmentId))
      .limit(1);
    
    return result[0] || null;
  }

  // Get registration by ID
  async getRegistrationById(registrationId: string): Promise<any> {
    const result = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, registrationId))
      .limit(1);
    
    return result[0] || null;
  }

  // Mark installment as paid
  async markInstallmentAsPaid(installmentId: string, updatedBy: string): Promise<void> {
    // Primeiro, marcar a parcela como paga
    await db
      .update(paymentInstallments)
      .set({
        status: 'paid',
        paidDate: new Date(),
        paidAmount: sql`original_amount`,
        remainingAmount: '0',
        updatedBy: updatedBy,
        updatedAt: new Date()
      })
      .where(eq(paymentInstallments.id, installmentId));

    // Buscar a inscrição relacionada à parcela
    const installment = await this.getPaymentInstallment(installmentId);
    if (!installment) return;

    // Calcular o total pago de todas as parcelas desta inscrição
    const allInstallments = await this.getRegistrationInstallments(installment.registrationId);
    const totalPaid = allInstallments
      .filter(inst => inst.status === 'paid')
      .reduce((sum, inst) => sum + parseFloat(inst.originalAmount || '0'), 0);

    // Atualizar o amountPaid da inscrição
    await this.updateRegistration(installment.registrationId, {
      amountPaid: totalPaid.toString()
    });
  }
}

export const storage = new DatabaseStorage();
