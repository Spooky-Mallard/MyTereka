'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  User, Lock, Bell, Globe, HelpCircle, MessageCircle,
  LogOut, Trash2, ChevronRight, Moon, Sun, Shield, Star, Flame,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ProfileData, EarnedBadge } from '@/lib/actions/profile'

/* All defined badges so unearned ones still show (greyed) */
const ALL_BADGES = [
  { triggerEvent: 'first_transaction', name: 'First Steps',    description: 'Logged your first transaction', icon: '🐾' },
  { triggerEvent: 'streak_7',          name: 'Streak Master',  description: '7-day streak achieved',         icon: '🔥' },
  { triggerEvent: 'goal_completed',    name: 'Goal Getter',    description: 'Completed your first goal',     icon: '🎯' },
  { triggerEvent: 'budget_completed',  name: 'Budget Boss',    description: 'Finished a budget period under limit', icon: '💰' },
  { triggerEvent: 'group_joined',      name: 'Team Player',    description: 'Joined a group savings',        icon: '🤝' },
]

const LEVEL_XP: Record<string, number> = {
  Beginner:    100,
  Saver:       300,
  Consistent:  700,
  Master:      1500,
  'Grand Master': 9999,
}

function useTheme() {
  const [dark, setDark] = useState(true)
  useEffect(() => {
    const saved = localStorage.getItem('mt-theme')
    setDark(saved ? saved === 'dark' : true)
  }, [])
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('mt-theme', next ? 'dark' : 'light')
  }
  return { dark, toggle }
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onToggle() }}
      className="relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200"
      style={{ background: on ? 'var(--primary)' : 'var(--surface-alt)' }}
      role="switch" aria-checked={on}>
      <span className="absolute h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: on ? 'translateX(24px)' : 'translateX(4px)' }} />
    </button>
  )
}

function SettingRow({
  icon: Icon, label, sub, iconColor, iconBg, right, danger, onClick, href,
}: {
  icon: React.ElementType; label: string; sub?: string
  iconColor: string; iconBg: string; right?: React.ReactNode
  danger?: boolean; onClick?: () => void; href?: string
}) {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: iconBg, color: iconColor }}>
        <Icon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium"
          style={{ color: danger ? 'var(--danger)' : 'var(--foreground)' }}>{label}</div>
        {sub && <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{sub}</div>}
      </div>
      {right ?? <ChevronRight size={16} style={{ color: 'var(--muted-foreground)' }} />}
    </>
  )
  if (href) {
    return (
      <Link href={href} className="flex w-full items-center gap-3 rounded-xl p-3 transition hover:opacity-80">
        {inner}
      </Link>
    )
  }
  return (
    <div onClick={onClick} className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 transition hover:opacity-80">
      {inner}
    </div>
  )
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
      <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--muted-foreground)' }}>{title}</div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

type ProfileTab = 'settings' | 'badges'

