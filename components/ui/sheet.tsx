"use client";

import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

export function Sheet({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode }) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onOpenChange(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [open, onOpenChange]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <button className="sheet-overlay absolute inset-0 bg-black/70 backdrop-blur-[1px]" aria-label="Close panel" onClick={() => onOpenChange(false)} />
      <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="sheet-panel absolute inset-y-0 right-0 flex w-full flex-col border-l bg-background shadow-2xl md:w-1/2">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-surface px-5">
          <div><h2 id={titleId} className="text-sm font-semibold">{title}</h2>{description && <p className="text-xs text-muted-foreground">{description}</p>}</div>
          <Button variant="ghost" size="icon" aria-label="Close panel" onClick={() => onOpenChange(false)}><X /></Button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 lg:p-6">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
