'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { UserPlus, Check, X, Flame, Star, Users as UsersIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  getFriends, getIncomingRequests, respondToFriendRequest, removeFriend,
} from '@/lib/actions/friends'
import type { FriendCard, IncomingRequest } from '@/lib/types/friends'
import { FriendSearchSheet } from './friend-search-sheet'

function Avatar({ name, src, size = 44 }: { name: string; src?: string | null; size?: number }) {
  const initials = name.split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: 'var(--gradient-primary)' }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : initials}
    </div>
  )
}

export function FriendsTab() {
  const [friends, setFriends] = useState<FriendCard[] | null>(null)
  const [requests, setRequests] = useState<IncomingRequest[] | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  async function reload() {
    const [f, r] = await Promise.all([getFriends(), getIncomingRequests()])
    setFriends(f)
    setRequests(r)
  }

  useEffect(() => { reload() }, [])

  function respond(id: string, action: 'accept' | 'decline') {
    startTransition(async () => {
      try {
        await respondToFriendRequest(id, action)
        toast.success(action === 'accept' ? 'Friend added' : 'Request declined')
        await reload()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  function unfriend(userId: string, name: string) {
    if (!confirm(`Remove ${name} from your friends?`)) return
    startTransition(async () => {
      try {
        await removeFriend(userId)
        toast.success(`Removed ${name}`)
        await reload()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-5" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Friends</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Connect and save together with people you trust.
            </div>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <UserPlus size={14} /> Add friend
          </button>
        </div>

        {/* Incoming requests */}
        {requests && requests.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
              Requests ({requests.length})
            </div>
            {requests.map((req) => (
              <div key={req.friendshipId}
                className="flex items-center gap-3 rounded-xl p-3"
                style={{ background: 'var(--surface-alt)' }}>
                <Avatar name={req.name} src={req.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{req.name}</div>
                  <div className="truncate text-xs" style={{ color: 'var(--muted-foreground)' }}>@{req.username ?? '—'}</div>
                </div>
                <button
                  disabled={pending}
                  onClick={() => respond(req.friendshipId, 'accept')}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}
                  aria-label="Accept"
                >
                  <Check size={14} />
                </button>
                <button
                  disabled={pending}
                  onClick={() => respond(req.friendshipId, 'decline')}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                  aria-label="Decline"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Friends list */}
        {friends === null ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl p-8 text-center" style={{ background: 'var(--surface-alt)' }}>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: 'rgba(0,184,148,0.12)', color: 'var(--primary)' }}
            >
              <UsersIcon size={24} />
            </div>
            <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>No friends yet</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Search a friend by their username to send a request.
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              className="mt-1 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <UserPlus size={14} /> Find your first friend
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((f) => (
              <div key={f.friendshipId}
                className="flex items-center gap-3 rounded-xl p-3 transition hover:opacity-90"
                style={{ background: 'var(--surface-alt)' }}>
                <Link
                  href={f.username ? `/profile/${f.username}` : '#'}
                  className="flex flex-1 items-center gap-3 min-w-0"
                >
                  <Avatar name={f.name} src={f.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{f.name}</div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      <span>@{f.username ?? '—'}</span>
                      <span className="level-badge text-[9px]">{f.level}</span>
                      <span className="flex items-center gap-0.5" style={{ color: 'var(--warning)' }}>
                        <Flame size={10} /> {f.streakCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Star size={10} style={{ color: 'var(--warning)' }} /> {f.xpPoints}
                      </span>
                    </div>
                  </div>
                </Link>
                <button
                  disabled={pending}
                  onClick={() => unfriend(f.id, f.name)}
                  className="text-xs font-semibold transition hover:opacity-70"
                  style={{ color: 'var(--danger)' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {searchOpen && (
        <FriendSearchSheet
          onClose={() => setSearchOpen(false)}
          onChanged={reload}
        />
      )}
    </div>
  )
}
