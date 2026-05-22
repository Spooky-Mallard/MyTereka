'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { transactions, categories, goals } from '@/lib/schema'
import { eq, and, gte, lt, sql } from 'drizzle-orm'

export type DashboardInsight = {
  categoryName: string
  savedAmount:  number
  topGoalId:    string | null
  topGoalName:  string | null
}

export async function getDashboardInsight(): Promise<DashboardInsight | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const now      = new Date(Date.now() + 3 * 60 * 60 * 1000)
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-01`

  const [thisMontRows, lastMonthRows, topGoalRows] = await Promise.all([
    db
      .select({
        categoryName: categories.name,
        total:        sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, thisMonth),
        )
      )
      .groupBy(categories.name),

    db
      .select({
        categoryName: categories.name,
        total:        sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, lastMonth),
          lt(transactions.date, thisMonth),
        )
      )
      .groupBy(categories.name),

    db
      .select({ id: goals.id, name: goals.name })
      .from(goals)
      .where(and(eq(goals.userId, userId), eq(goals.isCompleted, false)))
      .orderBy(goals.currentAmount)
      .limit(1),
  ])

  const thisMap  = new Map(thisMontRows.map((r) => [r.categoryName, Number(r.total)]))
  const lastMap  = new Map(lastMonthRows.map((r) => [r.categoryName, Number(r.total)]))

  let bestCat    = ''
  let bestSaving = 0

  for (const [cat, lastAmt] of lastMap) {
    const thisAmt = thisMap.get(cat) ?? 0
    const saving  = lastAmt - thisAmt
    if (saving > bestSaving) {
      bestSaving = saving
      bestCat    = cat
    }
  }

  if (bestSaving < 5000 || !bestCat) return null

  const topGoal = topGoalRows[0] ?? null

  return {
    categoryName: bestCat,
    savedAmount:  bestSaving,
    topGoalId:    topGoal?.id ?? null,
    topGoalName:  topGoal?.name ?? null,
  }
}
