"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Transactions", url: "/transactions", icon: ArrowLeftRight },
  { title: "Analytics", url: "/analytics", icon: PieChart },
  { title: "Budgets", url: "/budgets", icon: Target },
  { title: "Goals", url: "/goals", icon: PieChart },
];

export function AppSidebar() {
  const pathname = usePathname();
  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      {/* ── Logo ── */}
      <SidebarHeader className="px-4 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--gradient-primary)" }}
          >
            <img src="/logo.svg" alt="FinWise logo" className="h-6 w-6 object-contain" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span
              className="text-lg font-bold tracking-tight"
              style={{ color: "var(--sidebar-foreground)" }}
            >
              FinWise
            </span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Personal finance
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel
            className="mb-1 px-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-10 rounded-xl font-medium transition-all"
                      style={
                        active
                          ? { background: "var(--accent)", color: "var(--primary)" }
                          : { color: "var(--sidebar-foreground)" }
                      }
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3">
                        <item.icon
                          size={18}
                          strokeWidth={active ? 2.5 : 2}
                          style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="px-2 pb-4">
        <div className="mb-3 h-px w-full" style={{ background: "var(--sidebar-border)" }} />
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Profile"
              className="h-10 rounded-xl font-medium transition-all"
              style={{ color: "var(--sidebar-foreground)" }}
            >
              <User size={18} style={{ color: "var(--muted-foreground)" }} />
              <span>Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              className="h-10 rounded-xl font-medium transition-all"
              style={{ color: "var(--sidebar-foreground)" }}
            >
              <Settings size={18} style={{ color: "var(--muted-foreground)" }} />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Log out"
              className="h-10 rounded-xl font-medium transition-all"
              style={{ color: "var(--danger)" }}
            >
              <LogOut size={18} style={{ color: "var(--danger)" }} />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User chip */}
        <div
          className="mt-3 flex items-center gap-2.5 rounded-xl p-3 group-data-[collapsible=icon]:hidden"
          style={{ background: "var(--surface-alt)" }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: "var(--gradient-primary)" }}
          >
            AM
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-semibold" style={{ color: "var(--sidebar-foreground)" }}>
              Alex Morgan
            </div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Premium</div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
