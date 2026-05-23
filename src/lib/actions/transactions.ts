'use server'

import { db } from '@/lib/db'
import { transactions, accounts, budgets, users, categories, goals, streakHistory } from '@/lib/schema'
import { auth } from '@/lib/auth'
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm'
import { awardXP, checkAndAwardBadge } from './gamification'
import { completeQuestIfApplicable } from './quests'
import { todayISO } from '@/lib/format'
import { calcMoMoFee } from '@/lib/momo-fees'

// ─────────────────────────────────────────────────────────────────────────────

function todayEAT(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().split('T')[0]
}

function yesterdayEAT(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000 - 86400000).toISOString().split('T')[0]
}

export async function updateStreak(userId: string) {
  const today     = todayEAT()
  const yesterday = yesterdayEAT()

  const [user] = await db
    .select({ streakCount: users.streakCount, lastActiveDate: users.lastActiveDate })
    .from(users)
    .where(eq(users.id, userId))

  if (!user || user.lastActiveDate === today) return

  const continued = user.lastActiveDate === yesterday
  const newStreak = continued ? user.streakCount + 1 : 1

  await db
    .update(users)
    .set({ streakCount: newStreak, lastActiveDate: today })
    .where(eq(users.id, userId))

  if (continued) {
    const [open] = await db
      .select({ id: streakHistory.id })
      .from(streakHistory)
      .where(and(eq(streakHistory.userId, userId), sql`end_date IS NULL`))
    if (open) {
      await db
        .update(streakHistory)
        .set({ endDate: today, length: newStreak })
        .where(eq(streakHistory.id, open.id))
    } else {
      await db.insert(streakHistory).values({ userId, startDate: today, endDate: null, length: 1 })
    }
  } else {
    const [open] = await db
      .select({ id: streakHistory.id, length: streakHistory.length })
      .from(streakHistory)
      .where(and(eq(streakHistory.userId, userId), sql`end_date IS NULL`))
    if (open) {
      await db
        .update(streakHistory)
        .set({ endDate: yesterday, length: open.length })
        .where(eq(streakHistory.id, open.id))
    }
    await db.insert(streakHistory).values({ userId, startDate: today, endDate: null, length: 1 })
  }

  if (newStreak === 7) {
    await awardXP(userId, 'streak_7', 50, '7-day streak milestone')
    await checkAndAwardBadge(userId, 'streak_7')
  }
}

export async function createTransaction(data: {
  accountId:   string
  categoryId:  string
  type:        'income' | 'expense' | 'transfer' | 'investment'
  amount:      number
  note?:       string
  date:        string
  goalId?:     string
  transferFee?: number
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  const [existingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.userId, userId))
  const isFirst = Number(existingCount?.count ?? 0) === 0

  const [acct] = await db
    .select({ balance: accounts.balance })
    .from(accounts)
    .where(and(eq(accounts.id, data.accountId), eq(accounts.userId, userId)))

  const balanceDelta = data.type === 'income' ? data.amount : -data.amount
  const projectedBalance = (acct?.balance ?? 0) + balanceDelta
  const willGoNegative = projectedBalance < 0

  await db.transaction(async (tx) => {
    await tx.insert(transactions).values({
      ...data,
      userId,
      transferFee: data.transferFee && data.transferFee > 0 ? data.transferFee : null,
    })

    await tx
      .update(accounts)
      .set({ balance: sql`balance + ${balanceDelta}`, updatedAt: sql`now()` })
      .where(and(eq(accounts.id, data.accountId), eq(accounts.userId, userId)))

    if (data.type === 'expense') {
      const today = todayISO()
      await tx
        .update(budgets)
        .set({ spentAmount: sql`spent_amount + ${data.amount}` })
        .where(
          and(
            eq(budgets.categoryId, data.categoryId),
            eq(budgets.userId, userId),
            lte(budgets.periodStartDate, today),
            gte(budgets.periodEndDate, today),
          ),
        )
    }
  })

  await updateStreak(userId)
  await awardXP(userId, 'transaction_logged', 5, 'Logged a transaction')

  if (isFirst) {
    await checkAndAwardBadge(userId, 'first_transaction')
  }

  const [{ txCount }] = await db
    .select({ txCount: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.userId, userId))

  const [userRating] = await db
    .select({ ratingAskedAt: users.ratingAskedAt })
    .from(users)
    .where(eq(users.id, userId))

  const promptRating = Number(txCount) === 3 && userRating?.ratingAskedAt === null

  if (promptRating) {
    await db
      .update(users)
      .set({ ratingAskedAt: sql`now()` })
      .where(eq(users.id, userId))
  }

  if (data.type === 'expense' || data.type === 'investment') {
    await completeQuestIfApplicable('log_expense')
  } else if (data.type === 'income') {
    await completeQuestIfApplicable('log_income')
  }
  if (data.note && data.note.trim().length > 0) {
    await completeQuestIfApplicable('add_note')
  }

  return { negativeBalance: willGoNegative, promptRating }
}

