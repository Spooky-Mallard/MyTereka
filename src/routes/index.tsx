import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, ArrowDownLeft, ArrowUpRight, Plus, ArrowLeftRight as Transfer } from "lucide-react";
import { balance, budgets, categoryMeta, formatCurrency, formatDate, transactions } from "@/lib/mock-data";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — FinWise" },
      { name: "description", content: "Overview of balance, recent transactions and budgets." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const recent = transactions.slice(0, 5);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Good morning, Alex 👋</h1>
          <p className="text-sm text-muted-foreground">Here's how your money moved this month.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-6 text-primary-foreground shadow-card lg:col-span-2">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-6">
            <div className="flex items-center justify-between text-sm/none opacity-90">
              <span>Total balance</span>
              <Eye className="h-4 w-4" />
            </div>
            <div className="text-4xl font-bold tracking-tight md:text-5xl">{formatCurrency(balance.total)}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-xs opacity-90">
                  <ArrowDownLeft className="h-4 w-4" /> Income
                </div>
                <div className="mt-1 text-xl font-semibold">{formatCurrency(balance.income)}</div>
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-xs opacity-90">
                  <ArrowUpRight className="h-4 w-4" /> Expenses
                </div>
                <div className="mt-1 text-xl font-semibold">{formatCurrency(balance.expense)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-card p-6 shadow-card">
          <h3 className="text-base font-semibold">Quick actions</h3>
          <button className="flex items-center gap-3 rounded-xl bg-secondary p-3 text-left transition hover:bg-accent">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-success/15 text-success">
              <Plus className="h-4 w-4" />
            </span>
            <div className="text-sm">
              <div className="font-medium">Add income</div>
              <div className="text-xs text-muted-foreground">Log money you received</div>
            </div>
          </button>
          <button className="flex items-center gap-3 rounded-xl bg-secondary p-3 text-left transition hover:bg-accent">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-danger/15 text-danger">
              <Plus className="h-4 w-4" />
            </span>
            <div className="text-sm">
              <div className="font-medium">Add expense</div>
              <div className="text-xs text-muted-foreground">Track a new purchase</div>
            </div>
          </button>
          <button className="flex items-center gap-3 rounded-xl bg-secondary p-3 text-left transition hover:bg-accent">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
              <Transfer className="h-4 w-4" />
            </span>
            <div className="text-sm">
              <div className="font-medium">Transfer</div>
              <div className="text-xs text-muted-foreground">Move between accounts</div>
            </div>
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl bg-card p-6 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Recent transactions</h3>
            <Link to="/transactions" className="text-sm font-medium text-primary hover:underline">
              See all
            </Link>
          </div>
          <ul className="divide-y">
            {recent.map((t) => {
              const meta = categoryMeta[t.category];
              const Icon = meta?.icon ?? Plus;
              return (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-xl"
                    style={{ background: `color-mix(in oklab, ${meta?.tint} 15%, transparent)`, color: meta?.tint }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{t.note}</div>
                    <div className="text-xs text-muted-foreground">{t.category} · {formatDate(t.date)}</div>
                  </div>
                  <div className={`text-sm font-semibold ${t.type === "income" ? "text-success" : "text-foreground"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">My budgets</h3>
            <Link to="/budgets" className="text-sm font-medium text-primary hover:underline">See all</Link>
          </div>
          <div className="flex flex-col gap-4">
            {budgets.slice(0, 4).map((b) => {
              const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
              const over = b.spent > b.limit;
              return (
                <div key={b.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{b.category}</span>
                    <span className={over ? "text-danger" : "text-muted-foreground"}>
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                    </span>
                  </div>
                  <Progress value={pct} className={over ? "[&>div]:bg-danger" : "[&>div]:bg-primary"} />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
