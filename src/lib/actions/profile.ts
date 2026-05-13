'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, userBadges, badges } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

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
