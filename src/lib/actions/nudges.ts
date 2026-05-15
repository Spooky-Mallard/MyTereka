'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { nudges, notifications, friendships, users } from '@/lib/schema'
import { and, eq, or, gt, desc } from 'drizzle-orm'

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function sendNudge(friendId: string) {
  const me = await requireUserId()
  if (friendId === me) throw new Error('Cannot nudge yourself')

  // verify accepted friendship
  const [friendship] = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(
      and(
        eq(friendships.status, 'accepted'),
        or(
          and(eq(friendships.requesterId, me), eq(friendships.addresseeId, friendId)),
          and(eq(friendships.requesterId, friendId), eq(friendships.addresseeId, me)),
        ),
      ),
    )
  if (!friendship) throw new Error('You are not friends with this user')

  // server-side 24h rate limit
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [recent] = await db
    .select({ id: nudges.id })
    .from(nudges)
    .where(
      and(
        eq(nudges.fromUserId, me),
        eq(nudges.toUserId, friendId),
        gt(nudges.createdAt, cutoff),
      ),
    )

  if (recent) {
    const [friend] = await db.select({ name: users.name }).from(users).where(eq(users.id, friendId))
    throw new Error(`You can only nudge ${friend?.name ?? 'this person'} once per day`)
  }

  const [myUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, me))

  await db.transaction(async (tx) => {
    await tx.insert(nudges).values({ fromUserId: me, toUserId: friendId })
    await tx.insert(notifications).values({
      userId:  friendId,
      type:    'nudge',
      actorId: me,
      body:    `${myUser?.name ?? 'Someone'} is cheering you on — keep your streak alive!`,
    })
  })

  return { success: true }
}

export type NudgeCard = {
  id: string
  actorName: string
  actorUsername: string | null
  actorAvatarUrl: string | null
  notificationId: string
  createdAt: Date
}

export async function getRecentNudges(): Promise<NudgeCard[]> {
  const me = await requireUserId()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

  return db
    .select({
      id:             nudges.id,
      actorName:      users.name,
      actorUsername:  users.username,
      actorAvatarUrl: users.avatarUrl,
      notificationId: notifications.id,
      createdAt:      nudges.createdAt,
    })
    .from(nudges)
    .innerJoin(users,         eq(users.id,         nudges.fromUserId))
    .innerJoin(notifications, and(
      eq(notifications.actorId,  nudges.fromUserId),
      eq(notifications.userId,   me),
      eq(notifications.type,     'nudge'),
    ))
    .where(and(eq(nudges.toUserId, me), gt(nudges.createdAt, cutoff)))
    .orderBy(desc(nudges.createdAt))
    .limit(3)
}
