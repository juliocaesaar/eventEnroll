import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  passwordHash: varchar("password_hash"),
  profileImageUrl: varchar("profile_image_url"),
  asaasCustomerId: varchar("asaas_customer_id"),
  currentPlan: varchar("current_plan", { length: 50 }).default('free'),
  role: varchar("role", { length: 20 }).default('user'), // admin, organizer, user
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User subscriptions table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  planId: varchar("plan_id", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default('active'), // active, cancelled, past_due, trialing
  asaasSubscriptionId: varchar("asaas_subscription_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event categories enum
export const eventCategories = pgTable("event_categories", {
  id: varchar("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Templates table
export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => eventCategories.id),
  imageUrl: varchar("image_url"),
  components: jsonb("components").notNull().default('[]'),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizerId: varchar("organizer_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  categoryId: varchar("category_id").references(() => eventCategories.id),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  timezone: varchar("timezone", { length: 50 }).default('America/Sao_Paulo'),
  venueName: varchar("venue_name", { length: 255 }),
  venueAddress: jsonb("venue_address"),
  onlineUrl: text("online_url"),
  capacity: integer("capacity"),
  status: varchar("status", { length: 20 }).default('draft'), // draft, active, paused, completed, cancelled
  templateId: varchar("template_id").references(() => templates.id),
  customDomain: varchar("custom_domain", { length: 255 }),
  seoSettings: jsonb("seo_settings"),
  pageComponents: jsonb("page_components").default('[]'),
  imageUrl: varchar("image_url"),
  whatsappNumber: varchar("whatsapp_number"), // Número do WhatsApp para contato geral do evento
  pixUrl: varchar("pix_url"), // URL do PIX para pagamentos
  pixKeyType: varchar("pix_key_type", { length: 20 }).default('cpf'), // Tipo da chave PIX (cpf, cnpj, email, phone, random)
  pixKey: varchar("pix_key", { length: 255 }), // Chave PIX
  pixInstallments: integer("pix_installments").default(12), // Número de parcelas PIX
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  sold: integer("sold").default(0),
  salesStart: timestamp("sales_start"),
  salesEnd: timestamp("sales_end"),
  minPerOrder: integer("min_per_order").default(1),
  maxPerOrder: integer("max_per_order").default(10),
  status: varchar("status", { length: 20 }).default('active'), // active, paused, sold_out
  pixUrl: varchar("pix_url"), // URL do PIX copia e cola
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Registrations table
export const registrations = pgTable("registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  ticketId: varchar("ticket_id").references(() => tickets.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  groupId: varchar("group_id").references(() => eventGroups.id),
  paymentPlanId: varchar("payment_plan_id").references(() => eventPaymentPlans.id),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  customFields: jsonb("custom_fields"),
  status: varchar("status", { length: 20 }).default('confirmed'), // pending, confirmed, cancelled
  paymentStatus: varchar("payment_status", { length: 20 }).default('pending'), // pending, partial, paid, overdue, failed, refunded
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default('0'),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default('BRL'),
  paymentGateway: varchar("payment_gateway", { length: 50 }),
  paymentId: varchar("payment_id", { length: 255 }),
  checkedIn: boolean("checked_in").default(false),
  checkedInAt: timestamp("checked_in_at"),
  qrCode: varchar("qr_code", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event Groups table
export const eventGroups = pgTable("event_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  capacity: integer("capacity"),
  currentCount: integer("current_count").default(0),
  color: varchar("color", { length: 7 }).default('#3b82f6'),
  status: varchar("status", { length: 20 }).default('active'), // active, inactive
  whatsappNumber: varchar("whatsapp_number"), // Número do WhatsApp específico do grupo
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group Managers table
export const groupManagers = pgTable("group_managers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => eventGroups.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 20 }).default('manager'), // manager, assistant, viewer
  permissions: jsonb("permissions").default('{}'),
  assignedAt: timestamp("assigned_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event Organizers table
export const eventOrganizers = pgTable("event_organizers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 20 }).default('organizer'), // organizer, assistant, viewer
  permissions: jsonb("permissions").default('{}'),
  assignedAt: timestamp("assigned_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group Permissions table
export const groupPermissions = pgTable("group_permissions", {
  id: varchar("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event Payment Plans table
export const eventPaymentPlans = pgTable("event_payment_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  installmentCount: integer("installment_count").notNull(),
  installmentInterval: varchar("installment_interval", { length: 20 }).default('monthly'), // monthly, weekly, biweekly
  firstInstallmentDate: timestamp("first_installment_date"),
  lastInstallmentDate: timestamp("last_installment_date"),
  discountPolicy: jsonb("discount_policy").default('{}'),
  lateFeePolicy: jsonb("late_fee_policy").default('{}'),
  isDefault: boolean("is_default").default(false),
  status: varchar("status", { length: 20 }).default('active'), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Installments table
export const paymentInstallments = pgTable("payment_installments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  registrationId: varchar("registration_id").references(() => registrations.id).notNull(),
  planId: varchar("plan_id").references(() => eventPaymentPlans.id).notNull(),
  installmentNumber: integer("installment_number").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0'),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0'),
  lateFeeAmount: decimal("late_fee_amount", { precision: 10, scale: 2 }).default('0'),
  status: varchar("status", { length: 20 }).default('pending'), // pending, paid, overdue, waived, cancelled
  notes: text("notes"),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Transactions table
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  installmentId: varchar("installment_id").references(() => paymentInstallments.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // payment, refund, adjustment, waiver
  paymentMethod: varchar("payment_method", { length: 50 }), // pix, card, boleto, cash
  transactionId: varchar("transaction_id", { length: 255 }),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  events: many(events),
  registrations: many(registrations),
  subscription: one(userSubscriptions, {
    fields: [users.id],
    references: [userSubscriptions.userId],
  }),
  groupManagers: many(groupManagers),
  paymentInstallmentsUpdated: many(paymentInstallments, { relationName: 'updatedBy' }),
  paymentTransactionsCreated: many(paymentTransactions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
}));

export const eventCategoriesRelations = relations(eventCategories, ({ many }) => ({
  templates: many(templates),
  events: many(events),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  category: one(eventCategories, {
    fields: [templates.categoryId],
    references: [eventCategories.id],
  }),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  category: one(eventCategories, {
    fields: [events.categoryId],
    references: [eventCategories.id],
  }),
  template: one(templates, {
    fields: [events.templateId],
    references: [templates.id],
  }),
  tickets: many(tickets),
  registrations: many(registrations),
  groups: many(eventGroups),
  paymentPlans: many(eventPaymentPlans),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  event: one(events, {
    fields: [tickets.eventId],
    references: [events.id],
  }),
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one, many }) => ({
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
  ticket: one(tickets, {
    fields: [registrations.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [registrations.userId],
    references: [users.id],
  }),
  group: one(eventGroups, {
    fields: [registrations.groupId],
    references: [eventGroups.id],
  }),
  paymentPlan: one(eventPaymentPlans, {
    fields: [registrations.paymentPlanId],
    references: [eventPaymentPlans.id],
  }),
  installments: many(paymentInstallments),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

export type EventCategory = typeof eventCategories.$inferSelect;
export type InsertEventCategory = typeof eventCategories.$inferInsert;

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = typeof registrations.$inferInsert;

// Validation schemas
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const baseTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sold: true,
});

export const insertTicketSchema = baseTicketSchema.refine((data) => {
  const price = parseFloat(data.price || '0');
  return price >= 5.00;
}, {
  message: "O preço do ingresso deve ser de pelo menos R$ 5,00",
  path: ["price"],
});

export const updateTicketSchema = baseTicketSchema.partial().refine((data) => {
  if (data.price !== undefined) {
    const price = parseFloat(data.price || '0');
    return price >= 5.00;
  }
  return true;
}, {
  message: "O preço do ingresso deve ser de pelo menos R$ 5,00",
  path: ["price"],
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  qrCode: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// New relations for groups and payments
export const eventGroupsRelations = relations(eventGroups, ({ one, many }) => ({
  event: one(events, {
    fields: [eventGroups.eventId],
    references: [events.id],
  }),
  managers: many(groupManagers),
  registrations: many(registrations),
}));

export const groupManagersRelations = relations(groupManagers, ({ one }) => ({
  group: one(eventGroups, {
    fields: [groupManagers.groupId],
    references: [eventGroups.id],
  }),
  user: one(users, {
    fields: [groupManagers.userId],
    references: [users.id],
  }),
}));

export const eventPaymentPlansRelations = relations(eventPaymentPlans, ({ one, many }) => ({
  event: one(events, {
    fields: [eventPaymentPlans.eventId],
    references: [events.id],
  }),
  registrations: many(registrations),
  installments: many(paymentInstallments),
}));

export const paymentInstallmentsRelations = relations(paymentInstallments, ({ one, many }) => ({
  registration: one(registrations, {
    fields: [paymentInstallments.registrationId],
    references: [registrations.id],
  }),
  plan: one(eventPaymentPlans, {
    fields: [paymentInstallments.planId],
    references: [eventPaymentPlans.id],
  }),
  updatedByUser: one(users, {
    fields: [paymentInstallments.updatedBy],
    references: [users.id],
    relationName: 'updatedBy',
  }),
  transactions: many(paymentTransactions),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  installment: one(paymentInstallments, {
    fields: [paymentTransactions.installmentId],
    references: [paymentInstallments.id],
  }),
  createdByUser: one(users, {
    fields: [paymentTransactions.createdBy],
    references: [users.id],
  }),
}));

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'info', 'success', 'warning', 'error', 'payment', 'registration', 'event'
  priority: varchar("priority", { length: 20 }).default('normal'), // 'low', 'normal', 'high', 'urgent'
  isRead: boolean("is_read").default(false),
  isArchived: boolean("is_archived").default(false),
  
  // Context fields for hierarchical permissions
  eventId: varchar("event_id").references(() => events.id),
  groupId: varchar("group_id").references(() => eventGroups.id),
  registrationId: varchar("registration_id").references(() => registrations.id),
  installmentId: varchar("installment_id").references(() => paymentInstallments.id),
  
  // Metadata
  metadata: jsonb("metadata"), // Additional data like URLs, IDs, etc.
  actionUrl: varchar("action_url"), // URL to redirect when notification is clicked
  actionText: varchar("action_text"), // Text for the action button
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
  expiresAt: timestamp("expires_at"), // Optional expiration date
}, (table) => [
  index("IDX_notifications_user_id").on(table.userId),
  index("IDX_notifications_type").on(table.type),
  index("IDX_notifications_is_read").on(table.isRead),
  index("IDX_notifications_created_at").on(table.createdAt),
  index("IDX_notifications_event_id").on(table.eventId),
  index("IDX_notifications_group_id").on(table.groupId),
]);

// Notification preferences table
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Email preferences
  emailEnabled: boolean("email_enabled").default(true),
  emailTypes: jsonb("email_types").default('["info", "success", "warning", "error", "payment", "registration", "event"]'),
  
  // Push preferences (for future use)
  pushEnabled: boolean("push_enabled").default(true),
  pushTypes: jsonb("push_types").default('["info", "success", "warning", "error", "payment", "registration", "event"]'),
  
  // SMS preferences (for future use)
  smsEnabled: boolean("sms_enabled").default(false),
  smsTypes: jsonb("sms_types").default('["urgent", "payment"]'),
  
  // WhatsApp preferences
  whatsappEnabled: boolean("whatsapp_enabled").default(true),
  whatsappTypes: jsonb("whatsapp_types").default('["payment", "registration", "event"]'),
  
  // Timing preferences
  quietHoursStart: varchar("quiet_hours_start", { length: 5 }).default('22:00'), // HH:MM format
  quietHoursEnd: varchar("quiet_hours_end", { length: 5 }).default('08:00'), // HH:MM format
  timezone: varchar("timezone", { length: 50 }).default('America/Sao_Paulo'),
  
  // Frequency preferences
  digestEnabled: boolean("digest_enabled").default(true),
  digestFrequency: varchar("digest_frequency", { length: 20 }).default('daily'), // 'immediate', 'hourly', 'daily', 'weekly'
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_notification_preferences_user_id").on(table.userId),
]);

// Relations for notifications
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [notifications.eventId],
    references: [events.id],
  }),
  group: one(eventGroups, {
    fields: [notifications.groupId],
    references: [eventGroups.id],
  }),
  registration: one(registrations, {
    fields: [notifications.registrationId],
    references: [registrations.id],
  }),
  installment: one(paymentInstallments, {
    fields: [notifications.installmentId],
    references: [paymentInstallments.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// New schema types
export type EventGroup = typeof eventGroups.$inferSelect;
export type InsertEventGroup = typeof eventGroups.$inferInsert;

export type GroupManager = typeof groupManagers.$inferSelect;
export type InsertGroupManager = typeof groupManagers.$inferInsert;

export type EventOrganizer = typeof eventOrganizers.$inferSelect;
export type InsertEventOrganizer = typeof eventOrganizers.$inferInsert;

export type GroupPermission = typeof groupPermissions.$inferSelect;
export type InsertGroupPermission = typeof groupPermissions.$inferInsert;

export type EventPaymentPlan = typeof eventPaymentPlans.$inferSelect;
export type InsertEventPaymentPlan = typeof eventPaymentPlans.$inferInsert;

export type PaymentInstallment = typeof paymentInstallments.$inferSelect;
export type InsertPaymentInstallment = typeof paymentInstallments.$inferInsert;

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

export type InsertEventSchema = z.infer<typeof insertEventSchema>;
export type InsertTicketSchema = z.infer<typeof insertTicketSchema>;
export type InsertRegistrationSchema = z.infer<typeof insertRegistrationSchema>;
export type InsertTemplateSchema = z.infer<typeof insertTemplateSchema>;
