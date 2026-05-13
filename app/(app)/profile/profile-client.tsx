'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  User, Lock, Bell, Globe, HelpCircle, MessageCircle,
  LogOut, Trash2, ChevronRight, Moon, Sun, Shield, Star, Flame,
  Upload, FileText, CheckCircle2, AlertCircle, Loader2,
  Plus, X, Wallet, Banknote, Building2, Users, ArrowRightLeft, CalendarDays, Smartphone, Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { importTransactions, createAccount, updateAccount, deleteAccount, getAccountsForUser, transferBetweenAccounts } from '@/lib/actions/transactions'
import type { ImportRow } from '@/lib/actions/transactions'
import { calcMoMoFee } from '@/lib/momo-fees'
import type { FeeResult } from '@/lib/momo-fees'
import type { ProfileData, EarnedBadge } from '@/lib/actions/profile'
import { formatUGX } from '@/lib/format'
import { FriendsTab } from '@/components/friends-tab'
import { UsernameEditModal } from '@/components/username-edit-modal'

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

  // Auto-detect delimiter: tab-separated (TSV) or comma-separated (CSV)
  const firstLine = lines[0]
  const delim = firstLine.includes('\t') ? '\t' : ','

  const splitLine = (line: string) =>
    line.split(delim).map((c) => c.trim().replace(/^"|"$/g, ''))

  const header = splitLine(firstLine).map((h) => h.toLowerCase().replace(/[^a-z]/g, ''))
  const idx = (names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1

  const dateIdx     = idx(['date'])
  const typeIdx     = idx(['type'])
  const itemIdx     = idx(['item', 'description', 'name', 'note'])
  const categoryIdx = idx(['category', 'cat'])
  const amountIdx   = idx(['amountugx', 'amount', 'total', 'price'])
  const qtyIdx      = idx(['quantity', 'qty', 'count'])

  const rows: ImportRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i])

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
  const fileRef    = useRef<HTMLInputElement>(null)
  const [preview,  setPreview]  = useState<ImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [progress,  setProgress] = useState(0)   // 0–100
  const [result,    setResult]   = useState<{ imported: number; skipped: number } | null>(null)

  function handleFile(file: File) {
    setFileName(file.name)
    setResult(null)
    setProgress(0)
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
    setProgress(5)

    // Simulate progress while the server action runs
    const tick = setInterval(() => {
      setProgress((p) => (p < 85 ? p + Math.random() * 12 : p))
    }, 300)

    try {
      const res = await importTransactions(preview)
      clearInterval(tick)
      setProgress(100)

      setTimeout(() => {
        setResult(res)
        setPreview([])
        setFileName('')
        setProgress(0)
        router.refresh()
      }, 600)

      toast.success(`Import complete — ${res.imported} transactions added`, {
        description: res.skipped > 0 ? `${res.skipped} rows skipped (invalid data)` : 'All rows imported successfully',
        duration: 5000,
      })
    } catch (e: unknown) {
      clearInterval(tick)
      setProgress(0)
      toast.error(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        onClick={() => !importing && fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && !importing) handleFile(f) }}
        className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed py-10 text-center transition hover:opacity-80"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface-alt)',
          cursor: importing ? 'not-allowed' : 'pointer',
          opacity: importing ? 0.6 : 1,
        }}
      >
        <Upload size={32} style={{ color: 'var(--primary)', opacity: 0.7 }} />
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Drop your StackSaver export here
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Supports CSV and TSV — columns: Date, Type, Item, Category, Quantity, Amount (UGX)
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,text/csv,text/tab-separated-values"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>

      {/* Progress bar — shown while importing */}
      {importing && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Loader2 size={13} className="animate-spin" style={{ color: 'var(--primary)' }} />
              Importing {preview.length} transactions…
            </span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-alt)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: 'var(--gradient-primary)' }}
            />
          </div>
        </div>
      )}

      {/* Result banner */}
      {result && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(0,184,148,0.10)', border: '1px solid rgba(0,184,148,0.25)' }}>
          <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} />
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Import successful
            </div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {result.imported} imported · {result.skipped} skipped
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && !importing && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <FileText size={15} style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {fileName} — {preview.length} rows ready to import
            </span>
          </div>

          <div className="overflow-hidden rounded-xl" style={{ background: 'var(--surface-alt)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Date','Type','Item','Category','Amount (UGX)'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold"
                        style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 8).map((r, i) => (
                    <tr key={i} style={{ borderBottom: i < Math.min(preview.length,8)-1 ? '1px solid var(--border)' : undefined }}>
                      <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{r.date}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: r.type === 'income' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: r.type === 'income' ? 'var(--success)' : 'var(--danger)',
                          }}>
                          {r.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 max-w-[110px] truncate" style={{ color: 'var(--foreground)' }}>{r.item}</td>
                      <td className="px-3 py-2 max-w-[90px] truncate" style={{ color: 'var(--foreground)' }}>{r.category}</td>
                      <td className="px-3 py-2 font-semibold whitespace-nowrap"
                        style={{ color: r.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                        {r.type === 'income' ? '+' : '−'}{(r.quantity ? r.amount * r.quantity : r.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.length > 8 && (
              <div className="px-3 py-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                +{preview.length - 8} more rows not shown
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

// ─── Account type spec ───────────────────────────────────────────────────────
const ACCT_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  cash:         { icon: Banknote,   color: '#F59E0B',  bg: 'rgba(245,158,11,0.12)',  label: 'Cash'          },
  mobile_money: { icon: Smartphone, color: '#00B894',  bg: 'rgba(0,184,148,0.12)',   label: 'Mobile Money'  },
  bank:         { icon: Building2,  color: '#3B82F6',  bg: 'rgba(59,130,246,0.12)',  label: 'Bank Account'  },
  sacco:        { icon: Users,      color: '#8B5CF6',  bg: 'rgba(139,92,246,0.12)',  label: 'SACCO / Savings Group' },
}

type AccountRow = { id: string; name: string; type: string; balance: number; icon: string | null; color: string | null }

// ─── Transfer Modal with live fee calculator ──────────────────────────────────
function TransferModal({ accounts, onClose }: { accounts: AccountRow[]; onClose: () => void }) {
  const router = useRouter()
  const [fromId,    setFromId]    = useState(accounts[0]?.id ?? '')
  const [toId,      setToId]      = useState(accounts[1]?.id ?? accounts[0]?.id ?? '')
  const [amount,    setAmount]    = useState('')
  const [feeInput,  setFeeInput]  = useState('')
  const [note,      setNote]      = useState('')
  const [date,      setDate]      = useState(new Date().toISOString().split('T')[0])
  const [saving,    setSaving]    = useState(false)

  const fromAcc   = accounts.find((a) => a.id === fromId)
  const toAcc     = accounts.find((a) => a.id === toId)
  const numAmount = Math.round(Number(amount) || 0)

  // Auto-calc MoMo fee for Mobile Money → Cash, pre-populate fee field
  const isMoMoToCash = fromAcc?.type === 'mobile_money' && toAcc?.type === 'cash'
  const feeResult: FeeResult = isMoMoToCash && fromAcc && numAmount > 0
    ? calcMoMoFee(fromAcc.name, numAmount)
    : { type: 'none' }
  const autoFee    = feeResult.type === 'fee' ? feeResult.fee : 0
  const outOfRange = feeResult.type === 'out_of_range'

  // Sync fee input with auto-calculated value whenever it changes (MoMo→Cash only)
  useEffect(() => {
    if (isMoMoToCash && autoFee > 0) setFeeInput(String(autoFee))
    else if (isMoMoToCash && numAmount > 0 && autoFee === 0) setFeeInput('0')
  }, [autoFee, isMoMoToCash, numAmount])

  const effectiveFee = Math.round(Number(feeInput) || 0)
  const totalDebit   = numAmount + effectiveFee
  const canSubmit    = numAmount > 0 && fromId !== toId && !outOfRange && !saving

  async function handleTransfer() {
    if (!canSubmit) return
    setSaving(true)
    try {
      const result = await transferBetweenAccounts({
        fromAccountId: fromId,
        toAccountId:   toId,
        amount:        numAmount,
        note:          note || undefined,
        date,
        manualFee:     effectiveFee,
      })
      if (result.fee > 0) {
        toast.success(
          `Transferred ${formatUGX(numAmount)} · Fee: ${formatUGX(result.fee)}`,
          { description: `Total debited from source: ${formatUGX(result.total)}` }
        )
      } else {
        toast.success(`Transferred ${formatUGX(numAmount)}`)
      }
      onClose()
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Transfer failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5 max-h-[90dvh] overflow-y-auto"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            Transfer Between Accounts
          </h2>
          <button onClick={onClose} style={{ color: 'var(--muted-foreground)' }}><X size={20} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>From</label>
            <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="mytereka-input appearance-none text-sm">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {fromAcc && (
              <div className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Balance: {formatUGX(fromAcc.balance)}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>To</label>
            <select value={toId} onChange={(e) => setToId(e.target.value)} className="mytereka-input appearance-none text-sm">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        {fromId === toId && (
          <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(239,68,68,0.10)', color: 'var(--danger)' }}>
            From and To accounts must be different
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Amount (UGX)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>UGX</span>
            <input type="number" inputMode="numeric" placeholder="0" value={amount}
              onChange={(e) => setAmount(e.target.value)} className="mytereka-input pl-16 font-bold" />
          </div>
        </div>

        {/* Out-of-range error for MoMo→Cash */}
        {isMoMoToCash && outOfRange && feeResult.type === 'out_of_range' && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.10)', color: 'var(--danger)' }}>
            Amount is outside the valid range for {feeResult.provider}.<br />
            Min: {formatUGX(feeResult.min)} · Max: {formatUGX(feeResult.max)}
          </div>
        )}

        {/* Fee field — always visible, auto-populated for MoMo→Cash, editable for all */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Transaction Fee (UGX)
            {isMoMoToCash && <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--primary)' }}>auto-calculated · editable</span>}
            {!isMoMoToCash && <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>— optional</span>}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>UGX</span>
            <input type="number" inputMode="numeric" placeholder="0"
              value={feeInput} onChange={(e) => setFeeInput(e.target.value)}
              className="mytereka-input pl-16" />
          </div>
          {effectiveFee > 0 && numAmount > 0 && (
            <div className="mt-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Total deducted from source: {formatUGX(totalDebit)} · Recipient receives {formatUGX(numAmount)}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Date</label>
          <div className="relative">
            <CalendarDays size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mytereka-input pl-12" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Note (optional)</label>
          <input type="text" placeholder="e.g. MTN to Stanbic" value={note} onChange={(e) => setNote(e.target.value)} className="mytereka-input" />
        </div>

        <button onClick={handleTransfer} disabled={!canSubmit}
          className="w-full rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'var(--gradient-primary)' }}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          {effectiveFee > 0 ? `Transfer ${formatUGX(numAmount)} + ${formatUGX(effectiveFee)} fee` : 'Transfer'}
        </button>
      </div>
    </div>
  )
}

// ─── Add Account Modal ────────────────────────────────────────────────────────
function AddAccountModal({
  existingAccounts,
  onClose,
}: {
  existingAccounts: AccountRow[]
  onClose: () => void
}) {
  const router  = useRouter()
  const [name,    setName]    = useState('')
  const [type,    setType]    = useState<'cash' | 'mobile_money' | 'bank' | 'sacco'>('mobile_money')
  const [balance, setBalance] = useState('0')
  const [saving,  setSaving]  = useState(false)

  const hasCash     = existingAccounts.some((a) => a.type === 'cash')
  const cashBlocked = type === 'cash' && hasCash

  async function handleSave() {
    if (!name.trim())  { toast.error('Enter an account name'); return }
    if (cashBlocked)   { toast.error('You already have a Cash account'); return }
    setSaving(true)
    try {
      await createAccount({ name: name.trim(), type, balance: Math.round(Number(balance) || 0) })
      toast.success('Account added')
      onClose()
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to add account')
    } finally {
      setSaving(false)
    }
  }

  const accountTypes: Array<{ value: typeof type; label: string }> = [
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'bank',         label: 'Bank Account' },
    { value: 'sacco',        label: 'SACCO' },
    { value: 'cash',         label: 'Cash' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>Add Account</h2>
          <button onClick={onClose} style={{ color: 'var(--muted-foreground)' }}><X size={20} /></button>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Account name</label>
          <input type="text" placeholder="e.g. MTN Mobile Money" value={name} onChange={(e) => setName(e.target.value)} className="mytereka-input" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Type</label>
          <div className="grid grid-cols-2 gap-2">
            {accountTypes.map(({ value, label }) => {
              const meta     = ACCT_META[value]
              const Icon     = meta.icon
              const selected = type === value
              return (
                <button key={value} onClick={() => setType(value)}
                  className="flex items-center gap-2 rounded-xl p-3 text-sm font-medium transition-all"
                  style={{
                    background: selected ? `${meta.bg}` : 'var(--surface-alt)',
                    border: selected ? `1.5px solid ${meta.color}` : '1.5px solid transparent',
                    color: selected ? meta.color : 'var(--foreground)',
                  }}>
                  <Icon size={16} />
                  {label}
                </button>
              )
            })}
          </div>
          {cashBlocked && (
            <div className="mt-2 rounded-xl px-3 py-2 text-xs"
              style={{ background: 'rgba(239,68,68,0.10)', color: 'var(--danger)' }}>
              You already have a Cash account. Only one is allowed.
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Opening balance (UGX)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>UGX</span>
            <input type="number" inputMode="numeric" placeholder="0" value={balance}
              onChange={(e) => setBalance(e.target.value)} className="mytereka-input pl-16 font-bold" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving || cashBlocked}
          className="w-full rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'var(--gradient-primary)' }}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          Add Account
        </button>
      </div>
    </div>
  )
}

// ─── Edit Account Modal ────────────────────────────────────────────────────────
function EditAccountModal({
  acct,
  onClose,
  onDeleted,
}: {
  acct:      AccountRow
  onClose:   () => void
  onDeleted: () => void
}) {
  const router = useRouter()
  const meta   = ACCT_META[acct.type] ?? ACCT_META.cash
  const Icon   = meta.icon

  const [name,        setName]        = useState(acct.name)
  const [balance,     setBalance]     = useState(String(acct.balance))
  const [saving,      setSaving]      = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(false)
  const [deleting,    setDeleting]    = useState(false)

  async function handleSave() {
    if (!name.trim()) { toast.error('Enter an account name'); return }
    setSaving(true)
    try {
      await updateAccount(acct.id, { name: name.trim(), balance: Math.round(Number(balance) || 0) })
      toast.success('Account updated')
      onClose()
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteAccount(acct.id)
      toast.success('Account deleted')
      setConfirmDel(false)
      onDeleted()
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: meta.bg, color: meta.color }}>
              <Icon size={18} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
                Edit Account
              </h2>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{meta.label}</div>
            </div>
            <button onClick={onClose} style={{ color: 'var(--muted-foreground)' }}><X size={20} /></button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Account name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mytereka-input" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Correct Balance (UGX)</label>
            <div className="mb-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              This directly updates the tracked balance. Use this when the app balance doesn't match your actual balance.
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>UGX</span>
              <input type="number" inputMode="numeric" value={balance}
                onChange={(e) => setBalance(e.target.value)} className="mytereka-input pl-16 font-bold" />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDel(true)}
              className="flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition hover:opacity-90"
              style={{ background: 'rgba(239,68,68,0.10)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Trash2 size={14} />
              Delete
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--gradient-primary)' }}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={confirmDel} onOpenChange={setConfirmDel}>
        <DialogContent style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--foreground)' }}>Delete "{acct.name}"?</DialogTitle>
            <DialogDescription style={{ color: 'var(--muted-foreground)' }}>
              {acct.balance !== 0
                ? `This account has a balance of ${formatUGX(acct.balance)}. `
                : ''}
              All transactions linked to this account will be permanently deleted and their effect on budgets reversed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDel(false)}
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface-alt)' }}>
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={deleting}
              style={{ background: 'var(--danger)', color: '#fff' }}>
              {deleting && <Loader2 size={14} className="animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Accounts Manager ─────────────────────────────────────────────────────────
function AccountsManager() {
  const [accounts,     setAccounts]     = useState<AccountRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showAdd,      setShowAdd]      = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [editAcct,     setEditAcct]     = useState<AccountRow | null>(null)

  const reload = () => getAccountsForUser().then((a) => setAccounts(a as AccountRow[]))

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [])

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Total + Transfer */}
      <div className="rounded-2xl p-4 flex items-center justify-between"
        style={{ background: 'var(--surface-alt)' }}>
        <div>
          <div className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Total Balance</div>
          <div className="text-xl font-bold mt-0.5" style={{ color: 'var(--primary)' }}>{formatUGX(totalBalance)}</div>
        </div>
        {accounts.length >= 2 && (
          <button onClick={() => setShowTransfer(true)}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90"
            style={{ background: 'rgba(0,184,148,0.12)', color: 'var(--primary)', border: '1px solid rgba(0,184,148,0.3)' }}>
            <ArrowRightLeft size={14} />
            Transfer
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex h-20 items-center justify-center">
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl py-10 text-center"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <Wallet size={32} style={{ color: 'var(--muted-foreground)' }} />
          <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>No accounts yet</div>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Add your first account to track balances</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {accounts.map((acct) => {
            const meta = ACCT_META[acct.type] ?? ACCT_META.cash
            const Icon = meta.icon
            return (
              <button key={acct.id}
                onClick={() => setEditAcct(acct)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 w-full text-left transition hover:opacity-80 group"
                style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: meta.bg, color: meta.color }}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{acct.name}</div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{meta.label}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold"
                    style={{ color: acct.balance < 0 ? 'var(--danger)' : 'var(--primary)' }}>
                    {formatUGX(acct.balance)}
                  </div>
                  <Pencil size={13} className="opacity-0 group-hover:opacity-50 transition-opacity"
                    style={{ color: 'var(--muted-foreground)' }} />
                </div>
              </button>
            )
          })}
        </div>
      )}

      <button onClick={() => setShowAdd(true)}
        className="flex items-center justify-center gap-2 w-full rounded-full py-3 text-sm font-semibold transition hover:opacity-90"
        style={{ background: 'rgba(0,184,148,0.12)', color: 'var(--primary)', border: '1px solid rgba(0,184,148,0.3)' }}>
        <Plus size={15} strokeWidth={2.5} /> Add Account
      </button>

      {showAdd      && <AddAccountModal existingAccounts={accounts} onClose={() => { setShowAdd(false); reload() }} />}
      {showTransfer && <TransferModal accounts={accounts} onClose={() => { setShowTransfer(false); reload() }} />}
      {editAcct     && <EditAccountModal acct={editAcct} onClose={() => { setEditAcct(null); reload() }} onDeleted={() => { setEditAcct(null); reload() }} />}
    </div>
  )
}

type ProfileTab = 'settings' | 'badges' | 'import' | 'accounts' | 'friends'

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
  const [usernameOpen,  setUsernameOpen]  = useState(false)
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
            <button
              onClick={() => setUsernameOpen(true)}
              className="group flex items-center gap-1 text-sm transition hover:opacity-80"
              style={{ color: profile.username ? 'var(--primary)' : 'var(--warning)' }}
              aria-label="Edit username"
            >
              <span className="font-medium">
                {profile.username ? `@${profile.username}` : 'Set username'}
              </span>
              <Pencil size={11} className="opacity-70 group-hover:opacity-100" />
            </button>
            <div className="truncate text-xs" style={{ color: 'var(--muted-foreground)' }}>{profile.email}</div>
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
      <div className="flex rounded-2xl p-1 flex-wrap gap-1" style={{ background: 'var(--surface-alt)' }}>
        {([
          { key: 'settings',  label: '⚙️ Settings' },
          { key: 'friends',   label: '👥 Friends' },
          { key: 'accounts',  label: '💳 Accounts' },
          { key: 'badges',    label: '🏅 Badges' },
          { key: 'import',    label: '📥 Import' },
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

      {/* Friends tab */}
      {activeTab === 'friends' && <FriendsTab />}

      {/* Accounts tab */}
      {activeTab === 'accounts' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="mb-1 text-sm font-bold" style={{ color: 'var(--foreground)' }}>My Accounts</div>
            <div className="mb-4 text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              Add your cash, mobile money, bank, or SACCO accounts. Set the opening balance and track transfers between them.
            </div>
            <AccountsManager />
          </div>
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

      {usernameOpen && (
        <UsernameEditModal
          initialUsername={profile.username}
          onClose={() => setUsernameOpen(false)}
        />
      )}
    </div>
  )
}
