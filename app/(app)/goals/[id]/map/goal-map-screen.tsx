'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Loader2, X, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { formatUGX } from '@/lib/format'
import { contributeToGoal, getGoalMapData } from '@/lib/actions/goals'
import { getAccountsForUser } from '@/lib/actions/transactions'
import { GoalMapTileCanvas, MILESTONE_NODES } from '@/components/goal-map-tile-canvas'
import { MilestoneModal } from '@/components/milestone-modal'
import type { GoalMapData } from '@/lib/actions/goals'
import { useEffect } from 'react'

type Goal = GoalMapData['goal']
type AccountRow = { id: string; name: string; balance: number; type: string }

function ContributeModal({
  goal,
  onClose,
  onSuccess,
}: {
  goal: Goal
  onClose: () => void
  onSuccess: (res: { newlyReachedMilestones: string[]; coinsCollected: number[]; completed: boolean }) => void
}) {
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loadingAcc, setLoadingAcc] = useState(true)
  const [pending, start] = useTransition()

  useEffect(() => {
    getAccountsForUser()
      .then((accs) => { setAccounts(accs); if (accs.length) setAccountId(accs[0].id) })
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
        const res = await contributeToGoal(goal.id, num, accountId, note || undefined)
        toast.success(res.completed ? `"${res.goalName}" completed! 🎉` : `Contributed ${formatUGX(num)}`)
        onClose()
        onSuccess({ newlyReachedMilestones: res.newlyReachedMilestones, coinsCollected: res.coinsCollected, completed: res.completed })
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>Contribute</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{goal.name}</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted-foreground)' }}><X size={20} /></button>
        </div>

        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Remaining to target</div>
          <div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{formatUGX(remaining)}</div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Amount (UGX)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>UGX</span>
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
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="mytereka-input appearance-none">
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

export function GoalMapScreen({
  goal: initialGoal,
  currentPct: initialPct,
  earnedMilestones: initialMilestones,
  collectedCoins: initialCoins,
}: {
  goal: Goal
  currentPct: number
  earnedMilestones: string[]
  collectedCoins: number[]
}) {
  const router = useRouter()
  const [currentPct, setCurrentPct] = useState(initialPct)
  const [earnedMilestones, setEarnedMilestones] = useState(initialMilestones)
  const [collectedCoins, setCollectedCoins] = useState(initialCoins)
  const [goal, setGoal] = useState(initialGoal)
  const [showContribute, setShowContribute] = useState(false)
  const [activeMilestoneKey, setActiveMilestoneKey] = useState<string | null>(null)
  const [confettiFired, setConfettiFired] = useState(false)

  async function fireConfetti() {
    if (typeof window === 'undefined' || confettiFired) return
    setConfettiFired(true)
    const confetti = (await import('canvas-confetti')).default
    confetti({
      particleCount: 120,
      spread: 80,
      colors: ['#00B894', '#1DD1A1', '#F59E0B', '#ffffff'],
      origin: { y: 0.5 },
    })
  }

  function handleMilestoneModalDismiss() {
    const key = activeMilestoneKey
    setActiveMilestoneKey(null)
    if (key === '100') fireConfetti()
  }

  function handleContributionResult(res: { newlyReachedMilestones: string[]; coinsCollected: number[]; completed: boolean }) {
    // Refresh server data then update local state
    router.refresh()
    if (res.newlyReachedMilestones.length > 0) {
      setEarnedMilestones((prev) => [...new Set([...prev, ...res.newlyReachedMilestones])])
    }
    if (res.coinsCollected.length > 0) {
      setCollectedCoins((prev) => [...new Set([...prev, ...res.coinsCollected])])
    }
    // Refetch to get updated currentAmount
    getGoalMapData(goal.id).then((data) => {
      if (!data) return
      const newPct = data.goal.targetAmount > 0
        ? Math.min(100, Math.round((data.goal.currentAmount / data.goal.targetAmount) * 100))
        : 0
      setGoal(data.goal)
      setCurrentPct(newPct)
    })
  }

  const pct = currentPct
  const isCompleted = goal.isCompleted || pct >= 100

  // Fire confetti once on initial load if already completed
  useEffect(() => {
    if (isCompleted) fireConfetti()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      {/* Fixed header */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/goals"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: 'var(--surface-alt)', color: 'var(--foreground)' }}>
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight"
              style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
              {goal.name}
            </h1>
            {goal.targetDate && (
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <CalendarDays size={11} />
                {new Date(goal.targetDate).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-baseline gap-1.5">
              <span id="goal-map-xp-counter" className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{pct}%</span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>complete</span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {formatUGX(goal.currentAmount)} of {formatUGX(goal.targetAmount)}
            </div>
          </div>
          {!isCompleted && (
            <button onClick={() => setShowContribute(true)}
              className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: 'var(--gradient-primary)' }}>
              <Plus size={15} strokeWidth={2.5} /> Contribute
            </button>
          )}
          {isCompleted && (
            <div className="flex flex-col items-end gap-0.5">
              <div className="rounded-full px-4 py-2 text-sm font-bold"
                style={{ background: 'var(--gradient-primary)', color: '#ffffff' }}>
                Goal Complete 🎉
              </div>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {formatUGX(goal.targetAmount)} saved
              </span>
            </div>
          )}
        </div>

        <div className="progress-track" style={{ height: 6 }}>
          <div className="progress-fill"
            style={{ width: `${pct}%`, background: 'var(--gradient-primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.8s ease' }} />
        </div>
      </div>

      {/* Map canvas */}
      <GoalMapTileCanvas
        currentPct={currentPct}
        earnedMilestones={earnedMilestones}
      />

      {showContribute && (
        <ContributeModal
          goal={goal}
          onClose={() => setShowContribute(false)}
          onSuccess={handleContributionResult}
        />
      )}

      {activeMilestoneKey && (() => {
        const node = MILESTONE_NODES.find((m) => m.key === activeMilestoneKey)
        if (!node) return null
        return (
          <MilestoneModal
            milestone={node}
            onDismiss={handleMilestoneModalDismiss}
          />
        )
      })()}
    </div>
  )
}
