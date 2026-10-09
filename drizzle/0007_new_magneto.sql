CREATE TABLE "opportunity_status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"from_status" "outreach_status",
	"to_status" "outreach_status" NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "opportunity_status_events" ADD CONSTRAINT "opportunity_status_events_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "opportunity_status_events_opportunity_idx" ON "opportunity_status_events" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "opportunity_status_events_changed_at_idx" ON "opportunity_status_events" USING btree ("changed_at");--> statement-breakpoint
INSERT INTO "opportunity_status_events" ("opportunity_id", "from_status", "to_status", "changed_at")
SELECT "id", NULL, "status", "updated_at" FROM "opportunities";
