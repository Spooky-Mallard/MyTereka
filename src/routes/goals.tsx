import { createFileRoute } from "@tanstack/react-router";
import { formatCurrency, goals } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Savings goals — FinWise" },
      { name: "description", content: "Track progress toward your savings goals." },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Savings goals</h1>
          <p className="text-sm text-muted-foreground">Stay on track with what matters most.</p>
        </div>
        <Button className="gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary-light">
          <Plus className="h-4 w-4" /> New goal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
          const remaining = Math.max(0, g.target - g.saved);
          return (
            <div key={g.id} className="rounded-2xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-2xl">
                  {g.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold">{g.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Target {new Date(g.deadline).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{pct}%</div>
                  <div className="text-xs text-muted-foreground">complete</div>
                </div>
              </div>

              <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Saved</div>
                  <div className="font-semibold">{formatCurrency(g.saved)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Remaining</div>
                  <div className="font-semibold">{formatCurrency(remaining)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Target</div>
                  <div className="font-semibold">{formatCurrency(g.target)}</div>
                </div>
              </div>

              <Button variant="outline" className="mt-5 w-full rounded-full">
                Add contribution
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
