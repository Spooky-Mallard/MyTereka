"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Eye, EyeOff, ChevronRight, Flame, Star, TrendingUp, TrendingDown,
} from "lucide-react";
import {
  balance, budgets, categoryMeta, formatCurrency, formatDateShort,
  mockGoals, mockUser, transactions, weekStreak,
} from "@/lib/mock-data";

/* ── Circular goal ring ── */
const RING_R = 30;
const RING_C = 2 * Math.PI * RING_R;

function GoalRingMini({ pct }: { pct: number }) {
  const offset = RING_C * (1 - pct / 100);
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="goal-ring-svg">
      <circle cx="36" cy="36" r={RING_R} strokeWidth="6" className="goal-ring-bg" />
      <circle cx="36" cy="36" r={RING_R} strokeWidth="6"
        strokeDasharray={RING_C} strokeDashoffset={offset} className="goal-ring-fill" />
    </svg>
  );
}

/* ── Weekly streak dots ── */
function StreakWidget({ streak, days }: { streak: number; days: boolean[] }) {
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Flame size={16} style={{ color: "var(--warning)" }} />
        <span className="text-sm font-bold" style={{ color: "var(--warning)" }}>
          {streak}-day streak
        </span>
      </div>
      <div className="flex gap-1.5">
        {days.map((active, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={active ? "streak-dot" : "streak-dot-empty"} />
            <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [hideBalance, setHideBalance] = useState(false);
  const recent = transactions.slice(0, 5);

  const xpPct = Math.round((mockUser.xp / mockUser.xpNext) * 100);

  const today = new Date("2026-05-09");
  const greeting = today.getHours() < 12
    ? "Good morning"
    : today.getHours() < 18
    ? "Good afternoon"
    : "Good evening";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: "var(--foreground)", fontFamily: "Poppins, sans-serif" }}
          >
            {greeting}, {mockUser.firstName} 👋
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Here&apos;s how your money moved this month.
          </p>
        </div>
        <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          {today.toLocaleDateString("en-UG", { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Balance card ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-white lg:col-span-2"
          style={{ background: "var(--gradient-primary)", boxShadow: "0 8px 32px rgba(0,184,148,0.30)" }}
        >
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full"
            style={{ background: "rgba(255,255,255,0.10)", filter: "blur(40px)" }} />
          <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)", filter: "blur(30px)" }} />

          <div className="relative flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium opacity-90">Total Balance</span>
              <button
                onClick={() => setHideBalance((h) => !h)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.18)" }}
                aria-label={hideBalance ? "Show balance" : "Hide balance"}
              >
                {hideBalance ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div className="text-4xl font-bold tracking-tight md:text-5xl" style={{ fontFamily: "Poppins, sans-serif" }}>
              {hideBalance ? "• • • • • •" : formatCurrency(balance.total)}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Income",   icon: TrendingUp,   value: balance.income },
                { label: "Expenses", icon: TrendingDown,  value: balance.expense },
              ].map(({ label, icon: Icon, value }) => (
                <div key={label}
                  className="rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.14)", backdropFilter: "blur(8px)" }}
                >
                  <div className="flex items-center gap-1.5 text-xs opacity-80">
                    <Icon size={13} /><span>{label}</span>
                  </div>
                  <div className="mt-1 text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>
                    {hideBalance ? "• • •" : formatCurrency(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Gamification panel ── */}
        <div
          className="flex flex-col gap-4 rounded-2xl p-5"
          style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
        >
          {/* XP + level */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Level</div>
              <span className="level-badge mt-1">{mockUser.level}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={14} style={{ color: "var(--warning)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--warning)" }}>
                {mockUser.xp} XP
              </span>
            </div>
          </div>

          {/* XP progress */}
          <div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
              {mockUser.xp} / {mockUser.xpNext} XP to Grand Master
            </div>
          </div>

          {/* Streak */}
          <div className="rounded-xl p-3" style={{ background: "var(--surface-alt)" }}>
            <StreakWidget streak={mockUser.streak} days={weekStreak} />
          </div>

          {/* Budget warning */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span style={{ color: "var(--muted-foreground)" }}>Monthly budget</span>
              <span style={{ color: "var(--warning)" }}>30% used — looks good!</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: "30%", background: "var(--success)" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Recent transactions ── */}
        <section
          className="rounded-2xl p-6 lg:col-span-2"
          style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Recent Transactions</h3>
            <Link
              href="/transactions"
              className="flex items-center gap-1 text-sm font-medium transition hover:opacity-70"
              style={{ color: "var(--primary)" }}
            >
              See all <ChevronRight size={14} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="text-4xl">💸</div>
              <div className="font-semibold" style={{ color: "var(--foreground)" }}>No transactions yet</div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>Tap + to log your first transaction</div>
            </div>
          ) : (
            <ul className="flex flex-col gap-0">
              {recent.map((t, i) => {
                const meta = categoryMeta[t.category];
                const Icon = meta?.icon;
                const isIncome = t.type === "income";
                return (
                  <li key={t.id}
                    className="flex items-center gap-3 py-3"
                    style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: meta?.tint ? `${meta.tint}22` : "var(--surface-alt)",
                        color: meta?.tint ?? "var(--muted-foreground)",
                      }}
                    >
                      {Icon && <Icon size={16} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {t.note || t.category}
                      </div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {t.category} · {formatDateShort(t.date)}
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${isIncome ? "amount-income" : "amount-expense"}`}>
                      {isIncome ? "+" : "−"}{formatCurrency(t.amount)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Savings targets ── */}
        <section
          className="rounded-2xl p-6"
          style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Savings Goals</h3>
            <Link
              href="/goals"
              className="flex items-center gap-1 text-sm font-medium transition hover:opacity-70"
              style={{ color: "var(--primary)" }}
            >
              See all <ChevronRight size={14} />
            </Link>
          </div>

          {mockGoals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="text-3xl">🎯</div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>No goals yet</div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {mockGoals.slice(0, 3).map((g) => {
                const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                return (
                  <div key={g.id} className="flex items-center gap-3">
                    <div className="relative flex shrink-0 items-center justify-center">
                      <GoalRingMini pct={pct} />
                      <span className="absolute text-lg">{g.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {g.name}
                      </div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {formatCurrency(g.current)} of {formatCurrency(g.target)}
                      </div>
                    </div>
                    <div className="text-sm font-bold" style={{ color: "var(--primary)" }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Budget snapshot ── */}
      <section
        className="rounded-2xl p-6"
        style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Budget Overview</h3>
          <Link
            href="/budgets"
            className="flex items-center gap-1 text-sm font-medium transition hover:opacity-70"
            style={{ color: "var(--primary)" }}
          >
            See all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.slice(0, 3).map((b) => {
            const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
            const over = b.spent > b.limit;
            const barColor = over
              ? "var(--danger)"
              : pct >= 70
              ? "var(--warning)"
              : "var(--success)";
            return (
              <div key={b.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium" style={{ color: "var(--foreground)" }}>{b.category}</span>
                  <span style={{ color: over ? "var(--danger)" : "var(--muted-foreground)" }}>
                    {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