export type TransactionRow = {
  id:           string
  type:         string
  amount:       number
  note:         string | null
  date:         string
  categoryId:   string
  categoryName: string
  categoryIcon: string | null
  categoryColor:string | null
  accountId:    string
  accountName:  string
  transferFee:  number | null
}

export async function getTransactions(filters?: {
  type?:       'income' | 'expense'
  categoryId?: string
  accountId?:  string
  from?:       string
  to?:         string
}): Promise<TransactionRow[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  const rows = await db
    .select({
      id:            transactions.id,
      type:          transactions.type,
      amount:        transactions.amount,
      note:          transactions.note,
      date:          transactions.date,
      categoryId:    transactions.categoryId,
      categoryName:  categories.name,
      categoryIcon:  categories.icon,
      categoryColor: categories.color,
      accountId:     transactions.accountId,
      accountName:   accounts.name,
      transferFee:   transactions.transferFee,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .innerJoin(accounts,   eq(transactions.accountId,  accounts.id))
    .where(
      and(
        eq(transactions.userId, userId),
        filters?.type       ? eq(transactions.type, filters.type)             : undefined,
        filters?.categoryId ? eq(transactions.categoryId, filters.categoryId) : undefined,
        filters?.accountId  ? eq(transactions.accountId,  filters.accountId)  : undefined,
        filters?.from       ? gte(transactions.date, filters.from)            : undefined,
        filters?.to         ? lte(transactions.date, filters.to)              : undefined,
      ),
    )
    .orderBy(desc(transactions.date), desc(transactions.createdAt))

  return rows
}

export async function deleteTransaction(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  const [tx] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))

  if (!tx) throw new Error('Transaction not found')

  const balanceDelta = tx.type === 'income' ? -tx.amount : tx.amount

  await db.transaction(async (dbTx) => {
    await dbTx
      .update(accounts)
      .set({ balance: sql`balance + ${balanceDelta}`, updatedAt: sql`now()` })
      .where(eq(accounts.id, tx.accountId))

    if (tx.type === 'expense') {
      const today = todayISO()
      await dbTx
        .update(budgets)
        .set({ spentAmount: sql`GREATEST(0, spent_amount - ${tx.amount})` })
        .where(
          and(
            eq(budgets.categoryId, tx.categoryId),
            eq(budgets.userId, userId),
            lte(budgets.periodStartDate, today),
            gte(budgets.periodEndDate, today),
          ),
        )
    }

    await dbTx
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
  })
}

export type ImportRow = {
  date:     string   // YYYY-MM-DD
  type:     'income' | 'expense'
  item:     string   // used as note
  category: string   // matched or created
  amount:   number
  quantity?: number
}

