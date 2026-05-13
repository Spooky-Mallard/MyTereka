'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { UserPlus, Check, X, Clock } from 'lucide-react'
import { sendFriendRequest, removeFriend, getFriendshipWith, respondToFriendRequest } from '@/lib/actions/friends'

export function FriendProfileActions({
  userId, isFriend, pendingDirection,
}: {
  userId:           string
  isFriend:         boolean
  pendingDirection: 'incoming' | 'outgoing' | null
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function refresh() { router.refresh() }

  function add() {
    start(async () => {
      try {
        await sendFriendRequest(userId)
        toast.success('Request sent')
        refresh()
      } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    })
  }

  function remove() {
    if (!confirm('Remove this friend?')) return
    start(async () => {
      try {
        await removeFriend(userId)
        toast.success('Friend removed')
        refresh()
      } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    })
  }

  function respond(action: 'accept' | 'decline') {
    start(async () => {
      try {
        const f = await getFriendshipWith(userId)
        if (!f) throw new Error('No pending request')
        await respondToFriendRequest(f.id, action)
        toast.success(action === 'accept' ? 'Friend added' : 'Declined')
        refresh()
      } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    })
  }

  if (isFriend) {
    return (
      <button onClick={remove} disabled={pending}
        className="rounded-full px-5 py-2 text-sm font-semibold transition hover:opacity-80 disabled:opacity-50"
        style={{ background: 'var(--surface-alt)', color: 'var(--danger)' }}>
        Remove friend
      </button>
    )
  }
  if (pendingDirection === 'outgoing') {
    return (
      <div className="inline-flex items-center gap-1 rounded-full px-5 py-2 text-sm font-semibold"
        style={{ background: 'var(--surface-alt)', color: 'var(--muted-foreground)' }}>
        <Clock size={14} /> Request sent
      </div>
    )
  }
  if (pendingDirection === 'incoming') {
    return (
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => respond('accept')} disabled={pending}
          className="flex items-center gap-1 rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--gradient-primary)' }}>
          <Check size={14} /> Accept
        </button>
        <button onClick={() => respond('decline')} disabled={pending}
          className="flex items-center gap-1 rounded-full px-5 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--surface-alt)', color: 'var(--foreground)' }}>
          <X size={14} /> Decline
        </button>
      </div>
    )
  }
  return (
    <button onClick={add} disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      style={{ background: 'var(--gradient-primary)' }}>
      <UserPlus size={14} /> Add friend
    </button>
  )
}
