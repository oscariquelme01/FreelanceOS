"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesCombined, FileText, Menu, Send, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/outreach", label: "Outreach", icon: Send },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-14 items-center gap-2 border-b px-3">
        <div className="grid size-7 place-items-center rounded-sm bg-primary text-xs font-bold text-primary-foreground">
          F
        </div>
        <span className="text-sm font-semibold tracking-tight">FreelanceOS</span>
      </div>

      <nav className="flex-1 space-y-1 p-2" aria-label="Primary navigation">
        {navigation.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-8 items-center gap-2 rounded-sm px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                active && "bg-muted text-foreground",
              )}
            >
              <Icon className={cn("size-3.5", active && "text-primary")} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-3 py-2 text-[10px] text-muted-foreground">
        Personal freelance operations · v0.1
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-52 border-r md:block">
        <Sidebar />
      </aside>

      <div className="flex h-12 items-center justify-between border-b bg-surface px-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="grid size-6 place-items-center rounded-sm bg-primary text-[10px] font-bold text-primary-foreground">
            F
          </div>
          <span className="text-sm font-semibold">FreelanceOS</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <Menu aria-hidden="true" />
        </Button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            className="absolute inset-0 bg-black/65"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-64 border-r shadow-2xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            >
              <X aria-hidden="true" />
            </Button>
          </aside>
        </div>
      )}

      <main className="min-h-[calc(100dvh-3rem)] overflow-x-auto md:ml-52 md:min-h-dvh">
        {children}
      </main>
    </div>
  );
}
