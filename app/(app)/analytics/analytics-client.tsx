'use client'

import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'
import { formatUGX } from '@/lib/format'
import { categoryMeta } from '@/lib/mock-data'
import { useSetRightRail } from '@/components/right-rail-context'
import type { TransactionRow } from '@/lib/actions/transactions'

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

const PIE_COLORS = [
  '#00B894', '#F59E0B', '#EF4444', '#6366F1',
  '#EC4899', '#10B981', '#3B82F6', '#8B5CF6',
]

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function fmtShort(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
  if (v >= 1000)    return `${(v / 1000).toFixed(0)}K`
  return v.toString()
}

function getWeekStart(d: Date) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const m = new Date(d)
  m.setDate(diff)
  return m.toISOString().split('T')[0]
}

function CategoryBreakdown({
  pieData, totalExpForPct,
}: {
  pieData: { name: string; value: number }[]
  totalExpForPct: number
}) {
  if (pieData.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
        No expenses recorded
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {pieData.slice(0, 8).map(({ name, value }, i) => {
        const meta = categoryMeta[name]
        const Icon = meta?.icon
        const tint = meta?.tint ?? PIE_COLORS[i % PIE_COLORS.length]
        const pct  = totalExpForPct > 0 ? Math.round((value / totalExpForPct) * 100) : 0
        return (
          <div key={name} className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${tint}22`, color: tint }}>
              {Icon ? <Icon size={14} /> : <span className="text-xs">{name[0]}</span>}
            </span>
            <div className="flex-1 min-w-0">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>{name}</span>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{pct}%</span>
              </div>
              <div className="progress-track" style={{ height: 5 }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
              </div>
            </div>
            <div className="w-20 shrink-0 text-right text-xs font-bold amount-expense" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {formatUGX(value)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AnalyticsRightRail({
  pieData, totalExpForPct, topCategory, totalIncome, totalExpenses,
}: {
  pieData: { name: string; value: number }[]
  totalExpForPct: number
  topCategory: string | null
  totalIncome: number
  totalExpenses: number
}) {
  return (
    <>
      {/* Income vs Expense summary */}
      <div className="rail-card">
        <div className="eyebrow mb-3">This Period</div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.10)' }}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(16,185,129,0.18)' }}>
              <TrendingUp size={14} style={{ color: 'var(--success)' }} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--success)' }}>Income</div>
              <div className="text-sm font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
                {formatUGX(totalIncome)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.10)' }}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(239,68,68,0.18)' }}>
              <TrendingDown size={14} style={{ color: 'var(--danger)' }} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--danger)' }}>Expenses</div>
              <div className="text-sm font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
                {formatUGX(totalExpenses)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="rail-card">
        <div className="eyebrow mb-3">Where It Went</div>
        <CategoryBreakdown pieData={pieData} totalExpForPct={totalExpForPct} />
      </div>

      {/* Insight */}
      {topCategory && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🎯</span>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--warning)', fontFamily: 'Poppins, sans-serif' }}>Insight</span>
          </div>
          <div className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            {topCategory} is your top expense
          </div>
          <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Review your {topCategory.toLowerCase()} spend to find savings opportunities.
          </div>
        </div>
      )}
    </>
  )
}

export function AnalyticsClient({ data }: { data: TransactionRow[] }) {
  const [period, setPeriod] = useState<Period>('monthly')

  const { barData, pieData, totalIncome, totalExpenses, totalExpForPct, sparkPoints, daySpend } = useMemo(() => {
    const barMap = new Map<string, { income: number; expenses: number }>()

    for (const t of data) {
      const d = new Date(t.date)
      let key: string
      if (period === 'daily') {
        key = d.toLocaleDateString('en-UG', { weekday: 'short' })
      } else if (period === 'weekly') {
        key = `Wk ${getWeekStart(d).slice(5, 7)}/${getWeekStart(d).slice(8, 10)}`
      } else if (period === 'monthly') {
        key = d.toLocaleDateString('en-UG', { month: 'short' })
      } else {
        key = d.getFullYear().toString()
      }
      if (!barMap.has(key)) barMap.set(key, { income: 0, expenses: 0 })
      const entry = barMap.get(key)!
      if (t.type === 'income')  entry.income   += t.amount
      if (t.type === 'expense') entry.expenses += t.amount
    }

    const barData = Array.from(barMap.entries()).map(([name, v]) => ({ name, ...v }))

    const catMap = new Map<string, number>()
    for (const t of data.filter((t) => t.type === 'expense')) {
      const name = t.categoryName ?? 'Uncategorized'
      catMap.set(name, (catMap.get(name) ?? 0) + t.amount)
    }
    const pieData = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))

    const totalIncome   = data.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpenses = data.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const totalExpForPct = pieData.reduce((s, d) => s + d.value, 0)

    /* sparkline: daily cumulative savings over last 30 points */
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
    let running = 0
    const sparkMap = new Map<string, number>()
    for (const t of sorted) {
      if (t.type === 'income')  running += t.amount
      if (t.type === 'expense') running -= t.amount
      sparkMap.set(t.date, running)
    }
    const sparkPoints = Array.from(sparkMap.values()).slice(-30)

    /* day-of-week spend totals: 0=Mon…6=Sun */
    const dayTotals = [0, 0, 0, 0, 0, 0, 0]
    for (const t of data.filter((t) => t.type === 'expense')) {
      const jsDay = new Date(t.date).getDay() // 0=Sun
      const monIdx = (jsDay + 6) % 7           // shift so Mon=0
      dayTotals[monIdx] += t.amount
    }
    const maxDay = Math.max(...dayTotals, 1)
    const daySpend = dayTotals.map((v) => v / maxDay)

    return { barData, pieData, totalIncome, totalExpenses, totalExpForPct, sparkPoints, daySpend }
  }, [data, period])

  const netSavings   = totalIncome - totalExpenses
  const savingsRate  = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0
  const topCategory  = pieData[0]?.name ?? null
  const spendyDayIdx = daySpend.indexOf(Math.max(...daySpend))

  /* sparkline SVG path */
  const sparkPath = useMemo(() => {
    if (sparkPoints.length < 2) return ''
    const minV = Math.min(...sparkPoints)
    const maxV = Math.max(...sparkPoints, minV + 1)
    const W = 300, H = 44
    const pts = sparkPoints.map((v, i) => {
      const x = (i / (sparkPoints.length - 1)) * W
      const y = H - 4 - ((v - minV) / (maxV - minV)) * (H - 8)
      return [x, y]
    })
    const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
    const fill = `${line} L${W},${H} L0,${H} Z`
    return { line, fill }
  }, [sparkPoints])

  useSetRightRail(
    <AnalyticsRightRail
      pieData={pieData}
      totalExpForPct={totalExpForPct}
      topCategory={topCategory}
      totalIncome={totalIncome}
      totalExpenses={totalExpenses}
    />
  )

  const periodLabels: Record<Period, string> = {
    daily: 'Week', weekly: 'Month', monthly: 'Year', yearly: 'All time',
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {/* Header + period pills */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
          Analytics
        </h1>
        <div className="flex rounded-full p-1 gap-1" style={{ background: 'var(--surface-alt)' }}>
          {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition"
              style={period === p
                ? { background: 'var(--primary)', color: '#fff', fontFamily: 'Poppins, sans-serif' }
                : { color: 'var(--muted-foreground)', fontFamily: 'Poppins, sans-serif' }}>
              {p === 'daily' ? 'Week' : p === 'weekly' ? 'Month' : p === 'monthly' ? 'Year' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* HERO — savings card with sparkline */}
      <div
        className="relative overflow-hidden rounded-[22px] p-5"
        style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-cta)', color: '#fff' }}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
          style={{ background: 'rgba(255,255,255,0.12)', filter: 'blur(30px)' }} />
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-85">You saved</div>
          <div className="mt-1.5 text-4xl font-bold leading-none tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {formatUGX(Math.abs(netSavings))}
          </div>
          {savingsRate > 0 && (
            <div className="mt-1 text-xs opacity-90">
              That's <strong>{savingsRate}%</strong> of what you earned
            </div>
          )}

          {/* Sparkline */}
          {sparkPath && (
            <>
              <svg width="100%" height="44" viewBox="0 0 300 44" preserveAspectRatio="none" style={{ marginTop: 12 }}>
                <defs>
                  <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={sparkPath.fill} fill="url(#sparkFill)" />
                <path d={sparkPath.line} fill="none" stroke="#fff" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex justify-between" style={{ fontFamily: 'Poppins, sans-serif', fontSize: 9, fontWeight: 600, opacity: 0.8 }}>
                <span>Earlier</span><span>Today</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Income vs Expense cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[16px] p-4" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{ background: 'rgba(16,185,129,0.18)' }}>
              <TrendingUp size={12} style={{ color: 'var(--success)' }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--success)' }}>Income</span>
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            {formatUGX(totalIncome)}
          </div>
        </div>
        <div className="rounded-[16px] p-4" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{ background: 'rgba(239,68,68,0.18)' }}>
              <TrendingDown size={12} style={{ color: 'var(--danger)' }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--danger)' }}>Expenses</span>
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            {formatUGX(totalExpenses)}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-[18px] p-5" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="mb-4 text-sm font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
          Income vs Expenses
        </div>
        {barData.length === 0 ? (
          <div className="flex h-52 items-center justify-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            No data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barGap={4} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'Poppins, sans-serif' }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false} tickLine={false} tickFormatter={fmtShort} />
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 12, color: 'var(--foreground)', fontSize: 12 }}
                formatter={(v: number, name: string) => [formatUGX(v), name === 'income' ? 'Income' : 'Expenses']}
              />
              <Bar dataKey="income"   fill="var(--success)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" fill="var(--danger)"  radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="mt-2 flex gap-4">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--success)' }} />Income
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--danger)' }} />Expenses
          </div>
        </div>
      </div>

      {/* Day-of-week heat strip */}
      <div className="rounded-[18px] p-5" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="eyebrow mb-1">Your Spendiest Day</div>
        {daySpend.some((v) => v > 0) ? (
          <>
            <div className="mb-3 text-base font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
              {DAY_LABELS[spendyDayIdx]}
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {daySpend.map((intensity, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="w-full rounded-lg" style={{
                    aspectRatio: '1',
                    background: `rgba(239,68,68,${Math.max(0.08, intensity * 0.75)})`,
                    border: i === spendyDayIdx ? '1.5px solid var(--danger)' : '1px solid transparent',
                  }} />
                  <div className="text-[9px] font-semibold" style={{
                    color: i === spendyDayIdx ? 'var(--danger)' : 'var(--muted-foreground)',
                    fontFamily: 'Poppins, sans-serif',
                  }}>
                    {DAY_LABELS[i].slice(0, 3)}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No expense data yet</div>
        )}
      </div>

      {/* Insight card */}
      {topCategory && (
        <div className="flex gap-3 items-start rounded-[16px] p-4"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="mt-0.5 text-xl">🎯</div>
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
              {topCategory} is your top expense
            </div>
            <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              Review your {topCategory.toLowerCase()} spending to find opportunities to save.
            </div>
          </div>
        </div>
      )}

      {/* Donut chart (kept per user request) + category breakdown — mobile only */}
      <div className="xl:hidden rounded-[18px] p-5" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="mb-4 text-sm font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
          Spending by Category
        </div>
        {pieData.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            No expenses recorded
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 12, color: 'var(--foreground)', fontSize: 12 }}
                  formatter={(v: number) => [formatUGX(v)]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4">
              <CategoryBreakdown pieData={pieData} totalExpForPct={totalExpForPct} />
            </div>
          </>
        )}
      </div>

      {/* Donut chart on desktop — always show in main column */}
      <div className="hidden xl:block rounded-[18px] p-5" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="mb-4 text-sm font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
          Spending by Category
        </div>
        {pieData.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            No expenses recorded
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 12, color: 'var(--foreground)', fontSize: 12 }}
                formatter={(v: number) => [formatUGX(v)]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
