'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, House, BarChart2, Plus, Target, User, LogOut, ChevronDown } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from '@/components/ui/sonner'
import { AddTransactionSheet } from '@/components/add-transaction-sheet'

const mobileNavItems = [
  { title: 'Home',      url: '/',          icon: House },
  { title: 'Analytics', url: '/analytics', icon: BarChart2 },
  { title: 'Add',       url: '#',          icon: Plus,   fab: true },
  { title: 'Goals',     url: '/goals',     icon: Target },
  { title: 'Profile',   url: '/profile',   icon: User },
]

function MobileBottomNav({ onAdd }: { onAdd: () => void }) {
  const pathname = usePathname()
  const isActive = (url: string) =>
    url === '/' ? pathname === '/' : pathname.startsWith(url)

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
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:opacity-80"
        style={{ background: open ? 'var(--surface-alt)' : 'transparent' }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
          style={{ background: 'var(--gradient-primary)' }}
        >
          {initials}
        </div>
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

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* Placeholder — wire to real notifications later */
  const notifications: { id: string; text: string; time: string }[] = []

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-80"
        style={{ background: 'var(--surface-alt)', color: 'var(--foreground)' }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {notifications.length > 0 && (
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
            style={{ background: 'var(--danger)' }}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl z-50"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Notifications</span>
            {notifications.length > 0 && (
              <span className="rounded-full px-2 py-0.5 text-xs font-bold"
                style={{ background: 'var(--primary)22', color: 'var(--primary)' }}>
                {notifications.length}
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Bell size={28} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                No notifications yet
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div key={n.id} className="px-4 py-3 text-sm"
                  style={{ borderBottom: '1px solid var(--border)', color: 'var(--foreground)' }}>
                  <div>{n.text}</div>
                  <div className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>{n.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full" style={{ background: 'var(--background)' }}>
        {/* Sidebar hidden on mobile, shown on md+ */}
        <div className="hidden md:block">
          <AppSidebar onAdd={() => setAddOpen(true)} />
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

            {/* Mobile: logo */}
            <Link href="/" className="flex items-center gap-2 md:hidden">
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
            </Link>

            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
            {children}
          </main>
        </div>
      </div>

      {/* Bottom nav — mobile only */}
      <MobileBottomNav onAdd={() => setAddOpen(true)} />

      <AddTransactionSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  )
}
