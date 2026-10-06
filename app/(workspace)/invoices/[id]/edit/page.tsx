import { redirect } from "next/navigation";

export default function LegacyEditInvoicePage() {
  redirect("/invoices");
}
