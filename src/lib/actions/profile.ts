'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, userBadges, badges } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export type ProfileData = {
  id:             string
  name:           string
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
