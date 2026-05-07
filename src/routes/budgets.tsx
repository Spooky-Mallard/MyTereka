import { createFileRoute } from "@tanstack/react-router";
import { budgets, categoryMeta, formatCurrency } from "@/lib/mock-data";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/budgets")({
  head: () => ({
    meta: [
      { title: "Budgets — FinWise" },
      { name: "description", content: "Track spending limits across categories." },
    ],
  }),
  component: BudgetsPage,
});

function BudgetsPage() {
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overall = Math.round((totalSpent / totalLimit) * 100);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Budgets</h1>
          <p className="text-sm text-muted-foreground">Monthly spending limits</p>
        </div>
        <Button className="gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary-light">
          <Plus className="h-4 w-4" /> New budget
        </Button>
      </div>

      <section className="rounded-2xl bg-gradient-primary p-6 text-primary-foreground shadow-card">
        <div className="text-sm opacity-90">Total budget used</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold">{formatCurrency(totalSpent)}</span>
          <span className="text-sm opacity-80">of {formatCurrency(totalLimit)}</span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-white" style={{ width: `${Math.min(100, overall)}%` }} />
        </div>
        <div className="mt-2 text-xs opacity-90">{overall}% used this month</div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {budgets.map((b) => {
          const meta = categoryMeta[b.category];
          const Icon = meta?.icon ?? Plus;
          const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
          const over = b.spent > b.limit;
          return (
            <div key={b.id} className="rounded-2xl bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl"
                  style={{ background: `color-mix(in oklab, ${meta?.tint} 15%, transparent)`, color: meta?.tint }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="font-semibold">{b.category}</div>
                  <div className="text-xs capitalize text-muted-foreground">{b.period}</div>
                </div>
                {over && (
                  <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger">Over</span>
                )}
              </div>
              <div className="mt-4 flex items-baseline justify-between text-sm">
                <span className="font-semibold">{formatCurrency(b.spent)}</span>
                <span className="text-muted-foreground">of {formatCurrency(b.limit)}</span>
              </div>
              <Progress value={pct} className={`mt-2 ${over ? "[&>div]:bg-danger" : "[&>div]:bg-primary"}`} />
              <div className="mt-2 text-xs text-muted-foreground">
                {over ? `${formatCurrency(b.spent - b.limit)} over limit` : `${formatCurrency(b.limit - b.spent)} left`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
