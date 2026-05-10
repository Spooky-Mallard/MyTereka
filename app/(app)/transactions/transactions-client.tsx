'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Pencil, CalendarDays, ChevronDown, Loader2, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { formatUGX } from '@/lib/format'
import { categoryMeta } from '@/lib/mock-data'
import type { TransactionRow } from '@/lib/actions/transactions'
import { updateTransaction, getCategoriesForUser, getAccountsForUser } from '@/lib/actions/transactions'

type Filter = 'all' | 'income' | 'expense' | 'investment'

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
    if (d.toDateString() === today.toDateString())         label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })

    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(t)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

function EditTransactionModal({
  tx,
  onClose,
}: {
  tx: TransactionRow
  onClose: () => void
}) {
  const router = useRouter()
  const [type,       setType]       = useState(tx.type as 'income' | 'expense' | 'transfer' | 'investment')
  const [amount,     setAmount]     = useState(String(tx.amount))
  const [catId,      setCatId]      = useState(tx.categoryId ?? '')
  const [accountId,  setAccountId]  = useState(tx.accountId ?? '')
  const [date,       setDate]       = useState(tx.date)
  const [note,       setNote]       = useState(tx.note ?? '')
  const [saving,     setSaving]     = useState(false)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [accounts,   setAccounts]   = useState<AccountOption[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([getCategoriesForUser(), getAccountsForUser()])
      .then(([cats, accs]) => {
        setCategories(cats)
        setAccounts(accs)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { setCatId('') }, [type])

  const cats = categories.filter((c) => c.type === type)

  async function handleSave() {
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }
    if (!catId)                          { toast.error('Select a category');   return }
    if (!accountId)                      { toast.error('Select an account');   return }
    setSaving(true)
    try {
      await updateTransaction(tx.id, {
        type,
        amount:     Math.round(Number(amount)),
        categoryId: catId,
        accountId,
        date,
        note:       note || undefined,
      })
      toast.success('Transaction updated')
      onClose()
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update')
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
            Edit Transaction
          </h2>
          <button onClick={onClose} style={{ color: 'var(--muted-foreground)' }}><X size={20} /></button>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : (
          <>
            {/* Type */}
            <div className="grid grid-cols-3 rounded-xl p-1" style={{ background: 'var(--surface-alt)' }}>
              {(['expense', 'income', 'investment'] as const).map((t) => {
                const activeColor = t === 'income' ? 'var(--success)' : t === 'expense' ? 'var(--danger)' : 'var(--primary)'
                return (
                  <button key={t} onClick={() => setType(t)}
                    className="rounded-lg py-2.5 text-sm font-semibold capitalize transition-all"
                    style={type === t
                      ? { background: 'var(--card)', color: activeColor, boxShadow: 'var(--shadow-sm)' }
                      : { color: 'var(--muted-foreground)' }}>
                    {t}
                  </button>
                )
              })}
            </div>

            {/* Amount */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Amount (UGX)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold"
                  style={{ color: 'var(--muted-foreground)' }}>UGX</span>
                <input type="number" inputMode="numeric" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mytereka-input pl-16 font-bold" />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Category
              </label>
              <div className="grid grid-cols-4 gap-2">
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
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: `${tint}22`, color: tint }}>
                        {Icon ? <Icon size={16} /> : <span className="text-xs">{cat.name[0]}</span>}
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

            {/* Account */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Account
              </label>
              <div className="relative">
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                  className="mytereka-input appearance-none pr-10">
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <ChevronDown size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }} />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Date
              </label>
              <div className="relative">
                <CalendarDays size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }} />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="mytereka-input pl-10" />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Note (optional)
              </label>
              <input type="text" placeholder="e.g. Lunch at cafeteria"
                value={note} onChange={(e) => setNote(e.target.value)}
                className="mytereka-input" />
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--gradient-primary)' }}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function TransactionsClient({ initialData }: { initialData: TransactionRow[] }) {
  const [filter,  setFilter]  = useState<Filter>('all')
  const [q,       setQ]       = useState('')
  const [editTx,  setEditTx]  = useState<TransactionRow | null>(null)

  const filtered = useMemo(
    () =>
      initialData
        .filter((t) => (filter === 'all' ? true : t.type === filter))
        .filter((t) =>
          q ? `${t.note ?? ''} ${t.categoryName} ${t.accountName}`.toLowerCase().includes(q.toLowerCase()) : true,
        ),
    [filter, q, initialData],
  )

  const totalIncome  = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net          = totalIncome - totalExpense
  const grouped      = groupByDate(filtered)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
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
          { label: 'Income',   value: formatUGX(totalIncome),  color: 'var(--success)', prefix: '+' },
          { label: 'Expenses', value: formatUGX(totalExpense), color: 'var(--danger)',  prefix: '−' },
          { label: 'Net',      value: formatUGX(Math.abs(net)),
            color: net >= 0 ? 'var(--success)' : 'var(--danger)', prefix: net >= 0 ? '+' : '−' },
        ].map(({ label, value, color, prefix }) => (
          <div key={label} className="rounded-2xl p-4"
            style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
            <div className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
            <div className="mt-1 text-base font-bold" style={{ color }}>
              {prefix}{value}
            </div>
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
        <div className="flex rounded-full p-1 flex-wrap" style={{ background: 'var(--surface-alt)' }}>
          {(['all', 'income', 'expense', 'investment'] as Filter[]).map((f) => (
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

      {/* Grouped list */}
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
              {initialData.length === 0
                ? 'Add your first one to get started'
                : 'Try adjusting your search or filter'}
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
                  const meta       = categoryMeta[t.categoryName]
                  const Icon       = meta?.icon
                  const isIncome   = t.type === 'income'
                  const isInvest   = t.type === 'investment'
                  const amountColor = isIncome ? 'var(--success)' : isInvest ? 'var(--primary)' : 'var(--danger)'
                  const amountPrefix = isIncome ? '+' : '−'
                  return (
                    <div key={t.id}
                      className="flex items-center gap-3 px-5 py-4 group"
                      style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: meta?.tint ? `${meta.tint}22` : t.categoryColor ? `${t.categoryColor}22` : 'var(--surface-alt)',
                          color: meta?.tint ?? t.categoryColor ?? 'var(--muted-foreground)',
                        }}>
                        {isInvest && !Icon ? <TrendingUp size={18} /> : Icon ? <Icon size={18} /> : null}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                          {t.note || t.categoryName}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {t.categoryName} · {t.accountName}
                          {isInvest && <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{ background: 'rgba(0,184,148,0.15)', color: 'var(--primary)' }}>invest</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold" style={{ color: amountColor }}>
                          {amountPrefix}{formatUGX(t.amount)}
                        </div>
                        <button
                          onClick={() => setEditTx(t)}
                          className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-full transition-all"
                          style={{ background: 'var(--surface-alt)', color: 'var(--muted-foreground)' }}>
                          <Pencil size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {editTx && <EditTransactionModal tx={editTx} onClose={() => setEditTx(null)} />}
    </div>
  )
}
