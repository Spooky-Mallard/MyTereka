'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  User, Lock, Bell, Globe, HelpCircle, MessageCircle,
  LogOut, Trash2, ChevronRight, Moon, Sun, Shield, Star, Flame,
  Upload, FileText, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { importTransactions } from '@/lib/actions/transactions'
import type { ImportRow } from '@/lib/actions/transactions'
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

function parseCSV(text: string): ImportRow[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z]/g, ''))
  const idx = (names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1

  const dateIdx     = idx(['date'])
  const typeIdx     = idx(['type'])
  const itemIdx     = idx(['item', 'description', 'name', 'note'])
  const categoryIdx = idx(['category', 'cat'])
  const amountIdx   = idx(['amount', 'total', 'price'])
  const qtyIdx      = idx(['quantity', 'qty', 'count'])

  const rows: ImportRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))

    const rawDate  = dateIdx  >= 0 ? cols[dateIdx]  : ''
    const rawType  = typeIdx  >= 0 ? cols[typeIdx]  : 'expense'
    const rawItem  = itemIdx  >= 0 ? cols[itemIdx]  : ''
    const rawCat   = categoryIdx >= 0 ? cols[categoryIdx] : 'Other'
    const rawAmt   = amountIdx >= 0 ? cols[amountIdx] : '0'
    const rawQty   = qtyIdx   >= 0 ? cols[qtyIdx]   : ''

    // Normalise type
    const typeLower = rawType.toLowerCase()
    const type: 'income' | 'expense' =
      typeLower.includes('income') || typeLower.includes('credit') ? 'income' : 'expense'

    // Parse date — try multiple formats
    let date = ''
    const d = new Date(rawDate)
    if (!isNaN(d.getTime())) {
      date = d.toISOString().split('T')[0]
    } else {
      // try DD/MM/YYYY
      const parts = rawDate.split(/[\/\-]/)
      if (parts.length === 3) {
        const [a, b, c] = parts
        const attempt = new Date(`${c}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`)
        if (!isNaN(attempt.getTime())) date = attempt.toISOString().split('T')[0]
      }
    }
    if (!date) continue // skip rows with unparseable date

    const amount = parseFloat(rawAmt.replace(/[^0-9.]/g, ''))
    if (isNaN(amount) || amount <= 0) continue

    const quantity = rawQty ? parseFloat(rawQty) : undefined

    rows.push({ date, type, item: rawItem, category: rawCat || 'Other', amount, quantity })
  }

  return rows
}

function CSVImport() {
  const router = useRouter()
  const fileRef   = useRef<HTMLInputElement>(null)
  const [preview, setPreview]   = useState<ImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult]     = useState<{ imported: number; skipped: number } | null>(null)

  function handleFile(file: File) {
    setFileName(file.name)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      setPreview(rows)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!preview.length) return
    setImporting(true)
    try {
      const res = await importTransactions(preview)
      setResult(res)
      toast.success(`Imported ${res.imported} transactions`)
      setPreview([])
      setFileName('')
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed py-10 text-center transition hover:opacity-80"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-alt)' }}
      >
        <Upload size={32} style={{ color: 'var(--primary)', opacity: 0.7 }} />
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Drop your StackSaver CSV here
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            or click to browse — columns: date, type, item, category, amount, quantity
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>

      {/* Result */}
      {result && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(0,184,148,0.10)', border: '1px solid rgba(0,184,148,0.25)' }}>
          <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} />
          <span className="text-sm" style={{ color: 'var(--foreground)' }}>
            <strong>{result.imported}</strong> imported · <strong>{result.skipped}</strong> skipped
          </span>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <FileText size={15} style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {fileName} — {preview.length} rows to import
            </span>
          </div>

          <div className="overflow-hidden rounded-xl" style={{ background: 'var(--surface-alt)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Date','Type','Item','Category','Amount'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold"
                        style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 8).map((r, i) => (
                    <tr key={i} style={{ borderBottom: i < Math.min(preview.length,8)-1 ? '1px solid var(--border)' : undefined }}>
                      <td className="px-3 py-2" style={{ color: 'var(--foreground)' }}>{r.date}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: r.type === 'income' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: r.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                          {r.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 max-w-[120px] truncate" style={{ color: 'var(--foreground)' }}>{r.item}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--foreground)' }}>{r.category}</td>
                      <td className="px-3 py-2 font-semibold"
                        style={{ color: r.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                        {r.type === 'income' ? '+' : '−'}{r.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.length > 8 && (
              <div className="px-3 py-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                +{preview.length - 8} more rows
              </div>
            )}
          </div>

          {preview.some((r) => !r.date) && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
              style={{ background: 'rgba(245,158,11,0.10)', color: 'var(--warning)' }}>
              <AlertCircle size={13} />
              Some rows have invalid dates and will be skipped
            </div>
          )}

          <button onClick={handleImport} disabled={importing}
            className="w-full rounded-full py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'var(--gradient-primary)' }}>
            {importing && <Loader2 size={16} className="animate-spin" />}
            Import {preview.length} Transactions
          </button>
        </div>
      )}
    </div>
  )
}

type ProfileTab = 'settings' | 'badges' | 'import'

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
          { key: 'import',   label: '📥 Import' },
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

      {/* Import tab */}
      {activeTab === 'import' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="mb-1 text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              Import from StackSaver
            </div>
            <div className="mb-4 text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              Export your ledger as CSV from StackSaver and upload here. Columns needed:
              <code className="mx-1 rounded px-1 py-0.5 text-[10px]" style={{ background: 'var(--surface-alt)', color: 'var(--primary)' }}>
                date, type, item, category, amount, quantity
              </code>
              — quantity is optional.
            </div>
            <CSVImport />
          </div>
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
