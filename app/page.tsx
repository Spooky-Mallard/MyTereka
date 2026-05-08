"use client";

import Link from "next/link";
import { Eye, EyeOff, ArrowDownLeft, ArrowUpRight, Plus, ArrowLeftRight as Transfer, ChevronRight } from "lucide-react";
import { useState } from "react";
import { balance, budgets, categoryMeta, formatCurrency, formatDate, transactions } from "@/lib/mock-data";

function BudgetBar({ pct, over }: { pct: number; over: boolean }) {
  const color = over ? "var(--danger)" : pct >= 70 ? "var(--warning)" : "var(--success)";
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function Dashboard() {
  const [hideBalance, setHideBalance] = useState(false);
  const recent = transactions.slice(0, 5);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "var(--foreground)" }}>
            Good morning, Alex 👋
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Here's how your money moved this month.
          </p>
        </div>
        <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Balance card */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-white lg:col-span-2"
          style={{ background: "var(--gradient-primary)", boxShadow: "0 8px 32px rgba(79,70,229,0.30)" }}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full" style={{ background: "rgba(255,255,255,0.10)", filter: "blur(40px)" }} />
          <div className="pointer-events-none absolute -bottom-8 left-1/3 h-40 w-40 rounded-full" style={{ background: "rgba(255,255,255,0.06)", filter: "blur(30px)" }} />
          <div className="relative flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium opacity-90">Total Balance</span>
              <button
                onClick={() => setHideBalance((h) => !h)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.15)" }}
                aria-label={hideBalance ? "Show balance" : "Hide balance"}
              >
                {hideBalance ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="text-4xl font-bold tracking-tight md:text-5xl">
              {hideBalance ? "••••••" : formatCurrency(balance.total)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Income", icon: ArrowDownLeft, value: balance.income },
                { label: "Expenses", icon: ArrowUpRight, value: balance.expense },
              ].map(({ label, icon: Icon, value }) => (
                <div key={label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
                  <div className="flex items-center gap-1.5 text-xs opacity-80">
                    <Icon size={14} /><span>{label}</span>
                  </div>
                  <div className="mt-1 text-xl font-semibold">
                    {hideBalance ? "••••" : formatCurrency(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-3 rounded-2xl p-5" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Quick actions</h3>
          {[
            { label: "Add income", sub: "Log money received", bg: "rgba(16,185,129,0.12)", fg: "var(--success)", icon: Plus },
            { label: "Add expense", sub: "Track a new purchase", bg: "rgba(239,68,68,0.12)", fg: "var(--danger)", icon: Plus },
            { label: "Transfer", sub: "Move between accounts", bg: "rgba(79,70,229,0.12)", fg: "var(--primary)", icon: Transfer },
          ].map(({ label, sub, bg, fg, icon: Icon }) => (
            <button key={label} className="flex items-center gap-3 rounded-xl p-3 text-left transition hover:opacity-80 active:scale-95" style={{ background: "var(--surface-alt)" }}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: bg, color: fg }}>
                <Icon size={16} />
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{label}</div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{sub}</div>
              </div>
              <ChevronRight size={14} style={{ color: "var(--muted-foreground)" }} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent transactions */}
        <section className="rounded-2xl p-6 lg:col-span-2" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Recent transactions</h3>
            <Link href="/transactions" className="flex items-center gap-1 text-sm font-medium transition hover:opacity-70" style={{ color: "var(--primary)" }}>
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <ul className="flex flex-col gap-0">
            {recent.map((t, i) => {
              const meta = categoryMeta[t.category];
              const Icon = meta?.icon ?? Plus;
              const isIncome = t.type === "income";
              return (
                <li key={t.id} className="flex items-center gap-3 py-3" style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: meta?.tint ? `color-mix(in srgb, ${meta.tint} 15%, transparent)` : "var(--surface-alt)", color: meta?.tint ?? "var(--muted-foreground)" }}>
                    <Icon size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium" style={{ color: "var(--foreground)" }}>{t.note}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t.category} · {formatDate(t.date)}</div>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: isIncome ? "var(--success)" : "var(--danger)" }}>
                    {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Budget snapshot */}
        <section className="rounded-2xl p-6" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>My budgets</h3>
            <Link href="/budgets" className="flex items-center gap-1 text-sm font-medium transition hover:opacity-70" style={{ color: "var(--primary)" }}>
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {budgets.slice(0, 4).map((b) => {
              const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
              const over = b.spent > b.limit;
              return (
                <div key={b.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: "var(--foreground)" }}>{b.category}</span>
                    <span style={{ color: over ? "var(--danger)" : "var(--muted-foreground)" }}>
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                    </span>
                  </div>
                  <BudgetBar pct={pct} over={over} />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
