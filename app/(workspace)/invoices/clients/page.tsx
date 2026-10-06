import { redirect } from "next/navigation";

export default function LegacyClientsPage() {
  redirect("/invoices#clients");
}
