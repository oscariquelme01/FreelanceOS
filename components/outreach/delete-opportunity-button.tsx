"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteOpportunity } from "@/app/(workspace)/outreach/actions";
import { Button } from "@/components/ui/button";

export function DeleteOpportunityButton({ id, company, role }: { id: string; company: string; role: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <Button type="button" variant="ghost" size="icon" disabled={pending} aria-label={`Delete ${role} at ${company}`} onClick={() => {
    if (!window.confirm(`Delete the ${role} opportunity at ${company}?`)) return;
    startTransition(async () => {
      try {
        const result = await deleteOpportunity(id);
        toast.success(result.message);
        router.refresh();
      } catch {
        toast.error("Could not delete opportunity");
      }
    });
  }}><Trash2 /></Button>;
}
