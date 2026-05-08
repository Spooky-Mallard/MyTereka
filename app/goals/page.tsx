import { formatCurrency, goals } from "@/lib/mock-data";
import { Plus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Savings Goals", description: "Track progress toward your savings goals." };

const RING_R = 42;
const RING_CIRC = 2 * Math.PI * RING_R;

function GoalRing({ pct }: { pct: number }) {
  const offset = RING_CIRC * (1 - pct / 100);
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="goal-ring-svg">
      <circle cx="48" cy="48" r={RING_R} strokeWidth="8" className="goal-ring-bg" />
      <circle cx="48" cy="48" r={RING_R} strokeWidth="8" strokeDasharray={RING_CIRC} strokeDashoffset={offset} className="goal-ring-fill" />
    </svg>
  );
}

export default function GoalsPage() {
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "var(--foreground)" }}>Savings goals</h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>Stay on track with what matters most.</p>
        </div>
        <button className="flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
          style={{ background: "var(--primary)", boxShadow: "0 4px 12px rgba(79,70,229,0.30)" }}>
          <Plus size={16} strokeWidth={2.5} /> New goal
        </button>
      </div>

      {/* Summary banner */}
      <div className="flex flex-wrap items-center gap-6 rounded-2xl p-6" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
        {[
          { label: "Total saved", value: formatCurrency(totalSaved), color: "var(--success)" },
          { label: "Total target", value: formatCurrency(totalTarget), color: "var(--foreground)" },
          { label: "Overall progress", value: `${Math.round((totalSaved / totalTarget) * 100)}%`, color: "var(--primary)" },
        ].map(({ label, value, color }, i) => (
          <div key={label} className="flex items-center gap-6">
            {i > 0 && <div className="h-10 w-px hidden sm:block" style={{ background: "var(--border)" }} />}
            <div>
              <div className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{label}</div>
              <div className="mt-1 text-2xl font-bold" style={{ color }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Goal cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
          const remaining = Math.max(0, g.target - g.saved);
          const deadline = new Date(g.deadline);
          const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86400000);
          return (
            <div key={g.id} className="rounded-2xl p-6 cursor-pointer" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-4">
                <div className="relative flex shrink-0 items-center justify-center">
                  <GoalRing pct={pct} />
                  <span className="absolute text-2xl">{g.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{g.name}</div>
                  <div className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Target {deadline.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>
                  <div className="mt-1 text-xs font-medium" style={{ color: daysLeft < 30 ? "var(--danger)" : "var(--muted-foreground)" }}>
                    {daysLeft > 0 ? `${daysLeft} days left` : "Deadline passed"}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-bold" style={{ color: "var(--primary)" }}>{pct}%</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>complete</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl p-3 text-center" style={{ background: "var(--surface-alt)" }}>
                {[
                  { label: "Saved", value: formatCurrency(g.saved), color: "var(--success)" },
                  { label: "Remaining", value: formatCurrency(remaining), color: "var(--foreground)" },
                  { label: "Target", value: formatCurrency(g.target), color: "var(--primary)" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</div>
                    <div className="mt-0.5 text-sm font-semibold" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full rounded-full border py-2.5 text-sm font-semibold transition hover:opacity-80 active:scale-95"
                style={{ borderColor: "var(--primary)", color: "var(--primary)", background: "transparent" }}>
                Add contribution
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
