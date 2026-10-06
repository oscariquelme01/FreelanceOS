ALTER TABLE "invoices" ALTER COLUMN "payment_terms" SET DEFAULT 'Payable within 30 days.';--> statement-breakpoint
UPDATE "invoices" SET "payment_terms" = 'Payable within 30 days.' WHERE btrim("payment_terms") = '';--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "notes";
