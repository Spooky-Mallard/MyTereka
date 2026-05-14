'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft, Plus, Loader2, X, Users, Trophy, LogOut, UserMinus, Crown,
  Target, Laptop, Plane, Car, Home, BookOpen, Heart, Star, CalendarDays,
} from 'lucide-react'
import { formatUGX } from '@/lib/format'
import { getAccountsForUser } from '@/lib/actions/transactions'
import {
  contributeToSharedGoal,
  leaveSharedGoal,
  removeMember,
} from '@/lib/actions/shared-goals'
import type { SharedGoalDetail, SharedGoalMember } from '@/lib/types/shared-goals'

type AccountRow = { id: string; name: string; balance: number; type: string }

const iconMap: Record<string, React.ElementType> = {
  laptop: Laptop, plane: Plane, car: Car, home: Home, book: BookOpen,
  heart: Heart, trophy: Trophy, target: Target, star: Star,
}

function Avatar({ name, src, size = 36 }: { name: string; src?: string | null; size?: number }) {
  const initials = name.split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="flex shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ background: 'var(--gradient-primary)', width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : initials}
    </div>
  )
}

function ContributeSharedModal({
  sharedGoalId,
  goalName,
  remaining,
  onClose,
}: {
  sharedGoalId: string
  goalName: string
  remaining: number
  onClose: () => void
}) {
  const router = useRouter()
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loadingAcc, setLoadingAcc] = useState(true)
  const [pending, start] = useTransition()

  useEffect(() => {
    getAccountsForUser()
      .then((accs) => {
        setAccounts(accs)
        if (accs.length) setAccountId(accs[0].id)
      })
      .finally(() => setLoadingAcc(false))
  }, [])

  function save() {
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }
    if (!accountId) { toast.error('Select an account'); return }
    const num = Math.round(Number(amount))
    const acc = accounts.find((a) => a.id === accountId)
    if (acc && num > acc.balance) { toast.error('Insufficient balance'); return }

    start(async () => {
      try {
        const res = await contributeToSharedGoal(sharedGoalId, num, accountId, note || undefined)
        toast.success(
          res.completed
            ? `"${res.goalName}" reached target! 🎉`
            : `Contributed ${formatUGX(num)}`,
        )
        onClose()
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
              Contribute
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{goalName}</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted-foreground)' }}><X size={20} /></button>
        </div>

        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Remaining to target</div>
          <div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{formatUGX(Math.max(0, remaining))}</div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Amount (UGX)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold"
              style={{ color: 'var(--muted-foreground)' }}>UGX</span>
            <input type="number" inputMode="numeric" placeholder="0" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mytereka-input pl-16 font-bold" style={{ color: 'var(--primary)' }} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Source account</label>
          {loadingAcc ? (
            <div className="mytereka-input flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</span>
            </div>
          ) : (
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
              className="mytereka-input appearance-none">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} — {formatUGX(a.balance)}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Note (optional)</label>
          <input type="text" placeholder="e.g. Monthly chip-in" value={note}
            onChange={(e) => setNote(e.target.value)} className="mytereka-input" />
        </div>

        <button onClick={save} disabled={pending}
          className="w-full rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--gradient-primary)' }}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          Contribute
        </button>
      </div>
    </div>
  )
}

function ConfirmDialog({
  title, body, confirmLabel, danger, onCancel, onConfirm, pending,
}: {
  title: string
  body: string
  confirmLabel: string
  danger?: boolean
  onCancel: () => void
  onConfirm: () => void
  pending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}>
        <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>{title}</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>{body}</p>
        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} disabled={pending}
            className="flex-1 rounded-full py-2.5 text-sm font-semibold"
            style={{ background: 'var(--surface-alt)', color: 'var(--foreground)' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={pending}
            className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: danger ? 'var(--danger)' : 'var(--primary)' }}>
            {pending && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SharedGoalDetailClient({
  detail,
  meId,
}: {
  detail: SharedGoalDetail
  meId: string
}) {
  const router = useRouter()
  const [showContribute, setShowContribute] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [removing, setRemoving] = useState<SharedGoalMember | null>(null)
  const [pending, start] = useTransition()

  const pct = detail.targetAmount > 0
    ? Math.min(100, Math.round((detail.currentAmount / detail.targetAmount) * 100))
    : 0
  const remaining = Math.max(0, detail.targetAmount - detail.currentAmount)
  const Icon = detail.icon ? iconMap[detail.icon] ?? Target : Target
  const barColor = detail.isCompleted ? 'var(--success)' : pct >= 75 ? 'var(--primary-light)' : 'var(--primary)'

  const activeMembers = detail.members.filter((m) => m.status === 'active')
  const formerMembers = detail.members.filter((m) => m.status === 'left' || m.status === 'removed')

  function doLeave() {
    start(async () => {
      try {
        await leaveSharedGoal(detail.id)
        toast.success('Left shared goal')
        router.push('/goals')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed')
        setLeaving(false)
      }
    })
  }

  function doRemove(userId: string, name: string) {
    start(async () => {
      try {
        await removeMember(detail.id, userId)
        toast.success(`Removed ${name}`)
        setRemoving(null)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  const canContribute = detail.myStatus === 'active' && !detail.isCompleted

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/goals" className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: 'var(--surface-alt)', color: 'var(--foreground)' }}>
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl truncate"
            style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            {detail.name}
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Shared goal · {detail.leavePolicy === 'refundable' ? 'Refundable on leave' : 'Forfeit on leave'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: detail.isCompleted ? 'rgba(0,184,148,0.15)' : 'var(--surface-alt)',
              color:      detail.isCompleted ? 'var(--primary)' : 'var(--muted-foreground)',
            }}>
            {detail.isCompleted ? <Trophy size={26} /> : <Icon size={26} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>{pct}%</span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>complete</span>
            </div>
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {formatUGX(detail.currentAmount)} of {formatUGX(detail.targetAmount)}
            </div>
            {detail.targetDate && (
              <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <CalendarDays size={11} />
                {new Date(detail.targetDate).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="progress-track" style={{ height: 10 }}>
            <div className="progress-fill"
              style={{ width: `${pct}%`, background: barColor, borderRadius: 'var(--radius-full)' }} />
          </div>
          {!detail.isCompleted && (
            <div className="mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Remaining: <span className="font-semibold" style={{ color: 'var(--warning)' }}>{formatUGX(remaining)}</span>
            </div>
          )}
        </div>

        {canContribute && (
          <button onClick={() => setShowContribute(true)}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: 'var(--gradient-primary)' }}>
            <Plus size={16} strokeWidth={2.5} /> Contribute
          </button>
        )}
        {!canContribute && detail.isCompleted && (
          <div className="rounded-xl p-3 text-center text-sm font-semibold"
            style={{ background: 'rgba(0,184,148,0.12)', color: 'var(--primary)' }}>
            Goal reached 🎉
          </div>
        )}
      </div>

      <div className="rounded-2xl p-5"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="mb-3 flex items-center gap-2">
          <Users size={16} style={{ color: 'var(--muted-foreground)' }} />
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            Members · {activeMembers.length}
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          {activeMembers.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 rounded-xl p-2.5"
              style={{ background: m.userId === meId ? 'rgba(0,184,148,0.08)' : 'var(--surface-alt)' }}>
              <Avatar name={m.name} src={m.avatarUrl} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  <span className="truncate">{m.name}{m.userId === meId && ' (You)'}</span>
                  {m.isCreator && <Crown size={11} style={{ color: 'var(--warning)' }} />}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {m.contributionCount > 0
                    ? `${formatUGX(m.totalContributed)} · ${m.contributionCount} contribution${m.contributionCount === 1 ? '' : 's'}`
                    : 'No contributions yet'}
                </div>
              </div>
              {detail.isCreator && m.userId !== meId && (
                <button onClick={() => setRemoving(m)}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition hover:opacity-80"
                  style={{ background: 'var(--surface-alt)', color: 'var(--danger)' }}
                  aria-label={`Remove ${m.name}`}>
                  <UserMinus size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        {formerMembers.length > 0 && (
          <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--muted-foreground)' }}>
              Former members
            </div>
            <div className="flex flex-col gap-2">
              {formerMembers.map((m) => (
                <div key={m.userId} className="flex items-center gap-3 rounded-xl p-2 opacity-60">
                  <Avatar name={m.name} src={m.avatarUrl} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{m.name}</div>
                    <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                      {m.status === 'left' ? 'Left' : 'Removed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-5"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
          Recent activity
        </h2>
        {detail.contributions.length === 0 ? (
          <div className="rounded-xl p-6 text-center text-sm"
            style={{ background: 'var(--surface-alt)', color: 'var(--muted-foreground)' }}>
            No contributions yet. Be the first to chip in!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {detail.contributions.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl p-2.5"
                style={{ background: 'var(--surface-alt)' }}>
                <Avatar name={c.userName} src={c.avatarUrl} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm" style={{ color: 'var(--foreground)' }}>
                    <span className="font-semibold">{c.userId === meId ? 'You' : c.userName}</span>
                    {' '}
                    {c.isRefund ? 'refunded' : 'contributed'}
                  </div>
                  {c.note && (
                    <div className="truncate text-xs" style={{ color: 'var(--muted-foreground)' }}>{c.note}</div>
                  )}
                  <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                    {new Date(c.createdAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="text-sm font-bold"
                  style={{ color: c.isRefund ? 'var(--danger)' : 'var(--primary)' }}>
                  {c.isRefund ? '-' : '+'}{formatUGX(c.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detail.myStatus === 'active' && !detail.isCreator && (
        <button onClick={() => setLeaving(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition hover:opacity-90"
          style={{ background: 'var(--surface-alt)', color: 'var(--danger)' }}>
          <LogOut size={14} /> Leave shared goal
        </button>
      )}

      {showContribute && (
        <ContributeSharedModal
          sharedGoalId={detail.id}
          goalName={detail.name}
          remaining={remaining}
          onClose={() => setShowContribute(false)}
        />
      )}
      {leaving && (
        <ConfirmDialog
          title="Leave this shared goal?"
          body={
            detail.leavePolicy === 'refundable'
              ? 'Your net contributions will be refunded to your most recent source account.'
              : 'Your contributions stay in the pot — no refunds on this goal.'
          }
          confirmLabel="Leave"
          danger
          pending={pending}
          onCancel={() => setLeaving(false)}
          onConfirm={doLeave}
        />
      )}
      {removing && (
        <ConfirmDialog
          title={`Remove ${removing.name}?`}
          body={
            detail.leavePolicy === 'refundable'
              ? `${removing.name}'s net contributions will be refunded to them.`
              : `${removing.name}'s contributions will stay in the pot.`
          }
          confirmLabel="Remove"
          danger
          pending={pending}
          onCancel={() => setRemoving(null)}
          onConfirm={() => doRemove(removing.userId, removing.name)}
        />
      )}
    </div>
  )
}
