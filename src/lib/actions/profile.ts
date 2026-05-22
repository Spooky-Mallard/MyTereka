'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, userBadges, badges, transactions, streakHistory } from '@/lib/schema'
import { eq, desc, gte, and, sql } from 'drizzle-orm'

export type ProfileData = {
  id:             string
  name:           string
  username:       string | null
  email:          string
  avatarUrl:      string | null
  xpPoints:       number
  level:          string
  streakCount:    number
  lastActiveDate: string | null
}

export type EarnedBadge = {
  id:          string
  name:        string
  description: string | null
  icon:        string | null
  earnedAt:    Date
}

export async function getProfile(): Promise<ProfileData> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const [user] = await db
    .select({
      id:             users.id,
      name:           users.name,
      username:       users.username,
      email:          users.email,
      avatarUrl:      users.avatarUrl,
      xpPoints:       users.xpPoints,
      level:          users.level,
      streakCount:    users.streakCount,
      lastActiveDate: users.lastActiveDate,
    })
    .from(users)
    .where(eq(users.id, session.user.id))

  if (!user) throw new Error('User not found')
  return user
}

export async function getEarnedBadges(): Promise<EarnedBadge[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  return db
    .select({
      id:          badges.id,
      name:        badges.name,
      description: badges.description,
      icon:        badges.icon,
      earnedAt:    userBadges.earnedAt,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, session.user.id))
    .orderBy(desc(userBadges.earnedAt))
}

export type AccountOption = { id: string; name: string; type: string; balance: number }
export type CategoryOption = { id: string; name: string; type: string; icon: string | null; color: string | null }

export async function getUserAccounts(): Promise<AccountOption[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const { accounts } = await import('@/lib/schema')
  const { eq } = await import('drizzle-orm')
  return db.select({ id: accounts.id, name: accounts.name, type: accounts.type, balance: accounts.balance })
    .from(accounts).where(eq(accounts.userId, session.user.id))
}

export async function getUserCategories(): Promise<CategoryOption[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const { categories } = await import('@/lib/schema')
  const { eq } = await import('drizzle-orm')
  return db.select({ id: categories.id, name: categories.name, type: categories.type, icon: categories.icon, color: categories.color })
    .from(categories).where(eq(categories.userId, session.user.id))
}

export type StreakHistoryRow = {
  id:        string
  startDate: string
  endDate:   string | null
  length:    number
}

export async function getStreakPageData(): Promise<{
  streakCount:     number
  longestStreak:   number
  totalActiveDays: number
  activeDates:     string[]
  history:         StreakHistoryRow[]
}> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  const ninetyDaysAgo = new Date(Date.now() + 3 * 60 * 60 * 1000 - 90 * 86400000)
    .toISOString().split('T')[0]

  const [userRow, txDates, historyRows] = await Promise.all([
    db.select({ streakCount: users.streakCount })
      .from(users).where(eq(users.id, userId))
      .then((r) => r[0]),

    db.selectDistinct({ date: transactions.date })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), gte(transactions.date, ninetyDaysAgo)))
      .then((r) => r.map((x) => x.date)),

    db.select({
        id:        streakHistory.id,
        startDate: streakHistory.startDate,
        endDate:   streakHistory.endDate,
        length:    streakHistory.length,
      })
      .from(streakHistory)
      .where(eq(streakHistory.userId, userId))
      .orderBy(desc(streakHistory.startDate))
      .limit(10),
  ])

  const longestStreak = historyRows.reduce((max, r) => Math.max(max, r.length), 0)

  return {
    streakCount:     userRow?.streakCount ?? 0,
    longestStreak,
    totalActiveDays: txDates.length,
    activeDates:     txDates,
    history:         historyRows,
  }
}
