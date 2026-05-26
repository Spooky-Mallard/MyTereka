"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Eye,
  EyeOff,
  ChevronRight,
  Flame,
  Star,
  TrendingUp,
  TrendingDown,
  Sparkles,
  X,
  Wallet,
  Bell,
  Search,
  CheckCircle2,
  Trophy,
  Users,
} from "lucide-react";
import { formatUGX } from "@/lib/format";
import { categoryMeta } from "@/lib/mock-data";
import { UsernameSetupBanner } from "@/components/username-setup-banner";
import { markNotificationRead } from "@/lib/actions/notifications";
import { UserAvatar } from "@/components/user-avatar";
import { useSetRightRail } from "@/components/right-rail-context";
import type { NudgeCard } from "@/lib/actions/nudges";
import type { DailyQuestRow } from "@/lib/actions/quests";
import type { DashboardInsight } from "@/lib/actions/analytics";

const LEVEL_XP: Record<string, number> = {
  Beginner: 100,
  Saver: 300,
  Consistent: 700,
  Master: 1500,
  "Grand Master": 1500,
};

type TxnRow = {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  date: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  accountName: string;
};

type BudgetRow = {
  id: string;
  limitAmount: number;
  spentAmount: number;
  period: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
};

type GoalRow = {
  id: string;
  name: string;
  icon: string | null;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
};

type EarnedBadge = {
  triggerEvent: string | null;
  name: string;
  icon: string | null;
};

type Props = {
  user: {
    name: string;
    username: string | null;
    avatarId: string | null;
    level: string;
    xp: number;
    streak: number;
    lastActive: string | null;
  };
  totalBalance: number;
  recentTxns: TxnRow[];
  budgets: BudgetRow[];
  goals: GoalRow[];
  nudges: NudgeCard[];
  dailyTip: { body: string; category: string | null } | null;
  todayQuest: { quest: DailyQuestRow; completed: boolean } | null;
  insight: DashboardInsight | null;
  unreadCount: number;
  earnedBadges: EarnedBadge[];
};

// ── Shared helpers ──────────────────────────────────────────────────────────

const ICON_KEYWORD_MAP: Record<string, string> = {
  laptop: "💻", computer: "💻", pc: "💻",
  home: "🏠", house: "🏠",
  car: "🚗", vehicle: "🚗",
  phone: "📱", mobile: "📱",
  school: "🎓", education: "📚", book: "📚",
  travel: "✈️", holiday: "🌴", vacation: "🌴",
  wedding: "💍", ring: "💍",
  business: "💼", work: "💼",
  baby: "👶", child: "🧒",
  health: "🏥", hospital: "🏥",
  food: "🍽️", groceries: "🛒",
  savings: "💰", money: "💰", fund: "💰",
  watch: "⌚", clock: "⌚",
  tv: "📺", television: "📺",
  bike: "🚲", bicycle: "🚲",
  camera: "📷", photo: "📷",
}

function resolveGoalIcon(icon: string | null): string {
  if (!icon) return "🎯"
  // already an emoji (first char > basic ASCII)
  if (icon.codePointAt(0)! > 127) return icon
  return ICON_KEYWORD_MAP[icon.toLowerCase().trim()] ?? "🎯"
}

function weekStreakDots(streak: number) {
  // Mon–Sun labels (design uses M T W T F S S)
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  // todayIdx: Monday=0 … Sunday=6
  const jsDay = new Date().getDay(); // 0=Sun
  const todayIdx = (jsDay + 6) % 7;
  return labels.map((label, i) => {
    const daysAgo = todayIdx - i;
    const active = daysAgo >= 0 && daysAgo < streak;
    return { label, active };
  });
}

