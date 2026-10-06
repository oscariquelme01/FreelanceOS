"use client";

import { useRouter } from "next/navigation";
import { useTransition, type FormEvent } from "react";
import { toast } from "sonner";

type ActionResult = { success: boolean; message: string };

export function useSheetAction(action: (formData: FormData) => Promise<ActionResult>, onComplete: () => void) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await action(formData);
        toast.success(result.message);
        onComplete();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save changes");
      }
    });
  }
  return { pending, onSubmit };
}
