"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User, Lock, Bell, Globe, HelpCircle, MessageCircle,
  LogOut, Trash2, ChevronRight, Moon, Sun, Shield, Trophy, Star, Flame,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { mockUser, mockBadges, mockLeaderboard, formatCurrency } from "@/lib/mock-data";

function useTheme() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("mt-theme");
    if (saved) {
      setDark(saved === "dark");
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      setDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("mt-theme", next ? "dark" : "light");
  };

  return { dark, toggle };
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200"
      style={{ background: on ? "var(--primary)" : "var(--surface-alt)" }}
      aria-checked={on}
      role="switch"
    >
      <span
        className="absolute h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: on ? "translateX(24px)" : "translateX(4px)" }}
      />
    </button>
  );
}

function SettingRow({
  icon: Icon, label, sub, iconColor, iconBg, right, danger, onClick, href,
}: {
  icon: React.ElementType; label: string; sub?: string;
  iconColor: string; iconBg: string; right?: React.ReactNode;
  danger?: boolean; onClick?: () => void; href?: string;
}) {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: iconBg, color: iconColor }}>
        <Icon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: danger ? "var(--danger)" : "var(--foreground)" }}>{label}</div>
        {sub && <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{sub}</div>}
      </div>
      {right ?? <ChevronRight size={16} style={{ color: "var(--muted-foreground)" }} />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex w-full items-center gap-3 rounded-xl p-3 transition hover:opacity-80">
        {inner}
      </Link>
    );
  }
  return (
    <div onClick={onClick} className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 transition hover:opacity-80">
      {inner}
    </div>
  );
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
      <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
        {title}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

type ProfileTab = "settings" | "badges" | "leaderboard";