export function ProfileClient({
  profile,
  earnedBadges,
}: {
  profile:      ProfileData
  earnedBadges: EarnedBadge[]
}) {
  const { dark, toggle } = useTheme()
  const [budgetAlerts,  setBudgetAlerts]  = useState(true)
  const [goalReminders, setGoalReminders] = useState(true)
  const [streakAlerts,  setStreakAlerts]  = useState(true)
  const [logoutOpen,    setLogoutOpen]    = useState(false)
  const [activeTab,     setActiveTab]     = useState<ProfileTab>('settings')
  const router = useRouter()

  const initials    = profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const xpNext      = LEVEL_XP[profile.level] ?? 9999
  const xpPct       = Math.min(100, Math.round((profile.xpPoints / xpNext) * 100))
  const earnedSet   = new Set(earnedBadges.map((b) => b.name))

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' })
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl"
          style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
          Profile & Settings
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Manage your account and preferences
        </p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
            style={{ background: 'var(--gradient-primary)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{profile.name}</div>
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{profile.email}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="level-badge">{profile.level}</span>
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--warning)' }}>
                <Flame size={12} />
                <span>{profile.streakCount}-day streak</span>
              </div>
            </div>
          </div>
          <button className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface-alt)' }}>
            Edit
          </button>
        </div>

        {/* XP bar */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span style={{ color: 'var(--muted-foreground)' }}>
              <Star size={11} className="inline mr-1" style={{ color: 'var(--warning)' }} />
              {profile.xpPoints} XP
            </span>
            <span style={{ color: 'var(--muted-foreground)' }}>{xpNext} XP → next level</span>
          </div>
          <div className="xp-bar">
            <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl p-1" style={{ background: 'var(--surface-alt)' }}>
        {([
          { key: 'settings', label: '⚙️ Settings' },
          { key: 'badges',   label: '🏅 Badges' },
        ] as { key: ProfileTab; label: string }[]).map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex-1 rounded-xl py-2.5 text-xs font-semibold transition"
            style={activeTab === key
              ? { background: 'var(--card)', color: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }
              : { color: 'var(--muted-foreground)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <>
          <SettingsCard title="Account">
            <SettingRow icon={User}   label="Edit profile"    sub="Name, photo, mobile number"  iconColor="var(--primary)" iconBg="rgba(0,184,148,0.12)"   href="/profile/edit" />
            <SettingRow icon={Lock}   label="Change password" sub="Update your login password"  iconColor="#6366F1"        iconBg="rgba(99,102,241,0.12)"  href="/profile/password" />
            <SettingRow icon={Shield} label="Biometric login" sub="Fingerprint or Face ID"      iconColor="var(--success)" iconBg="rgba(16,185,129,0.12)"  href="/profile/security" />
          </SettingsCard>

          <SettingsCard title="Preferences">
            <SettingRow
              icon={dark ? Moon : Sun}
              label="Dark mode"
              sub={dark ? 'Currently dark (default)' : 'Currently light'}
              iconColor="var(--warning)"
              iconBg="rgba(245,158,11,0.12)"
              right={<Toggle on={dark} onToggle={toggle} />}
              onClick={toggle}
            />
            <SettingRow icon={Globe} label="Language" sub="English" iconColor="#14B8A6" iconBg="rgba(20,184,166,0.12)" href="/profile/language" />
          </SettingsCard>

          <SettingsCard title="Notifications">
            <SettingRow
              icon={Bell} label="Budget alerts" sub="80% and 100% threshold warnings"
              iconColor="var(--warning)" iconBg="rgba(245,158,11,0.12)"
              right={<Toggle on={budgetAlerts}   onToggle={() => setBudgetAlerts((n) => !n)} />}
              onClick={() => setBudgetAlerts((n) => !n)}
            />
            <SettingRow
              icon={Bell} label="Goal reminders" sub="50%, 75%, 100% milestones"
              iconColor="var(--success)" iconBg="rgba(16,185,129,0.12)"
              right={<Toggle on={goalReminders}  onToggle={() => setGoalReminders((n) => !n)} />}
              onClick={() => setGoalReminders((n) => !n)}
            />
            <SettingRow
              icon={Flame} label="Streak alerts" sub="24h inactivity reminders"
              iconColor="#EF4444" iconBg="rgba(239,68,68,0.12)"
              right={<Toggle on={streakAlerts}   onToggle={() => setStreakAlerts((n) => !n)} />}
              onClick={() => setStreakAlerts((n) => !n)}
            />
          </SettingsCard>

          <SettingsCard title="Support">
            <SettingRow icon={HelpCircle}    label="Help center"     sub="FAQs and guides"    iconColor="#6366F1"        iconBg="rgba(99,102,241,0.12)" href="/help" />
            <SettingRow icon={MessageCircle} label="Contact support" sub="Chat with our team" iconColor="var(--primary)" iconBg="rgba(0,184,148,0.12)"  href="/support" />
          </SettingsCard>

          <SettingsCard title="Account actions">
            <SettingRow
              icon={LogOut} label="Log out" sub="End your current session"
              iconColor="var(--danger)" iconBg="rgba(239,68,68,0.12)"
              danger onClick={() => setLogoutOpen(true)} right={null}
            />
            <SettingRow icon={Trash2} label="Delete account" sub="Permanently remove all data"
              iconColor="var(--danger)" iconBg="rgba(239,68,68,0.08)" danger />
          </SettingsCard>

          <div className="pb-4 text-center text-xs" style={{ color: 'var(--muted-foreground)' }}>
            MyTereka v1.0 · Made for Ugandan youth 🇺🇬
          </div>
        </>
      )}

      {/* Badges tab */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ALL_BADGES.map((badge) => {
            const earned = earnedSet.has(badge.name)
            return (
              <div key={badge.triggerEvent}
                className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center"
                style={{
                  background: earned ? 'var(--card)' : 'var(--surface-alt)',
                  boxShadow: earned ? 'var(--shadow-card)' : 'none',
                  opacity: earned ? 1 : 0.5,
                }}>
                <div className="text-4xl">{badge.icon}</div>
                <div className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{badge.name}</div>
                <div className="text-xs leading-snug" style={{ color: 'var(--muted-foreground)' }}>
                  {badge.description}
                </div>
                {earned && <span className="level-badge text-[10px]">Earned</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Log out confirm */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--foreground)' }}>Log out?</DialogTitle>
            <DialogDescription style={{ color: 'var(--muted-foreground)' }}>
              Your session will end. You can log back in anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLogoutOpen(false)}
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface-alt)' }}>
              Cancel
            </Button>
            <Button onClick={handleLogout} style={{ background: 'var(--danger)', color: '#fff' }}>
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
