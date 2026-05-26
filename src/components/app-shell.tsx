'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, House, BarChart2, Plus, Target, User, Wallet, LogOut, ChevronDown, UserPlus, UserCheck, Trophy, Users as UsersIcon, Sparkles, ArrowLeftRight, Flame, Menu, X as XIcon } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from '@/components/ui/sonner'
import { AddTransactionSheet } from '@/components/add-transaction-sheet'
import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead } from '@/lib/actions/notifications'
import type { NotificationRow } from '@/lib/types/notifications'
import { RightRailProvider, useRightRail } from '@/components/right-rail-context'
import { UserAvatar } from '@/components/user-avatar'

const mobileNavItems = [
  { title: 'Home',      url: '/',                       icon: House },
  { title: 'Analytics', url: '/analytics',              icon: BarChart2 },
  { title: 'Add',       url: '#',                       icon: Plus,   fab: true },
  { title: 'Goals',     url: '/goals',                  icon: Target },
  { title: 'Accounts',  url: '/profile?tab=accounts',   icon: Wallet },
]

const drawerNavGroups = [
  {
    label: 'Money',
    items: [
      { title: 'Home',         url: '/',             icon: House },
      { title: 'Transactions', url: '/transactions', icon: ArrowLeftRight },
      { title: 'Analytics',    url: '/analytics',    icon: BarChart2 },
      { title: 'Budgets',      url: '/budgets',      icon: Wallet },
    ],
  },
  {
    label: 'Quests',
    items: [
      { title: 'Goals',        url: '/goals',                   icon: Target },
      { title: 'Streak',       url: '/streak',                  icon: Flame },
      { title: 'Badges',       url: '/profile?tab=badges',      icon: Trophy },
      { title: 'Shared Goals', url: '/goals?section=shared',    icon: UsersIcon },
    ],
  },
  {
    label: 'Account',
    items: [
      { title: 'Profile',  url: '/profile', icon: User },
    ],
  },
]

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname  = usePathname()
  const router    = useRouter()

  function isActive(url: string) {
    const [urlPath, urlQuery] = url.split('?')
    if (urlPath === '/') return pathname === '/'
    if (!pathname.startsWith(urlPath)) return false
    if (!urlQuery) return true
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const expected = new URLSearchParams(urlQuery)
    for (const [k, v] of expected.entries()) {
      if (searchParams.get(k) !== v) return false
    }
    return true
  }

  function navigate(url: string) {
    onClose()
    router.push(url)
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={onClose}
        />
      )}
      {/* Drawer panel */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col md:hidden transition-transform duration-300"
        style={{
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--sidebar-border)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden" style={{ background: 'var(--primary)' }}>
              <img src="/logo.svg" alt="MyTereka" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-base font-bold" style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>MyTereka</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted-foreground)' }}>
            <XIcon size={20} />
          </button>
        </div>

        {/* Nav groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
          {drawerNavGroups.map((group) => (
            <div key={group.label}>
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                {group.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.url)
                  return (
                    <button
                      key={item.title}
                      onClick={() => navigate(item.url)}
                      className="flex items-center gap-3 rounded-xl px-3 h-11 w-full text-left transition"
                      style={active
                        ? { background: 'rgba(0,184,148,0.15)', color: 'var(--primary)' }
                        : { color: 'var(--sidebar-foreground)' }
                      }
                    >
                      <item.icon size={18} strokeWidth={active ? 2.5 : 2}
                        style={{ color: active ? 'var(--primary)' : 'var(--muted-foreground)', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: active ? 700 : 500 }}>
                        {item.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer — log out */}
        <div className="px-3 pb-6" style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: 12 }}>
          <button
            onClick={() => { onClose(); signOut({ callbackUrl: '/auth/login' }) }}
            className="flex items-center gap-3 rounded-xl px-3 h-11 w-full transition hover:opacity-80"
            style={{ color: 'var(--danger)' }}
          >
            <LogOut size={18} />
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 500 }}>Log out</span>
          </button>
        </div>
      </div>
    </>
  )
}