function StreakDots({ streak }: { streak: number }) {
  const dots = weekStreakDots(streak);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: 16 }}>
      {dots.map(({ label, active }, i) => (
        <div
          key={i}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 9999,
              background: active ? "#fff" : "rgba(255,255,255,0.28)",
              boxShadow: active ? "0 0 0 3px rgba(255,255,255,0.2)" : "none",
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              opacity: 0.9,
              color: "#fff",
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function TxnItem({ t, i }: { t: TxnRow; i: number }) {
  const meta = categoryMeta[t.categoryName];
  const Icon = meta?.icon;
  const tint = meta?.tint ?? t.categoryColor ?? "var(--muted-foreground)";
  const isIncome = t.type === "income";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
        borderTop: i > 0 ? "1px solid var(--border)" : "none",
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          fontSize: 14,
          background: `${tint}22`,
          color: tint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {Icon
          ? <Icon size={14} />
          : t.categoryIcon && t.categoryIcon.codePointAt(0)! > 127
            ? <span style={{ fontSize: 14 }}>{t.categoryIcon}</span>
            : <span style={{ fontSize: 11 }}>{t.categoryName[0]}</span>
        }
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--foreground)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {t.note || t.categoryName}
        </div>
        <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
          {t.categoryName} · {t.accountName}
        </div>
      </div>
      <div
        style={{
          fontFamily: "Poppins, sans-serif",
          fontWeight: 700,
          fontSize: 13,
          flexShrink: 0,
          color: isIncome ? "var(--success)" : "var(--danger)",
        }}
      >
        {isIncome ? "+" : "−"}
        {formatUGX(t.amount)}
      </div>
    </div>
  );
}

// ── Desktop right rail ───────────────────────────────────────────────────────

const ALL_DASHBOARD_BADGES = [
  { triggerEvent: 'first_transaction', icon: '🐾', name: 'First Steps' },
  { triggerEvent: 'streak_7',          icon: '🔥', name: 'Streak Master' },
  { triggerEvent: 'goal_completed',    icon: '🎯', name: 'Goal Getter' },
  { triggerEvent: 'budget_completed',  icon: '💰', name: 'Budget Boss' },
  { triggerEvent: 'group_joined',      icon: '🤝', name: 'Team Player' },
];

function DesktopRightRail({
  goals,
  dailyTip,
  user,
  xpNext,
  xpPct,
  earnedBadges,
}: {
  goals: GoalRow[];
  dailyTip: Props["dailyTip"];
  user: Props["user"];
  xpNext: number;
  xpPct: number;
  earnedBadges: EarnedBadge[];
}) {
  const earnedSet = new Set(earnedBadges.map((b) => b.triggerEvent).filter(Boolean));

  return (
    <>
      {/* Active quests */}
      <div className="rail-card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="eyebrow">Active quests</div>
          <Link
            href="/goals"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--primary)",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            See all
          </Link>
        </div>
        {goals.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", padding: "8px 0" }}>
            No active goals
          </div>
        ) : (
          goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            return (
              <div
                key={g.id}
                style={{
                  background: "var(--card)",
                  borderRadius: 14,
                  padding: 12,
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "rgba(0,184,148,0.16)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                    }}
                  >
                    {resolveGoalIcon(g.icon)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 700,
                        fontSize: 12,
                        color: "var(--foreground)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {g.name}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
                      {formatUGX(g.currentAmount)} / {formatUGX(g.targetAmount)}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 800,
                      fontSize: 13,
                      color: "var(--primary)",
                    }}
                  >
                    {pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: "var(--surface-alt)",
                    borderRadius: 9999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: "var(--gradient-primary)",
                      borderRadius: 9999,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Badges */}
      <div className="rail-card flex flex-col gap-3">
        <div className="eyebrow">Badges</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {ALL_DASHBOARD_BADGES.map((b) => {
            const earned = earnedSet.has(b.triggerEvent);
            return (
              <div
                key={b.triggerEvent}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  opacity: earned ? 1 : 0.35,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: earned ? "rgba(0,184,148,0.18)" : "var(--surface-alt)",
                    border: earned ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    filter: earned ? "none" : "grayscale(1)",
                  }}
                >
                  {b.icon}
                </div>
                <div
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 9,
                    fontWeight: 600,
                    color: "var(--muted-foreground)",
                    textAlign: "center",
                  }}
                >
                  {b.name}
                </div>
              </div>
            );
          })}
        </div>
        <Link
          href="/profile?tab=badges"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--primary)",
            fontFamily: "Poppins, sans-serif",
            textAlign: "center",
            paddingTop: 4,
          }}
        >
          View all badges
        </Link>
      </div>

      {/* XP progress */}
      <div className="rail-card flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="level-badge">{user.level}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Star size={13} color="var(--warning)" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--warning)",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              {user.xp} XP
            </span>
          </div>
        </div>
        <div className="xp-bar">
          <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
        </div>
        <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
          {user.xp} / {xpNext} XP to next level
        </div>
      </div>

      {/* Daily tip */}
      {dailyTip && (
        <div
          style={{
            padding: 12,
            borderRadius: 14,
            background: "rgba(0,184,148,0.10)",
            border: "1px solid rgba(0,184,148,0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 14 }}>💡</span>
            <span
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--primary)",
              }}
            >
              Today's tip
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--foreground)", lineHeight: 1.5 }}>
            {dailyTip.body}
          </div>
        </div>
      )}
    </>
  );
}

