'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Bell, UserPlus, UserCheck, Trophy, Users as UsersIcon, Sparkles, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { markAllNotificationsRead, markNotificationRead } from '@/lib/actions/notifications'
import type { NotificationRow } from '@/lib/types/notifications'
import { respondToFriendRequest } from '@/lib/actions/friends'

function iconFor(type: NotificationRow['type']) {
  switch (type) {
    case 'friend_request':            return UserPlus
    case 'friend_accepted':           return UserCheck
    case 'nudge':                     return Sparkles
    case 'shared_goal_invite':        return UsersIcon
    case 'shared_goal_contribution':  return Trophy
    case 'shared_goal_completed':     return Trophy
    case 'shared_goal_removed':       return UsersIcon
    case 'quest_completed':           return Sparkles
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

export function NotificationsClient({ initial }: { initial: NotificationRow[] }) {
  const [items, setItems] = useState(initial)
  const [pending, start] = useTransition()
  const unread = items.filter((n) => !n.readAt).length

  function update(id: string, patch: Partial<NotificationRow>) {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, ...patch } : n))
  }

  async function readOne(n: NotificationRow) {
    if (n.readAt) return
    update(n.id, { readAt: new Date() })
    try { await markNotificationRead(n.id) } catch { /* ignore */ }
  }

  async function readAll() {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })))
    try { await markAllNotificationsRead() } catch { /* ignore */ }
  }

  function respond(n: NotificationRow, action: 'accept' | 'decline') {
    if (!n.entityId) return
    start(async () => {
      try {
        await respondToFriendRequest(n.entityId!, action)
        toast.success(action === 'accept' ? 'Friend added' : 'Declined')
        update(n.id, { readAt: new Date() })
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            Notifications
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {unread === 0 ? 'You’re all caught up.' : `${unread} unread`}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={readAll}
            className="rounded-full px-4 py-2 text-xs font-semibold transition hover:opacity-90"
            style={{ background: 'var(--surface-alt)', color: 'var(--primary)' }}>
            Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl p-10 text-center"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'rgba(0,184,148,0.12)', color: 'var(--primary)' }}>
            <Bell size={24} />
          </div>
          <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>No notifications yet</div>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Add a friend to start getting activity here.
          </div>
          <Link href="/profile" className="mt-1 rounded-full px-4 py-2 text-xs font-semibold text-white"
            style={{ background: 'var(--gradient-primary)' }}>
            Go to Profile
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((n) => {
            const Icon = iconFor(n.type)
            const isUnread = !n.readAt
            const isRequest = n.type === 'friend_request'
            return (
              <div key={n.id}
                onClick={() => readOne(n)}
                className="flex items-start gap-3 rounded-2xl p-4 transition hover:opacity-90"
                style={{
                  background: isUnread ? 'var(--card)' : 'var(--surface-alt)',
                  boxShadow: isUnread ? 'var(--shadow-card)' : 'none',
                  cursor: 'pointer',
                }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'rgba(0,184,148,0.12)', color: 'var(--primary)' }}>
                  <Icon size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {n.body ?? n.type.replace(/_/g, ' ')}
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {formatRelative(n.createdAt)}
                  </div>
                  {isRequest && n.entityId && !n.readAt && (
                    <div className="mt-3 flex items-center gap-2">
                      <button disabled={pending} onClick={(e) => { e.stopPropagation(); respond(n, 'accept') }}
                        className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'var(--gradient-primary)' }}>
                        <Check size={12} /> Accept
                      </button>
                      <button disabled={pending} onClick={(e) => { e.stopPropagation(); respond(n, 'decline') }}
                        className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>
                        <X size={12} /> Decline
                      </button>
                    </div>
                  )}
                </div>
                {isUnread && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--primary)' }} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
