'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import {
  House, ArrowLeftRight, BarChart2, PiggyBank,
  Target, User, LogOut, Plus,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar'

const navItems = [
  { title: 'Home',         url: '/',             icon: House },
  { title: 'Transactions', url: '/transactions', icon: ArrowLeftRight },
  { title: 'Analytics',    url: '/analytics',    icon: BarChart2 },
  { title: 'Budgets',      url: '/budgets',      icon: PiggyBank },
  { title: 'Goals',        url: '/goals',        icon: Target },
]

export function AppSidebar({ onAdd }: { onAdd?: () => void }) {
  const pathname   = usePathname()
  const { data: session } = useSession()
  const isActive   = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  const name     = session?.user?.name ?? 'User'
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <Sidebar collapsible="icon" style={{ background: 'var(--sidebar)' }}>
      {/* Logo */}
      <SidebarHeader className="px-4 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden"
            style={{ background: 'var(--primary)' }}
          >
            <img src="/logo.svg" alt="MyTereka" className="h-6 w-6 object-contain" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span
              className="text-lg font-bold tracking-tight"
              style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}
            >
              MyTereka
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Personal finance
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel
            className="mb-1 px-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => {
                const active = isActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-10 rounded-xl font-medium transition-all"
                      style={
                        active
                          ? { background: 'rgba(0,184,148,0.15)', color: 'var(--primary)' }
                          : { color: 'var(--sidebar-foreground)' }
                      }
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3">
                        <item.icon
                          size={18}
                          strokeWidth={active ? 2.5 : 2}
                          style={{ color: active ? 'var(--primary)' : 'var(--muted-foreground)' }}
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

              {/* Add transaction */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Add Transaction"
                  className="h-10 rounded-xl font-medium transition-all mt-2"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                  onClick={onAdd}
                >
                  <Plus size={18} strokeWidth={2.5} />
                  <span>Add Transaction</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-2 pb-4">
        <div className="mb-2 h-px w-full" style={{ background: 'var(--sidebar-border)' }} />
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Profile"
              className="h-10 rounded-xl font-medium transition-all"
              isActive={pathname.startsWith('/profile')}
              style={
                pathname.startsWith('/profile')
                  ? { background: 'rgba(0,184,148,0.15)', color: 'var(--primary)' }
                  : { color: 'var(--sidebar-foreground)' }
              }
            >
              <Link href="/profile" className="flex items-center gap-3 px-3">
                <User
                  size={18}
                  style={{ color: pathname.startsWith('/profile') ? 'var(--primary)' : 'var(--muted-foreground)' }}
                />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Log out"
              className="h-10 rounded-xl font-medium transition-all"
              style={{ color: 'var(--danger)' }}
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
            >
              <LogOut size={18} style={{ color: 'var(--danger)' }} />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User chip */}
        <div
          className="mt-3 flex items-center gap-2.5 rounded-xl p-3 group-data-[collapsible=icon]:hidden"
          style={{ background: 'var(--surface-alt)' }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: 'var(--gradient-primary)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-semibold" style={{ color: 'var(--sidebar-foreground)' }}>
              {name}
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
