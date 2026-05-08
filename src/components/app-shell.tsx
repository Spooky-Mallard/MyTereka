"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Search, LayoutDashboard, ArrowLeftRight, Plus, Target, User, PieChart } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";

const mobileNavItems = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Analytics", url: "/analytics", icon: PieChart },
  { title: "Add", url: "#", icon: Plus, fab: true },
  { title: "Budgets", url: "/budgets", icon: Target },
  { title: "Profile", url: "/profile", icon: User },
];

function MobileBottomNav() {
  const pathname = usePathname();
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);

  return (
    <nav className="bottom-nav md:hidden">
      {mobileNavItems.map((item) =>
        item.fab ? (
          <button key={item.title} className="bottom-nav-item fab" aria-label="Add transaction">
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
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full" style={{ background: "var(--background)" }}>
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          {/* ── Top header ── */}
          <header
            className="sticky top-0 z-30 flex h-16 items-center gap-3 px-4 md:px-6"
            style={{
              background: "var(--card)",
              borderBottom: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <SidebarTrigger className="hidden md:flex" />

            {/* Search (desktop) */}
            <div className="relative hidden max-w-sm flex-1 md:block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                size={16}
                style={{ color: "var(--muted-foreground)" }}
              />
              <input
                placeholder="Search transactions, budgets…"
                className="finwise-input h-10 rounded-full pl-9 text-sm"
                style={{ height: 40 }}
              />
            </div>

            {/* Mobile logo */}
            <Link href="/" className="flex items-center gap-2 md:hidden">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "var(--primary)" }}
              >
                <img src="/logo.svg" alt="FinWise" className="h-5 w-5" />
              </div>
              <span className="text-base font-bold" style={{ color: "var(--foreground)" }}>FinWise</span>
            </Link>

            <div className="ml-auto flex items-center gap-3">
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
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  AM
                </div>
                <div className="hidden leading-tight md:block">
                  <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Alex Morgan</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Premium plan</div>
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

      <MobileBottomNav />
      <Toaster position="top-right" />
    </SidebarProvider>
  );
}