export async function importTransactions(rows: ImportRow[]): Promise<{ imported: number; skipped: number }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  const userCats = await db.select().from(categories).where(eq(categories.userId, userId))

  let imported = 0
  let skipped  = 0

  const userAccounts = await db
    .select({ id: accounts.id, type: accounts.type })
    .from(accounts)
    .where(eq(accounts.userId, userId))

  if (!userAccounts.length) throw new Error('No accounts found. Please create an account first.')

  const defaultAccount =
    userAccounts.find((a) => a.type === 'cash') ??
    userAccounts.find((a) => a.type === 'mobile_money') ??
    userAccounts[0]

  const existingTxns = await db
    .select({ date: transactions.date, note: transactions.note, amount: transactions.amount })
    .from(transactions)
    .where(eq(transactions.userId, userId))

  const existingSet = new Set(
    existingTxns.map((t) => `${t.date}|${(t.note ?? '').toLowerCase()}|${t.amount}`)
  )

  for (const row of rows) {
    try {
      const amount = row.quantity ? row.amount * row.quantity : row.amount
      const dupKey = `${row.date}|${(row.item ?? '').toLowerCase()}|${Math.round(amount)}`
      if (existingSet.has(dupKey)) {
        skipped++
        continue
      }

      const normalised = row.category.trim()
      let cat = userCats.find(
        (c) => c.name.toLowerCase() === normalised.toLowerCase() && c.type === row.type,
      )

      if (!cat) {
        const [inserted] = await db
          .insert(categories)
          .values({ userId, name: normalised, type: row.type, isDefault: false })
          .returning()
        cat = inserted
        userCats.push(inserted)
      }

      await db.transaction(async (tx) => {
        await tx.insert(transactions).values({
          userId,
          accountId:  defaultAccount.id,
          categoryId: cat!.id,
          type:       row.type,
          amount:     Math.round(amount),
          note:       row.item || null,
          date:       row.date,
        })

        const delta = row.type === 'income' ? amount : -amount
        await tx
          .update(accounts)
          .set({ balance: sql`balance + ${Math.round(delta)}`, updatedAt: sql`now()` })
          .where(eq(accounts.id, defaultAccount.id))
      })

      existingSet.add(dupKey)
      imported++
    } catch {
      skipped++
    }
  }

  if (imported > 0) {
    await awardXP(userId, 'transaction_logged', imported * 5, `Imported ${imported} transactions`)
    await updateStreak(userId)
  }

  return { imported, skipped }
}

export async function updateTransaction(
  id: string,
  data: {
    accountId?:   string
    categoryId?:  string
    type?:        'income' | 'expense' | 'transfer' | 'investment'
    amount?:      number
    note?:        string
    date?:        string
    goalId?:      string | null
    transferFee?: number | null
  },
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  const [old] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
  if (!old) throw new Error('Transaction not found')

  const newType      = data.type      ?? old.type
  const newAmount    = data.amount    ?? old.amount
  const newAccountId = data.accountId ?? old.accountId

  // Project final balance to detect negative result
  const [targetAcct] = await db
    .select({ balance: accounts.balance })
    .from(accounts)
    .where(eq(accounts.id, newAccountId))

  const oldDeltaOnTarget = old.accountId === newAccountId
    ? (old.type === 'income' ? -old.amount : old.amount)
    : 0
  const newDeltaOnTarget = newType === 'income' ? newAmount : -newAmount
  const projectedBalance = (targetAcct?.balance ?? 0) + oldDeltaOnTarget + newDeltaOnTarget
  const willGoNegative = projectedBalance < 0

  await db.transaction(async (tx) => {
    // Reverse old balance effect
    const oldDelta = old.type === 'income' ? -old.amount : old.amount
    await tx
      .update(accounts)
      .set({ balance: sql`balance + ${oldDelta}`, updatedAt: sql`now()` })
      .where(eq(accounts.id, old.accountId))

    // Reverse old budget effect — clamped at zero
    if (old.type === 'expense') {
      const today = todayISO()
      await tx
        .update(budgets)
        .set({ spentAmount: sql`GREATEST(0, spent_amount - ${old.amount})` })
        .where(
          and(
            eq(budgets.categoryId, old.categoryId),
            eq(budgets.userId, userId),
            lte(budgets.periodStartDate, today),
            gte(budgets.periodEndDate, today),
          ),
        )
    }

    const newCategoryId = data.categoryId ?? old.categoryId

    // Apply new balance effect
    const newDelta = newType === 'income' ? newAmount : -newAmount
    await tx
      .update(accounts)
      .set({ balance: sql`balance + ${newDelta}`, updatedAt: sql`now()` })
      .where(eq(accounts.id, newAccountId))

    // Apply new budget effect
    if (newType === 'expense') {
      const today = todayISO()
      await tx
        .update(budgets)
        .set({ spentAmount: sql`spent_amount + ${newAmount}` })
        .where(
          and(
            eq(budgets.categoryId, newCategoryId),
            eq(budgets.userId, userId),
            lte(budgets.periodStartDate, today),
            gte(budgets.periodEndDate, today),
          ),
        )
    }

    await tx
      .update(transactions)
      .set({
        accountId:   newAccountId,
        categoryId:  newCategoryId,
        type:        newType,
        amount:      newAmount,
        note:        data.note        !== undefined ? data.note        : old.note,
        date:        data.date        !== undefined ? data.date        : old.date,
        goalId:      data.goalId      !== undefined ? data.goalId      : old.goalId,
        transferFee: data.transferFee !== undefined
          ? (data.transferFee && data.transferFee > 0 ? data.transferFee : null)
          : old.transferFee,
        updatedAt:   sql`now()`,
      })
      .where(eq(transactions.id, id))
  })

  return { negativeBalance: willGoNegative }
}