// ── Desktop main column ──────────────────────────────────────────────────────

function DesktopDashboard({
  user,
  totalBalance,
  recentTxns,
  budgets,
  goals,
  insight,
  unreadCount,
  xpNext,
  xpPct,
  hideBalance,
  setHideBalance,
}: {
  user: Props["user"];
  totalBalance: number;
  recentTxns: TxnRow[];
  budgets: BudgetRow[];
  goals: GoalRow[];
  insight: DashboardInsight | null;
  unreadCount: number;
  xpNext: number;
  xpPct: number;
  hideBalance: boolean;
  setHideBalance: (v: boolean) => void;
}) {
  const firstName = user.name.split(" ")[0] ?? user.name;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-UG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalIncome = recentTxns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = recentTxns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: 12,
              color: "var(--muted-foreground)",
            }}
          >
            {dateStr}
          </div>
          <div
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 800,
              fontSize: 26,
              color: "var(--foreground)",
              marginTop: 2,
              letterSpacing: "-0.02em",
            }}
          >
            {greeting}, {firstName} 👋
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--muted-foreground)",
              fontSize: 12,
              minWidth: 220,
            }}
          >
            <Search size={14} />
            <span style={{ fontFamily: "Nunito Sans, sans-serif" }}>
              Search transactions, goals…
            </span>
          </div>
          <Link
            href="/notifications"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--muted-foreground)",
            }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 7,
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  background: "var(--danger)",
                  border: "2px solid var(--card)",
                }}
              />
            )}
          </Link>
        </div>
      </div>

      {/* Hero row: Balance + Streak */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        {/* Balance card */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 22,
            padding: 22,
            color: "#fff",
            background: "var(--gradient-primary)",
            boxShadow: "var(--shadow-cta)",
            minHeight: 170,
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -40,
              top: -40,
              width: 200,
              height: 200,
              borderRadius: 9999,
              background: "rgba(255,255,255,0.10)",
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 500,
                  fontSize: 13,
                  opacity: 0.92,
                }}
              >
                Total balance
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    background: "rgba(255,255,255,0.16)",
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    fontSize: 11,
                    padding: "4px 10px",
                    borderRadius: 9999,
                  }}
                >
                  {new Date().toLocaleDateString("en-UG", { month: "long", year: "numeric" })}
                </span>
                <button
                  onClick={() => setHideBalance(!hideBalance)}
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    border: "none",
                    borderRadius: 8,
                    padding: "4px 8px",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div
              style={{
                marginTop: 14,
                fontFamily: "Poppins, sans-serif",
                fontWeight: 800,
                fontSize: 48,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {hideBalance ? "• • • • •" : formatUGX(totalBalance)}
            </div>
            <div
              style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.14)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    opacity: 0.92,
                  }}
                >
                  <TrendingUp size={13} /> Income
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 800,
                    fontSize: 18,
                  }}
                >
                  {hideBalance ? "• • •" : formatUGX(totalIncome)}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.14)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    opacity: 0.92,
                  }}
                >
                  <TrendingDown size={13} /> Expenses
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 800,
                    fontSize: 18,
                  }}
                >
                  {hideBalance ? "• • •" : formatUGX(totalExpense)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Streak card */}
        <Link href="/streak" style={{ textDecoration: "none" }}>
          <div
            style={{
              borderRadius: 22,
              padding: 22,
              background: "linear-gradient(160deg, #F59E0B, #D97706)",
              color: "#fff",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 12px 30px rgba(245,158,11,0.3)",
              minHeight: 170,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: -30,
                top: -30,
                width: 160,
                height: 160,
                borderRadius: 9999,
                background: "rgba(255,255,255,0.10)",
                filter: "blur(30px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 12 }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Flame size={28} strokeWidth={2.4} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 9,
                    fontWeight: 700,
                    opacity: 0.85,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {user.streak}-day streak
                </div>
                <div
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 800,
                    fontSize: 32,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    marginTop: 4,
                  }}
                >
                  Keep it lit
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 11,
                    opacity: 0.9,
                  }}
                >
                  Log to stay alive
                </div>
              </div>
            </div>
            <StreakDots streak={user.streak} />
          </div>
        </Link>
      </div>

      {/* Middle row: Insight + Today's transactions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Insight */}
        {insight ? (
          <div
            style={{
              borderRadius: 18,
              padding: 18,
              background: "rgba(245,158,11,0.10)",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Sparkles size={16} style={{ color: "var(--warning)" }} />
              <div className="eyebrow" style={{ color: "var(--warning)" }}>
                Insight
              </div>
            </div>
            <div
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: "var(--foreground)",
                lineHeight: 1.3,
              }}
            >
              {insight.categoryName} spending dropped this month
            </div>
            <div
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 12,
                color: "var(--muted-foreground)",
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              You saved {formatUGX(insight.savedAmount)} vs last month.
              {insight.topGoalName && ` Move it to your "${insight.topGoalName}" goal.`}
            </div>
            {insight.topGoalId && (
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <Link
                  href={`/goals/${insight.topGoalId}/map`}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 9999,
                    background: "var(--warning)",
                    color: "#fff",
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    textDecoration: "none",
                  }}
                >
                  Move {formatUGX(insight.savedAmount)} →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              borderRadius: 18,
              padding: 18,
              background: "rgba(0,184,148,0.08)",
              border: "1px solid rgba(0,184,148,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Sparkles size={16} style={{ color: "var(--primary)" }} />
              <div className="eyebrow">Insight</div>
            </div>
            <div
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: "var(--foreground)",
                lineHeight: 1.3,
              }}
            >
              Keep logging to unlock spending insights
            </div>
            <div
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 12,
                color: "var(--muted-foreground)",
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              After 30 days of tracking, we'll show you where your money goes and how to save more.
            </div>
          </div>
        )}

        {/* Today's transactions */}
        <div
          style={{
            background: "var(--card)",
            borderRadius: 18,
            padding: 18,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: "var(--foreground)",
              }}
            >
              Today
            </div>
            <Link
              href="/transactions"
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--primary)",
                textDecoration: "none",
              }}
            >
              See all{" "}
              <ChevronRight size={11} style={{ display: "inline", verticalAlign: "-1px" }} />
            </Link>
          </div>
          {recentTxns.length === 0 ? (
            <div
              style={{
                padding: "16px 0",
                textAlign: "center",
                fontSize: 12,
                color: "var(--muted-foreground)",
              }}
            >
              No transactions yet
            </div>
          ) : (
            recentTxns.slice(0, 3).map((t, i) => <TxnItem key={t.id} t={t} i={i} />)
          )}
        </div>
      </div>

      {/* Budget bars */}
      {budgets.length > 0 && (
        <div
          style={{
            background: "var(--card)",
            borderRadius: 18,
            padding: 20,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 14,
            }}
          >
            <div>
              <div className="eyebrow">Budgets</div>
              <div
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "var(--foreground)",
                  marginTop: 4,
                }}
              >
                Where you&apos;re at this month
              </div>
            </div>
            <Link
              href="/budgets"
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--primary)",
                textDecoration: "none",
              }}
            >
              Adjust
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {budgets.slice(0, 4).map((b, i) => {
              const meta = categoryMeta[b.categoryName];
              const pct =
                b.limitAmount > 0
                  ? Math.min(100, Math.round((b.spentAmount / b.limitAmount) * 100))
                  : 0;
              const color =
                pct > 90 ? "var(--danger)" : pct > 70 ? "var(--warning)" : "var(--success)";
              return (
                <div key={b.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14 }}>
                      {meta
                        ? <meta.icon size={14} />
                        : b.categoryIcon && b.categoryIcon.codePointAt(0)! > 127
                          ? b.categoryIcon
                          : b.categoryName[0]
                      }
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontFamily: "Poppins, sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--foreground)",
                      }}
                    >
                      {b.categoryName}
                    </span>
                    <span
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--muted-foreground)",
                      }}
                    >
                      {formatUGX(b.spentAmount)} / {formatUGX(b.limitAmount)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: "var(--surface-alt)",
                      borderRadius: 9999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: color,
                        borderRadius: 9999,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mobile dashboard (Quest V1) ──────────────────────────────────────────────

function MobileDashboard({
  user,
  totalBalance,
  recentTxns,
  goals,
  nudges: initialNudges,
  dailyTip,
  todayQuest,
  xpNext,
  xpPct,
}: {
  user: Props["user"];
  totalBalance: number;
  recentTxns: TxnRow[];
  goals: GoalRow[];
  nudges: NudgeCard[];
  dailyTip: Props["dailyTip"];
  todayQuest: Props["todayQuest"];
  xpNext: number;
  xpPct: number;
}) {
  const [hideBalance, setHideBalance] = useState(true);
  const [dismissedNudges, setDismissed] = useState<Set<string>>(new Set());
  const [, startDismiss] = useTransition();

  const firstName = user.name.split(" ")[0] ?? user.name;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const totalIncome = recentTxns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = recentTxns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const visibleNudges = initialNudges.filter((n) => !dismissedNudges.has(n.id));

  function dismissNudge(n: NudgeCard) {
    setDismissed((prev) => new Set([...prev, n.id]));
    startDismiss(async () => {
      try {
        await markNotificationRead(n.notificationId);
      } catch {
        /* ignore */
      }
    });
  }

  return (
    <div style={{ padding: "14px 0", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Greeting */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <UserAvatar
          avatarId={user.avatarId}
          name={user.name}
          size={45}
          style={{ borderRadius: 9999 }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: 15,
              color: "var(--muted-foreground)",
            }}
          >
            {greeting} 👋
          </div>
          <div
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: 25,
              color: "var(--foreground)",
            }}
          >
            {user.name}
          </div>
        </div>
        <Link
          href="/notifications"
          style={{
            width: 36,
            height: 36,
            borderRadius: 9999,
            background: "var(--card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted-foreground)",
            border: "1px solid var(--border)",
            textDecoration: "none",
          }}
        >
          <Bell size={16} />
        </Link>
      </div>

      {/* Nudges */}
      {visibleNudges.map((n) => (
        <div
          key={n.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 16,
            background: "rgba(0,184,148,0.10)",
            border: "1px solid rgba(0,184,148,0.25)",
          }}
        >
          <Sparkles size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, color: "var(--foreground)" }}>
            <span style={{ fontWeight: 600 }}>{n.actorName}</span> is cheering you on!
          </span>
          <button
            onClick={() => dismissNudge(n)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted-foreground)",
              display: "flex",
              padding: 4,
            }}
          >
            <X size={13} />
          </button>
        </div>
      ))}

      {/* HERO: Streak card */}
      <Link href="/streak" style={{ textDecoration: "none" }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 22,
            padding: "16px 16px 14px",
            background: "linear-gradient(160deg, #F59E0B 0%, #D97706 70%)",
            boxShadow: "0 12px 30px rgba(245,158,11,0.28)",
            color: "#fff",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -30,
              top: -30,
              width: 140,
              height: 140,
              borderRadius: 9999,
              background: "rgba(255,255,255,0.12)",
              filter: "blur(30px)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                flexShrink: 0,
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Flame size={36} strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 600,
                  fontSize: 11,
                  opacity: 0.85,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Your streak
              </div>
              <div
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 800,
                  fontSize: 38,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                {user.streak}{" "}
                <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.85 }}>days</span>
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 11,
                  fontFamily: "Poppins, sans-serif",
                  opacity: 0.9,
                }}
              >
                Log today to keep it alive
              </div>
            </div>
          </div>
          <StreakDots streak={user.streak} />
        </div>
      </Link>

      {/* XP / level row */}
      <div
        style={{
          background: "var(--card)",
          borderRadius: 18,
          padding: 14,
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="level-badge">{user.level}</span>
            <span
              style={{
                fontSize: 11,
                color: "var(--muted-foreground)",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              {Math.max(0, xpNext - user.xp)} XP to next level
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 3,
              alignItems: "center",
              color: "var(--warning)",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            <Star size={14} color="var(--warning)" /> {user.xp}
          </div>
        </div>
        <div className="xp-bar">
          <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      {/* Balance — secondary */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "var(--card)",
          borderRadius: 18,
          padding: 14,
          boxShadow: "var(--shadow-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            flexShrink: 0,
            background: "var(--gradient-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Wallet size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--muted-foreground)",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Balance
          </div>
          <div
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {hideBalance ? "• • • • •" : formatUGX(totalBalance)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--success)",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
            }}
          >
            + {hideBalance ? "• • •" : formatUGX(totalIncome)}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--danger)",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            − {hideBalance ? "• • •" : formatUGX(totalExpense)}
          </div>
        </div>
        <button
          onClick={() => setHideBalance(!hideBalance)}
          style={{
            flexShrink: 0,
            background: "var(--surface-alt)",
            border: "none",
            borderRadius: 9999,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--muted-foreground)",
          }}
        >
          {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {/* Today's quest */}
      {todayQuest && (
        <div
          style={{
            background: "var(--card)",
            borderRadius: 18,
            padding: 14,
            boxShadow: "var(--shadow-card)",
            border: todayQuest.completed
              ? "1.5px solid rgba(0,184,148,0.5)"
              : "1.5px dashed rgba(0,184,148,0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Sparkles size={14} color="var(--primary)" />
            <div className="eyebrow" style={{ color: "var(--primary)" }}>
              Today&apos;s quest
            </div>
          </div>
          <div
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: "var(--foreground)",
              marginBottom: 4,
            }}
          >
            {todayQuest.quest.title}
          </div>
          {todayQuest.completed ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--success)",
                fontFamily: "Poppins, sans-serif",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={15} /> Quest complete! +{todayQuest.quest.xpReward} XP earned
            </div>
          ) : (
            <div
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 11,
                color: "var(--muted-foreground)",
                marginBottom: 12,
              }}
            >
              Reward: +{todayQuest.quest.xpReward} XP · keeps your streak alive
            </div>
          )}
        </div>
      )}

      {/* Mascot + goals carousel */}
      {goals.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: -4 }}>
          <img
            src={`/mascot/mood-${todayQuest?.completed ? 0 : user.streak >= 7 ? 1 : user.streak >= 3 ? 2 : user.streak === 0 ? 4 : 2}.png`}
            alt="MyTereka mascot"
            style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }}
          />
          <div style={{
            flex: 1,
            background: 'var(--surface-alt)',
            borderRadius: '14px 14px 14px 4px',
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--foreground)',
            fontFamily: 'Poppins, sans-serif',
            lineHeight: 1.4,
            border: '1px solid var(--border)',
          }}>
            Keep saving! You&apos;re making great progress 🌟
          </div>
        </div>
      )}

      {/* Active quests carousel */}
      {goals.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div className="eyebrow">Active quests</div>
            <Link
              href="/goals"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--primary)",
                fontFamily: "Poppins, sans-serif",
                textDecoration: "none",
              }}
            >
              See all <ChevronRight size={11} />
            </Link>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              paddingBottom: 4,
              scrollbarWidth: "none",
            }}
          >
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
              return (
                <Link key={g.id} href="/goals" style={{ textDecoration: "none", flexShrink: 0 }}>
                  <div
                    style={{
                      width: 130,
                      background: "var(--card)",
                      borderRadius: 16,
                      padding: 12,
                      boxShadow: "var(--shadow-card)",
                      border: "1px solid var(--border)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        right: -10,
                        top: -10,
                        width: 50,
                        height: 50,
                        borderRadius: 12,
                        background: "var(--primary)",
                        opacity: 0.18,
                        pointerEvents: "none",
                      }}
                    />
                    <div style={{ fontSize: 22 }}>{resolveGoalIcon(g.icon)}</div>
                    <div
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 700,
                        fontSize: 12,
                        color: "var(--foreground)",
                        marginTop: 6,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {g.name}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        height: 5,
                        background: "var(--surface-alt)",
                        borderRadius: 9999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "var(--gradient-primary)",
                          borderRadius: 9999,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 700,
                        fontSize: 13,
                        color: "var(--primary)",
                      }}
                    >
                      {pct}%
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's moves */}
      <div
        style={{
          background: "var(--card)",
          borderRadius: 18,
          padding: "4px 14px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 0 6px",
          }}
        >
          <div className="eyebrow">Today&apos;s moves</div>
          <Link
            href="/transactions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--primary)",
              fontFamily: "Poppins, sans-serif",
              textDecoration: "none",
            }}
          >
            See all <ChevronRight size={11} />
          </Link>
        </div>
        {recentTxns.length === 0 ? (
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💸</div>
            <div
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 600,
                color: "var(--foreground)",
                fontSize: 13,
              }}
            >
              No transactions yet
            </div>
            <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
              Tap + to log your first
            </div>
          </div>
        ) : (
          recentTxns.slice(0, 3).map((t, i) => <TxnItem key={t.id} t={t} i={i} />)
        )}
      </div>

      {/* Daily tip */}
      {dailyTip && (
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            padding: 14,
            borderRadius: 16,
            background: "rgba(0,184,148,0.10)",
            border: "1px solid rgba(0,184,148,0.25)",
          }}
        >
          <div style={{ fontSize: 20 }}>💡</div>
          <div>
            <div
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: "var(--primary)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Tip of the day
            </div>
            <div
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 13,
                color: "var(--foreground)",
                lineHeight: 1.5,
              }}
            >
              {dailyTip.body}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root export ──────────────────────────────────────────────────────────────

