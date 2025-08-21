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
  profileImageUrl: varchar("profile_image_url"),
  asaasCustomerId: varchar("asaas_customer_id"),
  currentPlan: varchar("current_plan", { length: 50 }).default('free'),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Registrations table
export const registrations = pgTable("registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  ticketId: varchar("ticket_id").references(() => tickets.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  customFields: jsonb("custom_fields"),
  status: varchar("status", { length: 20 }).default('confirmed'), // pending, confirmed, cancelled
  paymentStatus: varchar("payment_status", { length: 20 }).default('pending'), // pending, paid, failed, refunded
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default('0'),
  currency: varchar("currency", { length: 3 }).default('BRL'),
  paymentGateway: varchar("payment_gateway", { length: 50 }),
  paymentId: varchar("payment_id", { length: 255 }),
  checkedIn: boolean("checked_in").default(false),
  checkedInAt: timestamp("checked_in_at"),
  qrCode: varchar("qr_code", { length: 255 }),
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
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  event: one(events, {
    fields: [tickets.eventId],
    references: [events.id],
  }),
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
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

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sold: true,
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

export type InsertEventSchema = z.infer<typeof insertEventSchema>;
export type InsertTicketSchema = z.infer<typeof insertTicketSchema>;
export type InsertRegistrationSchema = z.infer<typeof insertRegistrationSchema>;
export type InsertTemplateSchema = z.infer<typeof insertTemplateSchema>;
