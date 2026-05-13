'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Search, UserPlus, Loader2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { searchUsers, sendFriendRequest } from '@/lib/actions/friends'
import type { PublicUser } from '@/lib/types/friends'

function Avatar({ name, src }: { name: string; src?: string | null }) {
  const initials = name.split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ background: 'var(--gradient-primary)' }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : initials}
    </div>
  )
}

export function FriendSearchSheet({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicUser[]>([])
  const [loading, setLoading] = useState(false)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const id = setTimeout(async () => {
      try {
        const r = await searchUsers(q)
        setResults(r)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Search failed')
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(id)
  }, [query])

  function send(user: PublicUser) {
    startTransition(async () => {
      try {
        await sendFriendRequest(user.id)
        toast.success(`Request sent to ${user.name}`)
        setSentIds((prev) => new Set(prev).add(user.id))
        onChanged()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to send request')
      }
    })
  }

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
        <SheetHeader className="text-left">
          <SheetTitle style={{ color: 'var(--foreground)' }}>Find a friend</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value.toLowerCase())}
              placeholder="Search by username"
              autoFocus
              className="mytereka-input"
              style={{ paddingLeft: 44 }}
            />
          </div>

          <div className="flex flex-col gap-2">
            {loading && (
              <div className="flex items-center justify-center py-6" style={{ color: 'var(--muted-foreground)' }}>
                <Loader2 size={18} className="animate-spin" />
              </div>
            )}

            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <div className="rounded-xl p-6 text-center text-sm" style={{ background: 'var(--surface-alt)', color: 'var(--muted-foreground)' }}>
                No users found for &quot;{query}&quot;.
              </div>
            )}

            {!loading && query.trim().length < 2 && (
              <div className="rounded-xl p-6 text-center text-sm" style={{ background: 'var(--surface-alt)', color: 'var(--muted-foreground)' }}>
                Type at least 2 characters to search.
              </div>
            )}

            {results.map((user) => {
              const already = sentIds.has(user.id)
              return (
                <div key={user.id}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
                  <Avatar name={user.name} src={user.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{user.name}</div>
                    <div className="truncate text-xs" style={{ color: 'var(--muted-foreground)' }}>@{user.username ?? '—'}</div>
                  </div>
                  <button
                    disabled={pending || already}
                    onClick={() => send(user)}
                    className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: already ? 'var(--muted)' : 'var(--gradient-primary)' }}
                  >
                    <UserPlus size={12} /> {already ? 'Sent' : 'Add'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
