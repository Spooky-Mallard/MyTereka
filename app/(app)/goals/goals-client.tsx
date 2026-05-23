'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Lock, Trophy, X, Loader2,
  CalendarDays, Users, UserPlus, Map,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatUGX } from '@/lib/format'
import { createGoal, contributeToGoal } from '@/lib/actions/goals'
import { respondToSharedGoalInvite } from '@/lib/actions/shared-goals'
import { getAccountsForUser } from '@/lib/actions/transactions'
import { NewSharedGoalSheet } from '@/components/new-shared-goal-sheet'
import { useSetRightRail } from '@/components/right-rail-context'
import type { goals } from '@/lib/schema'
import type { InferSelectModel } from 'drizzle-orm'
import type { SharedGoalCard, SharedGoalInvite } from '@/lib/types/shared-goals'

type GoalRow = InferSelectModel<typeof goals>
type AccountRow = { id: string; name: string; balance: number; type: string }

const GOAL_EMOJI_OPTIONS = [
  '🎯','💻','🏠','🚗','✈️','📱','⌚','📚','❤️','⭐',
  '💰','🏥','🎓','💍','👶','🌴','💼','🛒','📷','🚲',
  '🏆','🎮','🎸','🏋️','🌍','🏡','🎉','🔑','🛋️','🎁',
]

function resolveGoalIcon(icon: string | null): string {
  if (!icon) return '🎯'
  if (icon.codePointAt(0)! > 127) return icon
  const keywordMap: Record<string, string> = {
    laptop: '💻', computer: '💻', pc: '💻',
    home: '🏠', house: '🏠',
    car: '🚗', vehicle: '🚗',
    phone: '📱', mobile: '📱',
    school: '🎓', education: '📚', book: '📚',
    travel: '✈️', holiday: '🌴', vacation: '🌴',
    wedding: '💍', ring: '💍',
    business: '💼', work: '💼',
    baby: '👶', child: '🧒',
    health: '🏥', hospital: '🏥',
    savings: '💰', money: '💰', fund: '💰',
    watch: '⌚', clock: '⌚',
    plane: '✈️',
    heart: '❤️',
    trophy: '🏆',
    target: '🎯',
    star: '⭐',
  }
  return keywordMap[icon.toLowerCase().trim()] ?? '🎯'
}

