"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ConfirmSubmit({ message, label = "Delete" }: { message: string; label?: string }) {
  return <Button type="submit" variant="ghost" size="sm" aria-label={label || "Delete"} onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}><Trash2 /> {label}</Button>;
}
