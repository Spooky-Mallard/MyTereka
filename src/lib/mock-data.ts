import {
  ShoppingBag,
  UtensilsCrossed,
  Car,
  Home,
  Heart,
  Film,
  GraduationCap,
  Repeat,
  Plane,
  Sparkles,
  Lightbulb,
  Briefcase,
  Gift,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type TxType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TxType;
  category: string;
  note: string;
  amount: number;
  date: string; // ISO
};

export const categoryMeta: Record<string, { icon: LucideIcon; tint: string }> = {
  "Food & Drink": { icon: UtensilsCrossed, tint: "oklch(0.77 0.17 70)" },
  Shopping: { icon: ShoppingBag, tint: "oklch(0.65 0.23 27)" },
  Transport: { icon: Car, tint: "oklch(0.60 0.20 274)" },
  Housing: { icon: Home, tint: "oklch(0.71 0.16 162)" },
  Health: { icon: Heart, tint: "oklch(0.65 0.23 27)" },
  Entertainment: { icon: Film, tint: "oklch(0.60 0.20 304)" },
  Education: { icon: GraduationCap, tint: "oklch(0.52 0.22 274)" },
  Subscriptions: { icon: Repeat, tint: "oklch(0.55 0.05 257)" },
  Travel: { icon: Plane, tint: "oklch(0.60 0.20 230)" },
  Utilities: { icon: Lightbulb, tint: "oklch(0.77 0.17 70)" },
  Salary: { icon: Briefcase, tint: "oklch(0.71 0.16 162)" },
  Freelance: { icon: Sparkles, tint: "oklch(0.71 0.16 162)" },
  Gift: { icon: Gift, tint: "oklch(0.71 0.16 162)" },
  Investment: { icon: TrendingUp, tint: "oklch(0.71 0.16 162)" },
};

export const transactions: Transaction[] = [
  { id: "1", type: "income", category: "Salary", note: "October salary", amount: 5400, date: "2026-05-01" },
  { id: "2", type: "expense", category: "Food & Drink", note: "Whole Foods", amount: 84.32, date: "2026-05-06" },
  { id: "3", type: "expense", category: "Transport", note: "Uber to airport", amount: 42.5, date: "2026-05-05" },
  { id: "4", type: "expense", category: "Subscriptions", note: "Netflix", amount: 15.99, date: "2026-05-04" },
  { id: "5", type: "expense", category: "Shopping", note: "Nike sneakers", amount: 129.0, date: "2026-05-03" },
  { id: "6", type: "income", category: "Freelance", note: "Logo design", amount: 850, date: "2026-05-02" },
  { id: "7", type: "expense", category: "Entertainment", note: "Concert tickets", amount: 95, date: "2026-04-30" },
  { id: "8", type: "expense", category: "Housing", note: "Rent", amount: 1800, date: "2026-05-01" },
  { id: "9", type: "expense", category: "Utilities", note: "Internet bill", amount: 60, date: "2026-04-28" },
  { id: "10", type: "expense", category: "Health", note: "Pharmacy", amount: 23.4, date: "2026-04-26" },
];

export type Budget = {
  id: string;
  category: string;
  spent: number;
  limit: number;
  period: "monthly" | "weekly";
};

export const budgets: Budget[] = [
  { id: "b1", category: "Food & Drink", spent: 320, limit: 500, period: "monthly" },
  { id: "b2", category: "Shopping", spent: 410, limit: 400, period: "monthly" },
  { id: "b3", category: "Transport", spent: 120, limit: 250, period: "monthly" },
  { id: "b4", category: "Entertainment", spent: 95, limit: 150, period: "monthly" },
  { id: "b5", category: "Subscriptions", spent: 45, limit: 60, period: "monthly" },
  { id: "b6", category: "Utilities", spent: 60, limit: 200, period: "monthly" },
];

export type Goal = {
  id: string;
  name: string;
  emoji: string;
  saved: number;
  target: number;
  deadline: string;
};

export const goals: Goal[] = [
  { id: "g1", name: "Japan Trip", emoji: "✈️", saved: 2400, target: 5000, deadline: "2026-09-01" },
  { id: "g2", name: "Emergency Fund", emoji: "🛟", saved: 6800, target: 10000, deadline: "2026-12-31" },
  { id: "g3", name: "New MacBook", emoji: "💻", saved: 1100, target: 2200, deadline: "2026-08-15" },
  { id: "g4", name: "Down Payment", emoji: "🏡", saved: 12000, target: 40000, deadline: "2027-06-01" },
];

export const balance = {
  total: 12450.8,
  income: 6250,
  expense: 2249.21,
};

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