function GoalRing({ pct, size = 80 }: { pct: number; size?: number }) {
  const r  = (size - 12) / 2
  const c  = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  return (
    <svg width={size} height={size} className="goal-ring-svg -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={6} className="goal-ring-bg" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} strokeWidth={6}
        className="goal-ring-fill" fill="none"
        strokeDasharray={c} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

function ContributeModal({ goal, onClose }: { goal: GoalRow; onClose: () => void }) {
  const router = useRouter()
  const [accounts,   setAccounts]   = useState<AccountRow[]>([])
  const [accountId,  setAccountId]  = useState('')
  const [amount,     setAmount]     = useState('')
  const [note,       setNote]       = useState('')
  const [saving,     setSaving]     = useState(false)
  const [loadingAcc, setLoadingAcc] = useState(true)

  useEffect(() => {
    getAccountsForUser()
      .then((accs) => {
        setAccounts(accs)
        if (accs.length) setAccountId(accs[0].id)
      })
      .finally(() => setLoadingAcc(false))
  }, [])

  async function handleContribute() {
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }
    if (!accountId)                      { toast.error('Select an account');   return }
    const numAmount = Math.round(Number(amount))
    const acc = accounts.find((a) => a.id === accountId)
    if (acc && numAmount > acc.balance) {
      toast.error('Insufficient balance in selected account')
      return
    }
    setSaving(true)
    try {
      const result = await contributeToGoal(goal.id, numAmount, accountId, note || undefined)
      if (result.completed) {
        toast.success(`Goal "${result.goalName}" completed! 🎉`)
      } else {
        toast.success(`Contribution saved — ${formatUGX(numAmount)}`)
      }
      onClose()
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save contribution')
    } finally {
      setSaving(false)
    }
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
              Add Contribution
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{goal.name}</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted-foreground)' }}><X size={20} /></button>
        </div>

        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Remaining</div>
          <div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
            {formatUGX(Math.max(0, goal.targetAmount - goal.currentAmount))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Amount (UGX)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold"
              style={{ color: 'var(--muted-foreground)' }}>UGX</span>
            <input type="number" inputMode="numeric" placeholder="0"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="mytereka-input pl-16 font-bold"
              style={{ color: 'var(--primary)' }} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Source account
          </label>
          {loadingAcc ? (
            <div className="mytereka-input flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</span>
            </div>
          ) : (
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
              className="mytereka-input appearance-none">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {formatUGX(a.balance)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Note (optional)
          </label>
          <input type="text" placeholder="e.g. Monthly savings"
            value={note} onChange={(e) => setNote(e.target.value)}
            className="mytereka-input" />
        </div>

        <button onClick={handleContribute} disabled={saving}
          className="w-full rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--gradient-primary)' }}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          Add Contribution
        </button>
      </div>
    </div>
  )
}

function GoalCard({ goal, onContribute, featured = false }: { goal: GoalRow; onContribute: (g: GoalRow) => void; featured?: boolean }) {
  const pct       = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)

  if (featured) {
    return (
      <div className="relative overflow-hidden rounded-[20px] p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(0,184,148,0.18), rgba(29,209,161,0.06))',
          border: '1px solid rgba(0,184,148,0.35)',
        }}>
        <div className="pointer-events-none absolute right-3 top-3">
          <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(0,184,148,0.18)', color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
            Active quest
          </span>
        </div>

        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-[16px] text-2xl"
            style={{ background: 'rgba(0,184,148,0.22)', width: 52, height: 52 }}>
            {resolveGoalIcon(goal.icon)}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="font-bold text-base leading-tight" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
              {goal.name}
            </div>
            <div className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {formatUGX(goal.currentAmount)} <span style={{ opacity: 0.6 }}>of</span> {formatUGX(goal.targetAmount)}
              {goal.targetDate && ` · ${new Date(goal.targetDate).toLocaleDateString('en-UG', { month: 'short', year: 'numeric' })}`}
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-2xl font-bold" style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em' }}>
            {pct}%
          </span>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>· {formatUGX(remaining)} to go</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--gradient-primary)' }} />
        </div>

        <div className="flex gap-2">
          {!goal.isCompleted && (
            <button onClick={() => onContribute(goal)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[12px] py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-cta)', fontFamily: 'Poppins, sans-serif' }}>
              <Plus size={15} strokeWidth={2.5} /> Add to goal
            </button>
          )}
          <Link href={`/goals/${goal.id}/map`}
            className="flex items-center justify-center gap-1.5 rounded-[12px] px-4 py-2.5 text-sm font-bold transition hover:opacity-90"
            style={{ background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
            <Map size={14} /> View map
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[16px] p-4" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-xl"
          style={{ background: goal.isCompleted ? 'rgba(0,184,148,0.15)' : 'var(--surface-alt)',
                   color: goal.isCompleted ? 'var(--primary)' : 'var(--muted-foreground)' }}>
          {goal.isCompleted ? <Trophy size={18} /> : resolveGoalIcon(goal.icon)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>{goal.name}</span>
            {goal.isLocked && <Lock size={11} style={{ color: 'var(--warning)' }} />}
            {goal.isCompleted && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: 'rgba(0,184,148,0.15)', color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
                Done
              </span>
            )}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {formatUGX(goal.currentAmount)} / {formatUGX(goal.targetAmount)}
            {goal.targetDate && ` · ${new Date(goal.targetDate).toLocaleDateString('en-UG', { month: 'short', year: 'numeric' })}`}
          </div>
        </div>
        <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
          style={{ background: 'rgba(0,184,148,0.12)', color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-alt)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: goal.isCompleted ? 'var(--success)' : 'var(--primary)' }} />
      </div>
      {!goal.isCompleted && (
        <div className="mt-3 flex gap-2">
          <button onClick={() => onContribute(goal)}
            className="flex flex-1 items-center justify-center gap-1 rounded-full py-2 text-xs font-bold transition hover:opacity-90"
            style={{ background: 'rgba(0,184,148,0.12)', color: 'var(--primary)', border: '1px solid rgba(0,184,148,0.3)', fontFamily: 'Poppins, sans-serif' }}>
            <Plus size={12} strokeWidth={2.5} /> Add funds
          </button>
          <Link href={`/goals/${goal.id}/map`}
            className="flex items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-bold transition hover:opacity-90"
            style={{ background: 'var(--surface-alt)', color: 'var(--muted-foreground)', fontFamily: 'Poppins, sans-serif' }}>
            <Map size={12} /> Map
          </Link>
        </div>
      )}
    </div>
  )
}

function SharedGoalCardItem({ goal }: { goal: SharedGoalCard }) {
  const pct  = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0
  return (
    <Link href={`/goals/shared/${goal.id}`} className="block" style={{ textDecoration: 'none' }}>
      <div className="rounded-[16px] p-4 transition hover:opacity-90"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-xl"
            style={{ background: goal.isCompleted ? 'rgba(0,184,148,0.15)' : 'var(--surface-alt)',
                     color: goal.isCompleted ? 'var(--primary)' : 'var(--muted-foreground)' }}>
            {goal.isCompleted ? <Trophy size={18} /> : resolveGoalIcon(goal.icon)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
                {goal.name}
              </span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1"
                style={{ background: 'rgba(0,184,148,0.12)', color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
                <Users size={9} /> {goal.memberCount}
              </span>
              {goal.isCompleted && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: 'rgba(0,184,148,0.15)', color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
                  Done
                </span>
              )}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {goal.isCreator ? 'You created' : `by ${goal.creatorName}`}
              {' · '}{formatUGX(goal.currentAmount)} / {formatUGX(goal.targetAmount)}
              {goal.targetDate && ` · ${new Date(goal.targetDate).toLocaleDateString('en-UG', { month: 'short', year: 'numeric' })}`}
            </div>
          </div>
          <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ background: 'rgba(0,184,148,0.12)', color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
            {pct}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-alt)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: goal.isCompleted ? 'var(--success)' : 'var(--primary)' }} />
        </div>
        <div className="mt-3 flex gap-2">
          <Link href={`/goals/shared/${goal.id}`}
            className="flex flex-1 items-center justify-center gap-1 rounded-full py-2 text-xs font-bold transition hover:opacity-90"
            style={{ background: 'rgba(0,184,148,0.12)', color: 'var(--primary)', border: '1px solid rgba(0,184,148,0.3)', fontFamily: 'Poppins, sans-serif' }}>
            <Plus size={12} strokeWidth={2.5} /> Contribute
          </Link>
          <Link href={`/goals/shared/${goal.id}/map`}
            className="flex items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-bold transition hover:opacity-90"
            style={{ background: 'var(--surface-alt)', color: 'var(--muted-foreground)', fontFamily: 'Poppins, sans-serif' }}>
            <Map size={12} /> Map
          </Link>
        </div>
      </div>
    </Link>
  )
}

function InviteCard({ invite, onResponded }: { invite: SharedGoalInvite; onResponded: () => void }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function respond(action: 'accept' | 'decline') {
    start(async () => {
      try {
        await respondToSharedGoalInvite(invite.sharedGoalId, action)
        toast.success(action === 'accept' ? `Joined "${invite.name}"` : 'Invite declined')
        onResponded()
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  return (
    <div className="rounded-2xl p-4 flex items-start gap-3"
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--primary)' }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ background: 'rgba(0,184,148,0.15)' }}>
        {resolveGoalIcon(invite.icon ?? null)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{invite.name}</div>
        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {invite.creatorName} invited you · Target {formatUGX(invite.targetAmount)} · {invite.leavePolicy}
        </div>
        <div className="mt-2 flex gap-2">
          <button disabled={pending} onClick={() => respond('accept')}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--gradient-primary)' }}>
            Accept
          </button>
          <button disabled={pending} onClick={() => respond('decline')}
            className="rounded-full px-3 py-1.5 text-xs font-semibold transition hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--surface-alt)', color: 'var(--muted-foreground)' }}>
            Decline
          </button>
        </div>
      </div>
    </div>
  )
}

function GoalMap({ goals: goalList }: { goals: GoalRow[] }) {
  if (goalList.length === 0) return null

  const nodeCount = goalList.length
  const svgWidth  = 320
  const nodeR     = 22
  const stepY     = 120
  const svgHeight = nodeCount * stepY + 60

  const nodes = goalList.map((g, i) => {
    const x     = i % 2 === 0 ? svgWidth * 0.35 : svgWidth * 0.65
    const y     = 50 + i * stepY
    const pct   = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0
    const done  = g.isCompleted
    return { g, x, y, pct, done }
  })

  const pathParts: string[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1]
    const mx = (a.x + b.x) / 2
    pathParts.push(`M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`)
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
      <svg width={svgWidth} height={svgHeight} style={{ display: 'block', margin: '0 auto' }}>
        {pathParts.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--border)" strokeWidth={4}
            strokeDasharray="8 6" strokeLinecap="round" />
        ))}
        {nodes.map(({ g, x, y, done }, i) => (
          <g key={g.id}>
            <circle cx={x} cy={y} r={nodeR + 4} fill={done ? 'var(--primary)' : 'var(--card)'}
              stroke={done ? 'var(--primary)' : 'var(--border)'} strokeWidth={3} />
            <text x={x} y={y + 6} textAnchor="middle" fontSize={done ? 16 : 16} style={{ userSelect: 'none' }}>
              {done ? '🏆' : resolveGoalIcon(g.icon)}
            </text>
            <text x={x} y={y + nodeR + 20} textAnchor="middle"
              style={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 600 }}>
              {g.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function NewGoalModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [name,       setName]       = useState('')
  const [target,     setTarget]     = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [icon,       setIcon]       = useState('🎯')
  const [locked,     setLocked]     = useState(false)
  const [saving,     setSaving]     = useState(false)

  async function handleSave() {
    if (!name.trim())               { toast.error('Enter a goal name'); return }
    if (!target || Number(target) <= 0) { toast.error('Enter a target amount'); return }
    setSaving(true)
    try {
      await createGoal({
        name:         name.trim(),
        targetAmount: Math.round(Number(target)),
        targetDate:   targetDate || undefined,
        icon,
        isLocked:     locked,
      })
      toast.success('Goal created')
      onClose()
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create goal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            New Goal
          </h2>
          <button onClick={onClose} style={{ color: 'var(--muted-foreground)' }}><X size={20} /></button>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Goal name</label>
          <input type="text" placeholder="e.g. New Laptop" value={name} onChange={(e) => setName(e.target.value)}
            className="mytereka-input" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Target amount (UGX)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>UGX</span>
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
          <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Emoji</label>
          <div className="flex flex-wrap gap-2">
            {GOAL_EMOJI_OPTIONS.map((em) => (
              <button key={em} onClick={() => setIcon(em)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all"
                style={{
                  background: icon === em ? 'rgba(0,184,148,0.15)' : 'var(--surface-alt)',
                  border: icon === em ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                }}>
                {em}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Lock savings</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Prevent withdrawals until target date</div>
          </div>
          <button onClick={() => setLocked((l) => !l)}
            className="relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
            style={{ background: locked ? 'var(--primary)' : 'var(--surface-alt)' }}>
            <span className="absolute h-4 w-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: locked ? 'translateX(24px)' : 'translateX(4px)' }} />
          </button>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--gradient-primary)' }}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          Create Goal
        </button>
      </div>
    </div>
  )
}

type Section = 'personal' | 'shared'
type PersonalView = 'goals' | 'map'

export function GoalsClient({
  data,
  sharedGoals,
  sharedInvites,
}: {
  data: GoalRow[]
  sharedGoals: SharedGoalCard[]
  sharedInvites: SharedGoalInvite[]
}) {
  const [section, setSection] = useState<Section>('personal')
  const [personalView, setPersonalView] = useState<PersonalView>('goals')
  const [showNew, setShowNew] = useState(false)
  const [showNewShared, setShowNewShared] = useState(false)
  const [contributeGoal, setContributeGoal] = useState<GoalRow | null>(null)
  const [invitesLocal, setInvitesLocal] = useState(sharedInvites)

  const active    = data.filter((g) => !g.isCompleted)
  const completed = data.filter((g) => g.isCompleted)

  function dismissInvite(id: string) {
    setInvitesLocal((prev) => prev.filter((i) => i.sharedGoalId !== id))
  }

  /* right rail: overview of all goals */
  useSetRightRail(
    <div className="flex flex-col gap-4">
      <div className="rail-card">
        <div className="eyebrow mb-3">Overview</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--muted-foreground)' }}>Active goals</span>
            <span className="font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>{active.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--muted-foreground)' }}>Completed</span>
            <span className="font-bold" style={{ color: 'var(--success)', fontFamily: 'Poppins, sans-serif' }}>{completed.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--muted-foreground)' }}>Shared goals</span>
            <span className="font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>{sharedGoals.length}</span>
          </div>
          {invitesLocal.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--muted-foreground)' }}>Pending invites</span>
              <span className="font-bold" style={{ color: 'var(--warning)', fontFamily: 'Poppins, sans-serif' }}>{invitesLocal.length}</span>
            </div>
          )}
        </div>
      </div>

      {active.length > 0 && (
        <div className="rail-card">
          <div className="eyebrow mb-3">Progress</div>
          <div className="flex flex-col gap-3">
            {active.slice(0, 4).map((g) => {
              const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold truncate max-w-[140px]"
                      style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
                      {g.icon ?? ''} {g.name}
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>{pct}%</span>
                  </div>
                  <div className="progress-track" style={{ height: 5 }}>
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {sharedGoals.length > 0 && (
        <div className="rail-card">
          <div className="eyebrow mb-3">Shared Goals</div>
          <div className="flex flex-col gap-3">
            {sharedGoals.slice(0, 3).map((g) => {
              const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0
              return (
                <Link key={g.id} href={`/goals/shared/${g.id}`} style={{ textDecoration: 'none' }}>
                  <div className="flex items-center gap-2 hover:opacity-80 transition">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: 'var(--surface-alt)', fontSize: 14 }}>
                      {g.icon ?? '🤝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
                        {g.name}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                        {g.memberCount} members · {pct}%
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            Goals
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {section === 'personal'
              ? `${active.length} active · ${completed.length} completed`
              : `${sharedGoals.length} shared${invitesLocal.length > 0 ? ` · ${invitesLocal.length} invite${invitesLocal.length === 1 ? '' : 's'}` : ''}`}
          </p>
        </div>
        <button
          onClick={() => section === 'personal' ? setShowNew(true) : setShowNewShared(true)}
          className="flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold text-white transition hover:opacity-90 active:scale-95"
          style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-fab)', fontFamily: 'Poppins, sans-serif' }}>
          <Plus size={15} strokeWidth={2.5} /> {section === 'personal' ? 'New goal' : 'New shared'}
        </button>
      </div>

      {/* Personal / Shared tabs */}
      <div className="flex rounded-full p-1 w-fit gap-1" style={{ background: 'var(--surface-alt)' }}>
        {(['personal', 'shared'] as Section[]).map((s) => (
          <button key={s} onClick={() => setSection(s)}
            className="rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition flex items-center gap-1.5"
            style={section === s
              ? { background: 'var(--primary)', color: '#fff', fontFamily: 'Poppins, sans-serif' }
              : { color: 'var(--muted-foreground)', fontFamily: 'Poppins, sans-serif' }}>
            {s === 'shared' && <Users size={12} />}
            {s}
            {s === 'shared' && invitesLocal.length > 0 && (
              <span className="rounded-full px-1.5 text-[10px] font-bold"
                style={{ background: section === s ? '#fff' : 'var(--warning)', color: section === s ? 'var(--primary)' : '#fff' }}>
                {invitesLocal.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {section === 'personal' ? (
        <>
          {/* Goals / Map sub-tabs */}
          <div className="flex rounded-full p-1 w-fit gap-1" style={{ background: 'var(--surface-alt)' }}>
            {(['goals', 'map'] as PersonalView[]).map((t) => (
              <button key={t} onClick={() => setPersonalView(t)}
                className="rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition"
                style={personalView === t
                  ? { background: 'var(--primary)', color: '#fff', fontFamily: 'Poppins, sans-serif' }
                  : { color: 'var(--muted-foreground)', fontFamily: 'Poppins, sans-serif' }}>
                {t === 'goals' ? 'My Goals' : 'Goal Map'}
              </button>
            ))}
          </div>

          {data.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl py-16 text-center"
              style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
              <div className="text-5xl">🎯</div>
              <div>
                <div className="font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>No goals yet</div>
                <div className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>Set a savings goal to start your journey</div>
              </div>
              <button onClick={() => setShowNew(true)}
                className="flex h-10 items-center gap-2 rounded-full px-5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
                <Plus size={15} /> Create Goal
              </button>
            </div>
          ) : personalView === 'goals' ? (
            <div className="flex flex-col gap-3">
              {active.map((g, i) => (
                <GoalCard key={g.id} goal={g} onContribute={setContributeGoal} featured={i === 0} />
              ))}
              {completed.length > 0 && (
                <>
                  <div className="px-1 text-xs font-bold uppercase tracking-widest mt-1"
                    style={{ color: 'var(--muted-foreground)', fontFamily: 'Poppins, sans-serif' }}>
                    Completed
                  </div>
                  {completed.map((g) => (
                    <GoalCard key={g.id} goal={g} onContribute={setContributeGoal} />
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="rounded-2xl p-6" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
              <GoalMap goals={data} />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {invitesLocal.length > 0 && (
            <>
              <div className="px-1 text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--muted-foreground)', fontFamily: 'Poppins, sans-serif' }}>
                Invites
              </div>
              {invitesLocal.map((inv) => (
                <InviteCard key={inv.sharedGoalId} invite={inv}
                  onResponded={() => dismissInvite(inv.sharedGoalId)} />
              ))}
            </>
          )}

          {sharedGoals.length === 0 && invitesLocal.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl py-16 text-center"
              style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
              <div className="text-5xl">🤝</div>
              <div>
                <div className="font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>No shared goals yet</div>
                <div className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Save together — invite friends and pool funds toward a target
                </div>
              </div>
              <button onClick={() => setShowNewShared(true)}
                className="flex h-10 items-center gap-2 rounded-full px-5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
                <UserPlus size={15} /> Create Shared Goal
              </button>
            </div>
          ) : (
            sharedGoals.map((g) => <SharedGoalCardItem key={g.id} goal={g} />)
          )}
        </div>
      )}

      {showNew && <NewGoalModal onClose={() => setShowNew(false)} />}
      {showNewShared && <NewSharedGoalSheet onClose={() => setShowNewShared(false)} />}
      {contributeGoal && (
        <ContributeModal goal={contributeGoal} onClose={() => setContributeGoal(null)} />
      )}
    </div>
  )
}
