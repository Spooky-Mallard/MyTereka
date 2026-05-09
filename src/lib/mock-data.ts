import {
  UtensilsCrossed,
  Wifi,
  Car,
  Home,
  Heart,
  Film,
  GraduationCap,
  Shirt,
  Gift,
  Briefcase,
  Wallet,
  Zap,
  Plane,
  Laptop,
  type LucideIcon,
} from "lucide-react";

export type TxType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TxType;
  category: string;
  note: string;
  amount: number; // UGX
  date: string;   // ISO YYYY-MM-DD
  account: string;
};

export const categoryMeta: Record<string, { icon: LucideIcon; tint: string }> = {
  /* expense categories */
  "Food":              { icon: UtensilsCrossed, tint: "#F59E0B" },
  "Internet/Data":     { icon: Wifi,            tint: "#00B894" },
  "Transport":         { icon: Car,             tint: "#6366F1" },
  "Rent":              { icon: Home,            tint: "#8B5CF6" },
  "Health":            { icon: Heart,           tint: "#EF4444" },
  "Entertainment":     { icon: Film,            tint: "#EC4899" },
  "School Materials":  { icon: GraduationCap,   tint: "#3B82F6" },
  "Clothing/Fashion":  { icon: Shirt,           tint: "#F97316" },
  "Giving/Charity":    { icon: Gift,            tint: "#10B981" },
  "Savings":           { icon: Wallet,          tint: "#00B894" },
  /* income categories */
  "Salary/Wages":      { icon: Briefcase,       tint: "#10B981" },
  "Allowance":         { icon: Wallet,          tint: "#10B981" },
  "Freelance/Gigs":    { icon: Zap,             tint: "#F59E0B" },
  "Business":          { icon: Briefcase,       tint: "#6366F1" },
  "Upwork":            { icon: Laptop,          tint: "#3B82F6" },
  "Travel":            { icon: Plane,           tint: "#00B894" },
  "Other":             { icon: Wallet,          tint: "#94A3B8" },
};

export const mockUser = {
  name: "Atong Precious",
  firstName: "Atong",
  initials: "AP",
  level: "Master",
  xp: 720,
  xpNext: 1000, // XP needed for Grand Master
  streak: 11,
  lastActive: "2026-05-09",
  avatar: null as string | null,
  email: "atong@example.com",
  mobile: "256701234567",
};

export const mockAccounts = [
  { id: "1", name: "MTN Mobile Money", type: "mobile_money", balance: 850000 },
  { id: "2", name: "Cash",             type: "cash",         balance: 120000 },
  { id: "3", name: "Stanbic Bank",     type: "bank",         balance: 480000 },
];

export const transactions: Transaction[] = [
  { id: "1", type: "expense", category: "Food",          note: "Lunch at cafeteria",     amount: 45000,  date: "2026-05-09", account: "Cash" },
  { id: "2", type: "income",  category: "Salary/Wages",  note: "April salary",           amount: 850000, date: "2026-05-01", account: "Stanbic Bank" },
  { id: "3", type: "expense", category: "Transport",     note: "Boda boda to town",      amount: 12000,  date: "2026-05-08", account: "MTN Mobile Money" },
  { id: "4", type: "expense", category: "Internet/Data", note: "Monthly data bundle",    amount: 30000,  date: "2026-05-07", account: "MTN Mobile Money" },
  { id: "5", type: "income",  category: "Freelance/Gigs",note: "Upwork payment",         amount: 150000, date: "2026-05-05", account: "MTN Mobile Money" },
  { id: "6", type: "expense", category: "Food",          note: "Groceries — Nakumatt",   amount: 78000,  date: "2026-05-04", account: "Cash" },
  { id: "7", type: "expense", category: "School Materials", note: "Textbooks",           amount: 55000,  date: "2026-05-03", account: "Stanbic Bank" },
  { id: "8", type: "expense", category: "Entertainment", note: "Cinema — Acacia Mall",   amount: 25000,  date: "2026-05-02", account: "Cash" },
  { id: "9", type: "expense", category: "Clothing/Fashion", note: "New dress",           amount: 95000,  date: "2026-04-28", account: "MTN Mobile Money" },
  { id: "10", type: "income", category: "Allowance",     note: "Monthly allowance",      amount: 300000, date: "2026-04-25", account: "MTN Mobile Money" },
];

