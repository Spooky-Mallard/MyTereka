'use server'

import { db } from '@/lib/db'
import { transactions, accounts, budgets, users, categories } from '@/lib/schema'
import { auth } from '@/lib/auth'
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm'
import { awardXP, checkAndAwardBadge } from './gamification'
import { todayISO } from '@/lib/format'

async function updateStreak(userId: string) {
  const today     = todayISO()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const [user] = await db
    .select({ streakCount: users.streakCount, lastActiveDate: users.lastActiveDate })
    .from(users)
    .where(eq(users.id, userId))

  if (!user || user.lastActiveDate === today) return

  const newStreak =
    user.lastActiveDate === yesterday ? user.streakCount + 1 : 1

  await db
    .update(users)
    .set({ streakCount: newStreak, lastActiveDate: today })
    .where(eq(users.id, userId))

  if (newStreak === 7) {
    await awardXP(userId, 'streak_7', 50, '7-day streak milestone')
    await checkAndAwardBadge(userId, 'streak_7')
  }
}

export async function createTransaction(data: {
  accountId:  string
  categoryId: string
  type:       'income' | 'expense' | 'transfer'
  amount:     number
  note?:      string
  date:       string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  /* First-transaction badge check before insert */
  const [existingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.userId, userId))
  const isFirst = Number(existingCount?.count ?? 0) === 0

  await db.transaction(async (tx) => {
    await tx.insert(transactions).values({ ...data, userId })

    const balanceDelta = data.type === 'income' ? data.amount : -data.amount
    await tx
      .update(accounts)
      .set({ balance: sql`balance + ${balanceDelta}` })
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
}

export type TransactionRow = {
  id:           string
  type:         string
  amount:       number
  note:         string | null
  date:         string
  categoryName: string
  categoryIcon: string | null
  categoryColor:string | null
  accountName:  string
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
      categoryName:  categories.name,
      categoryIcon:  categories.icon,
      categoryColor: categories.color,
      accountName:   accounts.name,
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
      .set({ balance: sql`balance + ${balanceDelta}` })
      .where(eq(accounts.id, tx.accountId))

    if (tx.type === 'expense') {
      const today = todayISO()
      await dbTx
        .update(budgets)
        .set({ spentAmount: sql`spent_amount - ${tx.amount}` })
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
