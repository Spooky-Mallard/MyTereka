'use client'

import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { Lightbulb } from 'lucide-react'
import { formatUGX } from '@/lib/format'
import { categoryMeta } from '@/lib/mock-data'
import type { TransactionRow } from '@/lib/actions/transactions'

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

const PIE_COLORS = [
  '#00B894', '#F59E0B', '#EF4444', '#6366F1',
  '#EC4899', '#10B981', '#3B82F6', '#8B5CF6',
]

const financialTips: Record<Period, string> = {
  daily:   'Food is your biggest daily expense — try meal prepping with matooke and beans to cut 30% of costs.',
  weekly:  'Check weekly spending against your budget. Buying from local markets instead of supermarkets saves up to 40%.',
  monthly: 'Internet/Data costs add up. MTN offers bundles that cost less per GB when bought monthly.',
  yearly:  'Keep using your MTN MoMo savings consistently — small regular deposits compound over time.',
}

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

export function AnalyticsClient({ data }: { data: TransactionRow[] }) {
  const [period, setPeriod] = useState<Period>('monthly')

  const { barData, pieData, totalIncome, totalExpenses } = useMemo(() => {
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
      catMap.set(t.categoryName, (catMap.get(t.categoryName) ?? 0) + t.amount)
    }
    const pieData = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))

    const totalIncome   = data.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpenses = data.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    return { barData, pieData, totalIncome, totalExpenses }
  }, [data, period])

  const netSavings     = totalIncome - totalExpenses
  const totalExpForPct = pieData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            Analytics
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Visual overview of your finances
          </p>
        </div>
        <div className="flex rounded-full p-1" style={{ background: 'var(--surface-alt)' }}>
          {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className="rounded-full px-3 py-1.5 text-xs font-medium capitalize transition"
              style={period === p
                ? { background: 'var(--primary)', color: '#fff' }
                : { color: 'var(--muted-foreground)' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Income',   value: formatUGX(totalIncome),             color: 'var(--success)', bg: 'rgba(16,185,129,0.10)' },
          { label: 'Total Expenses', value: formatUGX(totalExpenses),           color: 'var(--danger)',  bg: 'rgba(239,68,68,0.10)' },
          { label: 'Net Savings',    value: formatUGX(Math.abs(netSavings)),     color: netSavings >= 0 ? 'var(--primary)' : 'var(--danger)', bg: netSavings >= 0 ? 'rgba(0,184,148,0.10)' : 'rgba(239,68,68,0.10)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-2xl p-4"
            style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="mb-2 inline-flex rounded-lg px-2 py-1 text-xs font-semibold"
              style={{ background: bg, color }}>
              {label}
            </div>
            <div className="text-lg font-bold" style={{ color, fontFamily: 'Poppins, sans-serif' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <h3 className="mb-4 font-semibold" style={{ color: 'var(--foreground)' }}>Income vs Expenses</h3>
        {barData.length === 0 ? (
          <div className="flex h-60 items-center justify-center text-sm"
            style={{ color: 'var(--muted-foreground)' }}>
            No data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} barGap={4} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false} tickLine={false} tickFormatter={fmtShort} />
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 12, color: 'var(--foreground)', fontSize: 13 }}
                formatter={(v: number, name: string) => [formatUGX(v), name === 'income' ? 'Income' : 'Expenses']}
              />
              <Bar dataKey="income"   fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" fill="#EF4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="mt-3 flex gap-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            <span className="h-3 w-3 rounded-full" style={{ background: '#10B981' }} />Income
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            <span className="h-3 w-3 rounded-full" style={{ background: '#EF4444' }} />Expenses
          </div>
        </div>
      </div>

      {/* Donut + category breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl p-6" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <h3 className="mb-4 font-semibold" style={{ color: 'var(--foreground)' }}>Spending by Category</h3>
          {pieData.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm"
              style={{ color: 'var(--muted-foreground)' }}>No expenses recorded</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 12, color: 'var(--foreground)', fontSize: 13 }}
                  formatter={(v: number) => [formatUGX(v)]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <h3 className="mb-4 font-semibold" style={{ color: 'var(--foreground)' }}>Category Breakdown</h3>
          {pieData.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm"
              style={{ color: 'var(--muted-foreground)' }}>No expenses recorded</div>
          ) : (
            <div className="flex flex-col gap-3">
              {pieData.slice(0, 6).map(({ name, value }, i) => {
                const meta = categoryMeta[name]
                const Icon = meta?.icon
                const pct  = totalExpForPct > 0 ? Math.round((value / totalExpForPct) * 100) : 0
                return (
                  <div key={name} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: meta?.tint ? `${meta.tint}22` : 'var(--surface-alt)',
                        color: meta?.tint ?? 'var(--muted-foreground)',
                      }}>
                      {Icon && <Icon size={14} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>{name}</span>
                        <span style={{ color: 'var(--muted-foreground)' }}>{pct}%</span>
                      </div>
                      <div className="progress-track" style={{ height: 6 }}>
                        <div className="progress-fill"
                          style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                    </div>
                    <div className="w-24 shrink-0 text-right text-xs font-semibold amount-expense">
                      {formatUGX(value)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Financial tip */}
      <div className="flex items-start gap-4 rounded-2xl p-5"
        style={{ background: 'rgba(0,184,148,0.10)', border: '1px solid rgba(0,184,148,0.25)' }}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'var(--primary)' }}>
          <Lightbulb size={18} color="#fff" />
        </div>
        <div>
          <div className="mb-1 text-sm font-bold" style={{ color: 'var(--primary)' }}>Financial Tip</div>
          <div className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
            {financialTips[period]}
          </div>
        </div>
      </div>
    </div>
  )
}
