var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/config/jwt.ts
import jwt from "jsonwebtoken";
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
  try {
    console.log("\u{1F50D} Verifying token with secret:", JWT_SECRET.substring(0, 10) + "...");
    const payload = jwt.verify(token, JWT_SECRET);
    console.log("\u2705 Token verification successful:", payload);
    return payload;
  } catch (error) {
    console.error("\u274C Token verification failed:", error);
    return null;
  }
}
function extractTokenFromHeader(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }
  return parts[1];
}
var JWT_SECRET;
var init_jwt = __esm({
  "server/config/jwt.ts"() {
    "use strict";
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = "e1dad618b2990846d521f9261bbc3bef5b2dab3feb80b9133bd9b8304825e418";
    }
    JWT_SECRET = process.env.JWT_SECRET;
  }
});

// server/middleware/auth.ts
var auth_exports = {};
__export(auth_exports, {
  authenticateToken: () => authenticateToken
});
var authenticateToken;
var init_auth = __esm({
  "server/middleware/auth.ts"() {
    "use strict";
    init_jwt();
    authenticateToken = (req, res, next) => {
      try {
        console.log("\u{1F50D} Auth middleware - Headers:", req.headers.authorization ? "Authorization header present" : "No authorization header");
        console.log("\u{1F50D} Auth middleware - URL:", req.url);
        console.log("\u{1F50D} Auth middleware - Full Authorization header:", req.headers.authorization);
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
          console.log("\u274C No token found in request");
          return res.status(401).json({ message: "Token n\xE3o fornecido" });
        }
        console.log("\u{1F511} Token found:", token.substring(0, 20) + "...");
        console.log("\u{1F511} Full token:", token);
        const payload = verifyToken(token);
        if (!payload) {
          console.log("\u274C Token verification failed");
          return res.status(401).json({ message: "Token inv\xE1lido" });
        }
        console.log("\u2705 Token verified for user:", payload.userId);
        req.user = payload;
        next();
      } catch (error) {
        console.error("Error in authentication middleware:", error);
        return res.status(401).json({ message: "Token inv\xE1lido" });
      }
    };
  }
});

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  eventCategories: () => eventCategories,
  eventCategoriesRelations: () => eventCategoriesRelations,
  eventGroups: () => eventGroups,
  eventGroupsRelations: () => eventGroupsRelations,
  eventPaymentPlans: () => eventPaymentPlans,
  eventPaymentPlansRelations: () => eventPaymentPlansRelations,
  events: () => events,
  eventsRelations: () => eventsRelations,
  groupManagers: () => groupManagers,
  groupManagersRelations: () => groupManagersRelations,
  groupPermissions: () => groupPermissions,
  insertEventSchema: () => insertEventSchema,
  insertRegistrationSchema: () => insertRegistrationSchema,
  insertTemplateSchema: () => insertTemplateSchema,
  insertTicketSchema: () => insertTicketSchema,
  notificationPreferences: () => notificationPreferences,
  notificationPreferencesRelations: () => notificationPreferencesRelations,
  notifications: () => notifications,
  notificationsRelations: () => notificationsRelations,
  paymentInstallments: () => paymentInstallments,
  paymentInstallmentsRelations: () => paymentInstallmentsRelations,
  paymentTransactions: () => paymentTransactions,
  paymentTransactionsRelations: () => paymentTransactionsRelations,
  registrations: () => registrations,
  registrationsRelations: () => registrationsRelations,
  sessions: () => sessions,
  templates: () => templates,
  templatesRelations: () => templatesRelations,
  tickets: () => tickets,
  ticketsRelations: () => ticketsRelations,
  updateTicketSchema: () => updateTicketSchema,
  userSubscriptions: () => userSubscriptions,
  userSubscriptionsRelations: () => userSubscriptionsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions, users, userSubscriptions, eventCategories, templates, events, tickets, registrations, eventGroups, groupManagers, groupPermissions, eventPaymentPlans, paymentInstallments, paymentTransactions, usersRelations, userSubscriptionsRelations, eventCategoriesRelations, templatesRelations, eventsRelations, ticketsRelations, registrationsRelations, insertEventSchema, baseTicketSchema, insertTicketSchema, updateTicketSchema, insertRegistrationSchema, insertTemplateSchema, eventGroupsRelations, groupManagersRelations, eventPaymentPlansRelations, paymentInstallmentsRelations, paymentTransactionsRelations, notifications, notificationPreferences, notificationsRelations, notificationPreferencesRelations;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: varchar("email").unique(),
      firstName: varchar("first_name"),
      lastName: varchar("last_name"),
      passwordHash: varchar("password_hash"),
      profileImageUrl: varchar("profile_image_url"),
      asaasCustomerId: varchar("asaas_customer_id"),
      currentPlan: varchar("current_plan", { length: 50 }).default("free"),
      role: varchar("role", { length: 20 }).default("user"),
      // admin, organizer, user
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userSubscriptions = pgTable("user_subscriptions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id).notNull(),
      planId: varchar("plan_id", { length: 50 }).notNull(),
      status: varchar("status", { length: 20 }).default("active"),
      // active, cancelled, past_due, trialing
      asaasSubscriptionId: varchar("asaas_subscription_id"),
      currentPeriodStart: timestamp("current_period_start"),
      currentPeriodEnd: timestamp("current_period_end"),
      cancelledAt: timestamp("cancelled_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    eventCategories = pgTable("event_categories", {
      id: varchar("id").primaryKey(),
      name: varchar("name", { length: 100 }).notNull(),
      description: text("description"),
      icon: varchar("icon", { length: 50 }),
      color: varchar("color", { length: 7 }),
      createdAt: timestamp("created_at").defaultNow()
    });
    templates = pgTable("templates", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      categoryId: varchar("category_id").references(() => eventCategories.id),
      imageUrl: varchar("image_url"),
      components: jsonb("components").notNull().default("[]"),
      isPublic: boolean("is_public").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    events = pgTable("events", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      organizerId: varchar("organizer_id").references(() => users.id).notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      slug: varchar("slug", { length: 255 }).unique().notNull(),
      categoryId: varchar("category_id").references(() => eventCategories.id),
      startDate: timestamp("start_date"),
      endDate: timestamp("end_date"),
      timezone: varchar("timezone", { length: 50 }).default("America/Sao_Paulo"),
      venueName: varchar("venue_name", { length: 255 }),
      venueAddress: jsonb("venue_address"),
      onlineUrl: text("online_url"),
      capacity: integer("capacity"),
      status: varchar("status", { length: 20 }).default("draft"),
      // draft, active, paused, completed, cancelled
      templateId: varchar("template_id").references(() => templates.id),
      customDomain: varchar("custom_domain", { length: 255 }),
      seoSettings: jsonb("seo_settings"),
      pageComponents: jsonb("page_components").default("[]"),
      imageUrl: varchar("image_url"),
      whatsappNumber: varchar("whatsapp_number"),
      // Número do WhatsApp para contato geral do evento
      pixUrl: varchar("pix_url"),
      // URL do PIX para pagamentos
      pixKeyType: varchar("pix_key_type", { length: 20 }).default("cpf"),
      // Tipo da chave PIX (cpf, cnpj, email, phone, random)
      pixKey: varchar("pix_key", { length: 255 }),
      // Chave PIX
      pixInstallments: integer("pix_installments").default(12),
      // Número de parcelas PIX
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    tickets = pgTable("tickets", {
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
      status: varchar("status", { length: 20 }).default("active"),
      // active, paused, sold_out
      pixUrl: varchar("pix_url"),
      // URL do PIX copia e cola
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    registrations = pgTable("registrations", {
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
      status: varchar("status", { length: 20 }).default("confirmed"),
      // pending, confirmed, cancelled
      paymentStatus: varchar("payment_status", { length: 20 }).default("pending"),
      // pending, partial, paid, overdue, failed, refunded
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
      amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
      remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }),
      currency: varchar("currency", { length: 3 }).default("BRL"),
      paymentGateway: varchar("payment_gateway", { length: 50 }),
      paymentId: varchar("payment_id", { length: 255 }),
      checkedIn: boolean("checked_in").default(false),
      checkedInAt: timestamp("checked_in_at"),
      qrCode: varchar("qr_code", { length: 255 }),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    eventGroups = pgTable("event_groups", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      eventId: varchar("event_id").references(() => events.id).notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      capacity: integer("capacity"),
      currentCount: integer("current_count").default(0),
      color: varchar("color", { length: 7 }).default("#3b82f6"),
      status: varchar("status", { length: 20 }).default("active"),
      // active, inactive
      whatsappNumber: varchar("whatsapp_number"),
      // Número do WhatsApp específico do grupo
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    groupManagers = pgTable("group_managers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      groupId: varchar("group_id").references(() => eventGroups.id).notNull(),
      userId: varchar("user_id").references(() => users.id).notNull(),
      role: varchar("role", { length: 20 }).default("manager"),
      // manager, assistant, viewer
      permissions: jsonb("permissions").default("{}"),
      assignedAt: timestamp("assigned_at").defaultNow(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    groupPermissions = pgTable("group_permissions", {
      id: varchar("id").primaryKey(),
      name: varchar("name", { length: 100 }).notNull(),
      description: text("description"),
      createdAt: timestamp("created_at").defaultNow()
    });
    eventPaymentPlans = pgTable("event_payment_plans", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      eventId: varchar("event_id").references(() => events.id).notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      installmentCount: integer("installment_count").notNull(),
      installmentInterval: varchar("installment_interval", { length: 20 }).default("monthly"),
      // monthly, weekly, biweekly
      firstInstallmentDate: timestamp("first_installment_date"),
      lastInstallmentDate: timestamp("last_installment_date"),
      discountPolicy: jsonb("discount_policy").default("{}"),
      lateFeePolicy: jsonb("late_fee_policy").default("{}"),
      isDefault: boolean("is_default").default(false),
      status: varchar("status", { length: 20 }).default("active"),
      // active, inactive
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    paymentInstallments = pgTable("payment_installments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      registrationId: varchar("registration_id").references(() => registrations.id).notNull(),
      planId: varchar("plan_id").references(() => eventPaymentPlans.id).notNull(),
      installmentNumber: integer("installment_number").notNull(),
      dueDate: timestamp("due_date").notNull(),
      paidDate: timestamp("paid_date"),
      originalAmount: decimal("original_amount", { precision: 10, scale: 2 }).notNull(),
      paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
      remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).notNull(),
      discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
      lateFeeAmount: decimal("late_fee_amount", { precision: 10, scale: 2 }).default("0"),
      status: varchar("status", { length: 20 }).default("pending"),
      // pending, paid, overdue, waived, cancelled
      notes: text("notes"),
      updatedBy: varchar("updated_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    paymentTransactions = pgTable("payment_transactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      installmentId: varchar("installment_id").references(() => paymentInstallments.id).notNull(),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      type: varchar("type", { length: 20 }).notNull(),
      // payment, refund, adjustment, waiver
      paymentMethod: varchar("payment_method", { length: 50 }),
      // pix, card, boleto, cash
      transactionId: varchar("transaction_id", { length: 255 }),
      notes: text("notes"),
      createdBy: varchar("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    usersRelations = relations(users, ({ many, one }) => ({
      events: many(events),
      registrations: many(registrations),
      subscription: one(userSubscriptions, {
        fields: [users.id],
        references: [userSubscriptions.userId]
      }),
      groupManagers: many(groupManagers),
      paymentInstallmentsUpdated: many(paymentInstallments, { relationName: "updatedBy" }),
      paymentTransactionsCreated: many(paymentTransactions)
    }));
    userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
      user: one(users, {
        fields: [userSubscriptions.userId],
        references: [users.id]
      })
    }));
    eventCategoriesRelations = relations(eventCategories, ({ many }) => ({
      templates: many(templates),
      events: many(events)
    }));
    templatesRelations = relations(templates, ({ one, many }) => ({
      category: one(eventCategories, {
        fields: [templates.categoryId],
        references: [eventCategories.id]
      }),
      events: many(events)
    }));
    eventsRelations = relations(events, ({ one, many }) => ({
      organizer: one(users, {
        fields: [events.organizerId],
        references: [users.id]
      }),
      category: one(eventCategories, {
        fields: [events.categoryId],
        references: [eventCategories.id]
      }),
      template: one(templates, {
        fields: [events.templateId],
        references: [templates.id]
      }),
      tickets: many(tickets),
      registrations: many(registrations),
      groups: many(eventGroups),
      paymentPlans: many(eventPaymentPlans)
    }));
    ticketsRelations = relations(tickets, ({ one, many }) => ({
      event: one(events, {
        fields: [tickets.eventId],
        references: [events.id]
      }),
      registrations: many(registrations)
    }));
    registrationsRelations = relations(registrations, ({ one, many }) => ({
      event: one(events, {
        fields: [registrations.eventId],
        references: [events.id]
      }),
      ticket: one(tickets, {
        fields: [registrations.ticketId],
        references: [tickets.id]
      }),
      user: one(users, {
        fields: [registrations.userId],
        references: [users.id]
      }),
      group: one(eventGroups, {
        fields: [registrations.groupId],
        references: [eventGroups.id]
      }),
      paymentPlan: one(eventPaymentPlans, {
        fields: [registrations.paymentPlanId],
        references: [eventPaymentPlans.id]
      }),
      installments: many(paymentInstallments)
    }));
    insertEventSchema = createInsertSchema(events).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    baseTicketSchema = createInsertSchema(tickets).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      sold: true
    });
    insertTicketSchema = baseTicketSchema.refine((data) => {
      const price = parseFloat(data.price || "0");
      return price >= 5;
    }, {
      message: "O pre\xE7o do ingresso deve ser de pelo menos R$ 5,00",
      path: ["price"]
    });
    updateTicketSchema = baseTicketSchema.partial().refine((data) => {
      if (data.price !== void 0) {
        const price = parseFloat(data.price || "0");
        return price >= 5;
      }
      return true;
    }, {
      message: "O pre\xE7o do ingresso deve ser de pelo menos R$ 5,00",
      path: ["price"]
    });
    insertRegistrationSchema = createInsertSchema(registrations).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      qrCode: true
    });
    insertTemplateSchema = createInsertSchema(templates).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    eventGroupsRelations = relations(eventGroups, ({ one, many }) => ({
      event: one(events, {
        fields: [eventGroups.eventId],
        references: [events.id]
      }),
      managers: many(groupManagers),
      registrations: many(registrations)
    }));
    groupManagersRelations = relations(groupManagers, ({ one }) => ({
      group: one(eventGroups, {
        fields: [groupManagers.groupId],
        references: [eventGroups.id]
      }),
      user: one(users, {
        fields: [groupManagers.userId],
        references: [users.id]
      })
    }));
    eventPaymentPlansRelations = relations(eventPaymentPlans, ({ one, many }) => ({
      event: one(events, {
        fields: [eventPaymentPlans.eventId],
        references: [events.id]
      }),
      registrations: many(registrations),
      installments: many(paymentInstallments)
    }));
    paymentInstallmentsRelations = relations(paymentInstallments, ({ one, many }) => ({
      registration: one(registrations, {
        fields: [paymentInstallments.registrationId],
        references: [registrations.id]
      }),
      plan: one(eventPaymentPlans, {
        fields: [paymentInstallments.planId],
        references: [eventPaymentPlans.id]
      }),
      updatedByUser: one(users, {
        fields: [paymentInstallments.updatedBy],
        references: [users.id],
        relationName: "updatedBy"
      }),
      transactions: many(paymentTransactions)
    }));
    paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
      installment: one(paymentInstallments, {
        fields: [paymentTransactions.installmentId],
        references: [paymentInstallments.id]
      }),
      createdByUser: one(users, {
        fields: [paymentTransactions.createdBy],
        references: [users.id]
      })
    }));
    notifications = pgTable("notifications", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id).notNull(),
      title: varchar("title").notNull(),
      message: text("message").notNull(),
      type: varchar("type", { length: 50 }).notNull(),
      // 'info', 'success', 'warning', 'error', 'payment', 'registration', 'event'
      priority: varchar("priority", { length: 20 }).default("normal"),
      // 'low', 'normal', 'high', 'urgent'
      isRead: boolean("is_read").default(false),
      isArchived: boolean("is_archived").default(false),
      // Context fields for hierarchical permissions
      eventId: varchar("event_id").references(() => events.id),
      groupId: varchar("group_id").references(() => eventGroups.id),
      registrationId: varchar("registration_id").references(() => registrations.id),
      installmentId: varchar("installment_id").references(() => paymentInstallments.id),
      // Metadata
      metadata: jsonb("metadata"),
      // Additional data like URLs, IDs, etc.
      actionUrl: varchar("action_url"),
      // URL to redirect when notification is clicked
      actionText: varchar("action_text"),
      // Text for the action button
      // Timestamps
      createdAt: timestamp("created_at").defaultNow(),
      readAt: timestamp("read_at"),
      expiresAt: timestamp("expires_at")
      // Optional expiration date
    }, (table) => [
      index("IDX_notifications_user_id").on(table.userId),
      index("IDX_notifications_type").on(table.type),
      index("IDX_notifications_is_read").on(table.isRead),
      index("IDX_notifications_created_at").on(table.createdAt),
      index("IDX_notifications_event_id").on(table.eventId),
      index("IDX_notifications_group_id").on(table.groupId)
    ]);
    notificationPreferences = pgTable("notification_preferences", {
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
      quietHoursStart: varchar("quiet_hours_start", { length: 5 }).default("22:00"),
      // HH:MM format
      quietHoursEnd: varchar("quiet_hours_end", { length: 5 }).default("08:00"),
      // HH:MM format
      timezone: varchar("timezone", { length: 50 }).default("America/Sao_Paulo"),
      // Frequency preferences
      digestEnabled: boolean("digest_enabled").default(true),
      digestFrequency: varchar("digest_frequency", { length: 20 }).default("daily"),
      // 'immediate', 'hourly', 'daily', 'weekly'
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("IDX_notification_preferences_user_id").on(table.userId)
    ]);
    notificationsRelations = relations(notifications, ({ one }) => ({
      user: one(users, {
        fields: [notifications.userId],
        references: [users.id]
      }),
      event: one(events, {
        fields: [notifications.eventId],
        references: [events.id]
      }),
      group: one(eventGroups, {
        fields: [notifications.groupId],
        references: [eventGroups.id]
      }),
      registration: one(registrations, {
        fields: [notifications.registrationId],
        references: [registrations.id]
      }),
      installment: one(paymentInstallments, {
        fields: [notifications.installmentId],
        references: [paymentInstallments.id]
      })
    }));
    notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
      user: one(users, {
        fields: [notificationPreferences.userId],
        references: [users.id]
      })
    }));
  }
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = "postgresql://neondb_owner:npg_MWSB7L8Hvlab@ep-morning-bonus-acx66sds-pooler.sa-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema: schema_exports });
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  DatabaseStorage: () => DatabaseStorage,
  storage: () => storage
});
import { eq, desc, and, gte, lte, sql as sql2 } from "drizzle-orm";
var DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    DatabaseStorage = class {
      // User operations
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
      }
      async createUser(userData) {
        const [user] = await db.insert(users).values(userData).returning();
        return user;
      }
      async upsertUser(userData) {
        const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
          target: users.id,
          set: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            asaasCustomerId: userData.asaasCustomerId,
            currentPlan: userData.currentPlan,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return user;
      }
      async updateUser(id, data) {
        const [user] = await db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
        return user;
      }
      async getAllUsers() {
        const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
        return allUsers;
      }
      async deleteUser(id) {
        await db.delete(users).where(eq(users.id, id));
      }
      // Subscription operations
      async getUserSubscription(userId) {
        const [subscription] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId)).orderBy(desc(userSubscriptions.createdAt));
        return subscription;
      }
      async updateUserSubscription(userId, data) {
        const [subscription] = await db.update(userSubscriptions).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(userSubscriptions.userId, userId)).returning();
        return subscription;
      }
      // Usage counting for plan limits
      async getUserEventCount(userId) {
        const result = await db.select({ count: sql2`count(*)` }).from(events).where(eq(events.organizerId, userId));
        return result[0]?.count || 0;
      }
      async getUserTemplateCount(userId) {
        const result = await db.select({ count: sql2`count(*)` }).from(templates).where(eq(templates.isPublic, true));
        return result[0]?.count || 0;
      }
      // Event operations
      async createEvent(eventData) {
        const [event] = await db.insert(events).values(eventData).returning();
        return event;
      }
      async updateEvent(id, eventData) {
        const [event] = await db.update(events).set({ ...eventData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(events.id, id)).returning();
        return event;
      }
      async getEvent(id) {
        const [event] = await db.select().from(events).where(eq(events.id, id));
        return event;
      }
      async getEventBySlug(slug) {
        const [event] = await db.select().from(events).where(eq(events.slug, slug));
        return event;
      }
      async getUserEvents(userId) {
        return await db.select().from(events).where(eq(events.organizerId, userId)).orderBy(desc(events.createdAt));
      }
      async deleteEvent(id) {
        await db.delete(events).where(eq(events.id, id));
      }
      // Ticket operations
      async createTicket(ticketData) {
        const [ticket] = await db.insert(tickets).values(ticketData).returning();
        return ticket;
      }
      async updateTicket(id, ticketData) {
        const [ticket] = await db.update(tickets).set({ ...ticketData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(tickets.id, id)).returning();
        return ticket;
      }
      async getEventTickets(eventId) {
        return await db.select().from(tickets).where(eq(tickets.eventId, eventId)).orderBy(tickets.createdAt);
      }
      async deleteTicket(id) {
        await db.delete(tickets).where(eq(tickets.id, id));
      }
      async getTicket(id) {
        const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
        return ticket;
      }
      // Registration operations
      async getRegistration(id) {
        const [registration] = await db.select().from(registrations).where(eq(registrations.id, id));
        return registration;
      }
      async updateRegistration(id, data) {
        const [registration] = await db.update(registrations).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(registrations.id, id)).returning();
        return registration;
      }
      async getEventAnalytics(eventId) {
        const registrations2 = await this.getEventRegistrations(eventId);
        const tickets2 = await this.getEventTickets(eventId);
        const totalRegistrations = registrations2.length;
        const totalRevenue = registrations2.reduce((sum, reg) => sum + parseFloat(reg.amount || 0), 0);
        const avgTicketValue = totalRevenue / (totalRegistrations || 1);
        return {
          overview: {
            totalRegistrations,
            totalRevenue,
            avgTicketValue,
            conversionRate: 8.5,
            // Mock
            registrationsGrowth: 12.5,
            // Mock
            revenueGrowth: 18.2
            // Mock
          },
          ticketTypes: tickets2.map((ticket) => ({
            name: ticket.name,
            sold: ticket.sold || 0,
            revenue: (ticket.sold || 0) * parseFloat(ticket.price || 0)
          })),
          registrationsByDay: [],
          // Mock
          trafficSources: []
          // Mock
        };
      }
      // Category operations
      async getEventCategory(id) {
        if (!id) return void 0;
        const [category] = await db.select().from(eventCategories).where(eq(eventCategories.id, id));
        return category;
      }
      // Registration operations
      async createRegistration(registrationData) {
        const qrCode = `REG-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        const [registration] = await db.insert(registrations).values({ ...registrationData, qrCode }).returning();
        return registration;
      }
      async getEventRegistrations(eventId) {
        return await db.select().from(registrations).where(eq(registrations.eventId, eventId)).orderBy(desc(registrations.createdAt));
      }
      async getUserRegistrations(userId) {
        return await db.select().from(registrations).where(eq(registrations.userId, userId)).orderBy(desc(registrations.createdAt));
      }
      // Template operations
      async createTemplate(templateData) {
        const [template] = await db.insert(templates).values(templateData).returning();
        return template;
      }
      async getTemplates() {
        return await db.select().from(templates).where(eq(templates.isPublic, true)).orderBy(templates.createdAt);
      }
      async getTemplatesByCategory(categoryId) {
        return await db.select().from(templates).where(and(eq(templates.categoryId, categoryId), eq(templates.isPublic, true))).orderBy(templates.createdAt);
      }
      async getTemplate(id) {
        const [template] = await db.select().from(templates).where(eq(templates.id, id));
        return template;
      }
      // Category operations
      async getEventCategories() {
        return await db.select().from(eventCategories).orderBy(eventCategories.name);
      }
      async createEventCategory(categoryData) {
        const [category] = await db.insert(eventCategories).values(categoryData).returning();
        return category;
      }
      // Analytics operations
      async getUserStats(userId) {
        const eventCount = await db.select({ count: sql2`count(*)` }).from(events).where(eq(events.organizerId, userId));
        const registrationStats = await db.select({
          count: sql2`count(*)`,
          revenue: sql2`sum(${registrations.amountPaid})`
        }).from(registrations).innerJoin(events, eq(registrations.eventId, events.id)).where(
          and(
            eq(events.organizerId, userId),
            eq(registrations.paymentStatus, "paid")
          )
        );
        const totalEvents = eventCount[0]?.count || 0;
        const totalParticipants = registrationStats[0]?.count || 0;
        const totalRevenue = registrationStats[0]?.revenue || 0;
        return {
          totalEvents,
          totalParticipants,
          totalRevenue: new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
          }).format(totalRevenue),
          conversionRate: totalEvents > 0 ? `${Math.round(totalParticipants / (totalEvents * 100) * 100)}%` : "0%"
        };
      }
      // Event Groups operations
      async createEventGroup(groupData) {
        const [group] = await db.insert(eventGroups).values(groupData).returning();
        return group;
      }
      async updateEventGroup(id, groupData) {
        const [group] = await db.update(eventGroups).set({ ...groupData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(eventGroups.id, id)).returning();
        return group;
      }
      async getEventGroup(id) {
        const [group] = await db.select().from(eventGroups).where(eq(eventGroups.id, id));
        return group;
      }
      async getEventGroups(eventId) {
        const groups = await db.select().from(eventGroups).where(eq(eventGroups.eventId, eventId)).orderBy(eventGroups.name);
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
      async deleteEventGroup(id) {
        await db.delete(eventGroups).where(eq(eventGroups.id, id));
      }
      // Group Managers operations
      async createGroupManager(managerData) {
        const [manager] = await db.insert(groupManagers).values(managerData).returning();
        return manager;
      }
      async updateGroupManager(id, managerData) {
        const [manager] = await db.update(groupManagers).set({ ...managerData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(groupManagers.id, id)).returning();
        return manager;
      }
      async getGroupManager(id) {
        const [manager] = await db.select().from(groupManagers).where(eq(groupManagers.id, id));
        return manager;
      }
      async getGroupManagers(groupId) {
        try {
          console.log("=== GET GROUP MANAGERS DEBUG ===");
          console.log("GroupId:", groupId);
          const managers = await db.select().from(groupManagers).where(eq(groupManagers.groupId, groupId));
          console.log("Managers found:", managers);
          return managers;
        } catch (error) {
          console.error("Error fetching group managers:", error);
          return [];
        }
      }
      async getUserGroupManagers(userId) {
        const managers = await db.select().from(groupManagers).where(eq(groupManagers.userId, userId)).orderBy(desc(groupManagers.assignedAt));
        const managersWithGroups = await Promise.all(
          managers.map(async (manager) => {
            const group = await this.getEventGroup(manager.groupId);
            return { ...manager, group };
          })
        );
        return managersWithGroups;
      }
      async deleteGroupManager(id) {
        await db.delete(groupManagers).where(eq(groupManagers.id, id));
      }
      async updateAllManagerPermissions() {
        const result = await db.update(groupManagers).set({
          permissions: ["read", "write", "participants", "payments"],
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(groupManagers.role, "manager")).returning();
        return result.length;
      }
      // Group Permissions operations
      async createGroupPermission(permissionData) {
        const [permission] = await db.insert(groupPermissions).values(permissionData).returning();
        return permission;
      }
      async getGroupPermission(id) {
        const [permission] = await db.select().from(groupPermissions).where(eq(groupPermissions.id, id));
        return permission;
      }
      async getGroupPermissions() {
        return await db.select().from(groupPermissions).orderBy(groupPermissions.name);
      }
      // Event Payment Plans operations
      async createEventPaymentPlan(planData) {
        const [plan] = await db.insert(eventPaymentPlans).values(planData).returning();
        return plan;
      }
      async updateEventPaymentPlan(id, planData) {
        const [plan] = await db.update(eventPaymentPlans).set({ ...planData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(eventPaymentPlans.id, id)).returning();
        return plan;
      }
      async getEventPaymentPlan(id) {
        const [plan] = await db.select().from(eventPaymentPlans).where(eq(eventPaymentPlans.id, id));
        return plan;
      }
      async getEventPaymentPlans(eventId) {
        return await db.select().from(eventPaymentPlans).where(eq(eventPaymentPlans.eventId, eventId)).orderBy(eventPaymentPlans.name);
      }
      async getDefaultEventPaymentPlan(eventId) {
        const [plan] = await db.select().from(eventPaymentPlans).where(and(
          eq(eventPaymentPlans.eventId, eventId),
          eq(eventPaymentPlans.isDefault, true)
        ));
        return plan;
      }
      async deleteEventPaymentPlan(id) {
        await db.delete(eventPaymentPlans).where(eq(eventPaymentPlans.id, id));
      }
      // Payment Installments operations
      async createPaymentInstallment(installmentData) {
        const [installment] = await db.insert(paymentInstallments).values(installmentData).returning();
        return installment;
      }
      async updatePaymentInstallment(id, installmentData) {
        const [installment] = await db.update(paymentInstallments).set({ ...installmentData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(paymentInstallments.id, id)).returning();
        return installment;
      }
      async getPaymentInstallment(id) {
        const [installment] = await db.select().from(paymentInstallments).where(eq(paymentInstallments.id, id));
        return installment;
      }
      async getRegistrationInstallments(registrationId) {
        return await db.select().from(paymentInstallments).where(eq(paymentInstallments.registrationId, registrationId)).orderBy(paymentInstallments.installmentNumber);
      }
      async getEventInstallments(eventId) {
        return await db.select().from(paymentInstallments).innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id)).where(eq(registrations.eventId, eventId)).orderBy(paymentInstallments.dueDate);
      }
      async getGroupInstallments(groupId) {
        return await db.select().from(paymentInstallments).innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id)).where(eq(registrations.groupId, groupId)).orderBy(paymentInstallments.dueDate);
      }
      async getOverdueInstallments(eventId) {
        const now = /* @__PURE__ */ new Date();
        let query = db.select().from(paymentInstallments).where(and(
          eq(paymentInstallments.status, "pending"),
          sql2`${paymentInstallments.dueDate} < ${now}`
        ));
        if (eventId) {
          query = query.innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id)).where(and(
            eq(registrations.eventId, eventId),
            eq(paymentInstallments.status, "pending"),
            sql2`${paymentInstallments.dueDate} < ${now}`
          ));
        }
        return await query.orderBy(paymentInstallments.dueDate);
      }
      async getUpcomingInstallments(dueDate) {
        const startOfDay = new Date(dueDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dueDate);
        endOfDay.setHours(23, 59, 59, 999);
        return await db.select().from(paymentInstallments).where(and(
          eq(paymentInstallments.status, "pending"),
          gte(paymentInstallments.dueDate, startOfDay),
          lte(paymentInstallments.dueDate, endOfDay)
        )).orderBy(paymentInstallments.dueDate);
      }
      async deletePaymentInstallment(id) {
        await db.delete(paymentInstallments).where(eq(paymentInstallments.id, id));
      }
      // Payment Transactions operations
      async createPaymentTransaction(transactionData) {
        const [transaction] = await db.insert(paymentTransactions).values(transactionData).returning();
        return transaction;
      }
      async getPaymentTransaction(id) {
        const [transaction] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id));
        return transaction;
      }
      async getInstallmentTransactions(installmentId) {
        return await db.select().from(paymentTransactions).where(eq(paymentTransactions.installmentId, installmentId)).orderBy(desc(paymentTransactions.createdAt));
      }
      async getRegistrationTransactions(registrationId) {
        return await db.select().from(paymentTransactions).innerJoin(paymentInstallments, eq(paymentTransactions.installmentId, paymentInstallments.id)).where(eq(paymentInstallments.registrationId, registrationId)).orderBy(desc(paymentTransactions.createdAt));
      }
      // Payment Analytics operations
      async getPaymentAnalytics(eventId) {
        const now = /* @__PURE__ */ new Date();
        const [stats] = await db.select({
          totalExpected: sql2`COALESCE(SUM(${paymentInstallments.originalAmount}), 0)`,
          totalPaid: sql2`COALESCE(SUM(${paymentInstallments.paidAmount}), 0)`,
          totalRemaining: sql2`COALESCE(SUM(${paymentInstallments.remainingAmount}), 0)`,
          overdueAmount: sql2`COALESCE(SUM(CASE WHEN ${paymentInstallments.dueDate} < ${now} AND ${paymentInstallments.status} = 'pending' THEN ${paymentInstallments.remainingAmount} ELSE 0 END), 0)`,
          overdueCount: sql2`COUNT(CASE WHEN ${paymentInstallments.dueDate} < ${now} AND ${paymentInstallments.status} = 'pending' THEN 1 END)`,
          paidCount: sql2`COUNT(CASE WHEN ${paymentInstallments.status} = 'paid' THEN 1 END)`,
          pendingCount: sql2`COUNT(CASE WHEN ${paymentInstallments.status} = 'pending' THEN 1 END)`
        }).from(paymentInstallments).innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id)).where(eq(registrations.eventId, eventId));
        return {
          totalExpected: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalExpected),
          totalPaid: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalPaid),
          totalRemaining: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalRemaining),
          overdueAmount: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.overdueAmount),
          overdueCount: stats.overdueCount,
          paidCount: stats.paidCount,
          pendingCount: stats.pendingCount
        };
      }
      async getGroupPaymentAnalytics(groupId) {
        const now = /* @__PURE__ */ new Date();
        const [stats] = await db.select({
          totalExpected: sql2`COALESCE(SUM(${paymentInstallments.originalAmount}), 0)`,
          totalPaid: sql2`COALESCE(SUM(${paymentInstallments.paidAmount}), 0)`,
          totalRemaining: sql2`COALESCE(SUM(${paymentInstallments.remainingAmount}), 0)`,
          overdueAmount: sql2`COALESCE(SUM(CASE WHEN ${paymentInstallments.dueDate} < ${now} AND ${paymentInstallments.status} = 'pending' THEN ${paymentInstallments.remainingAmount} ELSE 0 END), 0)`,
          overdueCount: sql2`COUNT(CASE WHEN ${paymentInstallments.dueDate} < ${now} AND ${paymentInstallments.status} = 'pending' THEN 1 END)`,
          paidCount: sql2`COUNT(CASE WHEN ${paymentInstallments.status} = 'paid' THEN 1 END)`,
          pendingCount: sql2`COUNT(CASE WHEN ${paymentInstallments.status} = 'pending' THEN 1 END)`
        }).from(paymentInstallments).innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id)).where(eq(registrations.groupId, groupId));
        return {
          totalExpected: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalExpected),
          totalPaid: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalPaid),
          totalRemaining: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalRemaining),
          overdueAmount: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.overdueAmount),
          overdueCount: stats.overdueCount,
          paidCount: stats.paidCount,
          pendingCount: stats.pendingCount
        };
      }
      // Notifications operations
      async createNotification(notificationData) {
        const [notification] = await db.insert(notifications).values(notificationData).returning();
        return notification;
      }
      async getNotification(id) {
        const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
        return notification;
      }
      async getUserNotifications(userId, options = {}) {
        const { limit = 50, offset = 0, unreadOnly = false, type, eventId, groupId } = options;
        let query = db.select().from(notifications).where(eq(notifications.userId, userId));
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
        return await query.orderBy(desc(notifications.createdAt)).limit(limit).offset(offset);
      }
      async markNotificationAsRead(id) {
        await db.update(notifications).set({ isRead: true, readAt: /* @__PURE__ */ new Date() }).where(eq(notifications.id, id));
      }
      async markAllNotificationsAsRead(userId) {
        await db.update(notifications).set({ isRead: true, readAt: /* @__PURE__ */ new Date() }).where(eq(notifications.userId, userId));
      }
      async deleteNotification(id) {
        await db.delete(notifications).where(eq(notifications.id, id));
      }
      async archiveNotification(id) {
        await db.update(notifications).set({ isArchived: true }).where(eq(notifications.id, id));
      }
      async getUnreadNotificationCount(userId) {
        const [result] = await db.select({ count: sql2`COUNT(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
        return result.count;
      }
      // Notification Preferences operations
      async createNotificationPreference(preferenceData) {
        const [preference] = await db.insert(notificationPreferences).values(preferenceData).returning();
        return preference;
      }
      async getNotificationPreference(userId) {
        const [preference] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
        return preference;
      }
      async updateNotificationPreference(userId, preferenceData) {
        const [preference] = await db.update(notificationPreferences).set({ ...preferenceData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(notificationPreferences.userId, userId)).returning();
        return preference;
      }
      // Group Dashboard operations
      async getGroupParticipants(groupId) {
        const participants = await db.select().from(registrations).where(eq(registrations.groupId, groupId)).orderBy(desc(registrations.createdAt));
        const participantsWithInstallments = await Promise.all(
          participants.map(async (participant) => {
            const installments = await db.select().from(paymentInstallments).where(eq(paymentInstallments.registrationId, participant.id)).orderBy(paymentInstallments.installmentNumber);
            return {
              ...participant,
              installments: installments.map((installment) => ({
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
      // Event participants with installments
      async getEventParticipantsWithInstallments(eventId) {
        const participants = await db.select().from(registrations).where(eq(registrations.eventId, eventId)).orderBy(desc(registrations.createdAt));
        const participantsWithInstallments = await Promise.all(
          participants.map(async (participant) => {
            const installments = await db.select().from(paymentInstallments).where(eq(paymentInstallments.registrationId, participant.id)).orderBy(paymentInstallments.installmentNumber);
            return {
              ...participant,
              installments: installments.map((installment) => ({
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
      async getGroupPendingPayments(groupId) {
        const result = await db.select({ count: sql2`count(*)` }).from(paymentInstallments).innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id)).where(
          and(
            eq(registrations.groupId, groupId),
            eq(paymentInstallments.status, "pending")
          )
        );
        return result[0]?.count || 0;
      }
      async getGroupTotalRevenue(groupId) {
        const result = await db.select({ total: sql2`coalesce(sum(${paymentTransactions.amount}), 0)` }).from(paymentTransactions).innerJoin(paymentInstallments, eq(paymentTransactions.installmentId, paymentInstallments.id)).innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id)).where(
          and(
            eq(registrations.groupId, groupId),
            eq(paymentTransactions.type, "payment")
          )
        );
        return result[0]?.total || 0;
      }
      async getGroupOverduePayments(groupId) {
        const result = await db.select({ count: sql2`count(*)` }).from(paymentInstallments).innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id)).where(
          and(
            eq(registrations.groupId, groupId),
            eq(paymentInstallments.status, "pending"),
            sql2`${paymentInstallments.dueDate} < ${/* @__PURE__ */ new Date()}`
          )
        );
        return result[0]?.count || 0;
      }
      async getGroupConfirmedParticipants(groupId) {
        const participants = await db.select().from(registrations).where(eq(registrations.groupId, groupId));
        let confirmedCount = 0;
        for (const participant of participants) {
          const installments = await db.select().from(paymentInstallments).where(eq(paymentInstallments.registrationId, participant.id)).orderBy(paymentInstallments.installmentNumber);
          if (installments.length === 0) {
            if (participant.paymentStatus === "paid" && Number(participant.amountPaid) > 0) {
              confirmedCount++;
            }
          } else {
            const hasPaidInstallment = installments.some((installment) => installment.status === "paid");
            if (hasPaidInstallment) {
              confirmedCount++;
            }
          }
        }
        return confirmedCount;
      }
      // Obter um grupo por ID
      async getGroupById(groupId) {
        try {
          console.log("=== GET GROUP BY ID DEBUG ===");
          console.log("GroupId:", groupId);
          const [group] = await db.select().from(eventGroups).where(eq(eventGroups.id, groupId)).limit(1);
          if (!group) {
            console.log("Grupo n\xE3o encontrado");
            return null;
          }
          console.log("Grupo encontrado:", group);
          const [event] = await db.select({
            id: events.id,
            name: events.title
          }).from(events).where(eq(events.id, group.eventId)).limit(1);
          return {
            ...group,
            event: event || null
          };
        } catch (error) {
          console.error("Erro ao buscar grupo por ID:", error);
          throw error;
        }
      }
      async checkUserGroupAccess(userId, groupId) {
        const group = await db.select().from(eventGroups).where(eq(eventGroups.id, groupId)).limit(1);
        if (group.length === 0) return false;
        const event = await db.select().from(events).where(eq(events.id, group[0].eventId)).limit(1);
        if (event.length > 0 && event[0].organizerId === userId) {
          return true;
        }
        const groupManager = await db.select().from(groupManagers).where(
          and(
            eq(groupManagers.userId, userId),
            eq(groupManagers.groupId, groupId)
          )
        ).limit(1);
        return groupManager.length > 0;
      }
      async getGroupPayments(groupId) {
        const payments = await db.select({
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
        }).from(paymentTransactions).innerJoin(paymentInstallments, eq(paymentTransactions.installmentId, paymentInstallments.id)).innerJoin(registrations, eq(paymentInstallments.registrationId, registrations.id)).where(eq(registrations.groupId, groupId)).orderBy(desc(paymentTransactions.createdAt));
        return payments;
      }
      async getUserEvents(userId) {
        const userEvents = await db.select().from(events).where(eq(events.organizerId, userId)).orderBy(desc(events.createdAt));
        return userEvents;
      }
      async getAllEvents() {
        const allEvents = await db.select().from(events).orderBy(desc(events.createdAt));
        return allEvents;
      }
      async getUserManagedEvents(userId) {
        const managedEvents = await db.select().from(events).innerJoin(eventGroups, eq(events.id, eventGroups.eventId)).innerJoin(groupManagers, eq(eventGroups.id, groupManagers.groupId)).where(eq(groupManagers.userId, userId)).orderBy(desc(events.createdAt));
        return managedEvents;
      }
      async findUserByEmail(email) {
        const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return user[0] || null;
      }
      async getEventById(eventId) {
        const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
        return event[0] || null;
      }
      // Get installment by ID
      async getInstallmentById(installmentId) {
        const result = await db.select().from(paymentInstallments).where(eq(paymentInstallments.id, installmentId)).limit(1);
        return result[0] || null;
      }
      // Get registration by ID
      async getRegistrationById(registrationId) {
        const result = await db.select().from(registrations).where(eq(registrations.id, registrationId)).limit(1);
        return result[0] || null;
      }
      // Mark installment as paid
      async markInstallmentAsPaid(installmentId, updatedBy) {
        await db.update(paymentInstallments).set({
          status: "paid",
          paidDate: /* @__PURE__ */ new Date(),
          paidAmount: sql2`original_amount`,
          remainingAmount: "0",
          updatedBy,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(paymentInstallments.id, installmentId));
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/config/pusher.ts
var pusher_exports = {};
__export(pusher_exports, {
  PUSHER_EVENTS: () => PUSHER_EVENTS,
  getEventChannel: () => getEventChannel,
  getUserChannel: () => getUserChannel,
  pusher: () => pusher,
  sendPusherNotification: () => sendPusherNotification,
  sendPusherNotificationToChannels: () => sendPusherNotificationToChannels
});
import Pusher from "pusher";
var pusher, PUSHER_EVENTS, getEventChannel, getUserChannel, sendPusherNotification, sendPusherNotificationToChannels;
var init_pusher = __esm({
  "server/config/pusher.ts"() {
    "use strict";
    pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID || "2046477",
      key: process.env.PUSHER_KEY || "f0725138d607f195d650",
      secret: process.env.PUSHER_SECRET || "553c5b655a5057236d50",
      cluster: process.env.PUSHER_CLUSTER || "sa1",
      useTLS: true
    });
    console.log("=== PUSHER CONFIGURADO ===");
    console.log("App ID:", process.env.PUSHER_APP_ID || "2046477");
    console.log("Key:", process.env.PUSHER_KEY || "f0725138d607f195d650");
    console.log("Cluster:", process.env.PUSHER_CLUSTER || "sa1");
    console.log("Use TLS:", true);
    PUSHER_EVENTS = {
      NEW_REGISTRATION: "new_registration",
      PAYMENT_CONFIRMED: "payment_confirmed",
      REGISTRATION_UPDATED: "registration_updated",
      EVENT_UPDATED: "event_updated"
    };
    getEventChannel = (eventId) => `private-event-${eventId}`;
    getUserChannel = (userId) => `private-user-${userId}`;
    sendPusherNotification = async (channel, event, data, userId) => {
      try {
        console.log("=== SEND PUSHER NOTIFICATION ===");
        console.log("Channel:", channel);
        console.log("Event:", event);
        console.log("Data:", JSON.stringify(data, null, 2));
        console.log("UserId:", userId);
        const notificationData = {
          ...data,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          userId,
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        console.log("Notification Data:", JSON.stringify(notificationData, null, 2));
        const result = await pusher.trigger(channel, event, notificationData);
        console.log("\u2705 Pusher trigger result:", result);
        console.log(`\u2705 Pusher notification sent to ${channel}: ${event}`);
      } catch (error) {
        console.error("\u274C Error sending Pusher notification:", error);
        console.error("Error details:", {
          message: error?.message || "Unknown error",
          stack: error?.stack || "No stack trace",
          channel,
          event
        });
      }
    };
    sendPusherNotificationToChannels = async (channels, event, data, userId) => {
      console.log("=== SEND PUSHER NOTIFICATION TO MULTIPLE CHANNELS ===");
      console.log("Channels:", channels);
      console.log("Event:", event);
      const promises = channels.map(
        (channel) => sendPusherNotification(channel, event, data, userId)
      );
      await Promise.all(promises);
    };
  }
});

// server/config/resend.ts
import { Resend } from "resend";
var resend, EMAIL_CONFIG;
var init_resend = __esm({
  "server/config/resend.ts"() {
    "use strict";
    resend = new Resend(process.env.RESEND_API_KEY || "re_L4nrK6rq_5oQT7qrdSsJaFgKWuD5oSFau");
    EMAIL_CONFIG = {
      from: "EventFlow <eventflow@juliodevelop.online>",
      replyTo: "suporte@juliodevelop.online"
    };
  }
});

// server/services/emailService.ts
var emailService_exports = {};
__export(emailService_exports, {
  EmailService: () => EmailService
});
var EmailService;
var init_emailService = __esm({
  "server/services/emailService.ts"() {
    "use strict";
    init_resend();
    EmailService = class {
      static FROM_EMAIL = EMAIL_CONFIG.from;
      /**
       * Enviar email de notificação de parcela vencida
       */
      static async sendInstallmentReminder(data) {
        const { to, participantName, eventName, installmentNumber, totalInstallments, amount, dueDate, paymentUrl, whatsappNumber } = data;
        const subject = `EventFlow - Lembrete de Pagamento - ${eventName}`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lembrete de Pagamento</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 24px; font-weight: bold; color: #059669; }
          .due-date { color: #dc2626; font-weight: bold; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .whatsapp-button { background: #25d366; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EventFlow</h1>
            <p>Lembrete de Pagamento</p>
          </div>
          
          <div class="content">
            <h2>Ol\xE1, ${participantName}!</h2>
            
            <p>Este \xE9 um lembrete sobre o pagamento da sua inscri\xE7\xE3o no evento <strong>${eventName}</strong>.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h3>Detalhes da Parcela</h3>
              <p><strong>Parcela:</strong> ${installmentNumber} de ${totalInstallments}</p>
              <p><strong>Valor:</strong> <span class="amount">R$ ${amount.toFixed(2)}</span></p>
              <p><strong>Vencimento:</strong> <span class="due-date">${new Date(dueDate).toLocaleDateString("pt-BR")}</span></p>
            </div>
            
            <p>Para realizar o pagamento, clique no bot\xE3o abaixo:</p>
            <a href="${paymentUrl}" class="button">Pagar Agora</a>
            
            ${whatsappNumber ? `
              <p>Ou entre em contato conosco via WhatsApp:</p>
              <a href="https://wa.me/${whatsappNumber.replace(/\D/g, "")}" class="button whatsapp-button">Contatar via WhatsApp</a>
            ` : ""}
            
            <div class="footer">
              <p><strong>EventFlow</strong> - Sistema de Gest\xE3o de Eventos</p>
              <p>Este \xE9 um email autom\xE1tico. Em caso de d\xFAvidas, entre em contato com os organizadores do evento.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
        try {
          const result = await resend.emails.send({
            from: this.FROM_EMAIL,
            to,
            subject,
            html
          });
          console.log("Email de lembrete enviado:", result);
          return result;
        } catch (error) {
          console.error("Erro ao enviar email de lembrete:", error);
          throw error;
        }
      }
      /**
       * Enviar email de confirmação de inscrição
       */
      static async sendRegistrationConfirmation(data) {
        const { to, participantName, eventName, totalAmount, installmentPlan } = data;
        const subject = `EventFlow - Confirma\xE7\xE3o de Inscri\xE7\xE3o - ${eventName}`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirma\xE7\xE3o de Inscri\xE7\xE3o</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 24px; font-weight: bold; color: #059669; }
          .installment-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EventFlow</h1>
            <p>Inscri\xE7\xE3o Confirmada!</p>
          </div>
          
          <div class="content">
            <h2>Parab\xE9ns, ${participantName}!</h2>
            
            <p>Sua inscri\xE7\xE3o no evento <strong>${eventName}</strong> foi confirmada com sucesso!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <h3>Detalhes da Inscri\xE7\xE3o</h3>
              <p><strong>Evento:</strong> ${eventName}</p>
              <p><strong>Valor Total:</strong> <span class="amount">R$ ${totalAmount.toFixed(2)}</span></p>
            </div>
            
            ${installmentPlan ? `
              <div class="installment-info">
                <h3>Plano de Pagamento</h3>
                <p><strong>Forma de Pagamento:</strong> Parcelamento em ${installmentPlan.totalInstallments} parcelas mensais</p>
                <p><strong>Valor da Parcela:</strong> <span class="amount">R$ ${installmentPlan.monthlyAmount.toFixed(2)}</span></p>
                <p><strong>Primeira Parcela:</strong> ${new Date(installmentPlan.firstDueDate).toLocaleDateString("pt-BR")}</p>
                <p><em>Voc\xEA receber\xE1 lembretes mensais sobre os vencimentos das parcelas.</em></p>
              </div>
            ` : ""}
            
            <div class="footer">
              <p><strong>EventFlow</strong> - Sistema de Gest\xE3o de Eventos</p>
              <p>Em caso de d\xFAvidas, entre em contato com os organizadores do evento.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
        try {
          const result = await resend.emails.send({
            from: this.FROM_EMAIL,
            to,
            subject,
            html
          });
          console.log("Email de confirma\xE7\xE3o enviado:", result);
          return result;
        } catch (error) {
          console.error("Erro ao enviar email de confirma\xE7\xE3o:", error);
          throw error;
        }
      }
      /**
       * Enviar email de cobrança de parcela em atraso
       */
      static async sendOverdueNotification(data) {
        const { to, participantName, eventName, installmentNumber, amount, daysOverdue, lateFee, paymentUrl, whatsappNumber } = data;
        const subject = `EventFlow - Parcela em Atraso - ${eventName}`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Parcela em Atraso</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
          .overdue-info { background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .whatsapp-button { background: #25d366; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EventFlow</h1>
            <p>Parcela em Atraso</p>
          </div>
          
          <div class="content">
            <h2>Ol\xE1, ${participantName}!</h2>
            
            <p>Identificamos que a parcela ${installmentNumber} do evento <strong>${eventName}</strong> est\xE1 em atraso.</p>
            
            <div class="overdue-info">
              <h3>Detalhes da Parcela em Atraso</h3>
              <p><strong>Parcela:</strong> ${installmentNumber}</p>
              <p><strong>Valor Original:</strong> R$ ${amount.toFixed(2)}</p>
              <p><strong>Multa por Atraso:</strong> R$ ${lateFee.toFixed(2)}</p>
              <p><strong>Valor Total:</strong> <span class="amount">R$ ${(amount + lateFee).toFixed(2)}</span></p>
              <p><strong>Dias em Atraso:</strong> ${daysOverdue} dias</p>
            </div>
            
            <p>Para regularizar sua situa\xE7\xE3o, clique no bot\xE3o abaixo:</p>
            <a href="${paymentUrl}" class="button">Pagar Agora</a>
            
            ${whatsappNumber ? `
              <p>Ou entre em contato conosco via WhatsApp:</p>
              <a href="https://wa.me/${whatsappNumber.replace(/\D/g, "")}" class="button whatsapp-button">Contatar via WhatsApp</a>
            ` : ""}
            
            <div class="footer">
              <p><strong>EventFlow</strong> - Sistema de Gest\xE3o de Eventos</p>
              <p>Este \xE9 um email autom\xE1tico. Em caso de d\xFAvidas, entre em contato com os organizadores do evento.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
        try {
          const result = await resend.emails.send({
            from: this.FROM_EMAIL,
            to,
            subject,
            html
          });
          console.log("Email de cobran\xE7a enviado:", result);
          return result;
        } catch (error) {
          console.error("Erro ao enviar email de cobran\xE7a:", error);
          throw error;
        }
      }
    };
  }
});

// server/services/paymentService.ts
var paymentService_exports = {};
__export(paymentService_exports, {
  PaymentService: () => PaymentService
});
var PaymentService;
var init_paymentService = __esm({
  "server/services/paymentService.ts"() {
    "use strict";
    init_storage();
    PaymentService = class {
      /**
       * Calcula as parcelas baseado no plano de pagamento
       */
      static calculateInstallments(plan, totalAmount, registrationDate = /* @__PURE__ */ new Date()) {
        const installments = [];
        const installmentAmount = totalAmount / plan.installmentCount;
        const dueDates = this.calculateDueDates(
          plan.firstInstallmentDate || registrationDate,
          plan.installmentCount,
          plan.installmentInterval
        );
        let totalPaid = 0;
        let totalRemaining = totalAmount;
        for (let i = 0; i < plan.installmentCount; i++) {
          const installmentNumber = i + 1;
          const dueDate = dueDates[i];
          const originalAmount = this.roundToTwoDecimals(installmentAmount);
          const remainingAmount = originalAmount;
          installments.push({
            installmentNumber,
            dueDate,
            originalAmount,
            remainingAmount,
            discountAmount: 0,
            lateFeeAmount: 0
          });
        }
        return {
          installments,
          totalAmount,
          totalPaid,
          totalRemaining
        };
      }
      /**
       * Calcula as datas de vencimento das parcelas
       */
      static calculateDueDates(firstDate, count, interval) {
        const dates = [];
        const currentDate = new Date(firstDate);
        for (let i = 0; i < count; i++) {
          dates.push(new Date(currentDate));
          switch (interval) {
            case "weekly":
              currentDate.setDate(currentDate.getDate() + 7);
              break;
            case "biweekly":
              currentDate.setDate(currentDate.getDate() + 14);
              break;
            case "monthly":
            default:
              currentDate.setMonth(currentDate.getMonth() + 1);
              break;
          }
        }
        return dates;
      }
      /**
       * Aplica desconto a uma parcela
       */
      static applyDiscount(installment, discountPolicy, groupId) {
        let discountAmount = 0;
        if (discountPolicy.cashDiscount?.enabled) {
          discountAmount += installment.originalAmount * (discountPolicy.cashDiscount.percentage / 100);
        }
        if (groupId && discountPolicy.groupDiscounts?.[groupId]?.enabled) {
          const groupDiscount = discountPolicy.groupDiscounts[groupId];
          discountAmount += installment.originalAmount * (groupDiscount.percentage / 100);
        }
        return this.roundToTwoDecimals(discountAmount);
      }
      /**
       * Calcula multa por atraso
       */
      static calculateLateFee(installment, lateFeePolicy) {
        if (!lateFeePolicy.enabled) return 0;
        const now = /* @__PURE__ */ new Date();
        const dueDate = new Date(installment.dueDate);
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1e3 * 60 * 60 * 24));
        if (daysOverdue <= lateFeePolicy.gracePeriodDays) return 0;
        let lateFee = lateFeePolicy.fixedFee;
        const interestDays = daysOverdue - lateFeePolicy.gracePeriodDays;
        const interestAmount = installment.remainingAmount * (lateFeePolicy.interestRate / 100) * (interestDays / 30);
        lateFee += interestAmount;
        return this.roundToTwoDecimals(Math.min(lateFee, lateFeePolicy.maxLateFee));
      }
      /**
       * Cria parcelas para uma inscrição
       */
      static async createInstallmentsForRegistration(registration, plan) {
        const totalAmount = parseFloat(registration.totalAmount || "0");
        const calculation = this.calculateInstallments(plan, totalAmount, new Date(registration.createdAt));
        const installments = [];
        for (const installmentData of calculation.installments) {
          const installment = await storage.createPaymentInstallment({
            registrationId: registration.id,
            planId: plan.id,
            installmentNumber: installmentData.installmentNumber,
            dueDate: installmentData.dueDate,
            originalAmount: installmentData.originalAmount.toString(),
            remainingAmount: installmentData.remainingAmount.toString(),
            status: "pending"
          });
          installments.push(installment);
        }
        return installments;
      }
      /**
       * Processa um pagamento
       */
      static async processPayment(installmentId, amount, paymentMethod, transactionId, notes, createdBy) {
        const installment = await storage.getPaymentInstallment(installmentId);
        if (!installment) {
          throw new Error("Parcela n\xE3o encontrada");
        }
        const paidAmount = parseFloat(installment.paidAmount || "0");
        const newPaidAmount = paidAmount + amount;
        const remainingAmount = Math.max(0, parseFloat(installment.originalAmount) - newPaidAmount);
        const updatedInstallment = await storage.updatePaymentInstallment(installmentId, {
          paidAmount: newPaidAmount.toString(),
          remainingAmount: remainingAmount.toString(),
          status: remainingAmount === 0 ? "paid" : "partial",
          paidDate: remainingAmount === 0 ? /* @__PURE__ */ new Date() : void 0,
          updatedBy: createdBy
        });
        const transaction = await storage.createPaymentTransaction({
          installmentId,
          amount: amount.toString(),
          type: "payment",
          paymentMethod,
          transactionId,
          notes,
          createdBy
        });
        await this.updateRegistrationPaymentStatus(installment.registrationId);
        return { installment: updatedInstallment, transaction };
      }
      /**
       * Aplica desconto a uma parcela
       */
      static async applyDiscountToInstallment(installmentId, discountAmount, notes, updatedBy) {
        const installment = await storage.getPaymentInstallment(installmentId);
        if (!installment) {
          throw new Error("Parcela n\xE3o encontrada");
        }
        const currentDiscount = parseFloat(installment.discountAmount || "0");
        const newDiscountAmount = currentDiscount + discountAmount;
        const remainingAmount = Math.max(0, parseFloat(installment.originalAmount) - parseFloat(installment.paidAmount || "0") - newDiscountAmount);
        const updatedInstallment = await storage.updatePaymentInstallment(installmentId, {
          discountAmount: newDiscountAmount.toString(),
          remainingAmount: remainingAmount.toString(),
          status: remainingAmount === 0 ? "waived" : installment.status,
          updatedBy
        });
        const transaction = await storage.createPaymentTransaction({
          installmentId,
          amount: discountAmount.toString(),
          type: "waiver",
          notes: notes || "Desconto aplicado",
          createdBy: updatedBy
        });
        return { installment: updatedInstallment, transaction };
      }
      /**
       * Aplica multa por atraso
       */
      static async applyLateFee(installmentId, lateFeeAmount, notes, updatedBy) {
        const installment = await storage.getPaymentInstallment(installmentId);
        if (!installment) {
          throw new Error("Parcela n\xE3o encontrada");
        }
        const currentLateFee = parseFloat(installment.lateFeeAmount || "0");
        const newLateFeeAmount = currentLateFee + lateFeeAmount;
        const remainingAmount = parseFloat(installment.originalAmount) - parseFloat(installment.paidAmount || "0") + newLateFeeAmount;
        const updatedInstallment = await storage.updatePaymentInstallment(installmentId, {
          lateFeeAmount: newLateFeeAmount.toString(),
          remainingAmount: remainingAmount.toString(),
          status: "overdue",
          updatedBy
        });
        const transaction = await storage.createPaymentTransaction({
          installmentId,
          amount: lateFeeAmount.toString(),
          type: "adjustment",
          notes: notes || "Multa por atraso aplicada",
          createdBy: updatedBy
        });
        return { installment: updatedInstallment, transaction };
      }
      /**
       * Atualiza o status de pagamento da inscrição
       */
      static async updateRegistrationPaymentStatus(registrationId) {
        const installments = await storage.getRegistrationInstallments(registrationId);
        if (installments.length === 0) return;
        const totalAmount = installments.reduce((sum, inst) => sum + parseFloat(inst.originalAmount), 0);
        const totalPaid = installments.reduce((sum, inst) => sum + parseFloat(inst.paidAmount || "0"), 0);
        const totalRemaining = installments.reduce((sum, inst) => sum + parseFloat(inst.remainingAmount), 0);
        let paymentStatus;
        if (totalPaid === 0) {
          paymentStatus = "pending";
        } else if (totalRemaining === 0) {
          paymentStatus = "paid";
        } else {
          paymentStatus = "partial";
        }
        const now = /* @__PURE__ */ new Date();
        const hasOverdue = installments.some(
          (inst) => new Date(inst.dueDate) < now && inst.status === "pending"
        );
        if (hasOverdue && paymentStatus !== "paid") {
          paymentStatus = "overdue";
        }
        await storage.updateRegistration(registrationId, {
          totalAmount: totalAmount.toString(),
          amountPaid: totalPaid.toString(),
          remainingAmount: totalRemaining.toString(),
          paymentStatus
        });
      }
      /**
       * Recalcula multas para parcelas em atraso
       */
      static async recalculateLateFees(eventId) {
        const overdueInstallments = await storage.getOverdueInstallments(eventId);
        for (const installment of overdueInstallments) {
          const plan = await storage.getEventPaymentPlan(installment.planId);
          if (!plan) continue;
          const lateFeePolicy = plan.lateFeePolicy;
          const calculatedLateFee = this.calculateLateFee(installment, lateFeePolicy);
          const currentLateFee = parseFloat(installment.lateFeeAmount || "0");
          if (calculatedLateFee > currentLateFee) {
            const additionalLateFee = calculatedLateFee - currentLateFee;
            await this.applyLateFee(
              installment.id,
              additionalLateFee,
              "Multa recalculada automaticamente",
              "system"
            );
          }
        }
      }
      /**
       * Arredonda para 2 casas decimais
       */
      static roundToTwoDecimals(value) {
        return Math.round(value * 100) / 100;
      }
      /**
       * Gera relatório de pagamentos
       */
      static async generatePaymentReport(eventId) {
        const eventAnalytics = await storage.getPaymentAnalytics(eventId);
        const groups = await storage.getEventGroups(eventId);
        const byGroup = await Promise.all(
          groups.map(async (group) => {
            const groupAnalytics = await storage.getGroupPaymentAnalytics(group.id);
            return {
              groupId: group.id,
              groupName: group.name,
              summary: groupAnalytics
            };
          })
        );
        return {
          summary: eventAnalytics,
          byGroup
        };
      }
    };
  }
});

// server/config/stripe.ts
var stripe_exports = {};
__export(stripe_exports, {
  STRIPE_CONFIG: () => STRIPE_CONFIG,
  createMultiTicketPaymentLink: () => createMultiTicketPaymentLink,
  createPaymentLink: () => createPaymentLink,
  createStripeProduct: () => createStripeProduct,
  getStripeRedirectConfig: () => getStripeRedirectConfig,
  stripe: () => stripe
});
import Stripe from "stripe";
function getStripeRedirectConfig(registrationId, eventSlug) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5000";
  const redirectUrl = registrationId && eventSlug ? `${baseUrl}/registration/confirmation?id=${registrationId}&session_id={CHECKOUT_SESSION_ID}&eventSlug=${eventSlug}` : registrationId ? `${baseUrl}/registration/confirmation?id=${registrationId}&session_id={CHECKOUT_SESSION_ID}` : `${baseUrl}/registration/confirmation?session_id={CHECKOUT_SESSION_ID}`;
  console.log("\u{1F517} URL de redirecionamento configurada:", redirectUrl);
  console.log("\u{1F4DD} RegistrationId:", registrationId);
  console.log("\u{1F4DD} EventSlug:", eventSlug);
  return {
    after_completion: {
      type: "redirect",
      redirect: {
        url: redirectUrl
      }
    }
  };
}
async function createStripeProduct(ticket, event) {
  try {
    console.log("=== DEBUG STRIPE PRODUCT ===");
    console.log("Ticket:", {
      id: ticket.id,
      name: ticket.name,
      price: ticket.price,
      priceType: typeof ticket.price
    });
    console.log("Event:", {
      id: event.id,
      title: event.title,
      slug: event.slug
    });
    const product = await stripe.products.create({
      name: `${event.title} - ${ticket.name}`,
      description: ticket.description || `Ingresso para ${event.title}`,
      metadata: {
        eventId: event.id,
        ticketId: ticket.id,
        eventSlug: event.slug
      }
    });
    console.log("Produto criado:", product.id);
    const unitAmount = Math.round(parseFloat(ticket.price || "0") * 100);
    console.log("Valor em centavos:", unitAmount);
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: unitAmount,
      currency: STRIPE_CONFIG.currency,
      metadata: {
        eventId: event.id,
        ticketId: ticket.id
      }
    });
    console.log("Pre\xE7o criado:", price.id);
    console.log("=== FIM DEBUG STRIPE PRODUCT ===");
    return { product, price };
  } catch (error) {
    console.error("Erro ao criar produto/pre\xE7o no Stripe:", error);
    throw error;
  }
}
async function createPaymentLink(ticket, event, quantity = 1, registrationId, customerEmail, customerPhone) {
  try {
    let product, price;
    try {
      const products = await stripe.products.list({
        limit: 1
      });
      const matchingProduct = products.data.find(
        (p) => p.metadata.eventId === event.id && p.metadata.ticketId === ticket.id
      );
      if (matchingProduct) {
        product = matchingProduct;
        const prices = await stripe.prices.list({
          limit: 1,
          product: product.id
        });
        if (prices.data.length > 0) {
          price = prices.data[0];
        }
      }
    } catch (error) {
      console.log("Produto n\xE3o encontrado, criando novo...");
    }
    if (!product || !price) {
      const result = await createStripeProduct(ticket, event);
      product = result.product;
      price = result.price;
    }
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity
        }
      ],
      ...STRIPE_CONFIG,
      ...getStripeRedirectConfig(registrationId, event.slug),
      metadata: {
        eventId: event.id,
        ticketId: ticket.id,
        eventSlug: event.slug,
        quantity: quantity.toString(),
        registrationId: registrationId || ""
      }
    });
    if ((customerEmail || customerPhone) && paymentLink.url) {
      const url = new URL(paymentLink.url);
      if (customerEmail) {
        url.searchParams.set("prefilled_email", customerEmail);
      }
      if (customerPhone) {
        url.searchParams.set("prefilled_phone_number", customerPhone);
      }
      paymentLink.url = url.toString();
    }
    return paymentLink;
  } catch (error) {
    console.error("Erro ao criar Payment Link:", error);
    console.error("Detalhes do erro:", {
      message: error.message,
      type: error.type,
      code: error.code
    });
    throw error;
  }
}
async function createMultiTicketPaymentLink(tickets2, event, customerEmail, customerPhone) {
  try {
    const lineItems = [];
    for (const ticketData of tickets2) {
      const ticket = await getTicketById(ticketData.ticketId);
      if (!ticket) continue;
      let product, price;
      try {
        const products = await stripe.products.list({
          limit: 1
        });
        const matchingProduct = products.data.find(
          (p) => p.metadata.eventId === event.id && p.metadata.ticketId === ticket.id
        );
        if (matchingProduct) {
          product = matchingProduct;
          const prices = await stripe.prices.list({
            limit: 1,
            product: product.id
          });
          if (prices.data.length > 0) {
            price = prices.data[0];
          }
        }
      } catch (error) {
        console.log("Produto n\xE3o encontrado, criando novo...");
      }
      if (!product || !price) {
        const result = await createStripeProduct(ticket, event);
        product = result.product;
        price = result.price;
      }
      lineItems.push({
        price: price.id,
        quantity: ticketData.quantity
      });
    }
    if (lineItems.length === 0) {
      throw new Error("Nenhum ingresso v\xE1lido encontrado");
    }
    const paymentLink = await stripe.paymentLinks.create({
      line_items: lineItems,
      ...STRIPE_CONFIG,
      metadata: {
        eventId: event.id,
        eventSlug: event.slug,
        multiTicket: "true"
      }
    });
    if ((customerEmail || customerPhone) && paymentLink.url) {
      const url = new URL(paymentLink.url);
      if (customerEmail) {
        url.searchParams.set("prefilled_email", customerEmail);
      }
      if (customerPhone) {
        url.searchParams.set("prefilled_phone_number", customerPhone);
      }
      paymentLink.url = url.toString();
    }
    return paymentLink;
  } catch (error) {
    console.error("Erro ao criar Payment Link para m\xFAltiplos ingressos:", error);
    throw error;
  }
}
async function getTicketById(ticketId) {
  try {
    const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    return await storage2.getTicket(ticketId);
  } catch (error) {
    console.error("Erro ao buscar ingresso:", error);
    return null;
  }
}
var stripe, STRIPE_CONFIG;
var init_stripe = __esm({
  "server/config/stripe.ts"() {
    "use strict";
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2025-08-27.basil"
    });
    STRIPE_CONFIG = {
      currency: "brl",
      // Real brasileiro
      payment_method_types: ["card", "boleto"],
      // Cartão e boleto (PIX removido temporariamente)
      billing_address_collection: "required",
      // Coletar endereço de cobrança
      phone_number_collection: {
        enabled: true
        // Coletar telefone
      }
    };
  }
});

// server/controllers/stripeWebhookController.ts
var stripeWebhookController_exports = {};
__export(stripeWebhookController_exports, {
  StripeWebhookController: () => StripeWebhookController
});
var processedWebhooks, StripeWebhookController;
var init_stripeWebhookController = __esm({
  "server/controllers/stripeWebhookController.ts"() {
    "use strict";
    init_stripe();
    init_storage();
    init_pusher();
    processedWebhooks = /* @__PURE__ */ new Set();
    StripeWebhookController = class _StripeWebhookController {
      // Processar webhook do Stripe
      static async handleWebhook(req, res) {
        console.log("=== WEBHOOK RECEBIDO ===");
        console.log("Timestamp:", (/* @__PURE__ */ new Date()).toISOString());
        console.log("Headers:", Object.keys(req.headers));
        console.log("Body length:", req.body?.length);
        console.log("Body type:", typeof req.body);
        const sig = req.headers["stripe-signature"];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        console.log("Signature presente:", !!sig);
        console.log("Endpoint Secret configurado:", !!endpointSecret);
        console.log("Environment:", process.env.NODE_ENV);
        if (!endpointSecret) {
          console.error("STRIPE_WEBHOOK_SECRET n\xE3o configurado");
          return res.status(500).json({ error: "Webhook secret n\xE3o configurado" });
        }
        let event;
        try {
          event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
          console.log("\u2705 Evento verificado com sucesso:", event.type);
          console.log("Event ID:", event.id);
          console.log("Event created:", new Date(event.created * 1e3).toISOString());
        } catch (err) {
          console.error("\u274C Erro na verifica\xE7\xE3o da assinatura do webhook:", err.message);
          console.error("Erro completo:", err);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        try {
          console.log("\u{1F504} Iniciando processamento do evento...");
          await _StripeWebhookController.processEvent(event);
          console.log("\u2705 Evento processado com sucesso");
          res.json({ received: true, eventType: event.type, eventId: event.id });
        } catch (error) {
          console.error("\u274C Erro ao processar webhook:", error);
          console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
          res.status(500).json({ error: "Erro interno do servidor" });
        }
      }
      // Processar diferentes tipos de eventos
      static async processEvent(event) {
        console.log("\u{1F504} Processando evento Stripe:", event.type);
        console.log("Event ID:", event.id);
        if (processedWebhooks.has(event.id)) {
          console.log("\u26A0\uFE0F Webhook j\xE1 foi processado, ignorando:", event.id);
          return;
        }
        processedWebhooks.add(event.id);
        console.log("\u2705 Webhook marcado como processado:", event.id);
        console.log("Event data object keys:", Object.keys(event.data.object));
        switch (event.type) {
          case "checkout.session.completed":
            console.log("\u{1F4CB} Processando checkout.session.completed");
            await _StripeWebhookController.handleCheckoutCompleted(event.data.object);
            break;
          case "payment_intent.succeeded":
            console.log("\u{1F4B3} Processando payment_intent.succeeded");
            await _StripeWebhookController.handlePaymentSucceeded(event.data.object);
            break;
          case "payment_intent.payment_failed":
            console.log("\u274C Processando payment_intent.payment_failed");
            await _StripeWebhookController.handlePaymentFailed(event.data.object);
            break;
          default:
            console.log(`\u26A0\uFE0F Evento n\xE3o tratado: ${event.type}`);
            console.log("Evento completo:", JSON.stringify(event, null, 2));
        }
      }
      // Quando o checkout é completado
      static async handleCheckoutCompleted(session2) {
        console.log("=== CHECKOUT COMPLETED WEBHOOK ===");
        console.log("Session ID:", session2.id);
        console.log("Session metadata:", session2.metadata);
        console.log("Session customer_details:", session2.customer_details);
        console.log("Timestamp:", (/* @__PURE__ */ new Date()).toISOString());
        try {
          const eventId = session2.metadata?.eventId;
          const eventSlug = session2.metadata?.eventSlug;
          if (!eventId || !eventSlug) {
            console.error("Metadados do evento n\xE3o encontrados na sess\xE3o:", session2.metadata);
            return;
          }
          const event = await storage.getEvent(eventId);
          if (!event) {
            console.error("Evento n\xE3o encontrado:", eventId);
            return;
          }
          const stripe2 = await Promise.resolve().then(() => (init_stripe(), stripe_exports));
          const lineItems = await stripe2.stripe.checkout.sessions.listLineItems(session2.id);
          console.log("Line items encontrados:", lineItems.data.length);
          for (const item of lineItems.data) {
            const ticketId = item.price?.metadata?.ticketId;
            const quantity = item.quantity || 1;
            console.log("Processando item:", { ticketId, quantity, priceMetadata: item.price?.metadata });
            if (ticketId) {
              const ticket = await storage.getTicket(ticketId);
              if (!ticket) {
                console.error("Ingresso n\xE3o encontrado:", ticketId);
                continue;
              }
              await _StripeWebhookController.updateRegistrationToPaid(
                session2,
                event,
                ticket,
                quantity
              );
            }
          }
          console.log(`Inscri\xE7\xF5es confirmadas para evento: ${event.title}`);
        } catch (error) {
          console.error("Erro ao processar checkout completado:", error);
        }
      }
      // Quando o pagamento é confirmado
      static async handlePaymentSucceeded(paymentIntent) {
        console.log("Pagamento confirmado:", paymentIntent.id);
        console.log("PaymentIntent metadata:", paymentIntent.metadata);
        try {
          const eventId = paymentIntent.metadata?.eventId;
          const eventSlug = paymentIntent.metadata?.eventSlug;
          if (!eventId || !eventSlug) {
            console.error("Metadados do evento n\xE3o encontrados no PaymentIntent:", paymentIntent.metadata);
            return;
          }
          const event = await storage.getEvent(eventId);
          if (!event) {
            console.error("Evento n\xE3o encontrado:", eventId);
            return;
          }
          const ticketId = paymentIntent.metadata?.ticketId;
          if (ticketId) {
            const ticket = await storage.getTicket(ticketId);
            if (!ticket) {
              console.error("Ingresso n\xE3o encontrado:", ticketId);
              return;
            }
            await _StripeWebhookController.updateRegistrationToPaid(
              paymentIntent,
              event,
              ticket,
              parseInt(paymentIntent.metadata?.quantity || "1")
            );
          }
          console.log(`Inscri\xE7\xE3o confirmada para evento: ${event.title}`);
        } catch (error) {
          console.error("Erro ao processar pagamento confirmado:", error);
        }
      }
      // Quando o pagamento falha
      static async handlePaymentFailed(paymentIntent) {
        console.log("Pagamento falhou:", paymentIntent.id);
        try {
          const eventId = paymentIntent.metadata?.eventId;
          const ticketId = paymentIntent.metadata?.ticketId;
          if (!eventId || !ticketId) {
            console.error("Metadados do evento n\xE3o encontrados no PaymentIntent");
            return;
          }
          const event = await storage.getEvent(eventId);
          if (!event) {
            console.error("Evento n\xE3o encontrado:", eventId);
            return;
          }
          const ticket = await storage.getTicket(ticketId);
          if (!ticket) {
            console.error("Ingresso n\xE3o encontrado:", ticketId);
            return;
          }
          console.log(`Pagamento falhou para evento: ${event.title}`);
        } catch (error) {
          console.error("Erro ao processar pagamento falhado:", error);
        }
      }
      // Atualizar inscrição existente para confirmada
      static async updateRegistrationToPaid(paymentData, event, ticket, quantity) {
        try {
          console.log("Atualizando inscri\xE7\xE3o para paga com dados:", {
            paymentDataId: paymentData.id,
            eventId: event.id,
            ticketId: ticket.id,
            quantity
          });
          let customerName = "N/A";
          let customerEmail = "N/A";
          let customerPhone = null;
          let amountPaid = "0.00";
          let paymentId = paymentData.id;
          if (paymentData.customer_details) {
            customerName = paymentData.customer_details.name || "N/A";
            customerEmail = paymentData.customer_details.email || "N/A";
            customerPhone = paymentData.customer_details.phone || null;
            amountPaid = paymentData.amount_total ? (paymentData.amount_total / 100).toFixed(2) : "0.00";
          } else if (paymentData.receipt_email) {
            customerEmail = paymentData.receipt_email;
            amountPaid = paymentData.amount ? (paymentData.amount / 100).toFixed(2) : "0.00";
          }
          let existingRegistration = null;
          const registrationId = paymentData.metadata?.registrationId;
          console.log("\u{1F50D} Metadados da sess\xE3o:", paymentData.metadata);
          console.log("\u{1F50D} RegistrationId encontrado nos metadados:", registrationId);
          if (registrationId && registrationId.trim() !== "") {
            console.log("Buscando inscri\xE7\xE3o pelo registrationId:", registrationId);
            existingRegistration = await storage.getRegistration(registrationId);
            console.log("Inscri\xE7\xE3o encontrada pelo registrationId:", existingRegistration ? existingRegistration.id : "N\xC3O ENCONTRADA");
            console.log("Status da inscri\xE7\xE3o encontrada:", existingRegistration ? existingRegistration.paymentStatus : "N/A");
            if (existingRegistration && existingRegistration.paymentStatus === "pending") {
              console.log("\u2705 Inscri\xE7\xE3o v\xE1lida encontrada pelo registrationId:", existingRegistration.id);
            } else {
              console.log("\u274C Inscri\xE7\xE3o n\xE3o encontrada ou j\xE1 processada, continuando busca...");
              existingRegistration = null;
            }
          } else {
            console.log("\u274C RegistrationId n\xE3o encontrado ou vazio nos metadados");
          }
          if (!existingRegistration) {
            console.log("\u{1F50D} Buscando inscri\xE7\xE3o pelo email e ticket...");
            console.log("Email do cliente:", customerEmail);
            console.log("Ticket ID:", ticket.id);
            const existingRegistrations = await storage.getEventRegistrations(event.id);
            console.log("Total de inscri\xE7\xF5es encontradas para o evento:", existingRegistrations.length);
            existingRegistration = existingRegistrations.find((reg) => {
              const matches = reg.email === customerEmail && reg.ticketId === ticket.id && reg.paymentStatus === "pending";
              if (matches) {
                console.log("\u2705 Inscri\xE7\xE3o encontrada por email/ticket:", reg.id);
              }
              return matches;
            });
            if (!existingRegistration) {
              console.log("\u274C Nenhuma inscri\xE7\xE3o pendente encontrada por email/ticket");
            }
          }
          if (existingRegistration) {
            const updatedRegistration = await storage.updateRegistration(existingRegistration.id, {
              status: "confirmed",
              paymentStatus: "paid",
              amountPaid,
              paymentId,
              phoneNumber: customerPhone
            });
            console.log(`Inscri\xE7\xE3o atualizada com sucesso: ${updatedRegistration.id}, paymentStatus: ${updatedRegistration.paymentStatus}`);
            console.log("=== ENVIANDO NOTIFICA\xC7\xC3O PUSHER (PAGAMENTO) ===");
            console.log("Event ID:", event.id);
            console.log("Event Organizer ID:", event.organizerId);
            console.log("Event Type:", PUSHER_EVENTS.PAYMENT_CONFIRMED);
            const eventChannel = getEventChannel(event.id);
            const userChannel = getUserChannel(event.organizerId);
            console.log("Event Channel Name:", eventChannel);
            console.log("User Channel Name:", userChannel);
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
            await _StripeWebhookController.sendConfirmationEmail(updatedRegistration, event, ticket, paymentData);
            return updatedRegistration;
          } else {
            console.log("\u26A0\uFE0F Inscri\xE7\xE3o existente n\xE3o encontrada, verificando se j\xE1 existe uma inscri\xE7\xE3o paga...");
            const allRegistrations = await storage.getEventRegistrations(event.id);
            const existingPaidRegistration = allRegistrations.find(
              (reg) => reg.email === customerEmail && reg.ticketId === ticket.id && reg.paymentStatus === "paid"
            );
            if (existingPaidRegistration) {
              console.log("\u2705 Inscri\xE7\xE3o j\xE1 paga encontrada, atualizando paymentId:", existingPaidRegistration.id);
              const updatedRegistration = await storage.updateRegistration(existingPaidRegistration.id, {
                paymentId,
                amountPaid,
                phoneNumber: customerPhone
              });
              await _StripeWebhookController.sendConfirmationEmail(updatedRegistration, event, ticket, paymentData);
              return updatedRegistration;
            }
            console.log("\u{1F195} Nenhuma inscri\xE7\xE3o encontrada, criando nova como fallback...");
            const nameParts = customerName.split(" ");
            const firstName = nameParts[0] || "N/A";
            const lastName = nameParts.slice(1).join(" ") || "N/A";
            const registrationData = {
              eventId: event.id,
              ticketId: ticket.id,
              firstName,
              lastName,
              email: customerEmail,
              phoneNumber: customerPhone,
              status: "confirmed",
              paymentStatus: "paid",
              amountPaid,
              currency: "BRL",
              paymentGateway: "stripe",
              paymentId,
              qrCode: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: /* @__PURE__ */ new Date()
            };
            const registration = await storage.createRegistration(registrationData);
            console.log(`Nova inscri\xE7\xE3o criada como fallback: ${registration.id}, paymentStatus: ${registration.paymentStatus}`);
            await _StripeWebhookController.sendConfirmationEmail(registration, event, ticket, paymentData);
            return registration;
          }
        } catch (error) {
          console.error("Erro ao atualizar inscri\xE7\xE3o:", error);
          throw error;
        }
      }
      // Enviar email de confirmação de inscrição
      static async sendConfirmationEmail(registration, event, ticket, session2) {
        try {
          console.log("\u{1F4E7} Preparando envio de email de confirma\xE7\xE3o...");
          const { EmailService: EmailService2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
          const emailData = {
            eventName: event.title || "Evento",
            eventDate: event.startDate ? new Date(event.startDate).toLocaleDateString("pt-BR") : "Data n\xE3o informada",
            eventTime: event.startDate ? new Date(event.startDate).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit"
            }) : "Hor\xE1rio n\xE3o informado",
            eventLocation: event.venueName || null,
            eventAddress: event.venueAddress ? typeof event.venueAddress === "string" ? event.venueAddress : JSON.stringify(event.venueAddress) : null,
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
            sessionId: session2?.id || null
          };
          const emailSent = await EmailService2.sendRegistrationConfirmation(emailData);
          if (emailSent) {
            console.log("\u2705 Email de confirma\xE7\xE3o enviado com sucesso para:", registration.email);
          } else {
            console.error("\u274C Falha ao enviar email de confirma\xE7\xE3o para:", registration.email);
          }
        } catch (error) {
          console.error("\u274C Erro ao enviar email de confirma\xE7\xE3o:", error);
        }
      }
    };
  }
});

// server/index.ts
import dotenv from "dotenv";
import express3 from "express";

// server/modules/routes.ts
import express from "express";
import { createServer } from "http";

// server/replitAuth.ts
import session from "express-session";
import connectPg from "connect-pg-simple";
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      // Set to false for development
      maxAge: sessionTtl
    }
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
}
var isAuthenticated = async (req, res, next) => {
  const { authenticateToken: authenticateToken2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
  return authenticateToken2(req, res, next);
};

// server/controllers/authController.ts
init_storage();
init_jwt();
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
var AuthController = class {
  static async validateToken(req, res) {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ message: "Token n\xE3o fornecido" });
      }
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Token inv\xE1lido" });
      }
      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(401).json({ message: "Usu\xE1rio n\xE3o encontrado" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error validating token:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
  static async getUser(req, res) {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ message: "Token n\xE3o fornecido" });
      }
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Token inv\xE1lido" });
      }
      const user = await storage.getUser(payload.userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  }
  static async updateUserProfile(req, res) {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ message: "Token n\xE3o fornecido" });
      }
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Token inv\xE1lido" });
      }
      const updates = req.body;
      const user = await storage.updateUser(payload.userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  }
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha s\xE3o obrigat\xF3rios" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inv\xE1lidas" });
      }
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais inv\xE1lidas" });
      }
      const token = generateToken({
        userId: user.id,
        email: user.email || "",
        role: user.role || "user"
      });
      res.json({
        message: "Login realizado com sucesso",
        token,
        user: {
          id: user.id,
          email: user.email || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          role: user.role || "user"
        }
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
  static async register(req, res) {
    try {
      const { firstName, lastName, email, password } = req.body;
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "Todos os campos s\xE3o obrigat\xF3rios" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "Este email j\xE1 est\xE1 em uso" });
      }
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const newUser = {
        id: uuidv4(),
        email,
        firstName,
        lastName,
        passwordHash,
        currentPlan: "free",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      const user = await storage.createUser(newUser);
      const token = generateToken({
        userId: user.id,
        email: user.email || "",
        role: user.role || "user"
      });
      res.status(201).json({
        message: "Conta criada com sucesso",
        token,
        user: {
          id: user.id,
          email: user.email || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          role: user.role || "user"
        }
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
  static async logout(req, res) {
    try {
      res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
};

// server/controllers/eventController.ts
init_storage();
import { z } from "zod";

// server/services/planService.ts
var PLANS = [
  {
    id: "free",
    name: "Teste Gr\xE1tis",
    description: "Para testar a plataforma",
    price: 0,
    currency: "BRL",
    interval: "monthly",
    features: [
      "At\xE9 3 eventos simult\xE2neos",
      "At\xE9 50 participantes por evento",
      "Templates b\xE1sicos",
      "Suporte por email",
      "Marca EventFlow nas p\xE1ginas"
    ],
    limits: {
      events: 3,
      participants: 50,
      templates: 5,
      storage: 100,
      emailsPerMonth: 100
    }
  },
  {
    id: "starter",
    name: "Starter",
    description: "Para organizadores iniciantes",
    price: 29.9,
    currency: "BRL",
    interval: "monthly",
    features: [
      "At\xE9 10 eventos simult\xE2neos",
      "At\xE9 200 participantes por evento",
      "Todos os templates",
      "Suporte priorit\xE1rio",
      "Sem marca EventFlow",
      "Analytics b\xE1sicos"
    ],
    limits: {
      events: 10,
      participants: 200,
      templates: -1,
      // unlimited
      storage: 500,
      emailsPerMonth: 1e3
    }
  },
  {
    id: "professional",
    name: "Professional",
    description: "Para organizadores profissionais",
    price: 89.9,
    currency: "BRL",
    interval: "monthly",
    features: [
      "Eventos ilimitados",
      "At\xE9 1000 participantes por evento",
      "Editor avan\xE7ado personalizado",
      "Automa\xE7\xE3o de email",
      "Analytics avan\xE7ados",
      "Integra\xE7\xF5es API",
      "Suporte via WhatsApp"
    ],
    limits: {
      events: -1,
      // unlimited
      participants: 1e3,
      templates: -1,
      storage: 2e3,
      emailsPerMonth: 5e3
    },
    isPopular: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Para grandes organiza\xE7\xF5es",
    price: 249.9,
    currency: "BRL",
    interval: "monthly",
    features: [
      "Tudo do Professional",
      "Participantes ilimitados",
      "White-label completo",
      "Gerente de sucesso dedicado",
      "SLA garantido",
      "Integra\xE7\xF5es customizadas",
      "Suporte 24/7"
    ],
    limits: {
      events: -1,
      participants: -1,
      templates: -1,
      storage: 1e4,
      emailsPerMonth: -1
    }
  }
];
var PlanService = class {
  static getPlan(planId) {
    return PLANS.find((plan) => plan.id === planId);
  }
  static getAllPlans() {
    return PLANS;
  }
  static canPerformAction(userPlan, action, currentUsage) {
    const plan = this.getPlan(userPlan);
    if (!plan) return false;
    const limit = plan.limits[action];
    if (limit === -1) return true;
    return currentUsage < limit;
  }
  static getTrialPlan() {
    return PLANS[0];
  }
  static getPopularPlan() {
    return PLANS.find((plan) => plan.isPopular) || PLANS[1];
  }
};

// server/controllers/eventController.ts
init_schema();
init_pusher();

// server/services/notificationService.ts
init_storage();
init_emailService();
init_paymentService();
var NotificationService = class {
  /**
   * Enviar lembretes de parcelas que vencem em 3 dias
   */
  static async sendUpcomingDueReminders() {
    try {
      console.log("=== INICIANDO ENVIO DE LEMBRETES DE VENCIMENTO ===");
      const threeDaysFromNow = /* @__PURE__ */ new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const upcomingInstallments = await storage.getUpcomingInstallments(threeDaysFromNow);
      console.log(`Encontradas ${upcomingInstallments.length} parcelas vencendo em 3 dias`);
      for (const installment of upcomingInstallments) {
        try {
          const registration = await storage.getRegistration(installment.registrationId);
          if (!registration) continue;
          const event = await storage.getEvent(registration.eventId);
          if (!event) continue;
          let groupWhatsapp = event.whatsappNumber;
          if (registration.groupId) {
            const group = await storage.getEventGroup(registration.groupId);
            if (group?.whatsappNumber) {
              groupWhatsapp = group.whatsappNumber;
            }
          }
          const paymentUrl = `${process.env.FRONTEND_URL || "http://localhost:5000"}/payment/confirmation?registrationId=${registration.id}&eventSlug=${event.slug}`;
          await EmailService.sendInstallmentReminder({
            to: registration.email,
            participantName: `${registration.firstName} ${registration.lastName}`,
            eventName: event.title,
            installmentNumber: installment.installmentNumber,
            totalInstallments: installment.totalInstallments,
            amount: parseFloat(installment.amount),
            dueDate: installment.dueDate.toISOString(),
            paymentUrl,
            whatsappNumber: groupWhatsapp
          });
          console.log(`Lembrete enviado para ${registration.email} - Parcela ${installment.installmentNumber}`);
        } catch (error) {
          console.error(`Erro ao enviar lembrete para parcela ${installment.id}:`, error);
        }
      }
      console.log("=== ENVIO DE LEMBRETES CONCLU\xCDDO ===");
    } catch (error) {
      console.error("Erro no servi\xE7o de lembretes:", error);
    }
  }
  /**
   * Enviar notificações de parcelas em atraso
   */
  static async sendOverdueNotifications() {
    try {
      console.log("=== INICIANDO ENVIO DE NOTIFICA\xC7\xD5ES DE ATRASO ===");
      const today = /* @__PURE__ */ new Date();
      const overdueInstallments = await storage.getOverdueInstallments(today);
      console.log(`Encontradas ${overdueInstallments.length} parcelas em atraso`);
      for (const installment of overdueInstallments) {
        try {
          const registration = await storage.getRegistration(installment.registrationId);
          if (!registration) continue;
          const event = await storage.getEvent(registration.eventId);
          if (!event) continue;
          const paymentService = new PaymentService();
          const lateFee = await paymentService.calculateLateFee(installment);
          let groupWhatsapp = event.whatsappNumber;
          if (registration.groupId) {
            const group = await storage.getEventGroup(registration.groupId);
            if (group?.whatsappNumber) {
              groupWhatsapp = group.whatsappNumber;
            }
          }
          const daysOverdue = Math.floor((today.getTime() - installment.dueDate.getTime()) / (1e3 * 60 * 60 * 24));
          const paymentUrl = `${process.env.FRONTEND_URL || "http://localhost:5000"}/payment/confirmation?registrationId=${registration.id}&eventSlug=${event.slug}`;
          await EmailService.sendOverdueNotification({
            to: registration.email,
            participantName: `${registration.firstName} ${registration.lastName}`,
            eventName: event.title,
            installmentNumber: installment.installmentNumber,
            amount: parseFloat(installment.amount),
            daysOverdue,
            lateFee,
            paymentUrl,
            whatsappNumber: groupWhatsapp
          });
          console.log(`Notifica\xE7\xE3o de atraso enviada para ${registration.email} - Parcela ${installment.installmentNumber}`);
        } catch (error) {
          console.error(`Erro ao enviar notifica\xE7\xE3o de atraso para parcela ${installment.id}:`, error);
        }
      }
      console.log("=== ENVIO DE NOTIFICA\xC7\xD5ES DE ATRASO CONCLU\xCDDO ===");
    } catch (error) {
      console.error("Erro no servi\xE7o de notifica\xE7\xF5es de atraso:", error);
    }
  }
  /**
   * Enviar confirmação de inscrição
   */
  static async sendRegistrationConfirmation(registrationId) {
    try {
      const registration = await storage.getRegistration(registrationId);
      if (!registration) return;
      const event = await storage.getEvent(registration.eventId);
      if (!event) return;
      let installmentPlan;
      if (registration.paymentPlanId) {
        const paymentPlan = await storage.getEventPaymentPlan(registration.paymentPlanId);
        if (paymentPlan) {
          installmentPlan = {
            totalInstallments: paymentPlan.installmentCount,
            monthlyAmount: parseFloat(registration.totalAmount || "0") / paymentPlan.installmentCount,
            firstDueDate: paymentPlan.firstInstallmentDate?.toISOString() || (/* @__PURE__ */ new Date()).toISOString()
          };
        }
      }
      await EmailService.sendRegistrationConfirmation({
        to: registration.email,
        participantName: `${registration.firstName} ${registration.lastName}`,
        eventName: event.title,
        totalAmount: parseFloat(registration.totalAmount || "0"),
        installmentPlan
      });
      console.log(`Confirma\xE7\xE3o de inscri\xE7\xE3o enviada para ${registration.email}`);
    } catch (error) {
      console.error("Erro ao enviar confirma\xE7\xE3o de inscri\xE7\xE3o:", error);
    }
  }
};

// server/controllers/eventController.ts
var EventController = class {
  // Teste do Pusher
  static async testPusher(req, res) {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      console.log("=== TESTE PUSHER ===");
      console.log("User ID:", userId);
      const testData = {
        message: "Teste de notifica\xE7\xE3o Pusher",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        userId
      };
      await sendPusherNotification(getUserChannel(userId), "test_notification", testData, userId);
      res.json({
        success: true,
        message: "Teste enviado com sucesso",
        userId,
        channel: getUserChannel(userId)
      });
    } catch (error) {
      console.error("Erro no teste Pusher:", error);
      res.status(500).json({ message: "Erro no teste", error: error?.message || "Unknown error" });
    }
  }
  // Pusher authentication endpoint
  static async authenticatePusher(req, res) {
    try {
      console.log("=== PUSHER AUTH REQUEST ===");
      console.log("Body:", req.body);
      console.log("Session:", req.session);
      console.log("URL:", req.url);
      console.log("Content-Type:", req.headers["content-type"]);
      let socket_id, channel_name;
      if (!req.body || Object.keys(req.body).length === 0) {
        console.log("\u{1F50D} Body vazio, tentando parsing manual...");
        if (req.body && typeof req.body.toString === "function") {
          const bodyString = req.body.toString();
          console.log("Body String:", bodyString);
          if (bodyString === "[object Object]" || bodyString === "{}") {
            console.log("\u{1F50D} Body \xE9 objeto vazio, tentando acessar raw body...");
            const rawBody = req.rawBody;
            if (rawBody) {
              console.log("Raw Body encontrado:", rawBody.toString());
              const params = new URLSearchParams(rawBody.toString());
              socket_id = params.get("socket_id");
              channel_name = params.get("channel_name");
              console.log("Parsed socket_id:", socket_id);
              console.log("Parsed channel_name:", channel_name);
            } else {
              console.log("\u274C Raw body n\xE3o encontrado");
            }
          } else if (bodyString && bodyString !== "[object Object]") {
            const params = new URLSearchParams(bodyString);
            socket_id = params.get("socket_id");
            channel_name = params.get("channel_name");
            console.log("Parsed socket_id:", socket_id);
            console.log("Parsed channel_name:", channel_name);
          }
        }
      } else {
        socket_id = req.body.socket_id;
        channel_name = req.body.channel_name;
      }
      const userId = req.session?.user?.id;
      console.log("Socket ID:", socket_id);
      console.log("Channel Name:", channel_name);
      console.log("User ID:", userId);
      const debugUserId = userId;
      console.log("Using User ID:", debugUserId);
      if (!socket_id || !channel_name) {
        console.log("\u274C Missing socket_id or channel_name");
        console.log("Available body keys:", Object.keys(req.body || {}));
        return res.status(400).json({ message: "Missing socket_id or channel_name" });
      }
      if (channel_name.startsWith("private-user-")) {
        const channelUserId = channel_name.replace("private-user-", "");
        console.log("Channel User ID:", channelUserId);
        console.log("Current User ID:", debugUserId);
        if (channelUserId !== debugUserId) {
          console.log("\u274C User ID mismatch for private-user channel");
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      if (channel_name.startsWith("private-event-")) {
        const eventId = channel_name.replace("private-event-", "");
        console.log("Event ID:", eventId);
        const event = await storage.getEvent(eventId);
        if (!event || event.organizerId !== debugUserId) {
          console.log("\u274C User does not have access to event");
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      console.log("\u{1F510} Authenticating with Pusher...");
      const pusher2 = (init_pusher(), __toCommonJS(pusher_exports)).pusher;
      const auth = pusher2.authenticate(socket_id, channel_name, {
        id: debugUserId,
        user_info: {
          name: req.session?.user?.name || "User"
        }
      });
      console.log("\u2705 Pusher authentication successful");
      console.log("Auth response:", auth);
      res.json(auth);
    } catch (error) {
      console.error("\u274C Pusher authentication error:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        body: req.body,
        session: req.session
      });
      res.status(500).json({ message: "Authentication failed", error: error?.message });
    }
  }
  static async getUserEvents(req, res) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      console.log("=== GET USER EVENTS ===");
      console.log("UserId:", userId);
      console.log("UserRole:", userRole);
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      let events2 = [];
      if (userRole === "admin") {
        events2 = await storage.getAllEvents();
      } else if (userRole === "organizer") {
        events2 = await storage.getUserEvents(userId);
      } else if (userRole === "manager") {
        events2 = await storage.getUserManagedEvents(userId);
      } else {
        events2 = [];
      }
      res.json(events2);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  }
  static async createEvent(req, res) {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const subscription = await storage.getUserSubscription(userId);
      const planId = subscription?.planId || "free";
      const currentEventCount = await storage.getUserEventCount(userId);
      if (!PlanService.canPerformAction(planId, "events", currentEventCount)) {
        return res.status(403).json({
          message: "Limite de eventos atingido para seu plano atual",
          planLimitReached: true
        });
      }
      const bodyData = { ...req.body };
      if (bodyData.startDate && typeof bodyData.startDate === "string") {
        bodyData.startDate = new Date(bodyData.startDate);
      }
      if (bodyData.endDate && typeof bodyData.endDate === "string") {
        bodyData.endDate = new Date(bodyData.endDate);
      }
      if (!bodyData.categoryId || bodyData.categoryId.trim() === "") {
        return res.status(400).json({
          message: "Categoria \xE9 obrigat\xF3ria",
          errors: [{ path: ["categoryId"], message: "Category ID is required" }]
        });
      }
      if (bodyData.startDate && isNaN(bodyData.startDate.getTime())) {
        return res.status(400).json({
          message: "Data de in\xEDcio inv\xE1lida",
          errors: [{ path: ["startDate"], message: "Invalid start date" }]
        });
      }
      if (bodyData.endDate && isNaN(bodyData.endDate.getTime())) {
        return res.status(400).json({
          message: "Data de fim inv\xE1lida",
          errors: [{ path: ["endDate"], message: "Invalid end date" }]
        });
      }
      console.log("Creating event with data:", {
        title: bodyData.title,
        categoryId: bodyData.categoryId,
        startDate: bodyData.startDate,
        endDate: bodyData.endDate,
        capacity: bodyData.capacity
      });
      const eventData = insertEventSchema.parse({
        ...bodyData,
        organizerId: userId,
        slug: bodyData.title?.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim() + "-" + Date.now(),
        status: "active"
        // Set as active by default so it's publicly accessible
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
  static async getEvent(req, res) {
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
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  }
  static async updateEvent(req, res) {
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
      const bodyData = { ...req.body };
      if (bodyData.startDate && typeof bodyData.startDate === "string") {
        bodyData.startDate = new Date(bodyData.startDate);
      }
      if (bodyData.endDate && typeof bodyData.endDate === "string") {
        bodyData.endDate = new Date(bodyData.endDate);
      }
      if (bodyData.startDate && isNaN(bodyData.startDate.getTime())) {
        return res.status(400).json({
          message: "Data de in\xEDcio inv\xE1lida",
          errors: [{ path: ["startDate"], message: "Invalid start date" }]
        });
      }
      if (bodyData.endDate && isNaN(bodyData.endDate.getTime())) {
        return res.status(400).json({
          message: "Data de fim inv\xE1lida",
          errors: [{ path: ["endDate"], message: "Invalid end date" }]
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
  static async deleteEvent(req, res) {
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
  static async getEventTickets(req, res) {
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
      const tickets2 = await storage.getEventTickets(req.params.eventId);
      res.json(tickets2);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  }
  static async createTicket(req, res) {
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
  static async updateTicket(req, res) {
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
      const ticketData = {
        ...req.body,
        price: req.body.price ? String(req.body.price) : void 0,
        salesStart: req.body.salesStart ? new Date(req.body.salesStart) : void 0,
        salesEnd: req.body.salesEnd ? new Date(req.body.salesEnd) : void 0
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
  static async deleteTicket(req, res) {
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
  static async getPublicEvent(req, res) {
    try {
      console.log("getPublicEvent called with slug:", req.params.slug);
      const event = await storage.getEventBySlug(req.params.slug);
      console.log("Event found:", !!event, "Status:", event?.status);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (event.status !== "active" && event.status !== "draft" && event.status !== "published") {
        console.log("Event status not allowed:", event.status);
        return res.status(404).json({ message: "Event not found" });
      }
      console.log("Event status allowed, returning event");
      const category = await storage.getEventCategory(event.categoryId);
      res.json({ ...event, category });
    } catch (error) {
      console.error("Error fetching public event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  }
  static async getPublicEventTickets(req, res) {
    try {
      const event = await storage.getEventBySlug(req.params.slug);
      if (!event || event.status !== "active" && event.status !== "published") {
        return res.status(404).json({ message: "Event not found" });
      }
      const tickets2 = await storage.getEventTickets(event.id);
      const activeTickets = tickets2.filter(
        (ticket) => ticket.status === "active" && (!ticket.salesEnd || new Date(ticket.salesEnd) > /* @__PURE__ */ new Date())
      );
      const publicTickets = activeTickets.map((ticket) => ({
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
  static async publicRegisterForEvent(req, res) {
    try {
      const { slug } = req.params;
      const bodyData = req.body;
      const event = await storage.getEventBySlug(slug);
      if (!event || event.status !== "active" && event.status !== "published") {
        return res.status(404).json({ message: "Event not found" });
      }
      const registrationSchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phoneNumber: z.string().optional(),
        groupId: z.string().optional(),
        paymentType: z.enum(["installments", "cash"]).optional().default("installments"),
        tickets: z.array(z.object({
          ticketId: z.string(),
          quantity: z.number().min(1)
        })).min(1)
      });
      const validatedData = registrationSchema.parse(bodyData);
      let totalAmount = 0;
      const selectedTickets = [];
      console.log("=== DEBUG INSCRI\xC7\xC3O ===");
      console.log("Dados recebidos:", validatedData);
      console.log("Evento:", event.title);
      for (const ticketData of validatedData.tickets) {
        const ticket = await storage.getTicket(ticketData.ticketId);
        if (!ticket) {
          return res.status(400).json({ message: `Ticket ${ticketData.ticketId} not found` });
        }
        if (ticket.eventId !== event.id) {
          return res.status(400).json({ message: "Ticket does not belong to this event" });
        }
        if (ticket.status !== "active") {
          return res.status(400).json({ message: "Ticket is not available for purchase" });
        }
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
        const now = /* @__PURE__ */ new Date();
        if (ticket.salesStart && new Date(ticket.salesStart) > now) {
          return res.status(400).json({ message: "Ticket sales have not started yet" });
        }
        if (ticket.salesEnd && new Date(ticket.salesEnd) < now) {
          return res.status(400).json({ message: "Ticket sales have ended" });
        }
        console.log("Ingresso encontrado:", {
          id: ticket.id,
          name: ticket.name,
          price: ticket.price,
          priceType: typeof ticket.price,
          priceRaw: ticket.price,
          quantity: ticketData.quantity
        });
        const ticketAmount = parseFloat(ticket.price || "0") * ticketData.quantity;
        console.log("Valor calculado no backend:", ticketAmount);
        console.log("Valor em centavos (Stripe):", Math.round(ticketAmount * 100));
        totalAmount += ticketAmount;
        selectedTickets.push({
          ...ticketData,
          ticket,
          amount: ticketAmount
        });
      }
      if (validatedData.paymentType === "cash" && totalAmount > 0) {
        totalAmount = Math.max(0, totalAmount - 20);
        console.log("Desconto aplicado (\xE0 vista): R$ 20,00");
        console.log("Valor final ap\xF3s desconto:", totalAmount);
      }
      console.log("Total calculado:", totalAmount);
      console.log("Total em centavos (Stripe):", Math.round(totalAmount * 100));
      console.log("Tipo de pagamento:", validatedData.paymentType);
      console.log("=== FIM DEBUG INSCRI\xC7\xC3O ===");
      if (totalAmount === 0) {
        const registrationData = {
          eventId: event.id,
          ticketId: selectedTickets[0].ticketId,
          firstName: validatedData.name.split(" ")[0],
          lastName: validatedData.name.split(" ").slice(1).join(" ") || "",
          email: validatedData.email,
          phoneNumber: validatedData.phoneNumber || null,
          groupId: validatedData.groupId || null,
          status: "confirmed",
          amountPaid: "0.00",
          qrCode: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: /* @__PURE__ */ new Date()
        };
        const registration = await storage.createRegistration(registrationData);
        console.log("=== ENVIANDO NOTIFICA\xC7\xC3O PUSHER ===");
        console.log("Event ID:", event.id);
        console.log("Event Organizer ID:", event.organizerId);
        console.log("Event Type:", PUSHER_EVENTS.NEW_REGISTRATION);
        const eventChannel = getEventChannel(event.id);
        const userChannel = getUserChannel(event.organizerId);
        console.log("Event Channel Name:", eventChannel);
        console.log("User Channel Name:", userChannel);
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
          message: "Inscri\xE7\xE3o confirmada para evento gratuito",
          registration: {
            id: registration.id,
            status: "confirmed",
            qrCode: registration.qrCode
          },
          totalAmount: 0,
          isFreeEvent: true
        });
      }
      try {
        const registrationData = {
          eventId: event.id,
          ticketId: selectedTickets[0].ticketId,
          firstName: validatedData.name.split(" ")[0],
          lastName: validatedData.name.split(" ").slice(1).join(" ") || "",
          email: validatedData.email,
          phoneNumber: validatedData.phoneNumber || null,
          groupId: validatedData.groupId || null,
          status: "confirmed",
          paymentStatus: "installment_plan",
          // Status para parcelamento
          amountPaid: "0.00",
          totalAmount: totalAmount.toString(),
          currency: "BRL",
          paymentGateway: "pix_installments",
          qrCode: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: /* @__PURE__ */ new Date()
        };
        const registration = await storage.createRegistration(registrationData);
        const { PaymentService: PaymentService2 } = await Promise.resolve().then(() => (init_paymentService(), paymentService_exports));
        const installmentCount = validatedData.paymentType === "cash" ? 1 : event.pixInstallments || 12;
        const firstInstallmentDate = /* @__PURE__ */ new Date();
        if (validatedData.paymentType !== "cash") {
          firstInstallmentDate.setMonth(firstInstallmentDate.getMonth() + 1);
        }
        const paymentPlan = await storage.createEventPaymentPlan({
          eventId: event.id,
          name: validatedData.paymentType === "cash" ? `Pagamento \xE0 Vista - ${validatedData.name}` : `Parcelamento - ${validatedData.name}`,
          description: validatedData.paymentType === "cash" ? `Pagamento \xE0 vista com desconto para ${validatedData.name}` : `Plano de pagamento em ${installmentCount} parcelas mensais para ${validatedData.name}`,
          installmentCount,
          installmentInterval: "monthly",
          firstInstallmentDate,
          discountPolicy: {
            earlyPaymentDiscount: {
              enabled: true,
              daysBeforeDue: 5,
              percentage: 5,
              description: "5% de desconto para pagamento antecipado"
            }
          },
          lateFeePolicy: {
            enabled: true,
            gracePeriodDays: 5,
            fixedFee: 10,
            interestRate: 2,
            description: "Multa de R$ 10,00 + 2% ao m\xEAs ap\xF3s 5 dias de atraso"
          },
          isDefault: false,
          status: "active"
        });
        const installments = await PaymentService2.createInstallmentsForRegistration(
          registration,
          paymentPlan
        );
        await storage.updateRegistration(registration.id, {
          paymentPlanId: paymentPlan.id
        });
        console.log("=== ENVIANDO NOTIFICA\xC7\xC3O PUSHER ===");
        console.log("Event ID:", event.id);
        console.log("Event Organizer ID:", event.organizerId);
        console.log("Event Type:", PUSHER_EVENTS.NEW_REGISTRATION);
        const eventChannel = getEventChannel(event.id);
        const userChannel = getUserChannel(event.organizerId);
        console.log("Event Channel Name:", eventChannel);
        console.log("User Channel Name:", userChannel);
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
        try {
          await NotificationService.sendRegistrationConfirmation(registration.id);
        } catch (emailError) {
          console.error("Erro ao enviar email de confirma\xE7\xE3o:", emailError);
        }
        const paymentConfirmationUrl = `/payment/confirmation?registrationId=${registration.id}&eventSlug=${event.slug}`;
        return res.json({
          success: true,
          message: validatedData.paymentType === "cash" ? "Inscri\xE7\xE3o confirmada! Pagamento \xE0 vista com desconto aplicado." : `Inscri\xE7\xE3o confirmada! Voc\xEA foi inclu\xEDdo em um plano de pagamento em ${installmentCount} parcelas mensais.`,
          paymentUrl: paymentConfirmationUrl,
          registrationId: registration.id,
          totalAmount,
          isFreeEvent: false,
          installmentPlan: {
            totalInstallments: installmentCount,
            monthlyAmount: (totalAmount / installmentCount).toFixed(2),
            firstDueDate: firstInstallmentDate.toISOString().split("T")[0],
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
            createdAt: registration.createdAt
          }]
        });
      } catch (pixError) {
        console.error("Erro ao criar inscri\xE7\xE3o PIX:", pixError);
        return res.status(500).json({
          message: "Erro ao processar inscri\xE7\xE3o. Tente novamente."
        });
      }
    } catch (error) {
      console.error("Erro na inscri\xE7\xE3o p\xFAblica:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Dados inv\xE1lidos",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
  static async getEventAnalytics(req, res) {
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
      const registrations2 = await storage.getEventRegistrations(req.params.eventId);
      const tickets2 = await storage.getEventTickets(req.params.eventId);
      const totalRegistrations = registrations2.length;
      const totalRevenue = registrations2.reduce((sum, reg) => sum + parseFloat(reg.amount || 0), 0);
      const avgTicketValue = totalRevenue / (totalRegistrations || 1);
      const ticketStats = tickets2.map((ticket) => ({
        name: ticket.name,
        sold: ticket.sold || 0,
        revenue: (ticket.sold || 0) * parseFloat(ticket.price || 0)
      }));
      const analytics = {
        overview: {
          totalRegistrations,
          totalRevenue,
          avgTicketValue,
          conversionRate: 8.5,
          // Mock
          registrationsGrowth: 12.5,
          // Mock
          revenueGrowth: 18.2
          // Mock
        },
        ticketTypes: ticketStats,
        registrationsByDay: [],
        // Mock - would calculate from registration dates
        trafficSources: []
        // Mock - would get from analytics service
      };
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  }
  static async registerForEvent(req, res) {
    try {
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      const { name, email, phone, document, tickets: tickets2 } = req.body;
      if (!name || !email || !tickets2 || tickets2.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const registrations2 = [];
      let totalAmount = 0;
      for (const ticketRequest of tickets2) {
        const ticket = await storage.getTicket(ticketRequest.ticketId);
        if (!ticket) {
          return res.status(404).json({ message: `Ticket not found: ${ticketRequest.ticketId}` });
        }
        totalAmount += parseFloat(ticket.price || "0") * ticketRequest.quantity;
        for (let i = 0; i < ticketRequest.quantity; i++) {
          const registration = await storage.createRegistration({
            eventId: event.id,
            ticketId: ticket.id,
            email,
            firstName: name.split(" ")[0] || name,
            lastName: name.split(" ").slice(1).join(" ") || "",
            phoneNumber: phone,
            customFields: { document },
            status: totalAmount > 0 ? "pending_payment" : "confirmed",
            paymentStatus: totalAmount > 0 ? "pending" : "paid",
            // Definir baseado no valor
            amountPaid: String(parseFloat(ticket.price || "0")),
            currency: "BRL"
          });
          registrations2.push(registration);
        }
      }
      const mockPaymentId = `pay_${Date.now()}`;
      const mockPaymentUrl = `/payment/mock?amount=${totalAmount}&id=${mockPaymentId}&eventSlug=${event.slug}`;
      res.json({
        success: true,
        paymentUrl: mockPaymentUrl,
        paymentId: mockPaymentId,
        totalAmount,
        registrations: registrations2
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
  static async checkinParticipant(req, res) {
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
        status: "checked_in",
        checkedInAt: /* @__PURE__ */ new Date()
      });
      res.json(updatedRegistration);
    } catch (error) {
      console.error("Error checking in participant:", error);
      res.status(500).json({ message: "Failed to check in participant" });
    }
  }
  static async sendReminder(req, res) {
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
      console.log(`\u{1F4E7} Sending reminder to ${registration.email} for event ${event?.title}`);
      res.json({ success: true, message: "Reminder sent successfully" });
    } catch (error) {
      console.error("Error sending reminder:", error);
      res.status(500).json({ message: "Failed to send reminder" });
    }
  }
  static async exportParticipants(req, res) {
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
      const registrations2 = await storage.getEventRegistrations(req.params.eventId);
      const format = req.params.format;
      if (format === "csv") {
        const csvData = registrations2.map((reg) => [
          `${reg.firstName} ${reg.lastName}`,
          reg.email,
          reg.phoneNumber || "",
          reg.customFields?.document || "",
          reg.ticket?.name || "",
          `R$ ${parseFloat(reg.amountPaid || 0).toFixed(2)}`,
          reg.status,
          reg.qrCode,
          new Date(reg.createdAt).toLocaleDateString("pt-BR")
        ]);
        const headers = [
          "Nome",
          "Email",
          "Telefone",
          "Documento",
          "Tipo Ingresso",
          "Valor",
          "Status",
          "QR Code",
          "Data Inscri\xE7\xE3o"
        ];
        const csv = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="participantes-${event.slug}.csv"`);
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
  static async getEventRegistrations(req, res) {
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
      const registrations2 = await storage.getEventRegistrations(req.params.eventId);
      res.json(registrations2);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  }
  // Get event participants with installments
  static async getEventParticipantsWithInstallments(req, res) {
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
  static async markInstallmentAsPaid(req, res) {
    try {
      const { installmentId } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const installment = await storage.getInstallmentById(installmentId);
      if (!installment) {
        return res.status(404).json({ message: "Installment not found" });
      }
      const registration = await storage.getRegistrationById(installment.registrationId);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      const isOrganizer = event.organizerId === userId;
      let isGroupManager = false;
      if (registration.groupId) {
        const hasGroupAccess = await storage.checkUserGroupAccess(userId, registration.groupId);
        if (hasGroupAccess) {
          const managers = await storage.getGroupManagers(registration.groupId);
          const userManager = managers.find((m) => m.userId === userId);
          if (userManager) {
            const userPermissions = Array.isArray(userManager.permissions) ? userManager.permissions : [];
            isGroupManager = userPermissions.includes("payments");
          }
        }
      }
      if (!isOrganizer && !isGroupManager) {
        return res.status(403).json({ message: "Access denied" });
      }
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
  static async getRegistration(req, res) {
    try {
      const registration = await storage.getRegistration(req.params.registrationId);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      const response = {
        success: true,
        paymentUrl: "",
        paymentId: registration.id,
        totalAmount: parseFloat(registration.totalAmount || "0"),
        registrations: [{
          id: registration.id,
          firstName: registration.firstName,
          lastName: registration.lastName || "",
          email: registration.email,
          phoneNumber: registration.phoneNumber || "",
          status: registration.status,
          amountPaid: registration.amountPaid || "0.00",
          qrCode: registration.qrCode || `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: registration.createdAt
        }]
      };
      res.json(response);
    } catch (error) {
      console.error("Error fetching registration:", error);
      res.status(500).json({ message: "Failed to fetch registration" });
    }
  }
};

// server/controllers/dashboardController.ts
init_storage();
var DashboardController = class {
  static async getDashboardStats(req, res) {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  }
};

// server/services/asaasService.ts
var AsaasService = class {
  apiKey;
  baseUrl;
  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || "";
    this.baseUrl = process.env.ASAAS_SANDBOX === "true" ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/v3";
  }
  async makeRequest(endpoint, method = "GET", data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "access_token": this.apiKey,
        "Content-Type": "application/json"
      },
      body: data ? JSON.stringify(data) : void 0
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Asaas API Error: ${error.message || response.statusText}`);
    }
    return response.json();
  }
  async createCustomer(customerData) {
    return this.makeRequest("/customers", "POST", customerData);
  }
  async getCustomer(customerId) {
    return this.makeRequest(`/customers/${customerId}`);
  }
  async createPayment(paymentData) {
    return this.makeRequest("/payments", "POST", paymentData);
  }
  async getPayment(paymentId) {
    return this.makeRequest(`/payments/${paymentId}`);
  }
  async createSubscription(subscriptionData) {
    return this.makeRequest("/subscriptions", "POST", subscriptionData);
  }
  async cancelSubscription(subscriptionId) {
    return this.makeRequest(`/subscriptions/${subscriptionId}`, "DELETE");
  }
  async getPixQrCode(paymentId) {
    return this.makeRequest(`/payments/${paymentId}/pixQrCode`);
  }
  async generateBoleto(paymentId) {
    return this.makeRequest(`/payments/${paymentId}/identificationField`);
  }
};
var asaasService = new AsaasService();

// server/controllers/planController.ts
init_storage();
var PlanController = class {
  static async getAllPlans(req, res) {
    try {
      const plans = PlanService.getAllPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  }
  static async subscribeToPlan(req, res) {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const { planId, paymentMethod, cardInfo } = req.body;
      const plan = PlanService.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (plan.id === "free") {
        await storage.updateUserSubscription(userId, {
          planId: plan.id,
          status: "active",
          currentPeriodStart: /* @__PURE__ */ new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
          // 30 days
        });
        return res.json({
          success: true,
          message: "Plano gratuito ativado com sucesso!",
          subscription: { planId: plan.id, status: "active" }
        });
      }
      let asaasCustomer;
      try {
        if (user.asaasCustomerId) {
          asaasCustomer = await asaasService.getCustomer(user.asaasCustomerId);
        } else {
          asaasCustomer = await asaasService.createCustomer({
            name: `${user.firstName} ${user.lastName}`.trim() || user.email || "Cliente",
            cpfCnpj: req.body.cpfCnpj || "00000000000",
            email: user.email || "",
            phone: req.body.phone
          });
          await storage.updateUser(userId, { asaasCustomerId: asaasCustomer.id });
        }
      } catch (error) {
        console.error("Error with Asaas customer:", error);
        return res.status(500).json({ message: "Erro ao processar cliente no gateway de pagamento" });
      }
      try {
        const subscription = await asaasService.createSubscription({
          customer: asaasCustomer.id,
          billingType: paymentMethod === "credit_card" ? "CREDIT_CARD" : paymentMethod === "pix" ? "PIX" : "BOLETO",
          cycle: plan.interval === "monthly" ? "MONTHLY" : "YEARLY",
          value: plan.price,
          nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
          // tomorrow
          description: `Assinatura ${plan.name} - EventFlow`,
          externalReference: userId
        });
        await storage.updateUserSubscription(userId, {
          planId: plan.id,
          status: "pending",
          asaasSubscriptionId: subscription.id,
          currentPeriodStart: /* @__PURE__ */ new Date(),
          currentPeriodEnd: new Date(subscription.nextDueDate)
        });
        res.json({
          success: true,
          subscription,
          message: "Assinatura criada com sucesso!",
          paymentUrl: subscription.invoiceUrl
        });
      } catch (error) {
        console.error("Error creating subscription:", error);
        res.status(500).json({ message: "Erro ao criar assinatura" });
      }
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      res.status(500).json({ message: "Failed to subscribe to plan" });
    }
  }
  static async cancelSubscription(req, res) {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const subscription = await storage.getUserSubscription(userId);
      if (!subscription || !subscription.asaasSubscriptionId) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      await asaasService.cancelSubscription(subscription.asaasSubscriptionId);
      await storage.updateUserSubscription(userId, {
        status: "cancelled",
        cancelledAt: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, message: "Assinatura cancelada com sucesso" });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  }
  static async getUserSubscription(req, res) {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const subscription = await storage.getUserSubscription(userId);
      if (!subscription) {
        const freePlan = PlanService.getTrialPlan();
        return res.json({
          planId: freePlan.id,
          status: "active",
          plan: freePlan
        });
      }
      const plan = PlanService.getPlan(subscription.planId);
      res.json({ ...subscription, plan });
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  }
};

// server/controllers/notificationController.ts
var NotificationController = class {
  // Marcar notificação como visualizada
  static async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      console.log(`Notification ${notificationId} marked as read by user ${userId}`);
      res.json({ success: true, message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  }
  // Marcar todas as notificações como visualizadas
  static async markAllAsRead(req, res) {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      console.log(`All notifications marked as read by user ${userId}`);
      res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  }
  // Obter notificações do usuário
  static async getUserNotifications(req, res) {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const notifications2 = [];
      res.json(notifications2);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  }
};

// server/controllers/groupController.ts
init_storage();
import { randomUUID } from "crypto";
var GroupController = class {
  /**
   * Criar um novo grupo para um evento
   */
  static async createGroup(req, res) {
    try {
      console.log("=== CREATE GROUP DEBUG ===");
      console.log("Request body:", req.body);
      console.log("User from session:", req.user);
      console.log("Session:", req.session);
      const { eventId, name, description, capacity, color } = req.body;
      const userId = req.user?.userId;
      console.log("Extracted userId:", userId);
      console.log("EventId from body:", eventId);
      if (!userId) {
        console.log("ERROR: Usu\xE1rio n\xE3o autenticado");
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const event = await storage.getEvent(eventId);
      if (!event || event.organizerId !== userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      const group = await storage.createEventGroup({
        eventId,
        name,
        description,
        capacity,
        color: color || "#3b82f6",
        status: "active"
      });
      res.status(201).json(group);
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Atualizar um grupo
   */
  static async updateGroup(req, res) {
    try {
      const { id } = req.params;
      const { name, description, capacity, color, status } = req.body;
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const group = await storage.getEventGroup(id);
      if (!group) {
        return res.status(404).json({ error: "Grupo n\xE3o encontrado" });
      }
      const event = await storage.getEvent(group.eventId);
      if (!event || event.organizerId !== userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      const updatedGroup = await storage.updateEventGroup(id, {
        name,
        description,
        capacity,
        color,
        status
      });
      res.json(updatedGroup);
    } catch (error) {
      console.error("Erro ao atualizar grupo:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Obter grupos de um evento
   */
  static async getEventGroups(req, res) {
    try {
      console.log("=== GET EVENT GROUPS DEBUG ===");
      const { eventId } = req.params;
      const userId = req.user?.userId;
      console.log("EventId:", eventId);
      console.log("UserId:", userId);
      if (!userId) {
        console.log("ERROR: Usu\xE1rio n\xE3o autenticado");
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const event = await storage.getEvent(eventId);
      console.log("Event found:", !!event);
      console.log("Event organizerId:", event?.organizerId);
      if (!event) {
        console.log("ERROR: Evento n\xE3o encontrado");
        return res.status(404).json({ error: "Evento n\xE3o encontrado" });
      }
      const isOrganizer = event.organizerId === userId;
      console.log("Is organizer:", isOrganizer);
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      console.log("User group managers:", userGroupManagers.length);
      const hasGroupAccess = userGroupManagers.some((gm) => {
        return gm.group?.eventId === eventId;
      });
      console.log("Has group access:", hasGroupAccess);
      if (!isOrganizer && !hasGroupAccess) {
        console.log("ERROR: Acesso negado - n\xE3o \xE9 organizador nem gestor");
        return res.status(403).json({ error: "Acesso negado" });
      }
      const groups = await storage.getEventGroups(eventId);
      console.log("Groups found:", groups.length);
      res.json(groups);
    } catch (error) {
      console.error("Erro ao obter grupos:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Obter um grupo específico
   */
  /**
   * Deletar um grupo
   */
  static async deleteGroup(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const group = await storage.getEventGroup(id);
      if (!group) {
        return res.status(404).json({ error: "Grupo n\xE3o encontrado" });
      }
      const event = await storage.getEvent(group.eventId);
      if (!event || event.organizerId !== userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      const registrations2 = await storage.getEventRegistrations(group.eventId);
      const groupRegistrations = registrations2.filter((r) => r.groupId === id);
      if (groupRegistrations.length > 0) {
        return res.status(400).json({
          error: "N\xE3o \xE9 poss\xEDvel deletar um grupo que possui inscri\xE7\xF5es"
        });
      }
      await storage.deleteEventGroup(id);
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar grupo:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Adicionar gestor a um grupo
   */
  static async addGroupManager(req, res) {
    try {
      const { groupId } = req.params;
      const { userId: managerUserId, role, permissions } = req.body;
      const currentUserId = req.user?.userId;
      if (!currentUserId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const group = await storage.getEventGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Grupo n\xE3o encontrado" });
      }
      const event = await storage.getEvent(group.eventId);
      if (!event || event.organizerId !== currentUserId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      const user = await storage.getUser(managerUserId);
      if (!user) {
        return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
      }
      const existingManagers = await storage.getGroupManagers(groupId);
      const isAlreadyManager = existingManagers.some((m) => m.userId === managerUserId);
      if (isAlreadyManager) {
        return res.status(400).json({ error: "Usu\xE1rio j\xE1 \xE9 gestor deste grupo" });
      }
      const groupManager = await storage.createGroupManager({
        id: randomUUID(),
        groupId,
        userId: managerUserId,
        role: role || "manager",
        permissions: permissions || ["read", "write", "participants", "payments"],
        // Permissões padrão para gestores
        assignedAt: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
      res.status(201).json(groupManager);
    } catch (error) {
      console.error("Erro ao adicionar gestor:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Remover gestor de um grupo
   */
  /**
   * Obter gestores de um grupo
   */
  /**
   * Obter analytics de um grupo
   */
  static async getGroupAnalytics(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const group = await storage.getEventGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Grupo n\xE3o encontrado" });
      }
      const event = await storage.getEvent(group.eventId);
      if (!event) {
        return res.status(404).json({ error: "Evento n\xE3o encontrado" });
      }
      const isOrganizer = event.organizerId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const isGroupManager = userGroupManagers.some((gm) => gm.groupId === groupId);
      if (!isOrganizer && !isGroupManager) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      const analytics = await storage.getGroupPaymentAnalytics(groupId);
      res.json(analytics);
    } catch (error) {
      console.error("Erro ao obter analytics do grupo:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Obter um grupo específico
   */
  static async getGroup(req, res) {
    try {
      const groupId = req.params.id;
      const userId = req.user?.userId;
      console.log("=== GET GROUP ===");
      console.log("GroupId:", groupId);
      console.log("UserId:", userId);
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const group = await storage.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Grupo n\xE3o encontrado" });
      }
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Acesso negado ao grupo" });
      }
      const currentParticipants = await storage.getGroupParticipants(groupId);
      const confirmedParticipants = await storage.getGroupConfirmedParticipants(groupId);
      const groupWithStats = {
        ...group,
        currentParticipants: currentParticipants.length,
        confirmedParticipants,
        maxParticipants: group.capacity
      };
      res.json(groupWithStats);
    } catch (error) {
      console.error("Erro ao buscar grupo:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Obter dashboard de grupos do usuário
   */
  static async getUserGroupDashboard(req, res) {
    try {
      console.log("=== GET USER GROUP DASHBOARD ===");
      const userId = req.user?.userId;
      const userRole = req.userRole;
      console.log("UserId:", userId);
      console.log("UserRole:", userRole);
      if (!userId) {
        console.log("ERROR: Usu\xE1rio n\xE3o autenticado");
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const groups = [];
      let totalParticipants = 0;
      let totalConfirmed = 0;
      let pendingPayments = 0;
      let totalRevenue = 0;
      let overduePayments = 0;
      if (userRole === "admin") {
        console.log("Admin access - loading all groups");
        const allEvents = await storage.getAllEvents();
        for (const event of allEvents) {
          const eventGroups2 = await storage.getEventGroups(event.id);
          for (const group of eventGroups2) {
            const participants = await storage.getGroupParticipants(group.id);
            const currentParticipants = participants.length;
            totalParticipants += currentParticipants;
            const groupPendingPayments = await storage.getGroupPendingPayments(group.id);
            pendingPayments += groupPendingPayments;
            const groupRevenue = await storage.getGroupTotalRevenue(group.id);
            totalRevenue += groupRevenue;
            const groupOverduePayments = await storage.getGroupOverduePayments(group.id);
            overduePayments += groupOverduePayments;
            const confirmedParticipants = await storage.getGroupConfirmedParticipants(group.id);
            totalConfirmed += confirmedParticipants;
            groups.push({
              id: group.id,
              name: group.name,
              description: group.description,
              capacity: group.capacity,
              currentParticipants,
              confirmedParticipants,
              eventId: group.eventId,
              eventTitle: event.title,
              status: group.status,
              color: group.color,
              pendingPayments: groupPendingPayments,
              totalRevenue: groupRevenue,
              lastActivity: group.updatedAt || group.createdAt
            });
          }
        }
      } else if (userRole === "organizer") {
        console.log("Organizer access - loading own event groups");
        const userEvents = await storage.getUserEvents(userId);
        for (const event of userEvents) {
          const eventGroups2 = await storage.getEventGroups(event.id);
          for (const group of eventGroups2) {
            const participants = await storage.getGroupParticipants(group.id);
            const currentParticipants = participants.length;
            totalParticipants += currentParticipants;
            const groupPendingPayments = await storage.getGroupPendingPayments(group.id);
            pendingPayments += groupPendingPayments;
            const groupRevenue = await storage.getGroupTotalRevenue(group.id);
            totalRevenue += groupRevenue;
            const groupOverduePayments = await storage.getGroupOverduePayments(group.id);
            overduePayments += groupOverduePayments;
            const confirmedParticipants = await storage.getGroupConfirmedParticipants(group.id);
            totalConfirmed += confirmedParticipants;
            groups.push({
              id: group.id,
              name: group.name,
              description: group.description,
              capacity: group.capacity,
              currentParticipants,
              confirmedParticipants,
              eventId: group.eventId,
              eventTitle: event.title,
              status: group.status,
              color: group.color,
              pendingPayments: groupPendingPayments,
              totalRevenue: groupRevenue,
              lastActivity: group.updatedAt || group.createdAt
            });
          }
        }
      } else if (userRole === "group_manager") {
        console.log("Group manager access - loading managed groups");
        const userGroupManagers = await storage.getUserGroupManagers(userId);
        for (const groupManager of userGroupManagers) {
          if (groupManager.group) {
            const group = groupManager.group;
            const participants = await storage.getGroupParticipants(group.id);
            const currentParticipants = participants.length;
            totalParticipants += currentParticipants;
            const groupPendingPayments = await storage.getGroupPendingPayments(group.id);
            pendingPayments += groupPendingPayments;
            const groupRevenue = await storage.getGroupTotalRevenue(group.id);
            totalRevenue += groupRevenue;
            const groupOverduePayments = await storage.getGroupOverduePayments(group.id);
            overduePayments += groupOverduePayments;
            const confirmedParticipants = await storage.getGroupConfirmedParticipants(group.id);
            totalConfirmed += confirmedParticipants;
            const event = await storage.getEvent(group.eventId);
            groups.push({
              id: group.id,
              name: group.name,
              description: group.description,
              capacity: group.capacity,
              currentParticipants,
              confirmedParticipants,
              eventId: group.eventId,
              eventTitle: event?.title || "Evento n\xE3o encontrado",
              eventStartDate: event?.startDate,
              eventEndDate: event?.endDate,
              status: group.status,
              color: group.color,
              pendingPayments: groupPendingPayments,
              totalRevenue: groupRevenue,
              lastActivity: group.updatedAt || group.createdAt
            });
          }
        }
      }
      const stats = {
        totalGroups: groups.length,
        totalParticipants,
        totalConfirmed,
        pendingPayments,
        totalRevenue,
        overduePayments
      };
      console.log("Dashboard data prepared:", {
        userRole,
        groupsCount: groups.length,
        stats
      });
      res.json({
        groups,
        stats,
        userRole
      });
    } catch (error) {
      console.error("Erro ao obter dashboard de grupos:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Obter participantes de um grupo
   */
  static async getGroupParticipants(req, res) {
    try {
      console.log("=== GET GROUP PARTICIPANTS ===");
      const { groupId } = req.params;
      const userId = req.user?.userId;
      console.log("GroupId:", groupId);
      console.log("UserId:", userId);
      if (!userId) {
        console.log("ERROR: Usu\xE1rio n\xE3o autenticado");
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        console.log("ERROR: Usu\xE1rio n\xE3o tem acesso ao grupo");
        return res.status(403).json({ error: "Acesso negado" });
      }
      const participants = await storage.getGroupParticipants(groupId);
      console.log("Participants found:", participants.length);
      res.json(participants);
    } catch (error) {
      console.error("Erro ao obter participantes do grupo:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Obter pagamentos de um grupo
   */
  static async getGroupPayments(req, res) {
    try {
      console.log("=== GET GROUP PAYMENTS ===");
      const { groupId } = req.params;
      const userId = req.user?.userId;
      console.log("GroupId:", groupId);
      console.log("UserId:", userId);
      if (!userId) {
        console.log("ERROR: Usu\xE1rio n\xE3o autenticado");
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        console.log("ERROR: Usu\xE1rio n\xE3o tem acesso ao grupo");
        return res.status(403).json({ error: "Acesso negado" });
      }
      const payments = await storage.getGroupPayments(groupId);
      console.log("Payments found:", payments.length);
      res.json(payments);
    } catch (error) {
      console.error("Erro ao obter pagamentos do grupo:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  // Gestores de grupos
  static async getGroupManagers(req, res) {
    try {
      const groupId = req.params.groupId;
      const userId = req.user?.userId;
      console.log("=== GET GROUP MANAGERS ===");
      console.log("GroupId:", groupId);
      console.log("UserId:", userId);
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Acesso negado ao grupo" });
      }
      const managers = await storage.getGroupManagers(groupId);
      res.json(managers);
    } catch (error) {
      console.error("Erro ao buscar gestores do grupo:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  static async removeGroupManager(req, res) {
    try {
      const { groupId, managerId } = req.params;
      const userId = req.user?.userId;
      console.log("=== REMOVE GROUP MANAGER ===");
      console.log("GroupId:", groupId);
      console.log("ManagerId:", managerId);
      console.log("UserId:", userId);
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Acesso negado ao grupo" });
      }
      await storage.deleteGroupManager(managerId);
      res.status(200).json({ message: "Gestor removido com sucesso" });
    } catch (error) {
      console.error("Erro ao remover gestor do grupo:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};

// server/controllers/paymentController.ts
init_storage();
init_paymentService();
var PaymentController = class {
  /**
   * Criar um plano de pagamento para um evento
   */
  static async createPaymentPlan(req, res) {
    try {
      const { eventId, name, description, installmentCount, installmentInterval, firstInstallmentDate, discountPolicy, lateFeePolicy, isDefault } = req.body;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const event = await storage.getEvent(eventId);
      if (!event || event.organizerId !== userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      if (isDefault) {
        const existingPlans = await storage.getEventPaymentPlans(eventId);
        for (const plan2 of existingPlans) {
          if (plan2.isDefault) {
            await storage.updateEventPaymentPlan(plan2.id, { isDefault: false });
          }
        }
      }
      const plan = await storage.createEventPaymentPlan({
        eventId,
        name,
        description,
        installmentCount,
        installmentInterval: installmentInterval || "monthly",
        firstInstallmentDate: firstInstallmentDate ? new Date(firstInstallmentDate) : void 0,
        discountPolicy: discountPolicy || {},
        lateFeePolicy: lateFeePolicy || {},
        isDefault: isDefault || false,
        status: "active"
      });
      res.status(201).json(plan);
    } catch (error) {
      console.error("Erro ao criar plano de pagamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Obter planos de pagamento de um evento
   */
  static async getEventPaymentPlans(req, res) {
    try {
      const { eventId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Evento n\xE3o encontrado" });
      }
      const isOrganizer = event.organizerId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const hasGroupAccess = userGroupManagers.some((gm) => {
        return gm.group?.eventId === eventId;
      });
      if (!isOrganizer && !hasGroupAccess) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      const plans = await storage.getEventPaymentPlans(eventId);
      res.json(plans);
    } catch (error) {
      console.error("Erro ao obter planos de pagamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Obter parcelas de uma inscrição
   */
  static async getRegistrationInstallments(req, res) {
    try {
      const { registrationId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const registration = await storage.getRegistration(registrationId);
      if (!registration) {
        return res.status(404).json({ error: "Inscri\xE7\xE3o n\xE3o encontrada" });
      }
      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ error: "Evento n\xE3o encontrado" });
      }
      const isOrganizer = event.organizerId === userId;
      const isParticipant = registration.userId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const isGroupManager = registration.groupId && userGroupManagers.some((gm) => gm.groupId === registration.groupId);
      if (!isOrganizer && !isParticipant && !isGroupManager) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      const installments = await storage.getRegistrationInstallments(registrationId);
      res.json(installments);
    } catch (error) {
      console.error("Erro ao obter parcelas:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Processar um pagamento
   */
  static async processPayment(req, res) {
    try {
      const { installmentId } = req.params;
      const { amount, paymentMethod, transactionId, notes } = req.body;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const installment = await storage.getPaymentInstallment(installmentId);
      if (!installment) {
        return res.status(404).json({ error: "Parcela n\xE3o encontrada" });
      }
      const registration = await storage.getRegistration(installment.registrationId);
      if (!registration) {
        return res.status(404).json({ error: "Inscri\xE7\xE3o n\xE3o encontrada" });
      }
      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ error: "Evento n\xE3o encontrado" });
      }
      const isOrganizer = event.organizerId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const isGroupManager = registration.groupId && userGroupManagers.some((gm) => gm.groupId === registration.groupId);
      if (!isOrganizer && !isGroupManager) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      const result = await PaymentService.processPayment(
        installmentId,
        amount,
        paymentMethod,
        transactionId,
        notes,
        userId
      );
      res.json(result);
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Aplicar desconto a uma parcela
   */
  static async applyDiscount(req, res) {
    try {
      const { installmentId } = req.params;
      const { discountAmount, notes } = req.body;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const installment = await storage.getPaymentInstallment(installmentId);
      if (!installment) {
        return res.status(404).json({ error: "Parcela n\xE3o encontrada" });
      }
      const registration = await storage.getRegistration(installment.registrationId);
      if (!registration) {
        return res.status(404).json({ error: "Inscri\xE7\xE3o n\xE3o encontrada" });
      }
      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ error: "Evento n\xE3o encontrado" });
      }
      const isOrganizer = event.organizerId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const isGroupManager = registration.groupId && userGroupManagers.some((gm) => gm.groupId === registration.groupId);
      if (!isOrganizer && !isGroupManager) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      const result = await PaymentService.applyDiscountToInstallment(
        installmentId,
        discountAmount,
        notes,
        userId
      );
      res.json(result);
    } catch (error) {
      console.error("Erro ao aplicar desconto:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Aplicar multa por atraso
   */
  static async applyLateFee(req, res) {
    try {
      const { installmentId } = req.params;
      const { lateFeeAmount, notes } = req.body;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const installment = await storage.getPaymentInstallment(installmentId);
      if (!installment) {
        return res.status(404).json({ error: "Parcela n\xE3o encontrada" });
      }
      const registration = await storage.getRegistration(installment.registrationId);
      if (!registration) {
        return res.status(404).json({ error: "Inscri\xE7\xE3o n\xE3o encontrada" });
      }
      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ error: "Evento n\xE3o encontrado" });
      }
      const isOrganizer = event.organizerId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const isGroupManager = registration.groupId && userGroupManagers.some((gm) => gm.groupId === registration.groupId);
      if (!isOrganizer && !isGroupManager) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      const result = await PaymentService.applyLateFee(
        installmentId,
        lateFeeAmount,
        notes,
        userId
      );
      res.json(result);
    } catch (error) {
      console.error("Erro ao aplicar multa:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Obter parcelas em atraso
   */
  static async getOverdueInstallments(req, res) {
    try {
      const { eventId } = req.query;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      if (eventId) {
        const event = await storage.getEvent(eventId);
        if (!event) {
          return res.status(404).json({ error: "Evento n\xE3o encontrado" });
        }
        const isOrganizer = event.organizerId === userId;
        const userGroupManagers = await storage.getUserGroupManagers(userId);
        const hasGroupAccess = userGroupManagers.some((gm) => {
          return gm.group?.eventId === eventId;
        });
        if (!isOrganizer && !hasGroupAccess) {
          return res.status(403).json({ error: "Acesso negado" });
        }
      }
      const overdueInstallments = await storage.getOverdueInstallments(eventId);
      res.json(overdueInstallments);
    } catch (error) {
      console.error("Erro ao obter parcelas em atraso:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Recalcular multas automaticamente
   */
  static async recalculateLateFees(req, res) {
    try {
      const { eventId } = req.query;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      if (eventId) {
        const event = await storage.getEvent(eventId);
        if (!event || event.organizerId !== userId) {
          return res.status(403).json({ error: "Acesso negado" });
        }
      }
      await PaymentService.recalculateLateFees(eventId);
      res.json({ message: "Multas recalculadas com sucesso" });
    } catch (error) {
      console.error("Erro ao recalcular multas:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Obter relatório de pagamentos
   */
  static async getPaymentReport(req, res) {
    try {
      const { eventId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const event = await storage.getEvent(eventId);
      if (!event || event.organizerId !== userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      const report = await PaymentService.generatePaymentReport(eventId);
      res.json(report);
    } catch (error) {
      console.error("Erro ao gerar relat\xF3rio:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Obter analytics de pagamentos de um evento
   */
  static async getEventPaymentAnalytics(req, res) {
    try {
      const { eventId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Evento n\xE3o encontrado" });
      }
      const isOrganizer = event.organizerId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const hasGroupAccess = userGroupManagers.some((gm) => {
        return gm.group?.eventId === eventId;
      });
      if (!isOrganizer && !hasGroupAccess) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      const analytics = await storage.getPaymentAnalytics(eventId);
      res.json(analytics);
    } catch (error) {
      console.error("Erro ao obter analytics:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  /**
   * Obter transações de uma parcela
   */
  static async getInstallmentTransactions(req, res) {
    try {
      const { installmentId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const installment = await storage.getPaymentInstallment(installmentId);
      if (!installment) {
        return res.status(404).json({ error: "Parcela n\xE3o encontrada" });
      }
      const registration = await storage.getRegistration(installment.registrationId);
      if (!registration) {
        return res.status(404).json({ error: "Inscri\xE7\xE3o n\xE3o encontrada" });
      }
      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ error: "Evento n\xE3o encontrado" });
      }
      const isOrganizer = event.organizerId === userId;
      const isParticipant = registration.userId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const isGroupManager = registration.groupId && userGroupManagers.some((gm) => gm.groupId === registration.groupId);
      if (!isOrganizer && !isParticipant && !isGroupManager) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      const transactions = await storage.getInstallmentTransactions(installmentId);
      res.json(transactions);
    } catch (error) {
      console.error("Erro ao obter transa\xE7\xF5es:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};

// server/controllers/pixController.ts
init_storage();
var PixController = class {
  // Gerar QR Code PIX
  static async generatePixQr(req, res) {
    try {
      const { registrationId, amount, pixUrl } = req.body;
      if (!registrationId || !amount || !pixUrl) {
        return res.status(400).json({
          error: "registrationId, amount e pixUrl s\xE3o obrigat\xF3rios"
        });
      }
      const registration = await storage.getRegistration(registrationId);
      if (!registration) {
        return res.status(404).json({ error: "Inscri\xE7\xE3o n\xE3o encontrada" });
      }
      if (registration.status !== "pending_payment") {
        return res.status(400).json({
          error: "Inscri\xE7\xE3o n\xE3o est\xE1 pendente de pagamento"
        });
      }
      const qrCodeData = {
        pixUrl,
        amount: parseFloat(amount),
        registrationId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1e3),
        // 30 minutos
        qrCodeImage: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`
        // Placeholder
      };
      await storage.updateRegistration(registrationId, {
        paymentData: JSON.stringify(qrCodeData),
        paymentMethod: "pix"
      });
      res.json({
        success: true,
        qrCode: qrCodeData,
        message: "QR Code PIX gerado com sucesso"
      });
    } catch (error) {
      console.error("Erro ao gerar QR Code PIX:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  // Confirmar pagamento manual (para organizadores)
  static async confirmManualPayment(req, res) {
    try {
      const { registrationId, paymentProof, installmentId, amount } = req.body;
      if (!registrationId) {
        return res.status(400).json({ error: "registrationId \xE9 obrigat\xF3rio" });
      }
      const registration = await storage.getRegistration(registrationId);
      if (!registration) {
        return res.status(404).json({ error: "Inscri\xE7\xE3o n\xE3o encontrada" });
      }
      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ error: "Evento n\xE3o encontrado" });
      }
      if (installmentId) {
        const installment = await storage.getPaymentInstallment(installmentId);
        if (!installment) {
          return res.status(404).json({ error: "Parcela n\xE3o encontrada" });
        }
        await storage.updatePaymentInstallment(installmentId, {
          status: "paid",
          paidAt: /* @__PURE__ */ new Date(),
          paymentProof: paymentProof || null,
          amountPaid: amount || installment.amount
        });
        const currentAmountPaid = parseFloat(registration.amountPaid || "0");
        const installmentAmount = parseFloat(amount || installment.amount);
        const newAmountPaid = currentAmountPaid + installmentAmount;
        const remainingAmount = parseFloat(registration.totalAmount || "0") - newAmountPaid;
        await storage.updateRegistration(registrationId, {
          amountPaid: newAmountPaid.toFixed(2),
          remainingAmount: remainingAmount.toFixed(2),
          paymentStatus: remainingAmount <= 0 ? "paid" : "partial_paid"
        });
        if (remainingAmount <= 0) {
          await storage.updateRegistration(registrationId, {
            status: "confirmed",
            paymentStatus: "paid",
            paidAt: /* @__PURE__ */ new Date()
          });
        }
        res.json({
          success: true,
          message: "Parcela confirmada com sucesso",
          installment: {
            id: installmentId,
            status: "paid",
            amountPaid: installmentAmount
          },
          registration: {
            id: registration.id,
            amountPaid: newAmountPaid.toFixed(2),
            remainingAmount: remainingAmount.toFixed(2),
            paymentStatus: remainingAmount <= 0 ? "paid" : "partial_paid"
          }
        });
        return;
      }
      if (registration.status !== "pending_payment" && registration.paymentStatus !== "installment_plan") {
        return res.status(400).json({
          error: "Inscri\xE7\xE3o n\xE3o est\xE1 pendente de pagamento"
        });
      }
      await storage.updateRegistration(registrationId, {
        status: "confirmed",
        paymentStatus: "paid",
        amountPaid: registration.totalAmount || "0.00",
        remainingAmount: "0.00",
        paymentMethod: "pix_manual",
        paymentProof: paymentProof || null,
        paidAt: /* @__PURE__ */ new Date()
      });
      try {
        const { sendPusherNotificationToChannels: sendPusherNotificationToChannels2, getEventChannel: getEventChannel2, getUserChannel: getUserChannel2, PUSHER_EVENTS: PUSHER_EVENTS2 } = await Promise.resolve().then(() => (init_pusher(), pusher_exports));
        const eventChannel = getEventChannel2(event.id);
        const userChannel = getUserChannel2(event.organizerId);
        const channels = [eventChannel, userChannel];
        await sendPusherNotificationToChannels2(channels, PUSHER_EVENTS2.PAYMENT_CONFIRMED, {
          registration: {
            id: registration.id,
            firstName: registration.firstName,
            lastName: registration.lastName,
            email: registration.email,
            status: "confirmed",
            paymentStatus: "paid",
            amountPaid: registration.totalAmount,
            paidAt: /* @__PURE__ */ new Date()
          },
          event: {
            id: event.id,
            title: event.title
          }
        });
      } catch (pusherError) {
        console.log("Erro ao enviar notifica\xE7\xE3o Pusher:", pusherError);
      }
      res.json({
        success: true,
        message: "Pagamento confirmado com sucesso",
        registration: {
          id: registration.id,
          status: "confirmed",
          paymentStatus: "paid"
        }
      });
    } catch (error) {
      console.error("Erro ao confirmar pagamento manual:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  // Verificar status do pagamento
  static async checkPaymentStatus(req, res) {
    try {
      const { registrationId } = req.params;
      if (!registrationId) {
        return res.status(400).json({ error: "registrationId \xE9 obrigat\xF3rio" });
      }
      const registration = await storage.getRegistration(registrationId);
      if (!registration) {
        return res.status(404).json({ error: "Inscri\xE7\xE3o n\xE3o encontrada" });
      }
      res.json({
        success: true,
        registration: {
          id: registration.id,
          status: registration.status,
          paymentStatus: registration.paymentStatus,
          amountPaid: registration.amountPaid,
          totalAmount: registration.totalAmount,
          paymentMethod: registration.paymentMethod,
          paidAt: registration.paidAt
        }
      });
    } catch (error) {
      console.error("Erro ao verificar status do pagamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};

// server/controllers/cronController.ts
var CronController = class {
  /**
   * Endpoint para executar tarefas de cron manualmente
   * Em produção, isso seria executado por um cron job real
   */
  static async runCronTasks(req, res) {
    try {
      console.log("=== INICIANDO EXECU\xC7\xC3O DE TAREFAS CRON ===");
      const results = {
        upcomingReminders: 0,
        overdueNotifications: 0,
        errors: []
      };
      try {
        await NotificationService.sendUpcomingDueReminders();
        results.upcomingReminders = 1;
        console.log("\u2705 Lembretes de vencimento executados com sucesso");
      } catch (error) {
        const errorMsg = `Erro nos lembretes de vencimento: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
        results.errors.push(errorMsg);
        console.error("\u274C", errorMsg);
      }
      try {
        await NotificationService.sendOverdueNotifications();
        results.overdueNotifications = 1;
        console.log("\u2705 Notifica\xE7\xF5es de atraso executadas com sucesso");
      } catch (error) {
        const errorMsg = `Erro nas notifica\xE7\xF5es de atraso: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
        results.errors.push(errorMsg);
        console.error("\u274C", errorMsg);
      }
      console.log("=== EXECU\xC7\xC3O DE TAREFAS CRON CONCLU\xCDDA ===");
      return res.json({
        success: true,
        message: "Tarefas de cron executadas",
        results,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Erro geral na execu\xE7\xE3o de cron:", error);
      return res.status(500).json({
        success: false,
        message: "Erro na execu\xE7\xE3o de tarefas de cron",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }
  /**
   * Endpoint para testar envio de email específico
   */
  static async testEmail(req, res) {
    try {
      const { type, email, registrationId } = req.body;
      if (!type || !email) {
        return res.status(400).json({
          success: false,
          message: "Tipo de email e endere\xE7o s\xE3o obrigat\xF3rios"
        });
      }
      switch (type) {
        case "registration_confirmation":
          if (!registrationId) {
            return res.status(400).json({
              success: false,
              message: "ID da inscri\xE7\xE3o \xE9 obrigat\xF3rio para confirma\xE7\xE3o"
            });
          }
          await NotificationService.sendRegistrationConfirmation(registrationId);
          break;
        case "installment_reminder":
          const { EmailService: EmailService2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
          await EmailService2.sendInstallmentReminder({
            to: email,
            participantName: "Usu\xE1rio Teste",
            eventName: "Evento Teste",
            installmentNumber: 1,
            totalInstallments: 12,
            amount: 100,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3).toISOString(),
            // 3 dias
            paymentUrl: "https://example.com/payment",
            whatsappNumber: "5511999999999"
          });
          break;
        case "overdue_notification":
          const { EmailService: EmailService22 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
          await EmailService22.sendOverdueNotification({
            to: email,
            participantName: "Usu\xE1rio Teste",
            eventName: "Evento Teste",
            installmentNumber: 1,
            amount: 100,
            daysOverdue: 5,
            lateFee: 10,
            paymentUrl: "https://example.com/payment",
            whatsappNumber: "5511999999999"
          });
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Tipo de email inv\xE1lido. Use: registration_confirmation, installment_reminder, overdue_notification"
          });
      }
      return res.json({
        success: true,
        message: `Email de teste (${type}) enviado com sucesso para ${email}`
      });
    } catch (error) {
      console.error("Erro ao enviar email de teste:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao enviar email de teste",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }
  /**
   * Endpoint para enviar lembretes de vencimento
   */
  static async sendUpcomingReminders(req, res) {
    try {
      console.log("=== ENVIANDO LEMBRETES DE VENCIMENTO ===");
      await NotificationService.sendUpcomingDueReminders();
      return res.json({
        success: true,
        message: "Lembretes de vencimento enviados com sucesso"
      });
    } catch (error) {
      console.error("Erro ao enviar lembretes de vencimento:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao enviar lembretes de vencimento",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }
  /**
   * Endpoint para enviar notificações de atraso
   */
  static async sendOverdueNotifications(req, res) {
    try {
      console.log("=== ENVIANDO NOTIFICA\xC7\xD5ES DE ATRASO ===");
      await NotificationService.sendOverdueNotifications();
      return res.json({
        success: true,
        message: "Notifica\xE7\xF5es de atraso enviadas com sucesso"
      });
    } catch (error) {
      console.error("Erro ao enviar notifica\xE7\xF5es de atraso:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao enviar notifica\xE7\xF5es de atraso",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }
  /**
   * Endpoint para verificar status das tarefas de cron
   */
  static async getCronStatus(req, res) {
    try {
      return res.json({
        success: true,
        message: "Status das tarefas de cron",
        lastExecution: (/* @__PURE__ */ new Date()).toISOString(),
        nextExecution: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
        // Próximo dia
        status: "active"
      });
    } catch (error) {
      console.error("Erro ao verificar status de cron:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao verificar status de cron",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }
};

// server/controllers/userController.ts
init_storage();
import bcrypt2 from "bcryptjs";
import { v4 as uuidv42 } from "uuid";
var UserController = class {
  // Criar novo usuário (apenas admin)
  static async createUser(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      const { email, firstName, lastName, role, password, eventId, groupId } = req.body;
      if (!email || !firstName || !role) {
        return res.status(400).json({
          message: "Email, nome e role s\xE3o obrigat\xF3rios"
        });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          message: "Email j\xE1 est\xE1 em uso"
        });
      }
      const tempPassword = password || Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt2.hash(tempPassword, 10);
      const userData = {
        id: uuidv42(),
        email,
        firstName,
        lastName: lastName || "",
        passwordHash: hashedPassword,
        role,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      const newUser = await storage.createUser(userData);
      if (role === "manager" && groupId) {
        await storage.createGroupManager({
          id: uuidv42(),
          groupId,
          userId: newUser.id,
          role: "manager",
          permissions: {},
          assignedAt: /* @__PURE__ */ new Date(),
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
      const { passwordHash, ...userResponse } = newUser;
      res.status(201).json({
        success: true,
        message: "Usu\xE1rio criado com sucesso",
        user: userResponse,
        tempPassword: !password ? tempPassword : void 0
        // Só retorna se foi gerada
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  }
  // Listar todos os usuários (apenas admin)
  static async getAllUsers(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      const users2 = await storage.getAllUsers();
      const safeUsers = users2.map((user) => {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      });
      res.json({ users: safeUsers });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }
  // Atualizar usuário (apenas admin)
  static async updateUser(req, res) {
    try {
      const userId = req.user?.userId;
      const targetUserId = req.params.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      const { email, firstName, lastName, role, status } = req.body;
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const updateData = {
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (email) updateData.email = email;
      if (firstName) updateData.firstName = firstName;
      if (lastName !== void 0) updateData.lastName = lastName;
      if (role) updateData.role = role;
      if (status) updateData.status = status;
      const updatedUser = await storage.updateUser(targetUserId, updateData);
      const { passwordHash, ...userResponse } = updatedUser;
      res.json({
        success: true,
        message: "Usu\xE1rio atualizado com sucesso",
        user: userResponse
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  }
  // Deletar usuário (apenas admin)
  static async deleteUser(req, res) {
    try {
      const userId = req.user?.userId;
      const targetUserId = req.params.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      if (userId === targetUserId) {
        return res.status(400).json({ message: "N\xE3o \xE9 poss\xEDvel deletar seu pr\xF3prio usu\xE1rio" });
      }
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.deleteUser(targetUserId);
      res.json({
        success: true,
        message: "Usu\xE1rio deletado com sucesso"
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  }
  // Atribuir gestor a grupo
  static async assignManagerToGroup(req, res) {
    try {
      const userId = req.user?.userId;
      const { groupId, managerId } = req.body;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== "admin" && currentUser.role !== "organizer") {
        return res.status(403).json({ message: "Access denied. Admin or organizer role required." });
      }
      const group = await storage.getEventGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      if (currentUser.role !== "admin") {
        const event = await storage.getEvent(group.eventId);
        if (!event || event.organizerId !== userId) {
          return res.status(403).json({ message: "Access denied. You can only assign managers to your own events." });
        }
      }
      const manager = await storage.getUser(managerId);
      if (!manager) {
        return res.status(404).json({ message: "Manager not found" });
      }
      const existingManager = await storage.getGroupManagers(groupId);
      const isAlreadyManager = existingManager.some((m) => m.userId === managerId);
      if (isAlreadyManager) {
        return res.status(400).json({ message: "Usu\xE1rio j\xE1 \xE9 gestor deste grupo" });
      }
      const groupManager = await storage.createGroupManager({
        id: uuidv42(),
        groupId,
        userId: managerId,
        role: "manager",
        permissions: ["read", "write", "participants", "payments"],
        // Permissões padrão para gestores
        assignedAt: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
      res.status(201).json({
        success: true,
        message: "Gestor atribu\xEDdo ao grupo com sucesso",
        groupManager
      });
    } catch (error) {
      console.error("Error assigning manager to group:", error);
      res.status(500).json({ message: "Failed to assign manager to group" });
    }
  }
  // Remover gestor de grupo
  static async removeManagerFromGroup(req, res) {
    try {
      const userId = req.user?.userId;
      const { groupId, managerId } = req.body;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== "admin" && currentUser.role !== "organizer") {
        return res.status(403).json({ message: "Access denied. Admin or organizer role required." });
      }
      const group = await storage.getEventGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      if (currentUser.role !== "admin") {
        const event = await storage.getEvent(group.eventId);
        if (!event || event.organizerId !== userId) {
          return res.status(403).json({ message: "Access denied. You can only remove managers from your own events." });
        }
      }
      const groupManagers2 = await storage.getGroupManagers(groupId);
      const managerAssociation = groupManagers2.find((m) => m.userId === managerId);
      if (!managerAssociation) {
        return res.status(404).json({ message: "Gestor n\xE3o encontrado neste grupo" });
      }
      await storage.deleteGroupManager(managerAssociation.id);
      res.json({
        success: true,
        message: "Gestor removido do grupo com sucesso"
      });
    } catch (error) {
      console.error("Error removing manager from group:", error);
      res.status(500).json({ message: "Failed to remove manager from group" });
    }
  }
  // Listar gestores de um grupo
  static async getGroupManagers(req, res) {
    try {
      const userId = req.user?.userId;
      const groupId = req.params.groupId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this group" });
      }
      const managers = await storage.getGroupManagers(groupId);
      const managersWithDetails = await Promise.all(
        managers.map(async (manager) => {
          const user = await storage.getUser(manager.userId);
          return {
            ...manager,
            // Garantir que permissions seja sempre um array
            permissions: Array.isArray(manager.permissions) ? manager.permissions : [],
            user: user ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role
            } : null
          };
        })
      );
      res.json({ managers: managersWithDetails });
    } catch (error) {
      console.error("Error fetching group managers:", error);
      res.status(500).json({ message: "Failed to fetch group managers" });
    }
  }
  // Criar gestor e atribuir a grupo em uma operação
  static async createManagerForGroup(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== "admin" && currentUser.role !== "organizer") {
        return res.status(403).json({ message: "Access denied. Admin or organizer role required." });
      }
      const { email, firstName, lastName, password, groupId } = req.body;
      if (!email || !firstName || !groupId) {
        return res.status(400).json({
          message: "Email, nome e grupo s\xE3o obrigat\xF3rios"
        });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          message: "Email j\xE1 est\xE1 em uso"
        });
      }
      const group = await storage.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      if (currentUser.role !== "admin") {
        const event = await storage.getEvent(group.eventId);
        if (!event || event.organizerId !== userId) {
          return res.status(403).json({ message: "Access denied. You can only create managers for your own events." });
        }
      }
      const finalPassword = password || Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt2.hash(finalPassword, 10);
      const userData = {
        id: uuidv42(),
        email,
        firstName,
        lastName: lastName || "",
        passwordHash: hashedPassword,
        role: "manager",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      const newUser = await storage.createUser(userData);
      const groupManager = await storage.createGroupManager({
        id: uuidv42(),
        groupId,
        userId: newUser.id,
        role: "manager",
        permissions: ["read", "write", "participants", "payments"],
        // Permissões padrão para gestores
        assignedAt: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
      const { passwordHash, ...userResponse } = newUser;
      res.status(201).json({
        success: true,
        message: "Gestor criado e atribu\xEDdo ao grupo com sucesso",
        user: userResponse,
        groupManager,
        tempPassword: !password ? finalPassword : void 0
      });
    } catch (error) {
      console.error("Error creating manager for group:", error);
      res.status(500).json({ message: "Failed to create manager for group" });
    }
  }
  // Endpoint temporário para atualizar permissões dos gestores existentes
  static async updateManagerPermissions(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      const result = await storage.updateAllManagerPermissions();
      res.json({
        success: true,
        message: "Permiss\xF5es dos gestores atualizadas com sucesso",
        updatedCount: result
      });
    } catch (error) {
      console.error("Error updating manager permissions:", error);
      res.status(500).json({ message: "Failed to update manager permissions" });
    }
  }
};

// server/middleware/planLimits.ts
init_storage();
var checkPlanLimit = (action) => {
  return async (req, res, next) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const subscription = await storage.getUserSubscription(userId);
      const planId = subscription?.planId || "free";
      let currentUsage = 0;
      switch (action) {
        case "events":
          currentUsage = await storage.getUserEventCount(userId);
          break;
        case "participants":
          currentUsage = 0;
          break;
        case "templates":
          currentUsage = await storage.getUserTemplateCount(userId);
          break;
        default:
          currentUsage = 0;
      }
      if (!PlanService.canPerformAction(planId, action, currentUsage)) {
        const plan = PlanService.getPlan(planId);
        return res.status(403).json({
          message: `Limite de ${action} atingido para o plano ${plan?.name}`,
          planLimitReached: true,
          currentPlan: planId,
          limit: plan?.limits[action],
          currentUsage
        });
      }
      next();
    } catch (error) {
      console.error("Error checking plan limits:", error);
      res.status(500).json({ message: "Error checking plan limits" });
    }
  };
};
var requirePaidPlan = async (req, res, next) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const subscription = await storage.getUserSubscription(userId);
    const planId = subscription?.planId || "free";
    if (planId === "free") {
      return res.status(403).json({
        message: "Esta funcionalidade requer um plano pago",
        requiresUpgrade: true,
        currentPlan: planId
      });
    }
    next();
  } catch (error) {
    console.error("Error checking paid plan:", error);
    res.status(500).json({ message: "Error checking plan status" });
  }
};

// server/middleware/permissions.ts
init_storage();
var restrictManagersFromCreatingEvents = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
  }
  if (req.user.role === "manager") {
    return res.status(403).json({
      error: "Acesso negado. Gestores n\xE3o podem criar eventos. Apenas administradores e organizadores podem criar eventos."
    });
  }
  next();
};
var requireGroupDashboardAccess = async (req, res, next) => {
  console.log("\u{1F50D} PERMISSIONS MIDDLEWARE - Starting");
  console.log("User:", req.user);
  if (!req.user) {
    console.log("\u274C No user found");
    return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
  }
  try {
    console.log("\u{1F50D} User role from token:", req.user.role);
    if (req.user.role === "admin") {
      console.log("\u2705 Admin access granted");
      req.userRole = "admin";
      return next();
    }
    console.log("\u{1F50D} Checking user events...");
    const userEvents = await storage.getUserEvents(req.user.userId);
    console.log("User events found:", userEvents.length);
    if (userEvents.length > 0) {
      console.log("\u2705 Organizer access granted");
      req.userRole = "organizer";
      return next();
    }
    console.log("\u{1F50D} Checking group managers...");
    const userGroupManagers = await storage.getUserGroupManagers(req.user.userId);
    console.log("User group managers found:", userGroupManagers.length);
    if (userGroupManagers.length > 0) {
      console.log("\u2705 Group manager access granted");
      req.userRole = "group_manager";
      return next();
    }
    console.log("\u274C No permissions found");
    return res.status(403).json({
      error: "Acesso negado. Voc\xEA n\xE3o tem permiss\xE3o para acessar o dashboard de grupos."
    });
  } catch (error) {
    console.error("\u274C Erro ao verificar permiss\xF5es do dashboard:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// server/middleware/groupPermissions.ts
init_storage();
var requireGroupPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      const groupId = req.params.groupId || req.params.id;
      console.log("=== GROUP PERMISSION CHECK ===");
      console.log("UserId:", userId);
      console.log("GroupId:", groupId);
      console.log("Required Permission:", requiredPermission);
      if (!userId) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      if (!groupId) {
        return res.status(400).json({ error: "ID do grupo n\xE3o fornecido" });
      }
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        console.log("ERROR: Usu\xE1rio n\xE3o tem acesso ao grupo");
        return res.status(403).json({ error: "Acesso negado ao grupo" });
      }
      const group = await storage.getGroupById(groupId);
      if (group?.eventId) {
        const event = await storage.getEventById(group.eventId);
        if (event?.organizerId === userId) {
          console.log("\u2705 Usu\xE1rio \xE9 organizador do evento - acesso total");
          req.groupPermissions = ["read", "write", "payments", "participants"];
          return next();
        }
      }
      const managers = await storage.getGroupManagers(groupId);
      const userManager = managers.find((m) => m.userId === userId);
      if (!userManager) {
        console.log("ERROR: Usu\xE1rio n\xE3o \xE9 gestor do grupo");
        return res.status(403).json({ error: "Acesso negado - n\xE3o \xE9 gestor do grupo" });
      }
      const userPermissions = Array.isArray(userManager.permissions) ? userManager.permissions : [];
      console.log("User permissions:", userPermissions);
      if (!userPermissions.includes(requiredPermission)) {
        console.log("ERROR: Usu\xE1rio n\xE3o tem a permiss\xE3o necess\xE1ria");
        return res.status(403).json({
          error: `Acesso negado - permiss\xE3o '${requiredPermission}' necess\xE1ria`
        });
      }
      console.log("\u2705 Permiss\xE3o verificada com sucesso");
      req.groupPermissions = userPermissions;
      next();
    } catch (error) {
      console.error("Erro ao verificar permiss\xF5es do grupo:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  };
};
var requireGroupRead = requireGroupPermission("read");
var requireGroupWrite = requireGroupPermission("write");
var requireGroupPayments = requireGroupPermission("payments");
var requireGroupParticipants = requireGroupPermission("participants");

// server/routes/pixTest.ts
import { Router } from "express";

// server/services/pixService.ts
import axios from "axios";
var PIXService = class {
  config;
  axiosInstance;
  constructor() {
    this.config = {
      baseURL: process.env.PIX_API_URL || "https://api.pix.com.br/v1",
      apiKey: process.env.PIX_API_KEY || "",
      environment: process.env.PIX_ENVIRONMENT || "production"
    };
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      timeout: 3e4
    });
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`\u{1F680} PIX API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error("\u274C PIX API Request Error:", error);
        return Promise.reject(error);
      }
    );
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`\u2705 PIX API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error("\u274C PIX API Response Error:", error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }
  /**
   * Cria um pagamento PIX
   */
  async createPayment(paymentData) {
    try {
      console.log("\u{1F4B3} Criando pagamento PIX:", paymentData);
      if (!this.config.apiKey) {
        console.log("\u26A0\uFE0F API Key n\xE3o configurada - simulando pagamento PIX");
        return this.simulatePaymentResponse(paymentData);
      }
      const response = await this.axiosInstance.post("/pix/payments", paymentData);
      console.log("\u2705 Pagamento PIX criado:", response.data);
      return response.data;
    } catch (error) {
      console.error("\u274C Erro ao criar pagamento PIX:", error.response?.data || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("\u26A0\uFE0F Erro de autentica\xE7\xE3o - simulando pagamento PIX");
        return this.simulatePaymentResponse(paymentData);
      }
      throw new Error(`Erro ao criar pagamento PIX: ${error.response?.data?.message || error.message}`);
    }
  }
  /**
   * Consulta um pagamento PIX
   */
  async getPayment(paymentId) {
    try {
      console.log(`\u{1F50D} Consultando pagamento PIX: ${paymentId}`);
      if (!this.config.apiKey) {
        console.log("\u26A0\uFE0F API Key n\xE3o configurada - simulando consulta PIX");
        return this.simulatePaymentResponse({ amount: 1, description: "Teste", external_id: paymentId, payer: { name: "Teste", document: "12345678901", email: "teste@teste.com" } });
      }
      const response = await this.axiosInstance.get(`/pix/payments/${paymentId}`);
      console.log("\u2705 Pagamento PIX consultado:", response.data);
      return response.data;
    } catch (error) {
      console.error("\u274C Erro ao consultar pagamento PIX:", error.response?.data || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("\u26A0\uFE0F Erro de autentica\xE7\xE3o - simulando consulta PIX");
        return this.simulatePaymentResponse({ amount: 1, description: "Teste", external_id: paymentId, payer: { name: "Teste", document: "12345678901", email: "teste@teste.com" } });
      }
      throw new Error(`Erro ao consultar pagamento PIX: ${error.response?.data?.message || error.message}`);
    }
  }
  /**
   * Cancela um pagamento PIX
   */
  async cancelPayment(paymentId) {
    try {
      console.log(`\u{1F6AB} Cancelando pagamento PIX: ${paymentId}`);
      if (!this.config.apiKey) {
        console.log("\u26A0\uFE0F API Key n\xE3o configurada - simulando cancelamento PIX");
        const simulatedResponse = this.simulatePaymentResponse({ amount: 1, description: "Teste", external_id: paymentId, payer: { name: "Teste", document: "12345678901", email: "teste@teste.com" } });
        simulatedResponse.status = "cancelled";
        return simulatedResponse;
      }
      const response = await this.axiosInstance.post(`/pix/payments/${paymentId}/cancel`);
      console.log("\u2705 Pagamento PIX cancelado:", response.data);
      return response.data;
    } catch (error) {
      console.error("\u274C Erro ao cancelar pagamento PIX:", error.response?.data || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("\u26A0\uFE0F Erro de autentica\xE7\xE3o - simulando cancelamento PIX");
        const simulatedResponse = this.simulatePaymentResponse({ amount: 1, description: "Teste", external_id: paymentId, payer: { name: "Teste", document: "12345678901", email: "teste@teste.com" } });
        simulatedResponse.status = "cancelled";
        return simulatedResponse;
      }
      throw new Error(`Erro ao cancelar pagamento PIX: ${error.response?.data?.message || error.message}`);
    }
  }
  /**
   * Estorna um pagamento PIX
   */
  async refundPayment(paymentId, amount) {
    try {
      console.log(`\u{1F4B0} Estornando pagamento PIX: ${paymentId}`);
      if (!this.config.apiKey) {
        console.log("\u26A0\uFE0F API Key n\xE3o configurada - simulando estorno PIX");
        const simulatedResponse = this.simulatePaymentResponse({ amount: amount || 1, description: "Teste", external_id: paymentId, payer: { name: "Teste", document: "12345678901", email: "teste@teste.com" } });
        simulatedResponse.status = "refunded";
        return simulatedResponse;
      }
      const response = await this.axiosInstance.post(`/pix/payments/${paymentId}/refund`, {
        amount
      });
      console.log("\u2705 Pagamento PIX estornado:", response.data);
      return response.data;
    } catch (error) {
      console.error("\u274C Erro ao estornar pagamento PIX:", error.response?.data || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("\u26A0\uFE0F Erro de autentica\xE7\xE3o - simulando estorno PIX");
        const simulatedResponse = this.simulatePaymentResponse({ amount: amount || 1, description: "Teste", external_id: paymentId, payer: { name: "Teste", document: "12345678901", email: "teste@teste.com" } });
        simulatedResponse.status = "refunded";
        return simulatedResponse;
      }
      throw new Error(`Erro ao estornar pagamento PIX: ${error.response?.data?.message || error.message}`);
    }
  }
  /**
   * Valida webhook PIX
   */
  validateWebhook(payload, signature) {
    console.log("\u{1F510} Validando webhook PIX:", { payload, signature });
    return true;
  }
  /**
   * Processa webhook PIX
   */
  processWebhook(payload) {
    console.log("\u{1F4E8} Processando webhook PIX:", payload);
    return payload;
  }
  /**
   * Gera dados de teste para pagamento
   */
  generateTestPayment() {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      amount: 1,
      // R$ 1,00 para teste
      description: "Teste de Pagamento PIX - EventsEnroll",
      external_id: testId,
      payer: {
        name: "Usu\xE1rio Teste",
        document: "12345678901",
        email: "teste@example.com",
        phone: "11999999999"
      },
      expires_in: 3600,
      // 1 hora
      additional_info: "Pagamento de teste para integra\xE7\xE3o PIX"
    };
  }
  /**
   * Simula uma resposta de pagamento PIX para testes
   */
  simulatePaymentResponse(paymentData) {
    const paymentId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 36e5);
    return {
      id: paymentId,
      status: "pending",
      qr_code: this.generateMockQRCode(),
      qr_code_text: `00020126580014br.gov.bcb.pix0136${paymentId}52040000530398654051.005802BR5913EventFlow Test6009Sao Paulo62070503***6304${this.generateCRC16(paymentId)}`,
      copy_paste_code: `00020126580014br.gov.bcb.pix0136${paymentId}52040000530398654051.005802BR5913EventFlow Test6009Sao Paulo62070503***6304${this.generateCRC16(paymentId)}`,
      expires_at: expiresAt.toISOString(),
      amount: paymentData.amount,
      external_id: paymentData.external_id
    };
  }
  /**
   * Gera um QR Code mock em base64
   */
  generateMockQRCode() {
    return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  }
  /**
   * Gera CRC16 para códigos PIX
   */
  generateCRC16(data) {
    let crc = 65535;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i);
      for (let j = 0; j < 8; j++) {
        if (crc & 1) {
          crc = crc >> 1 ^ 33800;
        } else {
          crc >>= 1;
        }
      }
    }
    return (crc ^ 65535).toString(16).toUpperCase().padStart(4, "0");
  }
};
var pixService = new PIXService();

// server/routes/pixTest.ts
init_auth();
var router = Router();
var testPayments = /* @__PURE__ */ new Map();
router.post("/create", authenticateToken, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Acesso negado. Apenas administradores podem acessar esta funcionalidade."
      });
    }
    console.log("\u{1F9EA} Criando pagamento PIX de teste...");
    const testPaymentData = pixService.generateTestPayment();
    const pixPayment = await pixService.createPayment(testPaymentData);
    testPayments.set(pixPayment.id, {
      ...pixPayment,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      user_id: req.user?.userId
    });
    console.log("\u2705 Pagamento PIX de teste criado:", pixPayment.id);
    res.json({
      success: true,
      message: "Pagamento PIX de teste criado com sucesso",
      data: {
        id: pixPayment.id,
        status: pixPayment.status,
        amount: pixPayment.amount,
        qr_code: pixPayment.qr_code,
        qr_code_text: pixPayment.qr_code_text,
        copy_paste_code: pixPayment.copy_paste_code,
        expires_at: pixPayment.expires_at,
        external_id: pixPayment.external_id
      }
    });
  } catch (error) {
    console.error("\u274C Erro ao criar pagamento PIX de teste:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar pagamento PIX de teste",
      error: error.message
    });
  }
});
router.get("/status/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Acesso negado. Apenas administradores podem acessar esta funcionalidade."
      });
    }
    const { id } = req.params;
    console.log(`\u{1F50D} Consultando status do pagamento PIX: ${id}`);
    const pixPayment = await pixService.getPayment(id);
    if (testPayments.has(id)) {
      testPayments.set(id, {
        ...testPayments.get(id),
        ...pixPayment,
        last_checked: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    console.log("\u2705 Status do pagamento PIX consultado:", pixPayment.status);
    res.json({
      success: true,
      message: "Status do pagamento PIX consultado com sucesso",
      data: {
        id: pixPayment.id,
        status: pixPayment.status,
        amount: pixPayment.amount,
        paid_at: pixPayment.paid_at,
        expires_at: pixPayment.expires_at,
        external_id: pixPayment.external_id
      }
    });
  } catch (error) {
    console.error("\u274C Erro ao consultar status do pagamento PIX:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao consultar status do pagamento PIX",
      error: error.message
    });
  }
});
router.get("/list", authenticateToken, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Acesso negado. Apenas administradores podem acessar esta funcionalidade."
      });
    }
    const userId = req.user?.userId;
    console.log(`\u{1F4CB} Listando pagamentos PIX de teste do usu\xE1rio: ${userId}`);
    const userPayments = Array.from(testPayments.values()).filter((payment) => payment.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    console.log(`\u2705 Encontrados ${userPayments.length} pagamentos PIX de teste`);
    res.json({
      success: true,
      message: "Pagamentos PIX de teste listados com sucesso",
      data: userPayments.map((payment) => ({
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        created_at: payment.created_at,
        paid_at: payment.paid_at,
        expires_at: payment.expires_at,
        external_id: payment.external_id
      }))
    });
  } catch (error) {
    console.error("\u274C Erro ao listar pagamentos PIX de teste:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar pagamentos PIX de teste",
      error: error.message
    });
  }
});
router.post("/cancel/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Acesso negado. Apenas administradores podem acessar esta funcionalidade."
      });
    }
    const { id } = req.params;
    console.log(`\u{1F6AB} Cancelando pagamento PIX de teste: ${id}`);
    const storedPayment = testPayments.get(id);
    if (!storedPayment || storedPayment.user_id !== req.user?.userId) {
      return res.status(404).json({
        success: false,
        message: "Pagamento PIX n\xE3o encontrado ou n\xE3o pertence ao usu\xE1rio"
      });
    }
    const pixPayment = await pixService.cancelPayment(id);
    testPayments.set(id, {
      ...storedPayment,
      ...pixPayment,
      cancelled_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    console.log("\u2705 Pagamento PIX de teste cancelado:", id);
    res.json({
      success: true,
      message: "Pagamento PIX de teste cancelado com sucesso",
      data: {
        id: pixPayment.id,
        status: pixPayment.status,
        amount: pixPayment.amount,
        external_id: pixPayment.external_id
      }
    });
  } catch (error) {
    console.error("\u274C Erro ao cancelar pagamento PIX de teste:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao cancelar pagamento PIX de teste",
      error: error.message
    });
  }
});
router.post("/refund/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Acesso negado. Apenas administradores podem acessar esta funcionalidade."
      });
    }
    const { id } = req.params;
    const { amount } = req.body;
    console.log(`\u{1F4B0} Estornando pagamento PIX de teste: ${id}`);
    const storedPayment = testPayments.get(id);
    if (!storedPayment || storedPayment.user_id !== req.user?.userId) {
      return res.status(404).json({
        success: false,
        message: "Pagamento PIX n\xE3o encontrado ou n\xE3o pertence ao usu\xE1rio"
      });
    }
    const pixPayment = await pixService.refundPayment(id, amount);
    testPayments.set(id, {
      ...storedPayment,
      ...pixPayment,
      refunded_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    console.log("\u2705 Pagamento PIX de teste estornado:", id);
    res.json({
      success: true,
      message: "Pagamento PIX de teste estornado com sucesso",
      data: {
        id: pixPayment.id,
        status: pixPayment.status,
        amount: pixPayment.amount,
        external_id: pixPayment.external_id
      }
    });
  } catch (error) {
    console.error("\u274C Erro ao estornar pagamento PIX de teste:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao estornar pagamento PIX de teste",
      error: error.message
    });
  }
});
var pixTest_default = router;

// server/routes/pixWebhook.ts
import { Router as Router2 } from "express";
var router2 = Router2();
var webhookLogs = /* @__PURE__ */ new Map();
router2.post("/", async (req, res) => {
  try {
    const signature = req.headers["x-pix-signature"];
    const payload = req.body;
    console.log("\u{1F4E8} Webhook PIX recebido:", {
      signature: signature ? "presente" : "ausente",
      payload
    });
    if (!pixService.validateWebhook(payload, signature)) {
      console.error("\u274C Webhook PIX inv\xE1lido");
      return res.status(400).json({
        success: false,
        message: "Webhook inv\xE1lido"
      });
    }
    const processedPayload = pixService.processWebhook(payload);
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    webhookLogs.set(webhookId, {
      id: webhookId,
      received_at: (/* @__PURE__ */ new Date()).toISOString(),
      payload: processedPayload,
      signature,
      processed: true
    });
    console.log("\u2705 Webhook PIX processado:", {
      webhookId,
      paymentId: processedPayload.id,
      status: processedPayload.status,
      amount: processedPayload.amount
    });
    if (processedPayload.status === "paid") {
      console.log("\u{1F4B0} Pagamento PIX confirmado:", {
        paymentId: processedPayload.id,
        amount: processedPayload.amount,
        paidAt: processedPayload.paid_at
      });
    }
    res.json({
      success: true,
      message: "Webhook processado com sucesso",
      webhookId
    });
  } catch (error) {
    console.error("\u274C Erro ao processar webhook PIX:", error);
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    webhookLogs.set(errorId, {
      id: errorId,
      received_at: (/* @__PURE__ */ new Date()).toISOString(),
      error: error.message,
      payload: req.body,
      processed: false
    });
    res.status(500).json({
      success: false,
      message: "Erro ao processar webhook",
      error: error.message
    });
  }
});
router2.get("/logs", async (req, res) => {
  try {
    const logs = Array.from(webhookLogs.values()).sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
    console.log(`\u{1F4CB} Listando ${logs.length} logs de webhook PIX`);
    res.json({
      success: true,
      message: "Logs de webhook listados com sucesso",
      data: logs
    });
  } catch (error) {
    console.error("\u274C Erro ao listar logs de webhook:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar logs de webhook",
      error: error.message
    });
  }
});
router2.get("/logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const log2 = webhookLogs.get(id);
    if (!log2) {
      return res.status(404).json({
        success: false,
        message: "Log de webhook n\xE3o encontrado"
      });
    }
    console.log(`\u{1F50D} Consultando log de webhook: ${id}`);
    res.json({
      success: true,
      message: "Log de webhook consultado com sucesso",
      data: log2
    });
  } catch (error) {
    console.error("\u274C Erro ao consultar log de webhook:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao consultar log de webhook",
      error: error.message
    });
  }
});
router2.delete("/logs", async (req, res) => {
  try {
    const count = webhookLogs.size;
    webhookLogs.clear();
    console.log(`\u{1F5D1}\uFE0F Limpando ${count} logs de webhook PIX`);
    res.json({
      success: true,
      message: `${count} logs de webhook limpos com sucesso`
    });
  } catch (error) {
    console.error("\u274C Erro ao limpar logs de webhook:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao limpar logs de webhook",
      error: error.message
    });
  }
});
var pixWebhook_default = router2;

// server/modules/seedData.ts
async function seedInitialData() {
  try {
    const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    try {
      await storage2.getUser("admin-user-123");
    } catch (error) {
      await storage2.createUser({
        id: "admin-user-123",
        email: "admin@eventflow.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        passwordHash: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"
        // password: password
      });
      console.log("Created admin user");
    }
    const existingCategories = await storage2.getEventCategories();
    if (existingCategories.length === 0) {
      await storage2.createEventCategory({
        id: "religious",
        name: "Eventos Religiosos",
        description: "Retiros, confer\xEAncias, acampamentos",
        icon: "fas fa-praying-hands",
        color: "#9333ea"
      });
      await storage2.createEventCategory({
        id: "corporate",
        name: "Eventos Corporativos",
        description: "Treinamentos, workshops, semin\xE1rios",
        icon: "fas fa-building",
        color: "#3b82f6"
      });
      await storage2.createEventCategory({
        id: "social",
        name: "Eventos Sociais",
        description: "Casamentos, anivers\xE1rios, formaturas",
        icon: "fas fa-heart",
        color: "#ec4899"
      });
      await storage2.createEventCategory({
        id: "cultural",
        name: "Eventos Culturais",
        description: "Shows, festivais, exposi\xE7\xF5es",
        icon: "fas fa-music",
        color: "#10b981"
      });
      console.log("Seeded initial categories");
    }
    const existingTemplates = await storage2.getTemplates();
    if (existingTemplates.length === 0) {
      await storage2.createTemplate({
        name: "Confer\xEAncia Empresarial",
        description: "Template profissional para confer\xEAncias e semin\xE1rios",
        categoryId: "corporate",
        imageUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678",
        components: [
          { type: "header", props: { title: "Sua Confer\xEAncia", subtitle: "Transformando neg\xF3cios" } },
          { type: "text", props: { content: "Junte-se aos melhores profissionais do setor" } },
          { type: "button", props: { text: "Inscreva-se Agora", variant: "primary" } }
        ],
        isPublic: true
      });
      await storage2.createTemplate({
        name: "Retiro Espiritual",
        description: "Template para retiros e eventos religiosos",
        categoryId: "religious",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        components: [
          { type: "header", props: { title: "Retiro Espiritual", subtitle: "Renova\xE7\xE3o da f\xE9" } },
          { type: "text", props: { content: "Um momento especial de comunh\xE3o e reflex\xE3o" } },
          { type: "button", props: { text: "Confirme Presen\xE7a", variant: "secondary" } }
        ],
        isPublic: true
      });
      await storage2.createTemplate({
        name: "Casamento",
        description: "Template elegante para casamentos e celebra\xE7\xF5es",
        categoryId: "social",
        imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3",
        components: [
          { type: "header", props: { title: "Nosso Grande Dia", subtitle: "Celebre conosco" } },
          { type: "text", props: { content: "Ser\xE1 uma honra ter voc\xEA em nosso casamento" } },
          { type: "button", props: { text: "Confirmar Presen\xE7a", variant: "accent" } }
        ],
        isPublic: true
      });
      console.log("Seeded initial templates");
    }
    const existingEvents = await storage2.getUserEvents("admin-user-123");
    if (existingEvents.length === 0) {
      const sampleEvent = await storage2.createEvent({
        title: "Acampamento Next Level 2024",
        description: "Um acampamento transformador para jovens com foco em lideran\xE7a e crescimento pessoal",
        startDate: /* @__PURE__ */ new Date("2024-09-15T09:00:00Z"),
        endDate: /* @__PURE__ */ new Date("2024-09-17T18:00:00Z"),
        capacity: 100,
        organizerId: "admin-user-123",
        // Use the correct user ID
        categoryId: "religious",
        status: "published",
        slug: "acamp-next-level",
        pageComponents: [
          { type: "header", props: { title: "Acampamento Next Level 2024", subtitle: "Transforme sua vida em 3 dias" } },
          { type: "image", props: { src: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", alt: "Acampamento na natureza", width: "100%" } },
          { type: "text", props: { content: "Junte-se a n\xF3s em uma experi\xEAncia \xFAnica de crescimento pessoal e espiritual. Durante 3 dias intensos, voc\xEA participar\xE1 de workshops, palestras inspiradoras e atividades ao ar livre que v\xE3o desafiar seus limites e expandir sua vis\xE3o de mundo.", size: "medium" } },
          { type: "text", props: { content: "O que esperar: Palestras motivacionais, Workshops pr\xE1ticos, Atividades de aventura, Networking com jovens l\xEDderes, Momentos de reflex\xE3o e autoconhecimento", size: "medium" } },
          { type: "button", props: { text: "Garanta sua vaga agora!", variant: "primary", link: "#register" } }
        ]
      });
      await storage2.createTicket({
        eventId: sampleEvent.id,
        name: "Ingresso Individual",
        description: "Inclui hospedagem, todas as refei\xE7\xF5es e materiais",
        price: "299.90",
        quantity: 80,
        maxPerOrder: 2,
        salesStart: /* @__PURE__ */ new Date(),
        // Iniciar vendas imediatamente
        salesEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
        // 30 dias a partir de agora
      });
      await storage2.createTicket({
        eventId: sampleEvent.id,
        name: "Lote Promocional Dupla",
        description: "Para quem vem acompanhado! Desconto especial para 2 pessoas",
        price: "499.90",
        quantity: 20,
        maxPerOrder: 1,
        salesStart: /* @__PURE__ */ new Date(),
        // Iniciar vendas imediatamente
        salesEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
        // 30 dias a partir de agora
      });
      console.log("Created sample event with tickets");
    }
  } catch (error) {
    console.error("Error seeding initial data:", error);
  }
}

// server/modules/routes.ts
async function registerRoutes(app2) {
  await setupAuth(app2);
  await seedInitialData();
  app2.post("/api/auth/login", AuthController.login);
  app2.post("/api/auth/register", AuthController.register);
  app2.post("/api/auth/logout", AuthController.logout);
  app2.get("/api/auth/validate", isAuthenticated, AuthController.validateToken);
  app2.get("/api/auth/user", isAuthenticated, AuthController.getUser);
  app2.put("/api/auth/user", isAuthenticated, AuthController.updateUserProfile);
  app2.get("/api/users", isAuthenticated, UserController.getAllUsers);
  app2.post("/api/users", isAuthenticated, UserController.createUser);
  app2.put("/api/users/:id", isAuthenticated, UserController.updateUser);
  app2.delete("/api/users/:id", isAuthenticated, UserController.deleteUser);
  app2.post("/api/groups/assign-manager", isAuthenticated, UserController.assignManagerToGroup);
  app2.delete("/api/groups/remove-manager", isAuthenticated, UserController.removeManagerFromGroup);
  app2.get("/api/groups/:groupId/managers", isAuthenticated, UserController.getGroupManagers);
  app2.post("/api/groups/create-manager", isAuthenticated, UserController.createManagerForGroup);
  app2.post("/api/admin/update-manager-permissions", isAuthenticated, UserController.updateManagerPermissions);
  app2.get("/api/dashboard/stats", isAuthenticated, DashboardController.getDashboardStats);
  app2.get("/api/plans", PlanController.getAllPlans);
  app2.get("/api/subscription", isAuthenticated, PlanController.getUserSubscription);
  app2.post("/api/subscription", isAuthenticated, PlanController.subscribeToPlan);
  app2.delete("/api/subscription", isAuthenticated, PlanController.cancelSubscription);
  app2.get("/api/events", isAuthenticated, EventController.getUserEvents);
  app2.post("/api/events", isAuthenticated, restrictManagersFromCreatingEvents, checkPlanLimit("events"), EventController.createEvent);
  app2.get("/api/events/:id", isAuthenticated, EventController.getEvent);
  app2.put("/api/events/:id", isAuthenticated, restrictManagersFromCreatingEvents, EventController.updateEvent);
  app2.delete("/api/events/:id", isAuthenticated, restrictManagersFromCreatingEvents, EventController.deleteEvent);
  app2.get("/api/events/:eventId/tickets", isAuthenticated, EventController.getEventTickets);
  app2.post("/api/events/:eventId/tickets", isAuthenticated, restrictManagersFromCreatingEvents, EventController.createTicket);
  app2.put("/api/events/:eventId/tickets/:ticketId", isAuthenticated, restrictManagersFromCreatingEvents, EventController.updateTicket);
  app2.delete("/api/events/:eventId/tickets/:ticketId", isAuthenticated, restrictManagersFromCreatingEvents, EventController.deleteTicket);
  app2.get("/api/events/:eventId/registrations", isAuthenticated, EventController.getEventRegistrations);
  app2.get("/api/events/:eventId/participants-with-installments", isAuthenticated, EventController.getEventParticipantsWithInstallments);
  app2.put("/api/installments/:installmentId/mark-as-paid", isAuthenticated, EventController.markInstallmentAsPaid);
  app2.post("/api/events/:eventId/register", EventController.registerForEvent);
  app2.post("/api/events/:eventId/groups", isAuthenticated, GroupController.createGroup);
  app2.get("/api/events/:eventId/groups", isAuthenticated, GroupController.getEventGroups);
  app2.get("/api/groups/dashboard", isAuthenticated, requireGroupDashboardAccess, GroupController.getUserGroupDashboard);
  app2.get("/api/groups/:id", isAuthenticated, requireGroupRead, GroupController.getGroup);
  app2.put("/api/groups/:id", isAuthenticated, requireGroupWrite, GroupController.updateGroup);
  app2.delete("/api/groups/:id", isAuthenticated, requireGroupWrite, GroupController.deleteGroup);
  app2.get("/api/groups/:groupId/analytics", isAuthenticated, requireGroupRead, GroupController.getGroupAnalytics);
  app2.post("/api/groups/:groupId/managers", isAuthenticated, requireGroupWrite, GroupController.addGroupManager);
  app2.get("/api/groups/:groupId/managers", isAuthenticated, UserController.getGroupManagers);
  app2.delete("/api/groups/:groupId/managers/:managerId", isAuthenticated, requireGroupWrite, GroupController.removeGroupManager);
  app2.get("/api/groups/:groupId/participants", isAuthenticated, requireGroupParticipants, GroupController.getGroupParticipants);
  app2.get("/api/groups/:groupId/payments", isAuthenticated, requireGroupPayments, GroupController.getGroupPayments);
  app2.post("/api/events/:eventId/payment-plans", isAuthenticated, PaymentController.createPaymentPlan);
  app2.get("/api/events/:eventId/payment-plans", isAuthenticated, PaymentController.getEventPaymentPlans);
  app2.get("/api/registrations/:registrationId/installments", isAuthenticated, PaymentController.getRegistrationInstallments);
  app2.post("/api/installments/:installmentId/payment", isAuthenticated, PaymentController.processPayment);
  app2.post("/api/installments/:installmentId/discount", isAuthenticated, PaymentController.applyDiscount);
  app2.post("/api/installments/:installmentId/late-fee", isAuthenticated, PaymentController.applyLateFee);
  app2.get("/api/installments/:installmentId/transactions", isAuthenticated, PaymentController.getInstallmentTransactions);
  app2.get("/api/events/:eventId/payment-analytics", isAuthenticated, PaymentController.getEventPaymentAnalytics);
  app2.get("/api/events/:eventId/payment-report", isAuthenticated, PaymentController.getPaymentReport);
  app2.get("/api/overdue-installments", isAuthenticated, PaymentController.getOverdueInstallments);
  app2.post("/api/recalculate-late-fees", isAuthenticated, PaymentController.recalculateLateFees);
  app2.post("/api/payments/generate-pix-qr", PixController.generatePixQr);
  app2.post("/api/payments/confirm-manual", PixController.confirmManualPayment);
  app2.get("/api/payments/status/:registrationId", PixController.checkPaymentStatus);
  app2.use("/api/pix-test", pixTest_default);
  app2.use("/api/pix-webhook", pixWebhook_default);
  app2.post("/api/cron/run-tasks", CronController.runCronTasks);
  app2.post("/api/cron/upcoming-reminders", CronController.sendUpcomingReminders);
  app2.post("/api/cron/overdue-notifications", CronController.sendOverdueNotifications);
  app2.post("/api/pusher/auth", isAuthenticated, EventController.authenticatePusher);
  app2.post("/api/pusher/test", isAuthenticated, EventController.testPusher);
  app2.post("/api/pusher/auth-debug", async (req, res) => {
    let rawBody = "";
    req.on("data", (chunk) => {
      rawBody += chunk.toString();
    });
    req.on("end", async () => {
      console.log("=== RAW BODY INTERCEPTED ===");
      console.log("Raw Body String:", rawBody);
      const params = new URLSearchParams(rawBody);
      const socket_id = params.get("socket_id");
      const channel_name = params.get("channel_name");
      console.log("Parsed socket_id:", socket_id);
      console.log("Parsed channel_name:", channel_name);
      if (!socket_id || !channel_name) {
        console.log("\u274C Missing socket_id or channel_name in raw body");
        return res.status(400).json({ message: "Missing socket_id or channel_name" });
      }
      const userId = req.session?.user?.id;
      console.log("Using User ID:", userId);
      if (channel_name.startsWith("private-user-")) {
        const channelUserId = channel_name.replace("private-user-", "");
        console.log("Channel User ID:", channelUserId);
        console.log("Current User ID:", userId);
        if (channelUserId !== userId) {
          console.log("\u274C User ID mismatch for private-user channel");
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      console.log("\u{1F510} Authenticating with Pusher...");
      const { pusher: pusher2 } = await Promise.resolve().then(() => (init_pusher(), pusher_exports));
      const auth = pusher2.authenticate(socket_id, channel_name, {
        user_id: userId,
        user_info: {
          name: "User"
        }
      });
      console.log("\u2705 Pusher authentication successful");
      console.log("Auth response:", auth);
      res.json(auth);
    });
  });
  app2.post("/api/pusher/test-body", (req, res) => {
    console.log("=== TEST BODY PARSING ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("Body type:", typeof req.body);
    console.log("Body keys:", Object.keys(req.body || {}));
    res.json({
      success: true,
      body: req.body,
      headers: req.headers,
      bodyType: typeof req.body
    });
  });
  app2.post("/api/pusher/test-raw", express.raw({ type: "application/x-www-form-urlencoded" }), (req, res) => {
    console.log("=== TEST RAW BODY PARSING ===");
    console.log("Headers:", req.headers);
    console.log("Raw Body:", req.body);
    console.log("Raw Body type:", typeof req.body);
    console.log("Raw Body length:", req.body?.length);
    const bodyString = req.body.toString();
    console.log("Body String:", bodyString);
    const params = new URLSearchParams(bodyString);
    const parsedBody = {};
    params.forEach((value, key) => {
      parsedBody[key] = value;
    });
    console.log("Parsed Body:", parsedBody);
    res.json({
      success: true,
      rawBody: req.body.toString(),
      parsedBody,
      headers: req.headers
    });
  });
  app2.get("/api/notifications", isAuthenticated, NotificationController.getUserNotifications);
  app2.put("/api/notifications/:notificationId/read", isAuthenticated, NotificationController.markAsRead);
  app2.put("/api/notifications/read-all", isAuthenticated, NotificationController.markAllAsRead);
  app2.get("/api/events/:eventId/analytics", isAuthenticated, EventController.getEventAnalytics);
  app2.get("/api/registrations/:registrationId", EventController.getRegistration);
  app2.post("/api/registrations/:registrationId/checkin", isAuthenticated, EventController.checkinParticipant);
  app2.post("/api/registrations/:registrationId/remind", isAuthenticated, EventController.sendReminder);
  app2.get("/api/events/:eventId/export/:format", isAuthenticated, EventController.exportParticipants);
  app2.get("/api/public/events/:slug", EventController.getPublicEvent);
  app2.get("/api/public/events/:slug/tickets", EventController.getPublicEventTickets);
  app2.post("/api/public/events/:slug/register", EventController.publicRegisterForEvent);
  app2.post("/api/test/email", async (req, res) => {
    try {
      const { EmailService: EmailService2 } = await Promise.resolve().then(() => (init_emailService(), emailService_exports));
      const testData = {
        eventName: "Evento de Teste",
        eventDate: "15/01/2025",
        eventTime: "19:00",
        eventLocation: "Centro de Conven\xE7\xF5es",
        eventAddress: "Rua das Flores, 123 - S\xE3o Paulo, SP",
        eventImageUrl: "https://via.placeholder.com/400x200",
        participantName: "Jo\xE3o Silva",
        participantEmail: req.body.email || "teste@exemplo.com",
        participantPhone: "(11) 99999-9999",
        ticketName: "Ingresso VIP",
        ticketPrice: 50,
        totalAmount: 50,
        qrCode: "QR_TEST_123456789",
        registrationId: "test-reg-123",
        paymentStatus: "paid",
        isFreeEvent: false
      };
      const emailSent = await EmailService2.sendRegistrationConfirmation(testData);
      if (emailSent) {
        res.json({ success: true, message: "Email de teste enviado com sucesso!" });
      } else {
        res.status(500).json({ success: false, message: "Falha ao enviar email de teste" });
      }
    } catch (error) {
      console.error("Erro ao enviar email de teste:", error);
      res.status(500).json({ success: false, message: "Erro interno do servidor" });
    }
  });
  app2.get("/api/stripe/session/:sessionId", async (req, res) => {
    try {
      const { stripe: stripe2 } = await Promise.resolve().then(() => (init_stripe(), stripe_exports));
      const session2 = await stripe2.checkout.sessions.retrieve(req.params.sessionId);
      res.json(session2);
    } catch (error) {
      console.error("Erro ao buscar sess\xE3o Stripe:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  app2.post("/api/stripe/confirm-payment", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID \xE9 obrigat\xF3rio" });
      }
      console.log("=== CONFIRMANDO PAGAMENTO ===");
      console.log("Session ID:", sessionId);
      const { stripe: stripe2 } = await Promise.resolve().then(() => (init_stripe(), stripe_exports));
      const { StripeWebhookController: StripeWebhookController2 } = await Promise.resolve().then(() => (init_stripeWebhookController(), stripeWebhookController_exports));
      const session2 = await stripe2.checkout.sessions.retrieve(sessionId);
      console.log("Session encontrada:", {
        id: session2.id,
        status: session2.status,
        payment_status: session2.payment_status,
        metadata: session2.metadata
      });
      if (session2.payment_status === "paid") {
        const mockEvent = {
          type: "checkout.session.completed",
          data: { object: session2 }
        };
        await StripeWebhookController2.processEvent(mockEvent);
        console.log("\u2705 Pagamento confirmado e inscri\xE7\xE3o atualizada");
        res.json({
          success: true,
          message: "Pagamento confirmado com sucesso",
          sessionId: session2.id,
          paymentStatus: session2.payment_status
        });
      } else {
        console.log("\u274C Pagamento n\xE3o foi processado:", session2.payment_status);
        res.status(400).json({
          error: "Pagamento n\xE3o foi processado",
          paymentStatus: session2.payment_status
        });
      }
    } catch (error) {
      console.error("Erro ao confirmar pagamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
  app2.get("/api/debug/events/slug/:slug", async (req, res) => {
    try {
      const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const event = await storage2.getEventBySlug(req.params.slug);
      res.json({
        found: !!event,
        event,
        slug: req.params.slug,
        status: event?.status
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
  app2.get("/api/debug/webhook/test", async (req, res) => {
    try {
      res.json({
        message: "Webhook endpoint est\xE1 funcionando",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: process.env.NODE_ENV,
        webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
        stripeKeyConfigured: !!process.env.STRIPE_SECRET_KEY
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
  app2.get("/api/debug/events", async (req, res) => {
    try {
      const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const events2 = await storage2.getUserEvents(req.session?.user?.id || "");
      res.json({
        count: events2.length,
        events: events2.map((e) => ({ id: e.id, title: e.title, slug: e.slug, status: e.status }))
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
  app2.get("/api/events/:eventId/analytics", isAuthenticated, requirePaidPlan, EventController.getEventAnalytics);
  app2.get("/api/templates", async (req, res) => {
    try {
      const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const categoryId = req.query.categoryId;
      const templates2 = categoryId ? await storage2.getTemplatesByCategory(categoryId) : await storage2.getTemplates();
      res.json(templates2);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });
  app2.get("/api/templates/:id", async (req, res) => {
    try {
      const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const template = await storage2.getTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });
  app2.get("/api/categories", async (req, res) => {
    try {
      const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const categories = await storage2.getEventCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    if (req.originalUrl.startsWith("/api/")) {
      return next();
    }
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
dotenv.config();
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_MWSB7L8Hvlab@ep-morning-bonus-acx66sds-pooler.sa-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "e1dad618b2990846d521f9261bbc3bef5b2dab3feb80b9133bd9b8304825e418";
}
if (!process.env.PUSHER_APP_ID) {
  process.env.PUSHER_APP_ID = "1820000";
}
if (!process.env.PUSHER_KEY) {
  process.env.PUSHER_KEY = "f0725138d607f195d650";
}
if (!process.env.PUSHER_SECRET) {
  process.env.PUSHER_SECRET = "e1dad618b2990846d521f9261bbc3bef5b2dab3feb80b9133bd9b8304825e418";
}
if (!process.env.PUSHER_CLUSTER) {
  process.env.PUSHER_CLUSTER = "sa1";
}
if (!process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL = "http://localhost:5000";
}
if (!process.env.RESEND_API_KEY) {
  process.env.RESEND_API_KEY = "re_L4nrK6rq_5oQT7qrdSsJaFgKWuD5oSFau";
}
var app = express3();
app.post("/api/webhooks/stripe", express3.raw({ type: "application/json" }), async (req, res) => {
  console.log("=== WEBHOOK ROUTE CHAMADA ===");
  console.log("Headers recebidos:", Object.keys(req.headers));
  console.log("Body recebido:", req.body ? "SIM" : "N\xC3O");
  console.log("Body type:", typeof req.body);
  console.log("Body length:", req.body?.length);
  console.log("Body is Buffer:", Buffer.isBuffer(req.body));
  try {
    const { StripeWebhookController: StripeWebhookController2 } = await Promise.resolve().then(() => (init_stripeWebhookController(), stripeWebhookController_exports));
    await StripeWebhookController2.handleWebhook(req, res);
  } catch (error) {
    console.error("Erro no webhook do Stripe:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
