'use server'

import { db } from '@/lib/db'
import { users, xpEvents, userBadges, badges } from '@/lib/schema'
import { eq, sql, and } from 'drizzle-orm'

const LEVEL_THRESHOLDS = [
  { level: 'Grand Master' as const, xp: 1500 },
  { level: 'Master'       as const, xp: 700  },
  { level: 'Consistent'   as const, xp: 300  },
  { level: 'Saver'        as const, xp: 100  },
  { level: 'Beginner'     as const, xp: 0    },
]

export async function awardXP(
  userId: string,
  eventType: string,
  xp: number,
  description: string,
) {
  await db.insert(xpEvents).values({ userId, eventType, xpAwarded: xp, description })

  const [updated] = await db
    .update(users)
    .set({ xpPoints: sql`xp_points + ${xp}` })
    .where(eq(users.id, userId))
    .returning({ xpPoints: users.xpPoints })

  const newLevel = LEVEL_THRESHOLDS.find((t) => updated.xpPoints >= t.xp)?.level ?? 'Beginner'

  await db.update(users).set({ level: newLevel }).where(eq(users.id, userId))
}

export async function checkAndAwardBadge(userId: string, triggerEvent: string) {
  const [badge] = await db
    .select()
    .from(badges)
    .where(eq(badges.triggerEvent, triggerEvent))

  if (!badge) return

  const already = await db
    .select({ id: userBadges.id })
    .from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badge.id)))

  if (already.length > 0) return

  await db.insert(userBadges).values({ userId, badgeId: badge.id })
}
