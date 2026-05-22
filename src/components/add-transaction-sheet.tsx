'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { categoryMeta } from '@/lib/mock-data'
import { formatUGX } from '@/lib/format'
import { createTransaction } from '@/lib/actions/transactions'
import { getUserAccounts, getUserCategories } from '@/lib/actions/profile'
import type { AccountOption, CategoryOption } from '@/lib/actions/profile'
import { CalendarDays, ChevronDown, Loader2 } from 'lucide-react'
import { RatingModal } from '@/components/rating-modal'

export function AddTransactionSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [type,        setType]       = useState<'expense' | 'income' | 'investment'>('expense')
  const [amount,      setAmount]     = useState('')
  const [catId,       setCatId]      = useState('')
  const [accountId,   setAccountId]  = useState('')
  const [date,        setDate]       = useState(new Date().toISOString().split('T')[0])
  const [note,        setNote]       = useState('')
  const [transferFee, setTransferFee] = useState('')
  const [saving,      setSaving]     = useState(false)
  const [showRating, setShowRating] = useState(false)

  const [accounts,   setAccounts]   = useState<AccountOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading,    setLoading]    = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([getUserAccounts(), getUserCategories()])
      .then(([accs, cats]) => {
        setAccounts(accs)
        setCategories(cats)
        if (accs.length && !accountId) setAccountId(accs[0].id)
      })
      .finally(() => setLoading(false))
  }, [open])

  // reset category when type changes
  useEffect(() => { setCatId('') }, [type])

  const cats = categories.filter((c) => c.type === type)

  async function handleSave() {
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }
    if (!catId)                          { toast.error('Select a category');   return }
    if (!accountId)                      { toast.error('Select an account');   return }

    setSaving(true)
    try {
      const result = await createTransaction({
        accountId,
        categoryId:  catId,
        type,
        amount:      Math.round(Number(amount)),
        note:        note || undefined,
        date,
        transferFee: transferFee ? Math.round(Number(transferFee)) : undefined,
      })
      const label = type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : 'Investment'
      toast.success(`${label} saved — ${formatUGX(Number(amount))}`)
      if (result.negativeBalance) {
        toast.warning('Account balance is now negative. You may be tracking a debt or credit situation.')
      }
      if (result.promptRating) {
        setShowRating(true)
      }
      setAmount(''); setCatId(''); setNote(''); setTransferFee('')
      onClose()
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save transaction')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 max-h-[92dvh] overflow-y-auto"
        style={{ background: 'var(--card)', border: 'none' }}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
        <SheetHeader className="px-6 pt-4 pb-2">
          <SheetTitle className="text-xl font-bold"
            style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            Add Transaction
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : (
          <div className="px-6 pb-8 flex flex-col gap-5">
            {/* Type toggle */}
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
                  style={{ color: 'var(--muted-foreground)' }}>
                  UGX
                </span>
                <input type="number" inputMode="numeric" placeholder="0"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="mytereka-input pl-20 text-xl font-bold"
                  style={{ color: type === 'income' ? 'var(--success)' : type === 'expense' ? 'var(--danger)' : 'var(--primary)' }} />
              </div>
            </div>

            {/* Category grid */}
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Category
              </label>
              {cats.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No categories found</p>
              ) : (
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
              )}
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
                    <option key={a.id} value={a.id}>
                      {a.name} — {formatUGX(a.balance)}
                    </option>
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
                  className="mytereka-input pl-12" />
              </div>
            </div>

            {/* Transaction fee */}
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Transaction Fee (UGX) <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>— optional</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold"
                  style={{ color: 'var(--muted-foreground)' }}>UGX</span>
                <input type="number" inputMode="numeric" placeholder="0"
                  value={transferFee} onChange={(e) => setTransferFee(e.target.value)}
                  className="mytereka-input pl-16" />
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

            {/* Save */}
            <button onClick={handleSave} disabled={saving}
              className="w-full rounded-full py-4 text-base font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 16px rgba(0,184,148,0.35)', fontFamily: 'Poppins, sans-serif' }}>
              {saving && <Loader2 size={18} className="animate-spin" />}
              Save Transaction
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
      <RatingModal open={showRating} onClose={() => setShowRating(false)} />
    </>
  )
}
