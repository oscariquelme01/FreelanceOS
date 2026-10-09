"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Select } from "@/components/ui/select";
import { outreachStatusLabels, outreachStatuses, type OutreachStatus } from "@/lib/outreach";

const tones: Record<OutreachStatus, string> = {
  lead: "text-muted-foreground",
  contacted: "text-peach",
  replied: "text-primary",
  interviewing: "text-warning",
  proposal: "text-peach",
  won: "text-success",
  lost: "text-destructive",
  ghosted: "text-muted-foreground",
};

export function OutreachStatusSelect({ company, status, action }: { company: string; status: OutreachStatus; action: (status: string) => Promise<void> }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();
  return <Select value={value} disabled={pending} className={`min-w-28 border-transparent bg-transparent font-medium ${tones[value]}`} aria-label={`Status for ${company}`} options={outreachStatuses.map((option) => ({ value: option, label: outreachStatusLabels[option] }))} onValueChange={(selected) => {
    const previous = value;
    const next = selected as OutreachStatus;
    setValue(next);
    startTransition(async () => {
      try {
        await action(next);
        toast.success(`${company} marked ${outreachStatusLabels[next].toLowerCase()}`);
        router.refresh();
      } catch {
        setValue(previous);
        toast.error("Could not update opportunity status");
      }
    });
  }} />;
}
