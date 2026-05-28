'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, X, Pencil, CalendarDays, ChevronDown, Loader2,
  TrendingUp, TrendingDown, Trash2, ArrowRightLeft, Sparkles, Wallet, MoreVertical,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatUGX } from '@/lib/format'
import { categoryMeta } from '@/lib/mock-data'
import type { TransactionRow } from '@/lib/actions/transactions'
import { updateTransaction, deleteTransaction, getCategoriesForUser, getAccountsForUser } from '@/lib/actions/transactions'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Filter = 'all' | 'income' | 'expense' | 'investment' | 'transfer'
type CategoryOption = { id: string; name: string; type: string; icon: string | null; color: string | null }
type AccountOption  = { id: string; name: string; balance: number; type: string }

function groupByDate(txs: TransactionRow[]) {
  const today     = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const map = new Map<string, TransactionRow[]>()
  for (const t of txs) {
    const d = new Date(t.date)
    let label: string
    if (d.toDateString() === today.toDateString())          label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-UG', { weekday: 'short', day: 'numeric', month: 'short' })

    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(t)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

function EditTransactionSheet({
  tx,
  onClose,
}: {
  tx: TransactionRow
  onClose: () => void
}) {
  const router = useRouter()
  const [type,        setType]        = useState(tx.type as 'income' | 'expense' | 'transfer' | 'investment')
  const [amount,      setAmount]      = useState(String(tx.amount))
  const [catId,       setCatId]       = useState(tx.categoryId)
  const [accountId,   setAccountId]   = useState(tx.accountId)
  const [date,        setDate]        = useState(tx.date)
  const [note,        setNote]        = useState(tx.note ?? '')
  const [transferFee, setTransferFee] = useState(tx.transferFee != null ? String(tx.transferFee) : '')
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [categories,  setCategories]  = useState<CategoryOption[]>([])
  const [accs,        setAccs]        = useState<AccountOption[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([getCategoriesForUser(), getAccountsForUser()])
      .then(([cats, accounts]) => {
        setCategories(cats)
        setAccs(accounts)
      })
      .finally(() => setLoading(false))
  }, [])

  const cats = categories.filter((c) => c.type === type)

  async function handleSave() {
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }
    if (!catId)                          { toast.error('Select a category');   return }
    if (!accountId)                      { toast.error('Select an account');   return }
    setSaving(true)
    try {
      const result = await updateTransaction(tx.id, {
        type,
        amount:      Math.round(Number(amount)),
        categoryId:  catId,
        accountId,
        date,
        note:        note || undefined,
        transferFee: transferFee ? Math.round(Number(transferFee)) : null,
      })
      toast.success('Transaction updated')
      if (result.negativeBalance) {
        toast.warning('Account balance is now negative. You may be tracking a debt or credit situation.')
      }
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
      await deleteTransaction(tx.id)
      toast.success('Transaction deleted')
      setConfirmOpen(false)
      onClose()
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="w-full max-w-lg rounded-t-3xl flex flex-col max-h-[92dvh]"
          style={{ background: 'var(--card)' }}>
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
          </div>

          <div className="flex items-center justify-between px-6 py-3 shrink-0">
            <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
              Edit Transaction
            </h2>
            <button onClick={onClose} style={{ color: 'var(--muted-foreground)' }}><X size={20} /></button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 pb-8 flex flex-col gap-5">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 rounded-xl p-1" style={{ background: 'var(--surface-alt)' }}>
                  {(['expense', 'income', 'investment'] as const).map((t) => {
                    const c = t === 'income' ? 'var(--success)' : t === 'expense' ? 'var(--danger)' : 'var(--primary)'
                    return (
                      <button key={t} onClick={() => setType(t)}
                        className="rounded-lg py-2.5 text-sm font-semibold capitalize transition-all"
                        style={type === t
                          ? { background: 'var(--card)', color: c, boxShadow: 'var(--shadow-sm)' }
                          : { color: 'var(--muted-foreground)' }}>
                        {t}
                      </button>
                    )
                  })}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Amount (UGX)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>UGX</span>
                    <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)}
                      className="mytereka-input pl-20 text-xl font-bold"
                      style={{ color: type === 'income' ? 'var(--success)' : type === 'expense' ? 'var(--danger)' : 'var(--primary)' }} />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Category</label>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {cats.map((cat) => {
                      const meta     = categoryMeta[cat.name]
                      const Icon     = meta?.icon
                      const selected = catId === cat.id
                      const tint     = meta?.tint ?? cat.color ?? 'var(--muted-foreground)'
                      return (
                        <button key={cat.id} onClick={() => setCatId(cat.id)}
                          className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center transition-all"
                          style={{
                            background: selected ? 'rgba(0,184,148,0.15)' : 'var(--surface-alt)',
                            border: selected ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                          }}>
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                            style={{ background: `${tint}22`, color: tint }}>
                            {Icon
                              ? <Icon size={16} />
                              : cat.icon && cat.icon.codePointAt(0)! > 127
                                ? cat.icon
                                : <span className="text-xs">{cat.name[0]}</span>
                            }
                          </span>
                          <span className="text-[10px] font-medium leading-tight"
                            style={{ color: selected ? 'var(--primary)' : 'var(--foreground)' }}>
                            {cat.name.split('/')[0]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Account</label>
                  <div className="relative">
                    <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                      className="mytereka-input appearance-none pr-10">
                      {accs.map((a) => <option key={a.id} value={a.id}>{a.name} — {formatUGX(a.balance)}</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Date</label>
                  <div className="relative">
                    <CalendarDays size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mytereka-input pl-12" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    Transaction Fee (UGX) <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>— optional</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>UGX</span>
                    <input type="number" inputMode="numeric" placeholder="0"
                      value={transferFee} onChange={(e) => setTransferFee(e.target.value)}
                      className="mytereka-input pl-16" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Note (optional)</label>
                  <input type="text" placeholder="e.g. Lunch at cafeteria"
                    value={note} onChange={(e) => setNote(e.target.value)} className="mytereka-input" />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-full py-3.5 px-5 text-sm font-semibold transition hover:opacity-90"
                    style={{ background: 'rgba(239,68,68,0.10)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <Trash2 size={15} />
                    Delete
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: 'var(--gradient-primary)' }}>
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--foreground)' }}>Delete transaction?</DialogTitle>
            <DialogDescription style={{ color: 'var(--muted-foreground)' }}>
              This will permanently delete this transaction and reverse its effect on your account balance
              {tx.type === 'expense' ? ' and budget' : ''}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}
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

// ── Right rail helpers ──────────────────────────────────────────────────────

function TxnIcon({ t }: { t: TransactionRow }) {
  const meta       = t.categoryName ? categoryMeta[t.categoryName] : undefined
  const Icon       = meta?.icon
  const isTransfer = t.type === 'transfer'
  const isInvest   = t.type === 'investment'
  const tint       = meta?.tint ?? t.categoryColor ?? 'var(--muted-foreground)'
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 11, flexShrink: 0,
      background: isTransfer ? 'rgba(0,184,148,0.15)' : `${tint}22`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: isTransfer ? 'var(--primary)' : tint,
    }}>
      {isTransfer
        ? <ArrowRightLeft size={16} />
        : Icon
          ? <Icon size={16} />
          : t.categoryIcon && t.categoryIcon.codePointAt(0)! > 127
            ? <span style={{ fontSize: 16 }}>{t.categoryIcon}</span>
            : isInvest
              ? <TrendingUp size={16} />
              : <span style={{ fontSize: 11, fontWeight: 700 }}>{(t.categoryName ?? '?')[0]}</span>
      }
    </div>
  )
}

// ── Desktop right rail ──────────────────────────────────────────────────────

function DesktopRightRail({
  filtered,
  accounts,
}: {
  filtered: TransactionRow[]
  accounts: AccountOption[]
}) {
  // "Where it went" — group expenses by category
  const catSpend = useMemo(() => {
    const map = new Map<string, { amt: number; color: string; icon: string | null }>()
    for (const t of filtered) {
      if (t.type !== 'expense') continue
      const key   = t.categoryName ?? 'Other'
      const color = t.categoryColor ?? '#94A3B8'
      const icon  = t.categoryIcon ?? null
      const prev  = map.get(key)
      if (prev) prev.amt += t.amount
      else map.set(key, { amt: t.amount, color, icon })
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].amt - a[1].amt)
      .slice(0, 6)
  }, [filtered])

  // Insight — spendiest date group
  const insight = useMemo(() => {
    const grouped = groupByDate(filtered)
    let maxLabel = '', maxAmt = 0
    for (const g of grouped) {
      const spend = g.items.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      if (spend > maxAmt) { maxAmt = spend; maxLabel = g.label }
    }
    return { label: maxLabel, amt: maxAmt }
  }, [filtered])

  return (
    <aside style={{
      width: 280, flexShrink: 0,
      background: 'var(--sidebar)',
      borderLeft: '1px solid var(--sidebar-border)',
      padding: '24px 16px',
      overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      {/* Where it went */}
      <div>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Where it went
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 14, padding: '4px 14px', boxShadow: 'var(--shadow-card)' }}>
          {catSpend.length === 0 ? (
            <div style={{ padding: '12px 0', fontFamily: 'Poppins, sans-serif', fontSize: 11, color: 'var(--muted-foreground)' }}>No expenses</div>
          ) : catSpend.map(([cat, { amt, color, icon }], i) => {
            const meta = categoryMeta[cat]
            const Icon = meta?.icon
            const tint = meta?.tint ?? color
            return (
              <div key={cat} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                  background: `${tint}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {Icon
                    ? <Icon size={13} style={{ color: tint }} />
                    : icon && icon.codePointAt(0)! > 127
                      ? <span style={{ fontSize: 13 }}>{icon}</span>
                      : <span style={{ fontSize: 10, fontWeight: 700, color: tint }}>{cat[0]}</span>
                  }
                </div>
                <span style={{ flex: 1, fontFamily: 'Nunito Sans, sans-serif', fontSize: 12, color: 'var(--foreground)', fontWeight: 500 }}>{cat}</span>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--foreground)' }}>{formatUGX(amt)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Insight */}
      {insight.amt > 0 && (
        <div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Insight
          </div>
          <div style={{
            padding: 12, borderRadius: 14,
            background: 'rgba(245,158,11,0.10)',
            border: '1px solid rgba(245,158,11,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Sparkles size={13} style={{ color: 'var(--warning)' }} />
              <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--warning)' }}>Spendiest day</span>
            </div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--foreground)', lineHeight: 1.2 }}>
              {insight.label} · {formatUGX(insight.amt)}
            </div>
            <div style={{ fontFamily: 'Nunito Sans, sans-serif', fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4, lineHeight: 1.4 }}>
              Review this day to find saving opportunities.
            </div>
          </div>
        </div>
      )}

      {/* Accounts */}
      <div>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Accounts
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {accounts.map((a) => (
            <div key={a.id} style={{
              background: 'var(--card)', borderRadius: 12, padding: 10,
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                background: 'rgba(0,184,148,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Wallet size={14} style={{ color: 'var(--primary)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 11, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--foreground)', marginTop: 1 }}>{formatUGX(a.balance)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

// ── Desktop table ───────────────────────────────────────────────────────────

const TABLE_COLS = '40px 1.6fr 1fr 1fr 80px 130px 24px'

function DesktopTable({
  grouped,
  filtered,
  onEdit,
}: {
  grouped: ReturnType<typeof groupByDate>
  filtered: TransactionRow[]
  onEdit: (t: TransactionRow) => void
}) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 18, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: TABLE_COLS,
        gap: 12, padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-alt)',
        fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 700,
        color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        <div />
        <div>Note</div>
        <div>Category</div>
        <div>Account</div>
        <div>Time</div>
        <div style={{ textAlign: 'right' }}>Amount</div>
        <div />
      </div>

      {grouped.map((g, gi) => {
        const groupNet = g.items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
        return (
          <div key={g.label}>
            {/* Date group row */}
            <div style={{
              padding: '10px 16px 6px',
              fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--primary)',
              background: 'rgba(0,184,148,0.06)',
              borderTop: gi > 0 ? '1px solid var(--border)' : 'none',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{g.label}</span>
              <span style={{ color: 'var(--muted-foreground)', fontWeight: 500, fontSize: 10 }}>
                {g.items.length} · net {groupNet >= 0 ? '+' : '−'}{formatUGX(Math.abs(groupNet))}
              </span>
            </div>

            {/* Transaction rows */}
            {g.items.map((t) => {
              const isIncome   = t.type === 'income'
              const isInvest   = t.type === 'investment'
              const isTransfer = t.type === 'transfer'
              const amtColor   = isIncome ? 'var(--success)' : isInvest || isTransfer ? 'var(--primary)' : 'var(--danger)'
              const prefix     = isIncome ? '+' : isTransfer ? '' : '−'
              const timeStr    = t.date
                ? new Date(t.date + 'T00:00:00').toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })
                : '—'
              const meta       = t.categoryName ? categoryMeta[t.categoryName] : undefined
              const tint       = meta?.tint ?? t.categoryColor ?? '#94A3B8'

              return (
                <div key={t.id}
                  onClick={() => onEdit(t)}
                  style={{
                    display: 'grid', gridTemplateColumns: TABLE_COLS,
                    gap: 12, padding: '12px 16px',
                    borderTop: '1px solid var(--border)',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <TxnIcon t={t} />
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.note || t.categoryName || 'Transfer'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, background: tint, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Nunito Sans, sans-serif', fontSize: 12, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.categoryName ?? 'Transfer'}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Nunito Sans, sans-serif', fontSize: 12, color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.accountName || 'Deleted Account'}
                  </div>
                  <div style={{ fontFamily: 'Nunito Sans, sans-serif', fontSize: 11, color: 'var(--muted-foreground)' }}>
                    {timeStr}
                  </div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: amtColor, textAlign: 'right' }}>
                    {prefix}{formatUGX(t.amount)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--muted-foreground)' }}>
                    <MoreVertical size={14} />
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface-alt)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'Nunito Sans, sans-serif', fontSize: 11, color: 'var(--muted-foreground)',
      }}>
        <span>Showing {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

// ── Main client component ───────────────────────────────────────────────────

export function TransactionsClient({
  initialData,
  accounts,
}: {
  initialData: TransactionRow[]
  accounts: AccountOption[]
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [q,      setQ]      = useState('')
  const [editTx, setEditTx] = useState<TransactionRow | null>(null)

  const filtered = useMemo(
    () =>
      initialData
        .filter((t) => (filter === 'all' ? true : t.type === filter))
        .filter((t) =>
          q ? `${t.note ?? ''} ${t.categoryName ?? ''} ${t.accountName}`.toLowerCase().includes(q.toLowerCase()) : true,
        ),
    [filter, q, initialData],
  )

  const totalIn  = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalOut = filtered.filter((t) => t.type === 'expense' || t.type === 'investment').reduce((s, t) => s + t.amount, 0)
  const net      = totalIn - totalOut
  const grouped  = groupByDate(filtered)

  const statStrip = [
    { label: 'Money in',       value: '+' + formatUGX(totalIn),         tint: 'var(--success)', Icon: TrendingUp   },
    { label: 'Money out',      value: '−' + formatUGX(totalOut),        tint: 'var(--danger)',  Icon: TrendingDown  },
    { label: 'Net this week',  value: (net >= 0 ? '+' : '−') + formatUGX(Math.abs(net)), tint: 'var(--primary)', Icon: Wallet },
    { label: 'Transactions',   value: String(filtered.length),           tint: 'var(--warning)', Icon: Sparkles     },
  ]

  return (
    <>
      {/* ── Desktop layout ─────────────────────────────────────── */}
      {/* Negative margins escape the shell's px-4 py-6/py-8 padding so the right rail can touch the edge */}
      <div className="hidden lg:flex" style={{ gap: 0, margin: '-32px -16px -32px -16px', minHeight: 'calc(100vh - 64px)' }}>
        {/* Main column */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '24px 28px 32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div>
              <div style={{ fontFamily: 'Nunito Sans, sans-serif', fontSize: 12, color: 'var(--muted-foreground)' }}>Money</div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 26, color: 'var(--foreground)', marginTop: 2, letterSpacing: '-0.02em' }}>
                Transactions
              </div>
            </div>
            <button style={{
              padding: '9px 14px', borderRadius: 10,
              background: 'var(--card)', color: 'var(--foreground)',
              border: '1px solid var(--border)',
              fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 12,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              ⬇ Export
            </button>
          </div>

          {/* Stat strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
            {statStrip.map(({ label, value, tint, Icon }) => (
              <div key={label} style={{
                background: 'var(--card)', borderRadius: 16, padding: 16,
                boxShadow: 'var(--shadow-card)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: tint + '22', color: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--foreground)', marginTop: 2, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: '12px 14px',
            boxShadow: 'var(--shadow-card)', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            <div style={{
              flex: 1, minWidth: 180,
              background: 'var(--surface-alt)', borderRadius: 10,
              padding: '8px 12px',
              display: 'flex', alignItems: 'center', gap: 8,
              color: 'var(--muted-foreground)',
            }}>
              <Search size={14} />
              <input
                type="text" value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search by note, category, or account"
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'Nunito Sans, sans-serif', fontSize: 12, color: 'var(--foreground)',
                  width: '100%',
                }}
              />
              {q && <button onClick={() => setQ('')}><X size={12} /></button>}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'income', 'expense', 'investment', 'transfer'] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '7px 13px', borderRadius: 10, border: 'none',
                  background: filter === f ? 'var(--primary)' : 'var(--surface-alt)',
                  color: filter === f ? '#fff' : 'var(--muted-foreground)',
                  fontFamily: 'Poppins, sans-serif', fontWeight: filter === f ? 700 : 600, fontSize: 11,
                  cursor: 'pointer', textTransform: 'capitalize',
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Table or empty */}
          {grouped.length === 0 ? (
            <div style={{
              background: 'var(--card)', borderRadius: 18, boxShadow: 'var(--shadow-card)',
              padding: '64px 24px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            }}>
              <div style={{ fontSize: 40 }}>🔍</div>
              <div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--foreground)' }}>
                  {initialData.length === 0 ? 'No transactions yet' : 'No transactions found'}
                </div>
                <div style={{ marginTop: 4, fontFamily: 'Nunito Sans, sans-serif', fontSize: 13, color: 'var(--muted-foreground)' }}>
                  {initialData.length === 0 ? 'Add your first one to get started' : 'Try adjusting your search or filter'}
                </div>
              </div>
            </div>
          ) : (
            <DesktopTable grouped={grouped} filtered={filtered} onEdit={(t) => setEditTx(t)} />
          )}
        </div>

        {/* Right rail */}
        <DesktopRightRail filtered={filtered} accounts={accounts} />
      </div>

      {/* ── Mobile layout ──────────────────────────────────────── */}
      <div className="lg:hidden mx-auto flex max-w-5xl flex-col gap-6 p-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            Transactions
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'}
          </p>
        </div>

        {/* Summary chips */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Income',   value: formatUGX(totalIn),   color: 'var(--success)', prefix: '+' },
            { label: 'Expenses', value: formatUGX(totalOut),  color: 'var(--danger)',  prefix: '−' },
            { label: 'Net', value: formatUGX(Math.abs(net)),
              color: net >= 0 ? 'var(--success)' : 'var(--danger)', prefix: net >= 0 ? '+' : '−' },
          ].map(({ label, value, color, prefix }) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
              <div className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
              <div className="mt-1 text-base font-bold" style={{ color }}>{prefix}{value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl p-3"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={15}
              style={{ color: 'var(--muted-foreground)' }} />
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search transactions…"
              className="mytereka-input rounded-full pl-9 text-sm" style={{ height: 40 }} />
            {q && (
              <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--muted-foreground)' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex rounded-full p-1 flex-wrap gap-0.5" style={{ background: 'var(--surface-alt)' }}>
            {(['all', 'income', 'expense', 'investment', 'transfer'] as Filter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="rounded-full px-3 py-1.5 text-sm font-medium capitalize transition"
                style={filter === f
                  ? { background: 'var(--primary)', color: '#fff' }
                  : { color: 'var(--muted-foreground)' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped card list */}
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl py-16 text-center"
            style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
              style={{ background: 'var(--surface-alt)' }}>🔍</div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                {initialData.length === 0 ? 'No transactions yet' : 'No transactions found'}
              </div>
              <div className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {initialData.length === 0 ? 'Add your first one to get started' : 'Try adjusting your search or filter'}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {grouped.map(({ label, items }) => (
              <div key={label}>
                <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--muted-foreground)' }}>
                  {label}
                </div>
                <div className="overflow-hidden rounded-2xl"
                  style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
                  {items.map((t, i) => {
                    const meta         = t.categoryName ? categoryMeta[t.categoryName] : undefined
                    const Icon         = meta?.icon
                    const isIncome     = t.type === 'income'
                    const isInvest     = t.type === 'investment'
                    const isTransfer   = t.type === 'transfer'
                    const amountColor  = isIncome ? 'var(--success)' : isInvest || isTransfer ? 'var(--primary)' : 'var(--danger)'
                    const amountPrefix = isIncome ? '+' : isTransfer ? '' : '−'
                    const acctName     = t.accountName || 'Deleted Account'
                    const acctMuted    = !t.accountName

                    return (
                      <div key={t.id}
                        className="flex items-center gap-3 px-5 py-4 group cursor-pointer transition hover:opacity-90"
                        style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
                        onClick={() => setEditTx(t)}>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                          style={isTransfer
                            ? { background: 'rgba(0,184,148,0.15)', color: 'var(--primary)' }
                            : {
                                background: meta?.tint ? `${meta.tint}22` : t.categoryColor ? `${t.categoryColor}22` : 'var(--surface-alt)',
                                color: meta?.tint ?? t.categoryColor ?? 'var(--muted-foreground)',
                              }
                          }>
                          {isTransfer
                            ? <ArrowRightLeft size={18} />
                            : Icon
                              ? <Icon size={18} />
                              : t.categoryIcon && t.categoryIcon.codePointAt(0)! > 127
                                ? <span style={{ fontSize: 18 }}>{t.categoryIcon}</span>
                                : isInvest ? <TrendingUp size={18} /> : <span className="text-xs font-bold">{(t.categoryName ?? '?')[0]}</span>
                          }
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                            {t.note || t.categoryName || 'Transfer'}
                          </div>
                          <div className="text-xs flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                            <span>{t.categoryName ?? 'Transfer'}</span>
                            <span>·</span>
                            <span style={acctMuted ? { color: 'var(--muted-foreground)', fontStyle: 'italic' } : {}}>
                              {acctName}
                            </span>
                            {isInvest && (
                              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                                style={{ background: 'rgba(0,184,148,0.15)', color: 'var(--primary)' }}>
                                invest
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold" style={{ color: amountColor }}>
                            {amountPrefix}{formatUGX(t.amount)}
                          </div>
                          <Pencil size={13} className="opacity-0 group-hover:opacity-60 transition-opacity"
                            style={{ color: 'var(--muted-foreground)' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editTx && <EditTransactionSheet tx={editTx} onClose={() => setEditTx(null)} />}
    </>
  )
}
