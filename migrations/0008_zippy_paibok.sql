ALTER TABLE "events" ADD COLUMN "pix_key_type" varchar(20) DEFAULT 'cpf';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "pix_key" varchar(255);