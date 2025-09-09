CREATE TABLE "event_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"capacity" integer,
	"current_count" integer DEFAULT 0,
	"color" varchar(7) DEFAULT '#3b82f6',
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_payment_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"installment_count" integer NOT NULL,
	"installment_interval" varchar(20) DEFAULT 'monthly',
	"first_installment_date" timestamp,
	"last_installment_date" timestamp,
	"discount_policy" jsonb DEFAULT '{}',
	"late_fee_policy" jsonb DEFAULT '{}',
	"is_default" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_managers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar(20) DEFAULT 'manager',
	"permissions" jsonb DEFAULT '{}',
	"assigned_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_permissions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_installments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" varchar NOT NULL,
	"plan_id" varchar NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" timestamp NOT NULL,
	"paid_date" timestamp,
	"original_amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0',
	"remaining_amount" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"late_fee_amount" numeric(10, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'pending',
	"notes" text,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installment_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" varchar(20) NOT NULL,
	"payment_method" varchar(50),
	"transaction_id" varchar(255),
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "group_id" varchar;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "payment_plan_id" varchar;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "total_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "remaining_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "event_groups" ADD CONSTRAINT "event_groups_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_payment_plans" ADD CONSTRAINT "event_payment_plans_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_managers" ADD CONSTRAINT "group_managers_group_id_event_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."event_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_managers" ADD CONSTRAINT "group_managers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_installments" ADD CONSTRAINT "payment_installments_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_installments" ADD CONSTRAINT "payment_installments_plan_id_event_payment_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."event_payment_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_installments" ADD CONSTRAINT "payment_installments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_installment_id_payment_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."payment_installments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_group_id_event_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."event_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_payment_plan_id_event_payment_plans_id_fk" FOREIGN KEY ("payment_plan_id") REFERENCES "public"."event_payment_plans"("id") ON DELETE no action ON UPDATE no action;