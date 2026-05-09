"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { categoryMeta, mockAccounts, formatCurrency } from "@/lib/mock-data";
import { CalendarDays, ChevronDown } from "lucide-react";

const EXPENSE_CATS = [
  "Food", "Internet/Data", "Transport", "Rent", "School Materials",
  "Clothing/Fashion", "Giving/Charity", "Entertainment", "Health", "Savings",
];
const INCOME_CATS = [
  "Salary/Wages", "Allowance", "Freelance/Gigs", "Business", "Upwork", "Other",
];

export function AddTransactionSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState(mockAccounts[0].id);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  const cats = type === "expense" ? EXPENSE_CATS : INCOME_CATS;

  function handleSave() {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!category) {
      toast.error("Select a category");
      return;
    }
    toast.success(`${type === "income" ? "Income" : "Expense"} saved — ${formatCurrency(Number(amount))}`, {
      description: category,
    });
    setAmount("");
    setCategory("");
    setNote("");
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 max-h-[92dvh] overflow-y-auto"
        style={{ background: "var(--card)", border: "none" }}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full" style={{ background: "var(--border)" }} />
        <SheetHeader className="px-6 pt-4 pb-2">
          <SheetTitle
            className="text-xl font-bold"
            style={{ color: "var(--foreground)", fontFamily: "Poppins, sans-serif" }}
          >
            Add Transaction
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 pb-8 flex flex-col gap-5">
          {/* Type toggle */}
          <div
            className="grid grid-cols-2 rounded-xl p-1"
            style={{ background: "var(--surface-alt)" }}
          >
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setType(t); setCategory(""); }}
                className="rounded-lg py-2.5 text-sm font-semibold capitalize transition-all"
                style={
                  type === t
                    ? {
                        background: "var(--card)",
                        color: t === "income" ? "var(--success)" : "var(--danger)",
                        boxShadow: "var(--shadow-sm)",
                      }
                    : { color: "var(--muted-foreground)" }
                }
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
              Amount (UGX)
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold"
                style={{ color: "var(--muted-foreground)" }}
              >
                UGX
              </span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mytereka-input pl-16 text-xl font-bold"
                style={{
                  color: type === "income" ? "var(--success)" : "var(--danger)",
                }}
              />
            </div>
          </div>

          {/* Category grid */}
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
              Category
            </label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {cats.map((cat) => {
                const meta = categoryMeta[cat];
                const Icon = meta?.icon;
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center transition-all"
                    style={{
                      background: selected
                        ? "rgba(0,184,148,0.15)"
                        : "var(--surface-alt)",
                      border: selected ? "1.5px solid var(--primary)" : "1.5px solid transparent",
                    }}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        background: meta?.tint
                          ? `${meta.tint}22`
                          : "var(--muted)",
                        color: meta?.tint ?? "var(--muted-foreground)",
                      }}
                    >
                      {Icon && <Icon size={16} />}
                    </span>
                    <span
                      className="text-[10px] font-medium leading-tight"
                      style={{ color: selected ? "var(--primary)" : "var(--foreground)" }}
                    >
                      {cat.split("/")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
              Account
            </label>
            <div className="relative">
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="mytereka-input appearance-none pr-10"
              >
                {mockAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted-foreground)" }}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
              Date
            </label>
            <div className="relative">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted-foreground)" }}
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mytereka-input pl-10"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
              Note (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Lunch at cafeteria"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mytereka-input"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full rounded-full py-4 text-base font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "0 4px 16px rgba(0,184,148,0.35)",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            Save Transaction
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
