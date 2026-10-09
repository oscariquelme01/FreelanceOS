CREATE TYPE "public"."outreach_status" AS ENUM('lead', 'contacted', 'replied', 'interviewing', 'proposal', 'won', 'lost', 'ghosted');--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"status" "outreach_status" DEFAULT 'lead' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"contact_name" text DEFAULT '' NOT NULL,
	"contact_email" text DEFAULT '' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"contacted_date" date,
	"follow_up_date" date,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "opportunities_company_idx" ON "opportunities" USING btree ("company");--> statement-breakpoint
CREATE INDEX "opportunities_status_idx" ON "opportunities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "opportunities_follow_up_idx" ON "opportunities" USING btree ("follow_up_date");--> statement-breakpoint
CREATE INDEX "opportunities_updated_at_idx" ON "opportunities" USING btree ("updated_at");