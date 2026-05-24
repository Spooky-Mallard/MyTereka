'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, userBadges, badges, transactions, streakHistory, financialTips, userTipSeeds } from '@/lib/schema'
import { eq, desc, gte, and, sql } from 'drizzle-orm'

export type ProfileData = {
  id:             string
  name:           string
  username:       string | null
  email:          string
  avatarUrl:      string | null
  avatarId:       string | null
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
      avatarId:       users.avatarId,
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

export async function seedFinancialTips(): Promise<{ inserted: number }> {
  const { FINANCIAL_TIPS } = await import('@/lib/seed-tips')
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(financialTips)
  if (Number(count) > 0) return { inserted: 0 }
  const rows = await db.insert(financialTips).values(FINANCIAL_TIPS).returning({ id: financialTips.id })
  return { inserted: rows.length }
}

export type DailyTip = { body: string; category: string | null }

export async function getDailyTip(): Promise<DailyTip | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const [seedRow] = await db
    .select({ seed: userTipSeeds.seed })
    .from(userTipSeeds)
    .where(eq(userTipSeeds.userId, userId))

  if (!seedRow) return null

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(financialTips)

  if (!total || Number(total) === 0) return null

  const dayIndex = Math.floor((Date.now() + 3 * 60 * 60 * 1000) / 86400000)
  const tipId = ((seedRow.seed + dayIndex) % Number(total)) + 1

  const [tip] = await db
    .select({ body: financialTips.body, category: financialTips.category })
    .from(financialTips)
    .where(eq(financialTips.id, tipId))

  return tip ?? null
}

export async function updateAvatar(avatarId: string | null): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await db.update(users).set({ avatarId }).where(eq(users.id, session.user.id))
}

export async function updateProfile(data: { name?: string; email?: string }): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const updates: Record<string, string> = {}
  if (data.name?.trim())  updates.name  = data.name.trim()
  if (data.email?.trim()) updates.email = data.email.trim().toLowerCase()
  if (!Object.keys(updates).length) return
  await db.update(users).set(updates).where(eq(users.id, session.user.id))
}

export async function submitAppRating(rating: number): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  if (rating < 1 || rating > 5) throw new Error('Invalid rating')
  await db
    .update(users)
    .set({ appRating: rating })
    .where(eq(users.id, session.user.id))
}
