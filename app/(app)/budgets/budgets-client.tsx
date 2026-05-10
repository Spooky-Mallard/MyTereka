'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, AlertTriangle, X, ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatUGX } from '@/lib/format'
import { categoryMeta } from '@/lib/mock-data'
import { createBudget } from '@/lib/actions/budgets'
import { getUserCategories } from '@/lib/actions/profile'
import type { CategoryOption } from '@/lib/actions/profile'
import type { BudgetRow } from '@/lib/actions/budgets'

function NewBudgetModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [cats,    setCats]    = useState<CategoryOption[]>([])
  const [catId,   setCatId]   = useState('')
  const [limit,   setLimit]   = useState('')
  const [period,  setPeriod]  = useState<'weekly' | 'monthly'>('monthly')
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserCategories()
      .then((c) => { setCats(c.filter((x) => x.type === 'expense')); setLoading(false) })
  }, [])

  async function handleSave() {
    if (!catId)                          { toast.error('Select a category'); return }
    if (!limit || Number(limit) <= 0)    { toast.error('Enter a limit amount'); return }
    setSaving(true)
    try {
      await createBudget({ categoryId: catId, limitAmount: Math.round(Number(limit)), period })
      toast.success('Budget created')
      onClose()
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create budget')
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
            New Budget
          </h2>
          <button onClick={onClose} style={{ color: 'var(--muted-foreground)' }}><X size={20} /></button>
        </div>

        {loading ? (
          <div className="flex h-20 items-center justify-center">
            <Loader2 size={22} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : (
          <>
            {/* Category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Category
              </label>
              <div className="relative">
                <select value={catId} onChange={(e) => setCatId(e.target.value)}
                  className="mytereka-input appearance-none pr-10">
                  <option value="">Select category…</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }} />
              </div>
            </div>

            {/* Limit */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Limit Amount (UGX)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold"
                  style={{ color: 'var(--muted-foreground)' }}>UGX</span>
                <input type="number" inputMode="numeric" placeholder="0" value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="mytereka-input pl-14 font-bold" />
              </div>
            </div>

            {/* Period */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Period
              </label>
              <div className="grid grid-cols-2 rounded-xl p-1" style={{ background: 'var(--surface-alt)' }}>
                {(['monthly', 'weekly'] as const).map((p) => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className="rounded-lg py-2 text-sm font-semibold capitalize transition-all"
                    style={period === p
                      ? { background: 'var(--card)', color: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }
                      : { color: 'var(--muted-foreground)' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--gradient-primary)' }}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              Create Budget
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function BudgetsClient({ data }: { data: BudgetRow[] }) {
  const [showNew, setShowNew] = useState(false)

  const totalLimit = data.reduce((s, b) => s + b.limitAmount, 0)
  const totalSpent = data.reduce((s, b) => s + b.spentAmount, 0)
  const overall    = totalLimit > 0 ? Math.min(100, Math.round((totalSpent / totalLimit) * 100)) : 0

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            Budgets
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Monthly spending limits
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
          style={{ background: 'var(--primary)', boxShadow: '0 4px 12px rgba(0,184,148,0.35)' }}>
          <Plus size={16} strokeWidth={2.5} /> New budget
        </button>
      </div>

      {/* Overview banner */}
      <section className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'var(--gradient-primary)', boxShadow: '0 8px 32px rgba(0,184,148,0.30)' }}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full"
          style={{ background: 'rgba(255,255,255,0.08)', filter: 'blur(32px)' }} />
        <div className="relative">
          <div className="text-sm font-medium opacity-80">Total budget used</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {formatUGX(totalSpent)}
            </span>
            <span className="text-sm opacity-70">of {formatUGX(totalLimit)}</span>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full"
            style={{ background: 'rgba(255,255,255,0.20)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${overall}%`, background: 'rgba(255,255,255,0.90)' }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm opacity-80">
            <span>{overall}% used this period</span>
            <span>{formatUGX(Math.max(0, totalLimit - totalSpent))} remaining</span>
          </div>
        </div>
      </section>

      {/* Budget cards */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl py-16 text-center"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="text-5xl">💰</div>
          <div>
            <div className="font-semibold" style={{ color: 'var(--foreground)' }}>No budgets yet</div>
            <div className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Set one to start tracking your spending
            </div>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--primary)' }}>
            <Plus size={16} /> Create Budget
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((b) => {
            const meta  = categoryMeta[b.categoryName]
            const Icon  = meta?.icon
            const pct   = b.limitAmount > 0 ? Math.min(100, Math.round((b.spentAmount / b.limitAmount) * 100)) : 0
            const over  = b.spentAmount > b.limitAmount
            const color = over ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--success)'

            return (
              <div key={b.id} className="rounded-2xl p-5 cursor-pointer"
                style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: meta?.tint ? `${meta.tint}22` : b.categoryColor ? `${b.categoryColor}22` : 'var(--surface-alt)',
                      color: meta?.tint ?? b.categoryColor ?? 'var(--muted-foreground)',
                    }}>
                    {Icon && <Icon size={18} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold" style={{ color: 'var(--foreground)' }}>{b.categoryName}</div>
                    <div className="text-xs capitalize" style={{ color: 'var(--muted-foreground)' }}>{b.period}</div>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ background: `${color}22`, color }}>
                    {over ? 'Over limit' : pct >= 70 ? 'Almost full' : 'On track'}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between text-sm">
                  <span className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                    {formatUGX(b.spentAmount)}
                  </span>
                  <span style={{ color: 'var(--muted-foreground)' }}>of {formatUGX(b.limitAmount)}</span>
                </div>

                <div className="progress-track mt-2">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span style={{ color }}>{pct}% spent</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>
                    {over
                      ? `${formatUGX(b.spentAmount - b.limitAmount)} over`
                      : `${formatUGX(b.limitAmount - b.spentAmount)} left`}
                  </span>
                </div>

                {pct >= 80 && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
                    style={{ background: `${over ? 'var(--danger)' : 'var(--warning)'}18`, color: over ? 'var(--danger)' : 'var(--warning)' }}>
                    <AlertTriangle size={12} />
                    {over ? 'You exceeded this budget limit' : `${b.categoryName} budget is almost full`}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showNew && <NewBudgetModal onClose={() => setShowNew(false)} />}
    </div>
  )
}
