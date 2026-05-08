"use client";

import { useState, useEffect } from "react";
import { User, Lock, Bell, Palette, Globe, DollarSign, HelpCircle, MessageCircle, LogOut, Trash2, ChevronRight, Moon, Sun, Shield } from "lucide-react";

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("fw-theme");
    if (saved) {
      setDark(saved === "dark");
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      setDark(document.documentElement.getAttribute("data-theme") === "dark");
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("fw-theme", next ? "dark" : "light");
  };

  return { dark, toggle };
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200"
      style={{ background: on ? "var(--primary)" : "var(--surface-alt)" }} aria-checked={on} role="switch">
      <span className="absolute h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: on ? "translateX(24px)" : "translateX(4px)" }} />
    </button>
  );
}

function SettingRow({ icon: Icon, label, sub, iconColor, iconBg, right, danger, onClick }:
  { icon: React.ElementType; label: string; sub?: string; iconColor: string; iconBg: string; right?: React.ReactNode; danger?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:opacity-80 active:scale-[0.99]" style={{ background: "transparent" }}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: iconBg, color: iconColor }}>
        <Icon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: danger ? "var(--danger)" : "var(--foreground)" }}>{label}</div>
        {sub && <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{sub}</div>}
      </div>
      {right ?? <ChevronRight size={16} style={{ color: "var(--muted-foreground)" }} />}
    </button>
  );
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
      <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>{title}</div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { dark, toggle } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "var(--foreground)" }}>Profile & Settings</h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>Manage your account and preferences</p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl p-6" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white" style={{ background: "var(--gradient-primary)" }}>AM</div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Alex Morgan</div>
            <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>alex.morgan@example.com</div>
            <span className="mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "rgba(79,70,229,0.12)", color: "var(--primary)" }}>Premium</span>
          </div>
          <button className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--surface-alt)" }}>Edit</button>
        </div>
      </div>

      <SettingsCard title="Account">
        <SettingRow icon={User} label="Edit profile" sub="Name, photo, currency" iconColor="var(--primary)" iconBg="rgba(79,70,229,0.12)" />
        <SettingRow icon={Lock} label="Change password" sub="Update your login password" iconColor="#6366F1" iconBg="rgba(99,102,241,0.12)" />
        <SettingRow icon={Shield} label="Two-factor auth" sub="Extra layer of security" iconColor="var(--success)" iconBg="rgba(16,185,129,0.12)" />
      </SettingsCard>

      <SettingsCard title="Preferences">
        <SettingRow icon={dark ? Moon : Sun} label="Dark mode" sub={dark ? "Currently dark" : "Currently light"}
          iconColor="var(--warning)" iconBg="rgba(245,158,11,0.12)" right={<Toggle on={dark} onToggle={toggle} />} onClick={toggle} />
        <SettingRow icon={DollarSign} label="Currency" sub="USD — US Dollar" iconColor="var(--success)" iconBg="rgba(16,185,129,0.12)" />
        <SettingRow icon={Globe} label="Language" sub="English" iconColor="#14B8A6" iconBg="rgba(20,184,166,0.12)" />
        <SettingRow icon={Palette} label="Appearance" sub="Theme, accent color" iconColor="#8B5CF6" iconBg="rgba(139,92,246,0.12)" />
      </SettingsCard>

      <SettingsCard title="Notifications">
        <SettingRow icon={Bell} label="Push notifications" sub="Budget alerts, goal reminders" iconColor="#EC4899" iconBg="rgba(236,72,153,0.12)"
          right={<Toggle on={notifications} onToggle={() => setNotifications((n) => !n)} />} onClick={() => setNotifications((n) => !n)} />
        <SettingRow icon={Bell} label="Email digest" sub="Weekly summary email" iconColor="#F59E0B" iconBg="rgba(245,158,11,0.12)"
          right={<Toggle on={emailDigest} onToggle={() => setEmailDigest((n) => !n)} />} onClick={() => setEmailDigest((n) => !n)} />
      </SettingsCard>

      <SettingsCard title="Support">
        <SettingRow icon={HelpCircle} label="Help center" sub="FAQs and guides" iconColor="#6366F1" iconBg="rgba(99,102,241,0.12)" />
        <SettingRow icon={MessageCircle} label="Online support" sub="Chat with our team" iconColor="var(--primary)" iconBg="rgba(79,70,229,0.12)" />
      </SettingsCard>

      <SettingsCard title="Danger zone">
        <SettingRow icon={LogOut} label="Log out" sub="End your current session" iconColor="var(--danger)" iconBg="rgba(239,68,68,0.12)" danger />
        <SettingRow icon={Trash2} label="Delete account" sub="Permanently remove all your data" iconColor="var(--danger)" iconBg="rgba(239,68,68,0.08)" danger />
      </SettingsCard>

      <div className="pb-4 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>FinWise v1.0.0 · Made with ♥</div>
    </div>
  );
}
