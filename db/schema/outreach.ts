import { date, index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const outreachStatusEnum = pgEnum("outreach_status", [
  "lead",
  "contacted",
  "replied",
  "interviewing",
  "proposal",
  "won",
  "lost",
  "ghosted",
]);

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    company: text("company").notNull(),
    role: text("role").notNull(),
    status: outreachStatusEnum("status").notNull().default("lead"),
    source: text("source").notNull().default(""),
    contactName: text("contact_name").notNull().default(""),
    contactEmail: text("contact_email").notNull().default(""),
    url: text("url").notNull().default(""),
    contactedDate: date("contacted_date"),
    followUpDate: date("follow_up_date"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("opportunities_company_idx").on(table.company),
    index("opportunities_status_idx").on(table.status),
    index("opportunities_follow_up_idx").on(table.followUpDate),
    index("opportunities_updated_at_idx").on(table.updatedAt),
  ],
);

export const opportunityStatusEvents = pgTable(
  "opportunity_status_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    fromStatus: outreachStatusEnum("from_status"),
    toStatus: outreachStatusEnum("to_status").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("opportunity_status_events_opportunity_idx").on(table.opportunityId),
    index("opportunity_status_events_changed_at_idx").on(table.changedAt),
  ],
);
