'use client'

import { useState } from 'react'
import { Plus, AlertTriangle } from 'lucide-react'
import { formatUGX } from '@/lib/format'
import { categoryMeta } from '@/lib/mock-data'
import type { BudgetRow } from '@/lib/actions/budgets'

export function BudgetsClient({ data }: { data: BudgetRow[] }) {
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
          <button className="flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--primary)' }}>
            <Plus size={16} /> Create Budget
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((b) => {
            const meta  = categoryMeta[b.categoryName]
            const Icon  = meta?.icon
            const pct   = Math.min(100, Math.round((b.spentAmount / b.limitAmount) * 100))
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
    </div>
  )
}