export function DashboardClient({
  user,
  totalBalance,
  recentTxns,
  budgets,
  goals,
  nudges,
  dailyTip,
  todayQuest,
  insight,
  unreadCount,
  earnedBadges,
}: Props) {
  const [hideBalance, setHideBalance] = useState(true);

  const xpNext = LEVEL_XP[user.level] ?? 100;
  const xpPct = Math.min(100, Math.round((user.xp / xpNext) * 100));

  useSetRightRail(
    <DesktopRightRail
      goals={goals}
      dailyTip={dailyTip}
      user={user}
      xpNext={xpNext}
      xpPct={xpPct}
      earnedBadges={earnedBadges}
    />,
  );

  return (
    <div className="mx-auto max-w-2xl">
      <UsernameSetupBanner initialUsername={user.username} />

      {/* Mobile layout */}
      <div className="md:hidden">
        <MobileDashboard
          user={user}
          totalBalance={totalBalance}
          recentTxns={recentTxns}
          goals={goals}
          nudges={nudges}
          dailyTip={dailyTip}
          todayQuest={todayQuest}
          xpNext={xpNext}
          xpPct={xpPct}
        />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block pt-2">
        <DesktopDashboard
          user={user}
          totalBalance={totalBalance}
          recentTxns={recentTxns}
          budgets={budgets}
          goals={goals}
          insight={insight}
          unreadCount={unreadCount}
          xpNext={xpNext}
          xpPct={xpPct}
          hideBalance={hideBalance}
          setHideBalance={setHideBalance}
        />
      </div>
    </div>
  );
}
