"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

export function Select({
  name,
  value,
  defaultValue = "",
  options,
  onValueChange,
  placeholder = "Select…",
  disabled,
  required,
  className,
  "aria-label": ariaLabel,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const listboxId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 180 });
  const selectedValue = value ?? internalValue;
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selectedValue));
  const selected = options.find((option) => option.value === selectedValue);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!buttonRef.current?.contains(event.target as Node) && !listRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const reposition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuHeight = Math.min(options.length * 34 + 8, 252);
      const top = rect.bottom + 4 + menuHeight > window.innerHeight ? Math.max(8, rect.top - menuHeight - 4) : rect.bottom + 4;
      setPosition({ left: rect.left, top, width: Math.max(rect.width, 180) });
    };
    reposition();
    document.addEventListener("pointerdown", close);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, options.length]);

  function choose(next: string) {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function toggle() {
    if (disabled) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ left: rect.left, top: rect.bottom + 4, width: Math.max(rect.width, 180) });
    setActiveIndex(selectedIndex);
    setOpen((current) => !current);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "Escape") { setOpen(false); return; }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(options[activeIndex]?.value ?? selectedValue);
      else toggle();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) { setActiveIndex(selectedIndex); setOpen(true); return; }
      setActiveIndex((current) => event.key === "ArrowDown" ? Math.min(options.length - 1, current + 1) : Math.max(0, current - 1));
      return;
    }
    if (event.key === "Home" && open) { event.preventDefault(); setActiveIndex(0); }
    if (event.key === "End" && open) { event.preventDefault(); setActiveIndex(options.length - 1); }
  }

  return <>
    {name && <input type="hidden" name={name} value={selectedValue} required={required} />}
    <button ref={buttonRef} type="button" disabled={disabled} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listboxId : undefined} className={cn("flex h-8 w-full items-center justify-between gap-2 rounded-sm border bg-background px-2 text-left text-xs text-foreground transition-colors hover:border-peach/50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-45", className)} onClick={toggle} onKeyDown={onKeyDown}>
      <span className={cn("truncate", !selected && "text-muted-foreground")}>{selected?.label ?? placeholder}</span><ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180 text-peach")} />
    </button>
    {open && createPortal(<div ref={listRef} id={listboxId} role="listbox" aria-label={ariaLabel} style={{ left: position.left, top: position.top, width: position.width }} className="fixed z-[70] max-h-64 overflow-y-auto rounded-md border bg-surface p-1 shadow-2xl">
      {options.map((option, index) => <button key={option.value} type="button" role="option" aria-selected={option.value === selectedValue} className={cn("flex h-8 w-full items-center justify-between rounded-sm px-2 text-left text-xs text-foreground outline-none transition-colors hover:bg-muted focus:bg-muted", index === activeIndex && "bg-muted", option.value === selectedValue && "text-peach")} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(option.value)}><span className="truncate">{option.label}</span>{option.value === selectedValue && <Check className="size-3.5 shrink-0" />}</button>)}
    </div>, document.body)}
  </>;
}