export default function ProfilePage() {
  const { dark, toggle } = useTheme();
  const [budgetAlerts, setBudgetAlerts]     = useState(true);
  const [goalReminders, setGoalReminders]   = useState(true);
  const [streakAlerts, setStreakAlerts]      = useState(true);
  const [logoutOpen, setLogoutOpen]         = useState(false);
  const [activeTab, setActiveTab]           = useState<ProfileTab>("settings");

  const xpPct = Math.round((mockUser.xp / mockUser.xpNext) * 100);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight md:text-3xl"
          style={{ color: "var(--foreground)", fontFamily: "Poppins, sans-serif" }}
        >
          Profile & Settings
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Manage your account and preferences
        </p>
      </div>

      {/* Profile card */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
            style={{ background: "var(--gradient-primary)" }}
          >
            {mockUser.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{mockUser.name}</div>
            <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{mockUser.email}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="level-badge">{mockUser.level}</span>
              <div className="flex items-center gap-1 text-xs" style={{ color: "var(--warning)" }}>
                <Flame size={12} />
                <span>{mockUser.streak}-day streak</span>
              </div>
            </div>
          </div>
          <button
            className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--surface-alt)" }}
          >
            Edit
          </button>
        </div>

        {/* XP bar */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span style={{ color: "var(--muted-foreground)" }}>
              <Star size={11} className="inline mr-1" style={{ color: "var(--warning)" }} />
              {mockUser.xp} XP
            </span>
            <span style={{ color: "var(--muted-foreground)" }}>{mockUser.xpNext} XP → Grand Master</span>
          </div>
          <div className="xp-bar">
            <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl p-1" style={{ background: "var(--surface-alt)" }}>
        {([
          { key: "settings",    label: "⚙️ Settings" },
          { key: "badges",      label: "🏅 Badges" },
          { key: "leaderboard", label: "🏆 Leaderboard" },
        ] as { key: ProfileTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex-1 rounded-xl py-2.5 text-xs font-semibold transition"
            style={
              activeTab === key
                ? { background: "var(--card)", color: "var(--primary)", boxShadow: "var(--shadow-sm)" }
                : { color: "var(--muted-foreground)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Settings tab ── */}
      {activeTab === "settings" && (
        <>
          <SettingsCard title="Account">
            <SettingRow icon={User}   label="Edit profile"   sub="Name, photo, mobile number" iconColor="var(--primary)"  iconBg="rgba(0,184,148,0.12)" href="/profile/edit" />
            <SettingRow icon={Lock}   label="Change password" sub="Update your login password"  iconColor="#6366F1"         iconBg="rgba(99,102,241,0.12)"   href="/profile/password" />
            <SettingRow icon={Shield} label="Biometric login" sub="Fingerprint or Face ID"       iconColor="var(--success)" iconBg="rgba(16,185,129,0.12)"   href="/profile/security" />
          </SettingsCard>

          <SettingsCard title="Preferences">
            <SettingRow
              icon={dark ? Moon : Sun}
              label="Dark mode"
              sub={dark ? "Currently dark (default)" : "Currently light"}
              iconColor="var(--warning)"
              iconBg="rgba(245,158,11,0.12)"
              right={<Toggle on={dark} onToggle={toggle} />}
              onClick={toggle}
            />
            <SettingRow icon={Globe}  label="Language" sub="English"   iconColor="#14B8A6"        iconBg="rgba(20,184,166,0.12)"  href="/profile/language" />
          </SettingsCard>

          <SettingsCard title="Notifications">
            <SettingRow
              icon={Bell}
              label="Budget alerts"
              sub="80% and 100% threshold warnings"
              iconColor="var(--warning)"
              iconBg="rgba(245,158,11,0.12)"
              right={<Toggle on={budgetAlerts}   onToggle={() => setBudgetAlerts((n) => !n)} />}
              onClick={() => setBudgetAlerts((n) => !n)}
            />
            <SettingRow
              icon={Bell}
              label="Goal reminders"
              sub="50%, 75%, 100% milestones"
              iconColor="var(--success)"
              iconBg="rgba(16,185,129,0.12)"
              right={<Toggle on={goalReminders}  onToggle={() => setGoalReminders((n) => !n)} />}
              onClick={() => setGoalReminders((n) => !n)}
            />
            <SettingRow
              icon={Flame}
              label="Streak alerts"
              sub="24h inactivity reminders"
              iconColor="#EF4444"
              iconBg="rgba(239,68,68,0.12)"
              right={<Toggle on={streakAlerts}   onToggle={() => setStreakAlerts((n) => !n)} />}
              onClick={() => setStreakAlerts((n) => !n)}
            />
          </SettingsCard>

          <SettingsCard title="Support">
            <SettingRow icon={HelpCircle}    label="Help center"     sub="FAQs and guides"       iconColor="#6366F1"        iconBg="rgba(99,102,241,0.12)"   href="/help" />
            <SettingRow icon={MessageCircle} label="Contact support" sub="Chat with our team"    iconColor="var(--primary)" iconBg="rgba(0,184,148,0.12)"    href="/support" />
          </SettingsCard>

          <SettingsCard title="Account actions">
            <SettingRow
              icon={LogOut}
              label="Log out"
              sub="End your current session"
              iconColor="var(--danger)"
              iconBg="rgba(239,68,68,0.12)"
              danger
              onClick={() => setLogoutOpen(true)}
              right={null}
            />
            <SettingRow icon={Trash2} label="Delete account" sub="Permanently remove all data" iconColor="var(--danger)" iconBg="rgba(239,68,68,0.08)" danger />
          </SettingsCard>

          <div className="pb-4 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
            MyTereka v1.0 · Made for Ugandan youth 🇺🇬
          </div>
        </>
      )}

      {/* ── Badges tab ── */}
      {activeTab === "badges" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {mockBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center"
              style={{
                background: badge.earned ? "var(--card)" : "var(--surface-alt)",
                boxShadow: badge.earned ? "var(--shadow-card)" : "none",
                opacity: badge.earned ? 1 : 0.5,
              }}
            >
              <div className="text-4xl">{badge.icon}</div>
              <div className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                {badge.name}
              </div>
              <div className="text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>
                {badge.description}
              </div>
              {badge.earned && (
                <span className="level-badge text-[10px]">Earned</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Leaderboard tab ── */}
      {activeTab === "leaderboard" && (
        <div className="flex flex-col gap-3">
          {/* Top 3 podium */}
          <div className="flex items-end justify-center gap-3 py-4">
            {[1, 0, 2].map((idx) => {
              const p = mockLeaderboard[idx];
              const podiumH = idx === 0 ? 80 : idx === 2 ? 56 : 64;
              const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
              const medals = ["🥇", "🥈", "🥉"];
              const sortedIdx = [1, 0, 2][idx];
              return (
                <div key={p.rank} className="flex flex-col items-center gap-2">
                  <div className="text-xl">{medals[idx]}</div>
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      background: p.isMe ? "var(--gradient-primary)" : "var(--surface-alt)",
                      color: p.isMe ? "#fff" : "var(--foreground)",
                      border: `2px solid ${medalColors[idx]}`,
                    }}
                  >
                    {p.initials}
                  </div>
                  <div className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                    {p.name.split(" ")[0]}
                  </div>
                  <div className="text-xs" style={{ color: "var(--primary)" }}>{p.xp} XP</div>
                  <div
                    className="flex items-end justify-center rounded-t-lg w-16"
                    style={{ height: podiumH, background: `${medalColors[idx]}33` }}
                  >
                    <span className="pb-2 text-lg font-bold" style={{ color: medalColors[idx] }}>
                      #{p.rank}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full list */}
          <div className="overflow-hidden rounded-2xl" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
            {mockLeaderboard.map((p, i) => (
              <div
                key={p.rank}
                className="flex items-center gap-3 px-5 py-3.5"
                style={{
                  borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                  background: p.isMe ? "rgba(0,184,148,0.08)" : "transparent",
                }}
              >
                <span
                  className="w-6 text-center text-sm font-bold"
                  style={{ color: p.rank <= 3 ? "var(--warning)" : "var(--muted-foreground)" }}
                >
                  #{p.rank}
                </span>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: p.isMe ? "var(--gradient-primary)" : "var(--surface-alt)",
                    color: p.isMe ? "#fff" : "var(--foreground)",
                  }}
                >
                  {p.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: p.isMe ? "var(--primary)" : "var(--foreground)" }}>
                    {p.isMe ? `${p.name} (You)` : p.name}
                  </div>
                  <span className="level-badge text-[10px]">{p.level}</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold" style={{ color: "var(--warning)" }}>
                  <Star size={12} />
                  {p.xp}
                </div>
              </div>
            ))}
          </div>

          {/* Relative rank message */}
          <div
            className="rounded-2xl p-4 text-center text-sm"
            style={{ background: "rgba(0,184,148,0.10)", color: "var(--primary)" }}
          >
            🎉 You are doing better than <strong>33%</strong> of players. Keep going!
          </div>
        </div>
      )}

      {/* ── Log out confirm dialog ── */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--foreground)" }}>Log out?</DialogTitle>
            <DialogDescription style={{ color: "var(--muted-foreground)" }}>
              Your session will end. You can log back in anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setLogoutOpen(false)}
              style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--surface-alt)" }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setLogoutOpen(false)}
              style={{ background: "var(--danger)", color: "#fff" }}
            >
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
