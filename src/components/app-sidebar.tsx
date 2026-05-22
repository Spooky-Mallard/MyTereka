'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import {
  House, ArrowLeftRight, BarChart2, Wallet,
  Target, User, LogOut, Plus, Flame, Trophy, Users,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar'

const moneyNav = [
  { title: 'Home',         url: '/',             icon: House },
  { title: 'Transactions', url: '/transactions', icon: ArrowLeftRight },
  { title: 'Analytics',    url: '/analytics',    icon: BarChart2 },
  { title: 'Budgets',      url: '/budgets',      icon: Wallet },
]

const questNav = [
  { title: 'Goals',        url: '/goals',        icon: Target },
  { title: 'Streak',       url: '/streak',       icon: Flame },
  { title: 'Badges',       url: '/profile',      icon: Trophy },
  { title: 'Shared Goals', url: '/goals',        icon: Users  },
]

export function AppSidebar({ onAdd }: { onAdd?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  const name     = session?.user?.name ?? 'User'
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  function NavItem({ item }: { item: { title: string; url: string; icon: React.ElementType } }) {
    const active = isActive(item.url)
    return (
      <SidebarMenuItem>
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
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: active ? 700 : 500 }}>
              {item.title}
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

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
        {/* Add transaction CTA */}
        <div className="px-1 pb-3 group-data-[collapsible=icon]:hidden">
          <button
            onClick={onAdd}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-fab)' }}
          >
            <Plus size={15} strokeWidth={2.6} />
            Add transaction
          </button>
        </div>

        {/* Money group */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Money
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {moneyNav.map((item) => <NavItem key={item.title} item={item} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quests group */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Quests
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {questNav.map((item) => <NavItem key={item.title} item={item} />)}
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
                <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 500 }}>Profile</span>
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
              <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 500 }}>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User chip with initials avatar */}
        <div
          className="mt-3 flex items-center gap-2.5 rounded-xl p-3 group-data-[collapsible=icon]:hidden"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: 'var(--gradient-primary)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="truncate text-sm font-bold"
              style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}
            >
              {name}
            </div>
            <div className="text-xs" style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
              Saver
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
