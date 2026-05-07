import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { categoryMeta, formatCurrency, formatDate, transactions } from "@/lib/mock-data";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — FinWise" },
      { name: "description", content: "Browse and filter your income and expenses." },
    ],
  }),
  component: TransactionsPage,
});

type Filter = "all" | "income" | "expense";

function TransactionsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const list = useMemo(
    () =>
      transactions
        .filter((t) => (filter === "all" ? true : t.type === filter))
        .filter((t) => (q ? `${t.note} ${t.category}`.toLowerCase().includes(q.toLowerCase()) : true))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [filter, q],
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Transactions</h1>
          <p className="text-sm text-muted-foreground">{list.length} entries</p>
        </div>
        <Button className="gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary-light">
          <Plus className="h-4 w-4" /> Add transaction
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="h-10 rounded-full bg-secondary pl-9 border-transparent" />
        </div>
        <div className="flex rounded-full bg-secondary p-1">
          {(["all", "income", "expense"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ul className="divide-y rounded-2xl bg-card shadow-card">
        {list.map((t) => {
          const meta = categoryMeta[t.category];
          const Icon = meta?.icon ?? Plus;
          return (
            <li key={t.id} className="flex items-center gap-3 px-5 py-4">
              <span
                className="grid h-11 w-11 place-items-center rounded-xl"
                style={{ background: `color-mix(in oklab, ${meta?.tint} 15%, transparent)`, color: meta?.tint }}
              >
                <Icon className="h-5 w-5" />
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
        {list.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-muted-foreground">No transactions match your filters.</li>
        )}
      </ul>
    </div>
  );
}
