"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  categoryMeta, formatCurrency, formatDate, groupByDate, transactions,
  type TxType,
} from "@/lib/mock-data";

type Filter = "all" | "income" | "expense";

export default function TransactionsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(
    () =>
      transactions
        .filter((t) => (filter === "all" ? true : t.type === filter))
        .filter((t) =>
          q ? `${t.note} ${t.category} ${t.account}`.toLowerCase().includes(q.toLowerCase()) : true,
        ),
    [filter, q],
  );

  const totalIncome  = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  const grouped = groupByDate(filtered);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: "var(--foreground)", fontFamily: "Poppins, sans-serif" }}
          >
            Transactions
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
            {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Income",   value: formatCurrency(totalIncome),  color: "var(--success)", bg: "rgba(16,185,129,0.10)", prefix: "+" },
          { label: "Expenses", value: formatCurrency(totalExpense), color: "var(--danger)",  bg: "rgba(239,68,68,0.10)",  prefix: "−" },
          { label: "Net",      value: formatCurrency(Math.abs(net)), color: net >= 0 ? "var(--success)" : "var(--danger)",
            bg: net >= 0 ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)", prefix: net >= 0 ? "+" : "−" },
        ].map(({ label, value, color, bg, prefix }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
            <div className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{label}</div>
            <div className="mt-1 text-base font-bold" style={{ color }}>
              {prefix}{value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
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
            className="mytereka-input rounded-full pl-9 text-sm"
            style={{ height: 40 }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted-foreground)" }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex rounded-full p-1" style={{ background: "var(--surface-alt)" }}>
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

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 rounded-2xl py-16 text-center"
          style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
            style={{ background: "var(--surface-alt)" }}
          >
            🔍
          </div>
          <div>
            <div className="font-semibold" style={{ color: "var(--foreground)" }}>No transactions found</div>
            <div className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
              Try adjusting your search or filter
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(({ label, items }) => (
            <div key={label}>
              <div
                className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--muted-foreground)" }}
              >
                {label}
              </div>
              <div
                className="overflow-hidden rounded-2xl"
                style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
              >
                {items.map((t, i) => {
                  const meta = categoryMeta[t.category];
                  const Icon = meta?.icon;
                  const isIncome = t.type === "income";
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-5 py-4 transition cursor-pointer hover:opacity-90"
                      style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: meta?.tint ? `${meta.tint}22` : "var(--surface-alt)",
                          color: meta?.tint ?? "var(--muted-foreground)",
                        }}
                      >
                        {Icon && <Icon size={18} />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {t.note || t.category}
                        </div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {t.category} · {t.account}
                        </div>
                      </div>
                      <div className={`text-sm font-semibold ${isIncome ? "amount-income" : "amount-expense"}`}>
                        {isIncome ? "+" : "−"}{formatCurrency(t.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
