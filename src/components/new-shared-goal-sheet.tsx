'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Target, Laptop, Plane, Car, Home, BookOpen, Heart, Trophy, Star, CalendarDays, Check } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { createSharedGoal } from '@/lib/actions/shared-goals'
import { getFriends } from '@/lib/actions/friends'
import type { FriendCard } from '@/lib/types/friends'

const iconMap: Record<string, React.ElementType> = {
  laptop: Laptop, plane: Plane, car: Car, home: Home, book: BookOpen,
  heart: Heart, trophy: Trophy, target: Target, star: Star,
}
const ICONS = ['target','laptop','plane','car','home','book','heart','trophy','star'] as const

function Avatar({ name, src }: { name: string; src?: string | null }) {
  const initials = name.split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ background: 'var(--gradient-primary)' }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : initials}
    </div>
  )
}

export function NewSharedGoalSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [icon, setIcon] = useState('target')
  const [leavePolicy, setLeavePolicy] = useState<'refundable' | 'forfeit'>('refundable')
  const [friends, setFriends] = useState<FriendCard[]>([])
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, start] = useTransition()

  useEffect(() => {
    getFriends().then(setFriends).catch(() => setFriends([])).finally(() => setLoadingFriends(false))
  }, [])

  function toggleFriend(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function save() {
    if (!name.trim()) { toast.error('Enter goal name'); return }
    if (!target || Number(target) <= 0) { toast.error('Enter target amount'); return }
    start(async () => {
      try {
        await createSharedGoal({
          name:             name.trim(),
          targetAmount:     Math.round(Number(target)),
          targetDate:       targetDate || null,
          icon,
          leavePolicy,
          invitedFriendIds: Array.from(selected),
        })
        toast.success('Shared goal created')
        onClose()
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to create')
      }
    })
  }

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl overflow-y-auto"
        style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
        <SheetHeader className="text-left">
          <SheetTitle style={{ color: 'var(--foreground)' }}>New Shared Goal</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-5 pb-8">
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Goal name</label>
            <input type="text" placeholder="e.g. School Fees Term 2" value={name}
              onChange={(e) => setName(e.target.value)} className="mytereka-input" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Target amount (UGX)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold"
                style={{ color: 'var(--muted-foreground)' }}>UGX</span>
              <input type="number" inputMode="numeric" placeholder="0" value={target}
                onChange={(e) => setTarget(e.target.value)} className="mytereka-input pl-14 font-bold" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Target date (optional)</label>
            <div className="relative">
              <CalendarDays size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--muted-foreground)' }} />
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                className="mytereka-input pl-10" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => {
                const Icon = iconMap[ic] ?? Target
                const sel = icon === ic
                return (
                  <button key={ic} onClick={() => setIcon(ic)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-all"
                    style={{
                      background: sel ? 'rgba(0,184,148,0.15)' : 'var(--surface-alt)',
                      border:     sel ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                      color:      sel ? 'var(--primary)' : 'var(--muted-foreground)',
                    }}>
                    <Icon size={18} />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>If a member leaves</label>
            <div className="flex flex-col gap-2">
              {(['refundable', 'forfeit'] as const).map((p) => {
                const sel = leavePolicy === p
                return (
                  <button key={p} onClick={() => setLeavePolicy(p)}
                    className="flex items-start gap-3 rounded-xl p-3 text-left transition"
                    style={{
                      background: sel ? 'rgba(0,184,148,0.10)' : 'var(--card)',
                      border:     sel ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                    }}>
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: sel ? 'var(--primary)' : 'transparent',
                        border:     sel ? '2px solid var(--primary)' : '2px solid var(--muted-foreground)',
                      }}>
                      {sel && <Check size={10} color="white" strokeWidth={3} />}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        {p === 'refundable' ? 'Refundable' : 'Forfeit'}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {p === 'refundable'
                          ? 'Members get their contributions back if they leave.'
                          : 'Contributions stay in the pot — no refunds on leave.'}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Invite friends {selected.size > 0 && `· ${selected.size} selected`}
            </label>
            {loadingFriends ? (
              <div className="flex items-center justify-center py-4" style={{ color: 'var(--muted-foreground)' }}>
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <div className="rounded-xl p-4 text-center text-sm"
                style={{ background: 'var(--surface-alt)', color: 'var(--muted-foreground)' }}>
                No friends yet. Add some from your profile first.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {friends.map((f) => {
                  const sel = selected.has(f.id)
                  return (
                    <button key={f.id} onClick={() => toggleFriend(f.id)}
                      className="flex items-center gap-3 rounded-xl p-2.5 text-left transition"
                      style={{
                        background: sel ? 'rgba(0,184,148,0.10)' : 'var(--card)',
                        border:     sel ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                      }}>
                      <Avatar name={f.name} src={f.avatarUrl} />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{f.name}</div>
                        <div className="truncate text-xs" style={{ color: 'var(--muted-foreground)' }}>@{f.username ?? '—'}</div>
                      </div>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full"
                        style={{
                          background: sel ? 'var(--primary)' : 'transparent',
                          border:     sel ? '2px solid var(--primary)' : '2px solid var(--muted-foreground)',
                        }}>
                        {sel && <Check size={11} color="white" strokeWidth={3} />}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button onClick={save} disabled={pending}
            className="w-full rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'var(--gradient-primary)' }}>
            {pending && <Loader2 size={16} className="animate-spin" />}
            Create Shared Goal
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
