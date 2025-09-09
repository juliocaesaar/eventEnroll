CREATE TABLE "notification_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"email_enabled" boolean DEFAULT true,
	"email_types" jsonb DEFAULT '["info", "success", "warning", "error", "payment", "registration", "event"]',
	"push_enabled" boolean DEFAULT true,
	"push_types" jsonb DEFAULT '["info", "success", "warning", "error", "payment", "registration", "event"]',
	"sms_enabled" boolean DEFAULT false,
	"sms_types" jsonb DEFAULT '["urgent", "payment"]',
	"whatsapp_enabled" boolean DEFAULT true,
	"whatsapp_types" jsonb DEFAULT '["payment", "registration", "event"]',
	"quiet_hours_start" varchar(5) DEFAULT '22:00',
	"quiet_hours_end" varchar(5) DEFAULT '08:00',
	"timezone" varchar(50) DEFAULT 'America/Sao_Paulo',
	"digest_enabled" boolean DEFAULT true,
	"digest_frequency" varchar(20) DEFAULT 'daily',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"priority" varchar(20) DEFAULT 'normal',
	"is_read" boolean DEFAULT false,
	"is_archived" boolean DEFAULT false,
	"event_id" varchar,
	"group_id" varchar,
	"registration_id" varchar,
	"installment_id" varchar,
	"metadata" jsonb,
	"action_url" varchar,
	"action_text" varchar,
	"created_at" timestamp DEFAULT now(),
	"read_at" timestamp,
	"expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_group_id_event_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."event_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_installment_id_payment_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."payment_installments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_notification_preferences_user_id" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_notifications_type" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "IDX_notifications_is_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "IDX_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_notifications_event_id" ON "notifications" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "IDX_notifications_group_id" ON "notifications" USING btree ("group_id");