function MobileBottomNav({ onAdd }: { onAdd: () => void }) {
  const pathname    = usePathname()

  function isActive(url: string) {
    const [urlPath, urlQuery] = url.split('?')
    if (urlPath === '/') return pathname === '/'
    if (!pathname.startsWith(urlPath)) return false
    if (!urlQuery) return true
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const expected = new URLSearchParams(urlQuery)
    for (const [k, v] of expected.entries()) {
      if (searchParams.get(k) !== v) return false
    }
    return true
  }

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
            className={`bottom-nav-item ${isActive(item.url) ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.title}</span>
          </Link>
        ),
      )}
    </nav>
  )
}

function UserMenu() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const name     = session?.user?.name ?? 'User'
  const avatarId = (session?.user as { avatarId?: string | null })?.avatarId ?? null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:opacity-80"
        style={{ background: open ? 'var(--surface-alt)' : 'transparent' }}
      >
        <UserAvatar avatarId={avatarId} name={name} size={32} style={{ borderRadius: '50%', flexShrink: 0 }} />
        <span className="hidden text-sm font-semibold md:block" style={{ color: 'var(--foreground)' }}>
          {name}
        </span>
        <ChevronDown
          size={14}
          className="hidden md:block transition-transform"
          style={{ color: 'var(--muted-foreground)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl py-1 z-50"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}
        >
          <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{name}</div>
            <div className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{session?.user?.email}</div>
          </div>
          <button
            onClick={() => { setOpen(false); router.push('/profile') }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition hover:opacity-80"
            style={{ color: 'var(--foreground)' }}
          >
            <User size={15} />
            Profile
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition hover:opacity-80"
            style={{ color: 'var(--danger)' }}
          >
            <LogOut size={15} />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

function notificationIcon(type: NotificationRow['type']) {
  switch (type) {
    case 'friend_request':            return UserPlus
    case 'friend_accepted':           return UserCheck
    case 'nudge':                     return Sparkles
    case 'shared_goal_invite':        return UsersIcon
    case 'shared_goal_contribution':  return Trophy
    case 'shared_goal_completed':     return Trophy
    case 'shared_goal_removed':       return UsersIcon
    default:                          return Bell
  }
}

function formatRelative(d: Date) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return new Date(d).toLocaleDateString('en-UG')
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationRow[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') return
    let active = true
    async function load() {
      try {
        const c = await getUnreadCount()
        if (active) setUnread(c)
      } catch { /* ignore */ }
    }
    load()
    const id = setInterval(load, 30000)
    return () => { active = false; clearInterval(id) }
  }, [status])

  useEffect(() => {
    if (!open) return
    let active = true
    async function load() {
      try {
        const rows = await getNotifications(20)
        if (active) setItems(rows)
      } catch { /* ignore */ }
    }
    load()
  }, [open])

  async function markAll() {
    await markAllNotificationsRead()
    setUnread(0)
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })))
  }

  async function clickItem(n: NotificationRow) {
    if (!n.readAt) {
      await markNotificationRead(n.id)
      setUnread((u) => Math.max(0, u - 1))
      setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, readAt: new Date() } : x))
    }
    setOpen(false)
    if (n.type === 'friend_request' || n.type === 'friend_accepted') {
      if (n.actor?.username) router.push(`/profile/${n.actor.username}`)
      else router.push('/profile')
    } else if (n.type.startsWith('shared_goal') && n.entityId) {
      router.push(`/goals/shared/${n.entityId}`)
    } else if (n.type === 'nudge') {
      router.push('/')
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-80"
        style={{ background: 'var(--surface-alt)', color: 'var(--foreground)' }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: 'var(--danger)' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl z-50"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAll}
                className="text-xs font-semibold transition hover:opacity-80"
                style={{ color: 'var(--primary)' }}>
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Bell size={28} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                No notifications yet
              </div>
            </div>
          ) : (
            <div className="flex max-h-[60vh] flex-col overflow-y-auto">
              {items.map((n) => {
                const Icon = notificationIcon(n.type)
                const isUnread = !n.readAt
                return (
                  <button key={n.id} onClick={() => clickItem(n)}
                    className="flex items-start gap-3 px-4 py-3 text-left text-sm transition hover:opacity-90"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isUnread ? 'var(--surface-alt)' : 'transparent',
                    }}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ background: 'rgba(0,184,148,0.12)', color: 'var(--primary)' }}>
                      <Icon size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {n.body ?? n.type.replace(/_/g, ' ')}
                      </div>
                      <div className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {formatRelative(n.createdAt)}
                      </div>
                    </div>
                    {isUnread && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--primary)' }} />
                    )}
                  </button>
                )
              })}
              <Link href="/notifications" onClick={() => setOpen(false)}
                className="px-4 py-3 text-center text-xs font-semibold transition hover:opacity-80"
                style={{ color: 'var(--primary)' }}>
                View all
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const [addOpen,    setAddOpen]    = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const rightRail = useRightRail()

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full" style={{ background: 'var(--background)' }}>
        {/* Sidebar hidden on mobile, shown on md+ */}
        <div className="hidden md:block">
          <Suspense>
            <AppSidebar onAdd={() => setAddOpen(true)} />
          </Suspense>
        </div>

        <div className="flex flex-1 flex-col min-w-0">
          {/* Top header */}
          <header
            className="sticky top-0 z-30 flex h-16 items-center gap-3 px-4 md:px-6"
            style={{
              background: 'var(--sidebar)',
              borderBottom: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <SidebarTrigger className="hidden md:flex" style={{ color: 'var(--foreground)' }} />

            {/* Mobile: logo — taps open drawer */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 md:hidden"
              aria-label="Open navigation"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden"
                style={{ background: 'var(--primary)' }}
              >
                <img src="/logo.svg" alt="MyTereka" className="h-6 w-6 object-contain" />
              </div>
              <span
                className="text-base font-bold"
                style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}
              >
                MyTereka
              </span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          {/* Page content — 2-col on xl+ when right rail is present */}
          <div className={`flex flex-1 min-w-0 ${rightRail ? 'xl:divide-x xl:divide-[var(--border)]' : ''}`}>
            <main className="flex-1 min-w-0 px-4 py-6 pb-24 md:px-4 md:py-8 md:pb-8">
              {children}
            </main>

            {/* Right rail — desktop only */}
            {rightRail && (
              <aside
                className="hidden xl:flex xl:flex-col w-[300px] shrink-0 px-5 py-8 gap-5 overflow-y-auto"
                style={{ background: 'var(--sidebar)' }}
              >
                {rightRail}
              </aside>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav — mobile only */}
      <MobileBottomNav onAdd={() => setAddOpen(true)} />

      {/* Mobile slide-in drawer — full nav */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <AddTransactionSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RightRailProvider>
      <AppShellInner>{children}</AppShellInner>
    </RightRailProvider>
  )
}
