"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

const labels = {
  sent: "Sent",
  paid: "Paid",
  rejected: "Rejected",
} as const;

export function InvoiceStatusSelect({
  number,
  status,
  action,
}: {
  number: string;
  status: keyof typeof labels;
  action: (status: string) => Promise<void>;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();
  const tones = { sent: "text-peach", paid: "text-success", rejected: "text-destructive" };

  return (
    <select
      value={value}
      disabled={pending}
      className={cn("min-w-24 font-medium", tones[value])}
      onChange={(event) => {
        const previous = value;
        const next = event.target.value as keyof typeof labels;
        setValue(next);
        startTransition(async () => {
          try {
            await action(next);
            toast.success(`${number} marked ${labels[next].toLowerCase()}`);
            router.refresh();
          } catch {
            setValue(previous);
            toast.error("Could not update invoice status");
          }
        });
      }}
      aria-label={`Status for ${number}`}
    >
      {Object.entries(labels).map(([option, label]) => (
        <option value={option} key={option}>{label}</option>
      ))}
    </select>
  );
}