export async function transferBetweenAccounts(data: {
  fromAccountId: string
  toAccountId:   string
  amount:        number
  date:          string
  note?:         string
  manualFee?:    number
}): Promise<{ fee: number; total: number }> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  // Verify both accounts belong to user
  const [fromAcc, toAcc] = await Promise.all([
    db.select().from(accounts).where(and(eq(accounts.id, data.fromAccountId), eq(accounts.userId, userId))).then((r) => r[0]),
    db.select().from(accounts).where(and(eq(accounts.id, data.toAccountId),   eq(accounts.userId, userId))).then((r) => r[0]),
  ])
  if (!fromAcc) throw new Error('Source account not found')
  if (!toAcc)   throw new Error('Destination account not found')

  // Validate MoMo→Cash amount range server-side (client already checks, but enforce here too)
  if (fromAcc.type === 'mobile_money' && toAcc.type === 'cash') {
    const rangeCheck = calcMoMoFee(fromAcc.name, data.amount)
    if (rangeCheck.type === 'out_of_range') {
      throw new Error(
        `Amount is outside the valid range for ${rangeCheck.provider}. ` +
        `Min: UGX ${rangeCheck.min.toLocaleString()}, Max: UGX ${rangeCheck.max.toLocaleString()}`
      )
    }
  }

  // Fee always comes from caller — client auto-populates for MoMo→Cash, manual for others
  const fee = Math.round(data.manualFee ?? 0)

  const totalDebit = data.amount + fee

  if (fromAcc.balance < totalDebit) {
    const shortfall = totalDebit - fromAcc.balance
    throw new Error(
      `Insufficient balance. You need UGX ${totalDebit.toLocaleString()} ` +
      `(amount + fee) but have UGX ${fromAcc.balance.toLocaleString()}. ` +
      `Short by UGX ${shortfall.toLocaleString()}.`
    )
  }

  // Find or create an expense category for transfer fees
  let feeCatId: string | null = null
  if (fee > 0) {
    const [existingFeeCat] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.name, 'Transfer Fee')))

    if (existingFeeCat) {
      feeCatId = existingFeeCat.id
    } else {
      const [inserted] = await db
        .insert(categories)
        .values({ userId, name: 'Transfer Fee', type: 'expense', icon: 'arrow-right-left', color: '#94A3B8', isDefault: false })
        .returning()
      feeCatId = inserted.id
    }
  }

  await db.transaction(async (tx) => {
    // Debit full amount (including fee) from source
    await tx
      .update(accounts)
      .set({ balance: sql`balance - ${totalDebit}`, updatedAt: sql`now()` })
      .where(eq(accounts.id, data.fromAccountId))

    // Credit only the transfer amount to destination (fee stays with provider)
    await tx
      .update(accounts)
      .set({ balance: sql`balance + ${data.amount}`, updatedAt: sql`now()` })
      .where(eq(accounts.id, data.toAccountId))

    // Only record the fee as an expense transaction — the money movement itself is silent
    if (fee > 0 && feeCatId) {
      await tx.insert(transactions).values({
        userId,
        accountId:   data.fromAccountId,
        categoryId:  feeCatId,
        type:        'expense',
        amount:      fee,
        note:        data.note
          ? `${data.note} · transfer to ${toAcc.name}`
          : `Transfer fee to ${toAcc.name}`,
        date:        data.date,
        transferFee: fee,
      })
    }
  })

  await updateStreak(userId)
  await awardXP(userId, 'transaction_logged', 5, 'Transfer recorded')

  return { fee, total: totalDebit }
}

