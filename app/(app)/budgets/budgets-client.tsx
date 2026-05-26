'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, AlertTriangle, X, ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatUGX } from '@/lib/format'
import { categoryMeta } from '@/lib/mock-data'
import { createBudget } from '@/lib/actions/budgets'
import { getUserCategories } from '@/lib/actions/profile'
import { useSetRightRail } from '@/components/right-rail-context'
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

function BudgetsRightRail({ data, totalSpent, totalLimit, overall }: {
  data: BudgetRow[]
  totalSpent: number
  totalLimit: number
  overall: number
}) {
  const overCount  = data.filter(b => b.spentAmount > b.limitAmount).length
  const warnCount  = data.filter(b => {
    const p = b.limitAmount > 0 ? (b.spentAmount / b.limitAmount) * 100 : 0
    return p >= 75 && b.spentAmount <= b.limitAmount
  }).length

  return (
    <>
      <div className="rail-card flex flex-col gap-4">
        <div>
          <div className="eyebrow">Summary</div>
          <div className="text-2xl font-black mt-1" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            {overall}%
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {formatUGX(totalSpent)} of {formatUGX(totalLimit)} spent
          </div>
        </div>
        <div className="progress-track" style={{ height: 8 }}>
          <div className="progress-fill" style={{
            width: `${overall}%`,
            background: overall >= 90 ? 'var(--danger)' : overall >= 70 ? 'var(--warning)' : 'var(--gradient-primary)',
            transition: 'width 0.8s ease',
          }}/>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'var(--surface-alt)' }}>
            <div className="text-lg font-black" style={{ color: 'var(--success)', fontFamily: 'Poppins, sans-serif' }}>
              {formatUGX(Math.max(0, totalLimit - totalSpent))}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Remaining</div>
          </div>
        </div>
        {(overCount > 0 || warnCount > 0) && (
          <div className="flex flex-col gap-1.5">
            {overCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)' }}>
                <AlertTriangle size={12} />
                {overCount} budget{overCount > 1 ? 's' : ''} exceeded
              </div>
            )}
            {warnCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)' }}>
                <AlertTriangle size={12} />
                {warnCount} budget{warnCount > 1 ? 's' : ''} nearly full
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rail-card flex flex-col gap-3">
        <div className="eyebrow">By Category</div>
        {data.slice(0, 5).map((b) => {
          const meta = categoryMeta[b.categoryName]
          const Icon = meta?.icon
          const pct  = b.limitAmount > 0 ? Math.min(100, Math.round((b.spentAmount / b.limitAmount) * 100)) : 0
          const over = b.spentAmount > b.limitAmount
          const color = over ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--success)'
          return (
            <div key={b.id} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: meta?.tint ? `${meta.tint}22` : b.categoryColor ? `${b.categoryColor}22` : 'var(--surface-alt)',
                  color: meta?.tint ?? b.categoryColor ?? 'var(--muted-foreground)',
                }}>
                {Icon
                  ? <Icon size={14} />
                  : b.categoryIcon && b.categoryIcon.codePointAt(0)! > 127
                    ? <span style={{ fontSize: 14 }}>{b.categoryIcon}</span>
                    : <span className="text-xs font-bold">{b.categoryName[0]}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span style={{ color: 'var(--foreground)' }} className="truncate">{b.categoryName}</span>
                  <span style={{ color }}>{pct}%</span>
                </div>
                <div className="progress-track" style={{ height: 4 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: color }}/>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

export function BudgetsClient({ data }: { data: BudgetRow[] }) {
  const [showNew, setShowNew] = useState(false)

  const totalLimit = data.reduce((s, b) => s + b.limitAmount, 0)
  const totalSpent = data.reduce((s, b) => s + b.spentAmount, 0)
  const remaining  = Math.max(0, totalLimit - totalSpent)
  const overall    = totalLimit > 0 ? Math.min(100, Math.round((totalSpent / totalLimit) * 100)) : 0

  useSetRightRail(
    <BudgetsRightRail data={data} totalSpent={totalSpent} totalLimit={totalLimit} overall={overall} />
  )

  // Warnings for near-limit budgets
  const warnings = data.filter((b) => {
    const p = b.limitAmount > 0 ? (b.spentAmount / b.limitAmount) * 100 : 0
    return p >= 75
  }).sort((a, b) => (b.spentAmount / b.limitAmount) - (a.spentAmount / a.limitAmount))

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight"
            style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            Budgets
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Monthly spending limits
          </p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-fab)' }}>
          <Plus size={15} strokeWidth={2.6} /> New budget
        </button>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
        <div className="eyebrow mb-2">This month</div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="hero-number" style={{ color: 'var(--foreground)' }}>
            {formatUGX(remaining)}
          </span>
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>left to spend</span>
        </div>
        <div className="progress-track" style={{ height: 10 }}>
          <div className="progress-fill" style={{
            width: `${overall}%`,
            background: overall >= 90 ? 'var(--danger)' : overall >= 70 ? 'var(--warning)' : 'var(--gradient-primary)',
            transition: 'width 0.8s ease',
          }}/>
        </div>
        <div className="mt-2 flex justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span>Spent {formatUGX(totalSpent)}</span>
          <span>of {formatUGX(totalLimit)} · {overall}%</span>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {warnings.slice(0, 2).map((b) => {
            const over = b.spentAmount > b.limitAmount
            const pct  = b.limitAmount > 0 ? Math.min(100, Math.round((b.spentAmount / b.limitAmount) * 100)) : 0
            return (
              <div key={b.id} className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{
                  background: over ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${over ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                }}>
                <AlertTriangle size={16} style={{ color: over ? 'var(--danger)' : 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold" style={{ color: over ? 'var(--danger)' : 'var(--warning)', fontFamily: 'Poppins, sans-serif' }}>
                    {over ? `${b.categoryName} budget exceeded` : `${b.categoryName} budget at ${pct}%`}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--foreground)' }}>
                    {over
                      ? `${formatUGX(b.spentAmount - b.limitAmount)} over limit`
                      : `${formatUGX(b.limitAmount - b.spentAmount)} remaining`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
        <>
          <div className="eyebrow">By Category</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.map((b) => {
              const meta  = categoryMeta[b.categoryName]
              const Icon  = meta?.icon
              const pct   = b.limitAmount > 0 ? Math.min(100, Math.round((b.spentAmount / b.limitAmount) * 100)) : 0
              const over  = b.spentAmount > b.limitAmount
              const color = over ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--success)'
              const tint  = meta?.tint ?? b.categoryColor ?? 'var(--muted-foreground)'

              return (
                <div key={b.id} className="rounded-2xl p-4"
                  style={{
                    background: 'var(--card)',
                    boxShadow: 'var(--shadow-card)',
                    border: over ? '1.5px solid rgba(239,68,68,0.4)' : '1px solid var(--border)',
                  }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${tint}22`, color: tint }}>
                      {Icon
                        ? <Icon size={18} />
                        : b.categoryIcon && b.categoryIcon.codePointAt(0)! > 127
                          ? <span style={{ fontSize: 18 }}>{b.categoryIcon}</span>
                          : <span className="text-xs font-bold">{b.categoryName[0]}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
                        {b.categoryName}
                      </div>
                      <div className="text-xs capitalize mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{b.period}</div>
                    </div>
                    <div className="text-base font-black" style={{ color, fontFamily: 'Poppins, sans-serif' }}>
                      {pct}%
                    </div>
                  </div>

                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      {formatUGX(b.spentAmount)}
                    </span>
                    <span style={{ color: 'var(--muted-foreground)' }}>of {formatUGX(b.limitAmount)}</span>
                  </div>

                  <div className="progress-track" style={{ height: 8 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color, transition: 'width 0.8s ease' }}/>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span style={{ color }}>
                      {over ? 'Over budget' : pct >= 70 ? 'Almost full' : 'On track'}
                    </span>
                    <span style={{ color: 'var(--muted-foreground)' }}>
                      {over
                        ? `${formatUGX(b.spentAmount - b.limitAmount)} over`
                        : `${formatUGX(b.limitAmount - b.spentAmount)} left`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {showNew && <NewBudgetModal onClose={() => setShowNew(false)} />}
    </div>
  )
}
