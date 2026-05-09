import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, accounts, transactions, budgets, goals, categories } from '@/lib/schema'
import { eq, and, desc, sql, lte, gte, sum } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { formatUGX, todayISO } from '@/lib/format'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')
  const userId = session.user.id
  const today  = todayISO()

  const [
    user,
    userAccounts,
    recentTxns,
    userBudgets,
    userGoals,
  ] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.select().from(accounts).where(eq(accounts.userId, userId)),
    db
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
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(5),
    db
      .select({
        id:            budgets.id,
        limitAmount:   budgets.limitAmount,
        spentAmount:   budgets.spentAmount,
        period:        budgets.period,
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
      .limit(3),
    db
      .select()
      .from(goals)
      .where(and(eq(goals.userId, userId), eq(goals.isCompleted, false)))
      .limit(3),
  ])

  const totalBalance = userAccounts.reduce((s, a) => s + a.balance, 0)

  return (
    <DashboardClient
      user={{
        name:       user?.name        ?? '',
        level:      user?.level       ?? 'Beginner',
        xp:         user?.xpPoints    ?? 0,
        streak:     user?.streakCount ?? 0,
        lastActive: user?.lastActiveDate ?? null,
      }}
      totalBalance={totalBalance}
      recentTxns={recentTxns}
      budgets={userBudgets}
      goals={userGoals}
    />
  )
}
