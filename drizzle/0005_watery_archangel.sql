UPDATE "expenses" SET "supplier" = "notes" WHERE btrim("notes") <> '';--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "invoice_number";--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "notes";
