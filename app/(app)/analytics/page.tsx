"use client";

import { useState } from "react";
import { categoryMeta, formatCurrency, transactions, balance } from "@/lib/mock-data";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { Lightbulb } from "lucide-react";

type Period = "daily" | "weekly" | "monthly" | "yearly";

/* Teal + amber palette matching design system */
const PIE_COLORS = [
  "#00B894", "#F59E0B", "#EF4444", "#6366F1",
  "#EC4899", "#10B981", "#3B82F6", "#8B5CF6",
];

const barDataByPeriod: Record<Period, Array<{ name: string; income: number; expenses: number }>> = {
  daily: [
    { name: "Mon", income: 0,      expenses: 45000 },
    { name: "Tue", income: 150000, expenses: 30000 },
    { name: "Wed", income: 0,      expenses: 12000 },
    { name: "Thu", income: 0,      expenses: 78000 },
    { name: "Fri", income: 0,      expenses: 55000 },
    { name: "Sat", income: 0,      expenses: 25000 },
    { name: "Sun", income: 0,      expenses: 0 },
  ],
  weekly: [
    { name: "Wk 1", income: 300000, expenses: 180000 },
    { name: "Wk 2", income: 150000, expenses: 95000 },
    { name: "Wk 3", income: 850000, expenses: 120000 },
    { name: "Wk 4", income: 0,      expenses: 45000 },
  ],
  monthly: [
    { name: "Jan", income: 900000,  expenses: 450000 },
    { name: "Feb", income: 850000,  expenses: 380000 },
    { name: "Mar", income: 1050000, expenses: 510000 },
    { name: "Apr", income: 970000,  expenses: 290000 },
    { name: "May", income: 1300000, expenses: 340000 },
  ],
  yearly: [
    { name: "2022", income: 7200000,  expenses: 5100000 },
    { name: "2023", income: 9500000,  expenses: 6800000 },
    { name: "2024", income: 11200000, expenses: 7400000 },
    { name: "2025", income: 12800000, expenses: 8200000 },
    { name: "2026", income: 6500000,  expenses: 1700000 },
  ],
};

const financialTips: Record<Period, string> = {
  daily:   "Food is your biggest daily expense — try meal prepping with matooke and beans to cut 30% of costs.",
  weekly:  "You spent 40% on food this week. Consider buying from local markets instead of supermarkets.",
  monthly: "Internet/Data is 9% of monthly expenses. MTN offers bundles that cost less per GB when bought monthly.",
  yearly:  "Your savings rate improved by 12% this year. Keep using your MTN MoMo savings consistently.",
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("monthly");

  const expensesByCat = transactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.entries(expensesByCat)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const totalExpenses = pieData.reduce((s, d) => s + d.value, 0);
  const netSavings = balance.income - balance.expense;

  const fmt = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
    return v.toString();
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      {/* Header + period tabs */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: "var(--foreground)", fontFamily: "Poppins, sans-serif" }}
          >
            Analytics
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Visual overview of your finances
          </p>
        </div>
        <div className="flex rounded-full p-1" style={{ background: "var(--surface-alt)" }}>
          {(["daily", "weekly", "monthly", "yearly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="rounded-full px-3 py-1.5 text-xs font-medium capitalize transition"
              style={
                period === p
                  ? { background: "var(--primary)", color: "#fff" }
                  : { color: "var(--muted-foreground)" }
              }
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Income",   value: formatCurrency(balance.income),  color: "var(--success)", bg: "rgba(16,185,129,0.10)" },
          { label: "Total Expenses", value: formatCurrency(balance.expense), color: "var(--danger)",  bg: "rgba(239,68,68,0.10)" },
          { label: "Net Savings",    value: formatCurrency(netSavings),      color: "var(--primary)", bg: "rgba(0,184,148,0.10)" },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
          >
            <div
              className="mb-2 inline-flex rounded-lg px-2 py-1 text-xs font-semibold"
              style={{ background: bg, color }}
            >
              {label}
            </div>
            <div className="text-lg font-bold" style={{ color, fontFamily: "Poppins, sans-serif" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="mb-4 font-semibold" style={{ color: "var(--foreground)" }}>Income vs Expenses</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barDataByPeriod[period]} barGap={4} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmt}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--foreground)",
                fontSize: 13,
              }}
              formatter={(v: number, name: string) => [formatCurrency(v), name === "income" ? "Income" : "Expenses"]}
            />
            <Bar dataKey="income"   fill="#10B981" radius={[6, 6, 0, 0]} name="income" />
            <Bar dataKey="expenses" fill="#EF4444" radius={[6, 6, 0, 0]} name="expenses" />
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-3 flex gap-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <span className="h-3 w-3 rounded-full" style={{ background: "#10B981" }} />Income
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <span className="h-3 w-3 rounded-full" style={{ background: "#EF4444" }} />Expenses
          </div>
        </div>
      </div>

      {/* Donut + category breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
        >
          <h3 className="mb-4 font-semibold" style={{ color: "var(--foreground)" }}>Spending by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--foreground)",
                  fontSize: 13,
                }}
                formatter={(v: number, name: string) => [formatCurrency(v), name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
        >
          <h3 className="mb-4 font-semibold" style={{ color: "var(--foreground)" }}>Category Breakdown</h3>
          <div className="flex flex-col gap-3">
            {pieData.slice(0, 6).map(({ name, value }, i) => {
              const meta = categoryMeta[name];
              const Icon = meta?.icon;
              const pct = Math.round((value / totalExpenses) * 100);
              return (
                <div key={name} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: meta?.tint ? `${meta.tint}22` : "var(--surface-alt)",
                      color: meta?.tint ?? "var(--muted-foreground)",
                    }}
                  >
                    {Icon && <Icon size={14} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium" style={{ color: "var(--foreground)" }}>{name}</span>
                      <span style={{ color: "var(--muted-foreground)" }}>{pct}%</span>
                    </div>
                    <div className="progress-track" style={{ height: 6 }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                    </div>
                  </div>
                  <div
                    className="w-24 text-right text-xs font-semibold amount-expense"
                    style={{ flexShrink: 0 }}
                  >
                    {formatCurrency(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Financial tip card */}
      <div
        className="flex items-start gap-4 rounded-2xl p-5"
        style={{
          background: "rgba(0,184,148,0.10)",
          border: "1px solid rgba(0,184,148,0.25)",
        }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--primary)" }}
        >
          <Lightbulb size={18} color="#fff" />
        </div>
        <div>
          <div className="mb-1 text-sm font-bold" style={{ color: "var(--primary)" }}>
            Financial Tip
          </div>
          <div className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            {financialTips[period]}
          </div>
        </div>
      </div>
    </div>
  );
}