export type Budget = {
  id: string;
  category: string;
  spent: number;   // UGX
  limit: number;   // UGX
  period: "monthly" | "weekly";
};

export const budgets: Budget[] = [
  { id: "b1", category: "Food",          spent: 150000, limit: 200000, period: "monthly" },
  { id: "b2", category: "Transport",     spent: 85000,  limit: 100000, period: "monthly" },
  { id: "b3", category: "Internet/Data", spent: 30000,  limit: 50000,  period: "monthly" },
  { id: "b4", category: "Entertainment", spent: 48000,  limit: 50000,  period: "monthly" },
  { id: "b5", category: "School Materials", spent: 55000, limit: 80000, period: "monthly" },
];

export type Goal = {
  id: string;
  name: string;
  icon: string;
  current: number;  // UGX saved so far
  target: number;   // UGX target
  targetDate: string;
  locked: boolean;
};

export const mockGoals: Goal[] = [
  { id: "g1", name: "Laptop",      icon: "💻", current: 300000, target: 800000, targetDate: "2026-12-31", locked: true },
  { id: "g2", name: "Travel Fund", icon: "✈️", current: 150000, target: 500000, targetDate: "2026-08-01", locked: false },
  { id: "g3", name: "Emergency",   icon: "🛟", current: 50000,  target: 200000, targetDate: "2026-09-30", locked: false },
];

export const mockGroupSavings = [
  {
    id: "gs1",
    name: "Kyambogo Trip Fund",
    target: 2000000,
    contributed: 1250000,
    members: [
      { name: "Atong Precious", contributed: 450000, avatar: null },
      { name: "Brian Okello",   contributed: 400000, avatar: null },
      { name: "Joan Namwezi",   contributed: 250000, avatar: null },
      { name: "Miriam Akot",    contributed: 150000, avatar: null },
    ],
  },
];

export const mockBadges = [
  { id: "b1", name: "First Steps",   icon: "👣", earned: true,  description: "Logged your first transaction" },
  { id: "b2", name: "Streak Master", icon: "🔥", earned: true,  description: "Reached a 7-day streak" },
  { id: "b3", name: "Goal Getter",   icon: "🎯", earned: false, description: "Complete your first savings goal" },
  { id: "b4", name: "Budget Boss",   icon: "💎", earned: false, description: "Complete a budget period under limit" },
  { id: "b5", name: "Team Player",   icon: "🤝", earned: false, description: "Join a group savings pool" },
];

export const mockLeaderboard = [
  { rank: 1, name: "Brian Okello",   level: "Grand Master", xp: 1820, initials: "BO" },
  { rank: 2, name: "Joan Namwezi",   level: "Master",       xp: 950,  initials: "JN" },
  { rank: 3, name: "Miriam Akot",    level: "Consistent",   xp: 620,  initials: "MA" },
  { rank: 4, name: "Atong Precious", level: "Master",       xp: 720,  initials: "AP", isMe: true },
  { rank: 5, name: "David Kamya",    level: "Saver",        xp: 310,  initials: "DK" },
  { rank: 6, name: "Grace Tendo",    level: "Beginner",     xp: 85,   initials: "GT" },
];

export const balance = {
  total: 1450000,  // UGX
  income: 1300000,
  expense: 340000,
};

/* Weekly streak data — Sun to Sat */
export const weekStreak = [true, true, false, true, true, true, true]; // Sun–Sat

export const formatCurrency = (n: number): string =>
  "UGX " + new Intl.NumberFormat("en-UG", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat("en-UG", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));

export const formatDateShort = (iso: string): string =>
  new Intl.DateTimeFormat("en-UG", { day: "numeric", month: "short" }).format(new Date(iso));

/* Group transactions by date label */
export function groupByDate(txs: Transaction[]): Array<{ label: string; items: Transaction[] }> {
  const today = new Date("2026-05-09");
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const map = new Map<string, Transaction[]>();
  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date));

  for (const t of sorted) {
    const d = new Date(t.date);
    let label: string;
    if (d.toDateString() === today.toDateString()) label = "Today";
    else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
    else label = formatDateShort(t.date);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(t);
  }

  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}
