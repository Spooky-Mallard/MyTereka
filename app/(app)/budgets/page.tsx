import { budgets, categoryMeta, formatCurrency } from "@/lib/mock-data";
import { Plus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Budgets", description: "Track spending limits across categories." };

function getBudgetColor(pct: number, over: boolean) {
  if (over) return "var(--danger)";
  if (pct >= 70) return "var(--warning)";
  return "var(--success)";
}

export default function BudgetsPage() {
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overall = Math.round((totalSpent / totalLimit) * 100);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "var(--foreground)" }}>Budgets</h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>Monthly spending limits</p>
        </div>
        <button className="flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
          style={{ background: "var(--primary)", boxShadow: "0 4px 12px rgba(79,70,229,0.30)" }}>
          <Plus size={16} strokeWidth={2.5} /> New budget
        </button>
      </div>

      {/* Overview banner */}
      <section className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: "var(--gradient-primary)", boxShadow: "0 8px 32px rgba(79,70,229,0.30)" }}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full" style={{ background: "rgba(255,255,255,0.08)", filter: "blur(32px)" }} />
        <div className="relative">
          <div className="text-sm font-medium opacity-80">Total budget used</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatCurrency(totalSpent)}</span>
            <span className="text-sm opacity-70">of {formatCurrency(totalLimit)}</span>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.20)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, overall)}%`, background: "rgba(255,255,255,0.90)" }} />
          </div>
          <div className="mt-2 text-sm opacity-80">{overall}% used this month</div>
        </div>
      </section>

      {/* Budget cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {budgets.map((b) => {
          const meta = categoryMeta[b.category];
          const Icon = meta?.icon ?? Plus;
          const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
          const over = b.spent > b.limit;
          const barColor = getBudgetColor(pct, over);
          return (
            <div key={b.id} className="rounded-2xl p-5 cursor-pointer" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: meta?.tint ? `color-mix(in srgb, ${meta.tint} 15%, transparent)` : "var(--surface-alt)", color: meta?.tint ?? "var(--muted-foreground)" }}>
                  <Icon size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold" style={{ color: "var(--foreground)" }}>{b.category}</div>
                  <div className="text-xs capitalize" style={{ color: "var(--muted-foreground)" }}>{b.period}</div>
                </div>
                {over && (
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}>
                    Over limit
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-baseline justify-between text-sm">
                <span className="font-bold text-base" style={{ color: "var(--foreground)" }}>{formatCurrency(b.spent)}</span>
                <span style={{ color: "var(--muted-foreground)" }}>of {formatCurrency(b.limit)}</span>
              </div>
              <div className="progress-track mt-2">
                <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                <span style={{ color: barColor }}>{pct}%</span>
                <span>{over ? `${formatCurrency(b.spent - b.limit)} over` : `${formatCurrency(b.limit - b.spent)} left`}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
