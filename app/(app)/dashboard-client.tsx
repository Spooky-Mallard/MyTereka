'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Eye, EyeOff, ChevronRight, Flame, Star, TrendingUp, TrendingDown } from 'lucide-react'
import { formatUGX } from '@/lib/format'
import { categoryMeta } from '@/lib/mock-data'

const LEVEL_XP: Record<string, number> = {
  'Beginner': 100, 'Saver': 300, 'Consistent': 700, 'Master': 1500, 'Grand Master': 1500,
}

const RING_R = 30
const RING_C = 2 * Math.PI * RING_R

function GoalRingMini({ pct }: { pct: number }) {
  const offset = RING_C * (1 - pct / 100)
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="goal-ring-svg">
      <circle cx="36" cy="36" r={RING_R} strokeWidth="6" className="goal-ring-bg" />
      <circle cx="36" cy="36" r={RING_R} strokeWidth="6"
        strokeDasharray={RING_C} strokeDashoffset={offset} className="goal-ring-fill" />
    </svg>
  )
}

function StreakDots({ streak }: { streak: number }) {
  const today     = new Date()
  const dayOfWeek = today.getDay()
  const labels    = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const dots      = labels.map((_, i) => i <= dayOfWeek && (dayOfWeek - i) < streak)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Flame size={16} style={{ color: 'var(--warning)' }} />
        <span className="text-sm font-bold" style={{ color: 'var(--warning)' }}>
          {streak}-day streak
        </span>
      </div>
      <div className="flex gap-1.5">
        {dots.map((active, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={active ? 'streak-dot' : 'streak-dot-empty'} />
            <span className="text-[9px]" style={{ color: 'var(--muted-foreground)' }}>{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type Props = {
  user: { name: string; level: string; xp: number; streak: number; lastActive: string | null }
  totalBalance: number
  recentTxns: Array<{
    id: string; type: string; amount: number; note: string | null
    date: string; categoryName: string; categoryIcon: string | null
    categoryColor: string | null; accountName: string
  }>
  budgets: Array<{
    id: string; limitAmount: number; spentAmount: number; period: string
    categoryName: string; categoryIcon: string | null; categoryColor: string | null
  }>
  goals: Array<{
    id: string; name: string; icon: string | null
    targetAmount: number; currentAmount: number; targetDate: string | null
  }>
}

export function DashboardClient({ user, totalBalance, recentTxns, budgets, goals }: Props) {
  const [hideBalance, setHideBalance] = useState(false)

  const totalIncome  = recentTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = recentTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const xpNext = LEVEL_XP[user.level] ?? 100
  const xpPct  = Math.min(100, Math.round((user.xp / xpNext) * 100))

  const firstName = user.name.split(' ')[0] ?? user.name
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            {greeting}, {firstName} 👋
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Here&apos;s how your money moved this month.
          </p>
        </div>
        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {new Date().toLocaleDateString('en-UG', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Balance card */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-white lg:col-span-2"
          style={{ background: 'var(--gradient-primary)', boxShadow: '0 8px 32px rgba(0,184,148,0.30)' }}
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full"
            style={{ background: 'rgba(255,255,255,0.10)', filter: 'blur(40px)' }} />

          <div className="relative flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium opacity-90">Total Balance</span>
              <button onClick={() => setHideBalance((h) => !h)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition hover:opacity-70"
                style={{ background: 'rgba(255,255,255,0.18)' }}>
                {hideBalance ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="text-4xl font-bold tracking-tight md:text-5xl"
              style={{ fontFamily: 'Poppins, sans-serif' }}>
              {hideBalance ? '• • • • • •' : formatUGX(totalBalance)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Income',   icon: TrendingUp,  value: totalIncome  },
                { label: 'Expenses', icon: TrendingDown, value: totalExpense },
              ].map(({ label, icon: Icon, value }) => (
                <div key={label} className="rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)' }}>
                  <div className="flex items-center gap-1.5 text-xs opacity-80">
                    <Icon size={13} /><span>{label}</span>
                  </div>
                  <div className="mt-1 text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {hideBalance ? '• • •' : formatUGX(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gamification panel */}
        <div className="flex flex-col gap-4 rounded-2xl p-5"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Level</div>
              <span className="level-badge mt-1">{user.level}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={14} style={{ color: 'var(--warning)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--warning)' }}>{user.xp} XP</span>
            </div>
          </div>
          <div>
            <div className="xp-bar"><div className="xp-bar-fill" style={{ width: `${xpPct}%` }} /></div>
            <div className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {user.xp} / {xpNext} XP
            </div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)' }}>
            <StreakDots streak={user.streak} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent transactions */}
        <section className="rounded-2xl p-6 lg:col-span-2"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Recent Transactions</h3>
            <Link href="/transactions"
              className="flex items-center gap-1 text-sm font-medium transition hover:opacity-70"
              style={{ color: 'var(--primary)' }}>
              See all <ChevronRight size={14} />
            </Link>
          </div>

          {recentTxns.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="text-4xl">💸</div>
              <div className="font-semibold" style={{ color: 'var(--foreground)' }}>No transactions yet</div>
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Tap + to log your first transaction
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-0">
              {recentTxns.map((t, i) => {
                const meta     = categoryMeta[t.categoryName]
                const Icon     = meta?.icon
                const isIncome = t.type === 'income'
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3"
                    style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: meta?.tint ? `${meta.tint}22` : t.categoryColor ? `${t.categoryColor}22` : 'var(--surface-alt)',
                        color: meta?.tint ?? t.categoryColor ?? 'var(--muted-foreground)',
                      }}>
                      {Icon && <Icon size={16} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                        {t.note || t.categoryName}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {t.categoryName} · {t.accountName}
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${isIncome ? 'amount-income' : 'amount-expense'}`}>
                      {isIncome ? '+' : '−'}{formatUGX(t.amount)}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Savings targets */}
        <section className="rounded-2xl p-6"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Savings Goals</h3>
            <Link href="/goals"
              className="flex items-center gap-1 text-sm font-medium transition hover:opacity-70"
              style={{ color: 'var(--primary)' }}>
              See all <ChevronRight size={14} />
            </Link>
          </div>

          {goals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="text-3xl">🎯</div>
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No goals yet</div>
              <Link href="/goals"
                className="mt-1 rounded-full px-4 py-1.5 text-xs font-semibold text-white"
                style={{ background: 'var(--primary)' }}>
                Create goal
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {goals.map((g) => {
                const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
                return (
                  <div key={g.id} className="flex items-center gap-3">
                    <div className="relative flex shrink-0 items-center justify-center">
                      <GoalRingMini pct={pct} />
                      <span className="absolute text-lg">{g.icon ?? '🎯'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        {g.name}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {formatUGX(g.currentAmount)} of {formatUGX(g.targetAmount)}
                      </div>
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{pct}%</div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Budget snapshot */}
      {budgets.length > 0 && (
        <section className="rounded-2xl p-6"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Budget Overview</h3>
            <Link href="/budgets"
              className="flex items-center gap-1 text-sm font-medium transition hover:opacity-70"
              style={{ color: 'var(--primary)' }}>
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {budgets.map((b) => {
              const pct   = Math.min(100, Math.round((b.spentAmount / b.limitAmount) * 100))
              const over  = b.spentAmount > b.limitAmount
              const color = over ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--success)'
              return (
                <div key={b.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: 'var(--foreground)' }}>{b.categoryName}</span>
                    <span style={{ color: over ? 'var(--danger)' : 'var(--muted-foreground)' }}>
                      {formatUGX(b.spentAmount)} / {formatUGX(b.limitAmount)}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
