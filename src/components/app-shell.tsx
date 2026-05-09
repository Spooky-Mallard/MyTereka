"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, House, BarChart2, Plus, Target, User } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AddTransactionSheet } from "@/components/add-transaction-sheet";
import { mockUser } from "@/lib/mock-data";

const mobileNavItems = [
  { title: "Home",      url: "/",           icon: House },
  { title: "Analytics", url: "/analytics",  icon: BarChart2 },
  { title: "Add",       url: "#",           icon: Plus,    fab: true },
  { title: "Goals",     url: "/goals",      icon: Target },
  { title: "Profile",   url: "/profile",    icon: User },
];

function MobileBottomNav({ onAdd }: { onAdd: () => void }) {
  const pathname = usePathname();
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);

  return (
    <nav className="bottom-nav md:hidden" aria-label="Bottom navigation">
      {mobileNavItems.map((item) =>
        item.fab ? (
          <button
            key={item.title}
            className="bottom-nav-item fab"
            aria-label="Add transaction"
            onClick={onAdd}
          >
            <item.icon size={22} strokeWidth={2.5} />
          </button>
        ) : (
          <Link
            key={item.title}
            href={item.url}
            className={`bottom-nav-item ${isActive(item.url) ? "active" : ""}`}
          >
            <item.icon size={20} />
            <span>{item.title}</span>
          </Link>
        ),
      )}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full" style={{ background: "var(--background)" }}>
        <AppSidebar onAdd={() => setAddOpen(true)} />

        <div className="flex flex-1 flex-col min-w-0">
          {/* ── Top header ── */}
          <header
            className="sticky top-0 z-30 flex h-16 items-center gap-3 px-4 md:px-6"
            style={{
              background: "var(--sidebar)",
              borderBottom: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <SidebarTrigger className="hidden md:flex" style={{ color: "var(--foreground)" }} />

            {/* Mobile: logo + name */}
            <Link href="/" className="flex items-center gap-2 md:hidden">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden"
                style={{ background: "var(--primary)" }}
              >
                <img src="/logo.svg" alt="MyTereka" className="h-6 w-6 object-contain" />
              </div>
              <span
                className="text-base font-bold"
                style={{ color: "var(--foreground)", fontFamily: "Poppins, sans-serif" }}
              >
                MyTereka
              </span>
            </Link>

            <div className="ml-auto flex items-center gap-3">
              {/* Notification bell */}
              <button
                className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-80"
                style={{ background: "var(--surface-alt)", color: "var(--foreground)" }}
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                  style={{ background: "var(--danger)" }}
                />
              </button>

              {/* Avatar + name (desktop) */}
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {mockUser.initials}
                </div>
                <div className="hidden leading-tight md:block">
                  <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {mockUser.name}
                  </div>
                  <span className="level-badge text-[10px]">{mockUser.level}</span>
                </div>
              </div>
            </div>
          </header>

          {/* ── Page content ── */}
          <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
            {children}
          </main>
        </div>
      </div>

      <MobileBottomNav onAdd={() => setAddOpen(true)} />
      <AddTransactionSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  );
}
