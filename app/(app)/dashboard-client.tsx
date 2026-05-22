'use client'

import Link from 'next/link'
import { useState, useTransition, useEffect } from 'react'
import { Eye, EyeOff, ChevronRight, Flame, Star, TrendingUp, TrendingDown, Sparkles, X, Wallet } from 'lucide-react'
import { formatUGX } from '@/lib/format'
import { categoryMeta } from '@/lib/mock-data'
import { UsernameSetupBanner } from '@/components/username-setup-banner'
import { markNotificationRead } from '@/lib/actions/notifications'
import { useSetRightRail } from '@/components/right-rail-context'
import type { NudgeCard } from '@/lib/actions/nudges'

const LEVEL_XP: Record<string, number> = {
  'Beginner': 100, 'Saver': 300, 'Consistent': 700, 'Master': 1500, 'Grand Master': 1500,
}

const RING_R = 30
const RING_C = 2 * Math.PI * RING_R

function GoalRingMini({ pct, color = 'var(--primary)' }: { pct: number; color?: string }) {
  const offset = RING_C * (1 - pct / 100)
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" className="goal-ring-svg">
      <circle cx="36" cy="36" r={RING_R} strokeWidth="6" className="goal-ring-bg" />
      <circle cx="36" cy="36" r={RING_R} strokeWidth="6"
        strokeDasharray={RING_C} strokeDashoffset={offset}
        className="goal-ring-fill" style={{ stroke: color }} />
    </svg>
  )
}

type Props = {
  user: { name: string; username: string | null; level: string; xp: number; streak: number; lastActive: string | null }
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
  nudges: NudgeCard[]
  dailyTip: { body: string; category: string | null } | null
}

