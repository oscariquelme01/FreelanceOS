import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "sent",
  "paid",
  "rejected",
]);
export const currencyEnum = pgEnum("currency", ["EUR", "USD"]);
export const invoiceLanguageEnum = pgEnum("invoice_language", ["es", "en"]);

export type BillingSnapshot = {
  legalName: string;
  taxId: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  email: string;
  phone: string;
  iban: string;
  bic: string;
  paymentInstructions: string;
  signaturePath: string | null;
};

export type ClientSnapshot = {
  name: string;
  taxId: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
};

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const billingProfiles = pgTable("billing_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  legalName: text("legal_name").notNull(),
  taxId: text("tax_id").notNull(),
  address: text("address").notNull().default(""),
  postalCode: text("postal_code").notNull().default(""),
  city: text("city").notNull().default(""),
  province: text("province").notNull().default(""),
  country: text("country").notNull().default("España"),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  iban: text("iban").notNull().default(""),
  bic: text("bic").notNull().default(""),
  paymentInstructions: text("payment_instructions").notNull().default(""),
  signaturePath: text("signature_path"),
  ...timestamps,
});

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    taxId: text("tax_id").notNull().default(""),
    email: text("email").notNull().default(""),
    address: text("address").notNull().default(""),
    postalCode: text("postal_code").notNull().default(""),
    city: text("city").notNull().default(""),
    province: text("province").notNull().default(""),
    country: text("country").notNull().default(""),
    defaultDescription: text("default_description").notNull().default(""),
    currency: currencyEnum("currency").notNull().default("EUR"),
    language: invoiceLanguageEnum("language").notNull().default("es"),
    vatEnabled: boolean("vat_enabled").notNull().default(true),
    vatRate: integer("vat_rate").notNull().default(2100),
    withholdingEnabled: boolean("withholding_enabled").notNull().default(true),
    withholdingRate: integer("withholding_rate").notNull().default(1500),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [index("clients_name_idx").on(table.name)],
);

export const invoiceSequences = pgTable("invoice_sequences", {
  year: integer("year").primaryKey(),
  nextValue: integer("next_value").notNull().default(1),
});

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    number: text("number").notNull(),
    sequenceYear: integer("sequence_year").notNull(),
    sequenceNumber: integer("sequence_number").notNull(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    status: invoiceStatusEnum("status").notNull().default("sent"),
    issueDate: date("issue_date").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    currency: currencyEnum("currency").notNull(),
    language: invoiceLanguageEnum("language").notNull(),
    vatEnabled: boolean("vat_enabled").notNull(),
    vatRate: integer("vat_rate").notNull(),
    withholdingEnabled: boolean("withholding_enabled").notNull(),
    withholdingRate: integer("withholding_rate").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    vatCents: integer("vat_cents").notNull(),
    withholdingCents: integer("withholding_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    paymentTerms: text("payment_terms").notNull().default("Payable within 30 days."),
    issuerSnapshot: jsonb("issuer_snapshot").$type<BillingSnapshot>().notNull(),
    clientSnapshot: jsonb("client_snapshot").$type<ClientSnapshot>().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("invoices_number_idx").on(table.number),
    uniqueIndex("invoices_sequence_idx").on(table.sequenceYear, table.sequenceNumber),
    index("invoices_client_idx").on(table.clientId),
    index("invoices_issue_date_idx").on(table.issueDate),
  ],
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    amountCents: integer("amount_cents").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [index("invoice_items_invoice_idx").on(table.invoiceId)],
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expenseDate: date("expense_date").notNull(),
    title: text("supplier").notNull(),
    totalCents: integer("total_cents").notNull(),
    taxableBaseCents: integer("taxable_base_cents"),
    vatCents: integer("vat_cents"),
    originalFilename: text("original_filename").notNull(),
    storagePath: text("storage_path").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    ...timestamps,
  },
  (table) => [index("expenses_date_idx").on(table.expenseDate)],
);
