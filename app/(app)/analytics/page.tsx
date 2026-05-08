"use client";

import { useState } from "react";
import { categoryMeta, formatCurrency, transactions, balance } from "@/lib/mock-data";
import { Plus } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";

type Period = "weekly" | "monthly" | "yearly";

const PIE_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#EC4899", "#14B8A6", "#8B5CF6"];

const barData = [
  { name: "Jan", income: 5200, expenses: 3100 },
  { name: "Feb", income: 4800, expenses: 2900 },
  { name: "Mar", income: 6100, expenses: 3400 },
  { name: "Apr", income: 5700, expenses: 2700 },
  { name: "May", income: 6250, expenses: 2249 },
];

const lineData = [
  { name: "Week 1", amount: 620 },
  { name: "Week 2", amount: 430 },
  { name: "Week 3", amount: 890 },
  { name: "Week 4", amount: 319 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("monthly");

  const expensesByCat = transactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => { acc[t.category] = (acc[t.category] ?? 0) + t.amount; return acc; }, {});

  const pieData = Object.entries(expensesByCat).map(([name, value]) => ({ name, value }));
  const totalExpenses = pieData.reduce((s, d) => s + d.value, 0);
  const netSavings = balance.income - balance.expense;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "var(--foreground)" }}>Analytics</h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>Visual overview of your finances</p>
        </div>
        <div className="flex rounded-full p-1" style={{ background: "var(--surface-alt)" }}>
          {(["weekly", "monthly", "yearly"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className="rounded-full px-4 py-1.5 text-sm font-medium capitalize transition"
              style={period === p ? { background: "var(--card)", color: "var(--foreground)", boxShadow: "var(--shadow-sm)" } : { color: "var(--muted-foreground)" }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total income", value: formatCurrency(balance.income), color: "var(--success)", bg: "rgba(16,185,129,0.10)" },
          { label: "Total expenses", value: formatCurrency(balance.expense), color: "var(--danger)", bg: "rgba(239,68,68,0.10)" },
          { label: "Net savings", value: formatCurrency(netSavings), color: "var(--primary)", bg: "rgba(79,70,229,0.10)" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
            <div className="mb-2 inline-flex rounded-lg px-2 py-1 text-xs font-semibold" style={{ background: bg, color }}>{label}</div>
            <div className="text-xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl p-6" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
          <h3 className="mb-4 font-semibold" style={{ color: "var(--foreground)" }}>Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)", fontSize: 13 }} formatter={(v: number) => [formatCurrency(v)]} />
              <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#EF4444" radius={[6, 6, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl p-6" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
          <h3 className="mb-4 font-semibold" style={{ color: "var(--foreground)" }}>Spending by category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {pieData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)", fontSize: 13 }} formatter={(v: number) => [formatCurrency(v)]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line chart */}
      <div className="rounded-2xl p-6" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
        <h3 className="mb-4 font-semibold" style={{ color: "var(--foreground)" }}>Spending trend</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)", fontSize: 13 }} formatter={(v: number) => [formatCurrency(v), "Spent"]} />
            <Line type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: "#4F46E5", r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown */}
      <div className="rounded-2xl p-6" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
        <h3 className="mb-4 font-semibold" style={{ color: "var(--foreground)" }}>Category breakdown</h3>
        <div className="flex flex-col gap-4">
          {pieData.sort((a, b) => b.value - a.value).map(({ name, value }, i) => {
            const meta = categoryMeta[name];
            const Icon = meta?.icon ?? Plus;
            const pct = Math.round((value / totalExpenses) * 100);
            return (
              <div key={name} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: meta?.tint ? `color-mix(in srgb, ${meta.tint} 15%, transparent)` : "var(--surface-alt)", color: meta?.tint ?? "var(--muted-foreground)" }}>
                  <Icon size={15} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: "var(--foreground)" }}>{name}</span>
                    <span style={{ color: "var(--muted-foreground)" }}>{pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  </div>
                </div>
                <div className="w-20 text-right text-sm font-semibold" style={{ color: "var(--danger)" }}>-{formatCurrency(value)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