function DashboardRightRail({ goals, budgets, user, xpNext, xpPct }: {
  goals: Props['goals']
  budgets: Props['budgets']
  user: Props['user']
  xpNext: number
  xpPct: number
}) {
  return (
    <>
      {/* Level + XP */}
      <div className="rail-card">
        <div className="eyebrow mb-3">Your Progress</div>
        <div className="flex items-center justify-between mb-2">
          <span className="level-badge">{user.level}</span>
          <div className="flex items-center gap-1">
            <Star size={13} style={{ color: 'var(--warning)' }} />
            <span className="text-xs font-bold" style={{ color: 'var(--warning)', fontFamily: 'Poppins, sans-serif' }}>
              {user.xp} XP
            </span>
          </div>
        </div>
        <div className="xp-bar"><div className="xp-bar-fill" style={{ width: `${xpPct}%` }} /></div>
        <div className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {user.xp} / {xpNext} XP to next level
        </div>
      </div>

      {/* Goals */}
      <div className="rail-card">
        <div className="flex items-center justify-between mb-3">
          <div className="eyebrow">Active Quests</div>
          <Link href="/goals" className="text-xs font-semibold transition hover:opacity-70"
            style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
            See all
          </Link>
        </div>
        {goals.length === 0 ? (
          <div className="py-4 text-center text-xs" style={{ color: 'var(--muted-foreground)' }}>
            No active goals
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
              return (
                <div key={g.id} className="flex items-center gap-3">
                  <div className="relative flex shrink-0 items-center justify-center">
                    <GoalRingMini pct={pct} />
                    <span className="absolute text-base">{g.icon ?? '🎯'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
                      {g.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {formatUGX(g.currentAmount)} / {formatUGX(g.targetAmount)}
                    </div>
                  </div>
                  <div className="text-sm font-bold" style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>{pct}%</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Budgets */}
      {budgets.length > 0 && (
        <div className="rail-card">
          <div className="flex items-center justify-between mb-3">
            <div className="eyebrow">Budgets</div>
            <Link href="/budgets" className="text-xs font-semibold transition hover:opacity-70"
              style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
              Adjust
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {budgets.map((b) => {
              const pct   = Math.min(100, Math.round((b.spentAmount / b.limitAmount) * 100))
              const over  = b.spentAmount > b.limitAmount
              const color = over ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--success)'
              return (
                <div key={b.id}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
                      {b.categoryName}
                    </span>
                    <span className="text-xs" style={{ color: over ? 'var(--danger)' : 'var(--muted-foreground)' }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

export function DashboardClient({ user, totalBalance, recentTxns, budgets, goals, nudges: initialNudges, dailyTip }: Props) {
  const [hideBalance, setHideBalance] = useState(true)
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set())
  const [, startDismiss] = useTransition()

  const xpNext = LEVEL_XP[user.level] ?? 100
  const xpPct  = Math.min(100, Math.round((user.xp / xpNext) * 100))

  useSetRightRail(
    <DashboardRightRail goals={goals} budgets={budgets} user={user} xpNext={xpNext} xpPct={xpPct} />
  )

  function dismissNudge(nudge: NudgeCard) {
    setDismissedNudges((prev) => new Set([...prev, nudge.id]))
    startDismiss(async () => {
      try { await markNotificationRead(nudge.notificationId) } catch { /* ignore */ }
    })
  }

  const visibleNudges = initialNudges.filter((n) => !dismissedNudges.has(n.id))

  const totalIncome  = recentTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = recentTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const firstName = user.name.split(' ')[0] ?? user.name
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  /* week streak dots */
  const today     = new Date()
  const dayOfWeek = today.getDay()
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const streakDots = dayLabels.map((_, i) => i <= dayOfWeek && (dayOfWeek - i) < user.streak)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <UsernameSetupBanner initialUsername={user.username} />

      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: 'var(--gradient-primary)' }}
        >
          {firstName[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{greeting} 👋</div>
          <div className="text-base font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            {firstName}
          </div>
        </div>
        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {new Date().toLocaleDateString('en-UG', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Nudges */}
      {visibleNudges.length > 0 && (
        <div className="flex flex-col gap-2">
          {visibleNudges.map((n) => (
            <div key={n.id}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'rgba(0,184,148,0.10)', border: '1px solid rgba(0,184,148,0.25)' }}>
              <Sparkles size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span className="flex-1 text-sm" style={{ color: 'var(--foreground)' }}>
                <span className="font-semibold">{n.actorName}</span>
                {n.actorUsername && (
                  <Link href={`/profile/${n.actorUsername}`} className="ml-1 text-xs hover:underline"
                    style={{ color: 'var(--primary)' }}>
                    @{n.actorUsername}
                  </Link>
                )}
                {' '}is cheering you on — keep your streak alive!
              </span>
              <button onClick={() => dismissNudge(n)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:opacity-70"
                style={{ color: 'var(--muted-foreground)' }} aria-label="Dismiss">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* HERO — streak card */}
      <Link href="/streak" style={{ textDecoration: 'none' }}>
        <div
          className="relative overflow-hidden rounded-[22px] p-4"
          style={{
            background: 'linear-gradient(160deg, #F59E0B 0%, #D97706 70%)',
            boxShadow: '0 12px 30px rgba(245,158,11,0.28)',
            color: '#fff',
          }}
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
            style={{ background: 'rgba(255,255,255,0.12)', filter: 'blur(30px)' }} />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px]"
              style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)' }}>
              <Flame size={36} strokeWidth={2.4} />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-85">Your streak</div>
              <div className="mt-0.5 leading-none" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 38, letterSpacing: '-0.02em' }}>
                {user.streak} <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.85 }}>days</span>
              </div>
              <div className="mt-1 text-[11px] opacity-90">
                Log today to keep it alive
              </div>
            </div>
          </div>

          {/* Week dots */}
          <div className="relative mt-3 flex justify-between">
            {streakDots.map((active, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div style={{
                  width: 10, height: 10, borderRadius: 9999,
                  background: active ? '#fff' : 'rgba(255,255,255,0.3)',
                  boxShadow: active ? '0 0 0 2px rgba(255,255,255,0.25)' : 'none',
                }} />
                <span style={{ fontSize: 9, fontFamily: 'Poppins, sans-serif', fontWeight: 600, opacity: 0.85 }}>
                  {dayLabels[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Link>

      {/* Balance — secondary */}
      <div className="flex items-center gap-4 rounded-[18px] p-4"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
          style={{ background: 'var(--gradient-primary)' }}>
          <Wallet size={20} strokeWidth={2} color="#fff" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
            Balance
          </div>
          <div className="mt-0.5 text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            {hideBalance ? '• • • • •' : formatUGX(totalBalance)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <div className="text-[11px] font-semibold" style={{ color: 'var(--success)' }}>
            + {hideBalance ? '• • •' : formatUGX(totalIncome)}
          </div>
          <div className="text-[11px] font-semibold" style={{ color: 'var(--danger)' }}>
            − {hideBalance ? '• • •' : formatUGX(totalExpense)}
          </div>
        </div>
        <button onClick={() => setHideBalance((h) => !h)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:opacity-70"
          style={{ background: 'var(--surface-alt)', color: 'var(--muted-foreground)' }}>
          {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {/* Goals — horizontal carousel */}
      {goals.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="eyebrow">Active Quests</div>
            <Link href="/goals" className="flex items-center gap-1 text-xs font-semibold transition hover:opacity-70"
              style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
              See all <ChevronRight size={11} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
              return (
                <Link key={g.id} href="/goals" style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <div className="relative overflow-hidden rounded-[16px] p-3 w-[130px]"
                    style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
                    <div className="pointer-events-none absolute -right-2 -top-2 h-12 w-12 rounded-full opacity-20"
                      style={{ background: 'var(--primary)' }} />
                    <div className="text-xl">{g.icon ?? '🎯'}</div>
                    <div className="mt-1.5 truncate text-xs font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
                      {g.name}
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-alt)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                    </div>
                    <div className="mt-1 text-xs font-bold" style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
                      {pct}%
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <section className="rounded-[18px] p-5" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="mb-3 flex items-center justify-between">
          <div className="eyebrow">Today's Moves</div>
          <Link href="/transactions" className="flex items-center gap-1 text-xs font-semibold transition hover:opacity-70"
            style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
            See all <ChevronRight size={11} />
          </Link>
        </div>

        {recentTxns.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="text-4xl">💸</div>
            <div className="font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>No transactions yet</div>
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Tap + to log your first transaction</div>
          </div>
        ) : (
          <ul className="flex flex-col">
            {recentTxns.map((t, i) => {
              const meta     = categoryMeta[t.categoryName]
              const Icon     = meta?.icon
              const tint     = meta?.tint ?? t.categoryColor ?? 'var(--muted-foreground)'
              const isIncome = t.type === 'income'
              return (
                <li key={t.id} className="flex items-center gap-3 py-2.5"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: `${tint}22`, color: tint }}>
                    {Icon ? <Icon size={15} /> : <span className="text-sm">{t.categoryName[0]}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      {t.note || t.categoryName}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {t.categoryName} · {t.accountName}
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${isIncome ? 'amount-income' : 'amount-expense'}`}
                    style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {isIncome ? '+' : '−'}{formatUGX(t.amount)}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Daily tip */}
      {dailyTip && (
        <div className="flex gap-3 items-start rounded-[18px] p-4"
          style={{ background: 'rgba(0,184,148,0.10)', border: '1px solid rgba(0,184,148,0.25)' }}>
          <div className="mt-0.5 shrink-0 text-lg">💡</div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
              Tip of the Day
            </div>
            <div className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{dailyTip.body}</div>
          </div>
        </div>
      )}
    </div>
  )
}
