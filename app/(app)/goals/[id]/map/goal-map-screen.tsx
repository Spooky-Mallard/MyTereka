'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Loader2, X } from 'lucide-react'
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
    router.refresh()
    if (res.newlyReachedMilestones.length > 0) {
      setEarnedMilestones((prev) => [...new Set([...prev, ...res.newlyReachedMilestones])])
    }
    if (res.coinsCollected.length > 0) {
      setCollectedCoins((prev) => [...new Set([...prev, ...res.coinsCollected])])
    }
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

  useEffect(() => {
    if (isCompleted) fireConfetti()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--background)', zIndex: 0, overflow: 'hidden' }}>
      {/* Floating top overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(10,25,41,0.95) 0%, transparent 100%)',
      }}>
        <Link href="/goals" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)', color: '#fff',
          textDecoration: 'none',
        }}>
          <ArrowLeft size={16} />
        </Link>
        <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '-0.01em' }}>
            {goal.name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
            {pct}% · {formatUGX(goal.currentAmount)} of {formatUGX(goal.targetAmount)}
          </div>
        </div>
        {!isCompleted ? (
          <button onClick={() => setShowContribute(true)} style={{
            padding: '8px 14px', borderRadius: 9999, border: 'none',
            background: 'var(--gradient-primary)', color: '#fff',
            fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,184,148,0.4)',
          }}>
            <Plus size={13} strokeWidth={2.5} /> Contribute
          </button>
        ) : (
          <div style={{
            padding: '8px 14px', borderRadius: 9999,
            background: 'var(--gradient-primary)', color: '#fff',
            fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 12,
          }}>
            Complete 🎉
          </div>
        )}
      </div>

      {/* Map — fills full screen */}
      <GoalMapTileCanvas
        currentPct={currentPct}
        earnedMilestones={earnedMilestones}
        goalName={goal.name}
        targetAmount={goal.targetAmount}
        currentAmount={goal.currentAmount}
        fullScreen
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