export async function getAccountsForUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, session.user.id))
}

export async function createAccount(data: {
  name:    string
  type:    'cash' | 'mobile_money' | 'bank' | 'sacco'
  balance: number
  icon?:   string
  color?:  string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  // Enforce Cash uniqueness server-side
  if (data.type === 'cash') {
    const existing = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.type, 'cash')))
    if (existing.length > 0) throw new Error('You already have a Cash account. Only one is allowed.')
  }

  await db.insert(accounts).values({ ...data, userId })
}

export async function updateAccount(id: string, data: { name?: string; balance?: number }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  const [acct] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
  if (!acct) throw new Error('Account not found')

  await db
    .update(accounts)
    .set({ ...data, updatedAt: sql`now()` })
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
}

export async function deleteAccount(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  const [acct] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
  if (!acct) throw new Error('Account not found')

  await db.transaction(async (tx) => {
    // Null out any goal auto-debit references to this account
    await tx
      .update(goals)
      .set({ autoDebitAccountId: null })
      .where(eq(goals.autoDebitAccountId, id))

    // Reverse budget spentAmount for any expense transactions on this account,
    // then delete all transactions linked to this account
    const linkedTxns = await tx
      .select({ id: transactions.id, type: transactions.type, amount: transactions.amount, categoryId: transactions.categoryId })
      .from(transactions)
      .where(eq(transactions.accountId, id))

    for (const t of linkedTxns) {
      if (t.type === 'expense') {
        const today = todayISO()
        await tx
          .update(budgets)
          .set({ spentAmount: sql`GREATEST(0, spent_amount - ${t.amount})` })
          .where(
            and(
              eq(budgets.categoryId, t.categoryId),
              eq(budgets.userId, userId),
              lte(budgets.periodStartDate, today),
              gte(budgets.periodEndDate, today),
            ),
          )
      }
    }

    await tx.delete(transactions).where(eq(transactions.accountId, id))
    await tx.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
  })
}

export async function getCategoriesForUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, session.user.id))
}

export async function createCategory(data: {
  name:  string
  type:  'expense' | 'income' | 'investment'
  icon?: string
  color?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const [row] = await db
    .insert(categories)
    .values({ ...data, userId: session.user.id, isDefault: false })
    .returning({ id: categories.id })
  return row
}

export async function deleteCategory(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const [cat] = await db
    .select({ isDefault: categories.isDefault })
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, session.user.id)))
  if (!cat) throw new Error('Category not found')
  if (cat.isDefault) throw new Error('Cannot delete a default category')
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, session.user.id)))
}

export async function updateCategory(id: string, data: { name?: string; icon?: string; color?: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await db
    .update(categories)
    .set(data)
    .where(and(eq(categories.id, id), eq(categories.userId, session.user.id)))
}
