'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifications, users } from '@/lib/schema'
import { and, desc, eq, isNull, count } from 'drizzle-orm'
import type { NotificationRow } from '@/lib/types/notifications'

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function getNotifications(limit = 30): Promise<NotificationRow[]> {
  const me = await requireUserId()
  const rows = await db
    .select({
      id:        notifications.id,
      type:      notifications.type,
      body:      notifications.body,
      entityId:  notifications.entityId,
      readAt:    notifications.readAt,
      createdAt: notifications.createdAt,
      actorId:   users.id,
      actorName: users.name,
      actorUsername: users.username,
      actorAvatar:   users.avatarUrl,
    })
    .from(notifications)
    .leftJoin(users, eq(users.id, notifications.actorId))
    .where(eq(notifications.userId, me))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)

  return rows.map((r) => ({
    id:        r.id,
    type:      r.type,
    body:      r.body,
    entityId:  r.entityId,
    readAt:    r.readAt,
    createdAt: r.createdAt,
    actor: r.actorId
      ? { id: r.actorId, name: r.actorName, username: r.actorUsername, avatarUrl: r.actorAvatar }
      : null,
  }))
}

export async function getUnreadCount(): Promise<number> {
  const me = await requireUserId()
  const [row] = await db
    .select({ c: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, me), isNull(notifications.readAt)))
  return row?.c ?? 0
}

export async function markNotificationRead(notificationId: string) {
  const me = await requireUserId()
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, me)))
  return { success: true }
}

export async function markAllNotificationsRead() {
  const me = await requireUserId()
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, me), isNull(notifications.readAt)))
  return { success: true }
}
