'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { budgets, categories } from '@/lib/schema'
import { eq, and, lte, gte } from 'drizzle-orm'
import { awardXP } from './gamification'
import { todayISO } from '@/lib/format'

function getPeriodDates(period: 'weekly' | 'monthly'): { start: string; end: string } {
  const now = new Date()
  if (period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }
  const day  = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(new Date(now).setDate(diff))
  const end   = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
}

export async function createBudget(data: {
  categoryId:  string
  limitAmount: number
  period:      'weekly' | 'monthly'
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const { start, end } = getPeriodDates(data.period)
  await db.insert(budgets).values({
    ...data,
    userId:          session.user.id,
    spentAmount:     0,
    periodStartDate: start,
    periodEndDate:   end,
  })
}

export type BudgetRow = {
  id:            string
  limitAmount:   number
  spentAmount:   number
  period:        string
  periodEndDate: string
  categoryName:  string
  categoryIcon:  string | null
  categoryColor: string | null
}

export async function getBudgets(): Promise<BudgetRow[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id
  const today  = todayISO()

  return db
    .select({
      id:            budgets.id,
      limitAmount:   budgets.limitAmount,
      spentAmount:   budgets.spentAmount,
      period:        budgets.period,
      periodEndDate: budgets.periodEndDate,
      categoryName:  categories.name,
      categoryIcon:  categories.icon,
      categoryColor: categories.color,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(
      and(
        eq(budgets.userId, userId),
        lte(budgets.periodStartDate, today),
        gte(budgets.periodEndDate,   today),
      ),
    )
}
