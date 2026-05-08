import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { categoryMeta, formatCurrency, formatDate, transactions } from "@/lib/mock-data";
import { Plus, Search } from "lucide-react";

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
        .filter((t) =>
          q ? `${t.note} ${t.category}`.toLowerCase().includes(q.toLowerCase()) : true,
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [filter, q],
  );

  const totalIncome = list.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "var(--foreground)" }}>
            Transactions
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
            {list.length} entr{list.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <button
          className="flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
          style={{ background: "var(--primary)", boxShadow: "0 4px 12px rgba(79,70,229,0.30)" }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Add transaction
        </button>
      </div>

      {/* ── Summary chips ── */}
      <div className="flex flex-wrap gap-3">
        <div
          className="flex-1 min-w-[140px] rounded-2xl p-4"
          style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Total income</div>
          <div className="mt-1 text-xl font-bold" style={{ color: "var(--success)" }}>
            +{formatCurrency(totalIncome)}
          </div>
        </div>
        <div
          className="flex-1 min-w-[140px] rounded-2xl p-4"
          style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Total expenses</div>
          <div className="mt-1 text-xl font-bold" style={{ color: "var(--danger)" }}>
            -{formatCurrency(totalExpense)}
          </div>
        </div>
        <div
          className="flex-1 min-w-[140px] rounded-2xl p-4"
          style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Net</div>
          <div
            className="mt-1 text-xl font-bold"
            style={{ color: totalIncome - totalExpense >= 0 ? "var(--success)" : "var(--danger)" }}
          >
            {totalIncome - totalExpense >= 0 ? "+" : ""}{formatCurrency(totalIncome - totalExpense)}
          </div>
        </div>
      </div>

      {/* ── Filters bar ── */}
      <div
        className="flex flex-wrap items-center gap-3 rounded-2xl p-3"
        style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="relative flex-1 min-w-[180px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            size={15}
            style={{ color: "var(--muted-foreground)" }}
          />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search transactions…"
            className="finwise-input h-10 rounded-full pl-9 text-sm"
            style={{ height: 40 }}
          />
        </div>
        <div
          className="flex rounded-full p-1"
          style={{ background: "var(--surface-alt)" }}
        >
          {(["all", "income", "expense"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-full px-4 py-1.5 text-sm font-medium capitalize transition"
              style={
                filter === f
                  ? { background: "var(--card)", color: "var(--foreground)", boxShadow: "var(--shadow-sm)" }
                  : { color: "var(--muted-foreground)" }
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
      >
        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
              style={{ background: "var(--surface-alt)" }}
            >
              🔍
            </div>
            <div className="font-semibold" style={{ color: "var(--foreground)" }}>No transactions found</div>
            <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Try adjusting your search or filter.
            </div>
          </div>
        ) : (
          <ul>
            {list.map((t, i) => {
              const meta = categoryMeta[t.category];
              const Icon = meta?.icon ?? Plus;
              const isIncome = t.type === "income";
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 px-5 py-4 transition hover:opacity-90 cursor-pointer"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: meta?.tint
                        ? `color-mix(in srgb, ${meta.tint} 15%, transparent)`
                        : "var(--surface-alt)",
                      color: meta?.tint ?? "var(--muted-foreground)",
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {t.note}
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {t.category} · {formatDate(t.date)}
                    </div>
                  </div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: isIncome ? "var(--success)" : "var(--danger)" }}
                  >
                    {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
