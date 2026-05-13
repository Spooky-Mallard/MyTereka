'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { friendships, notifications, users } from '@/lib/schema'
import { and, eq, or, ne, ilike, sql } from 'drizzle-orm'
import type { PublicUser, FriendCard, IncomingRequest, FriendProfile } from '@/lib/types/friends'

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!USERNAME_REGEX.test(username)) return false
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.username, username))
  return rows.length === 0
}

export async function setUsername(newUsername: string) {
  const userId = await requireUserId()
  const normalized = newUsername.trim().toLowerCase()
  if (!USERNAME_REGEX.test(normalized))
    throw new Error('Username must be 3-20 characters, lowercase letters, numbers, or underscore')

  const taken = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, normalized), ne(users.id, userId)))
  if (taken.length > 0) throw new Error('Username is already taken')

  await db.update(users).set({ username: normalized }).where(eq(users.id, userId))
  return { success: true, username: normalized }
}

export async function getUserByUsername(username: string): Promise<PublicUser | null> {
  const me = await requireUserId()
  const normalized = username.trim().toLowerCase()
  if (!normalized) return null
  const [row] = await db
    .select({ id: users.id, name: users.name, username: users.username, avatarUrl: users.avatarUrl })
    .from(users)
    .where(and(eq(users.username, normalized), ne(users.id, me)))
  return row ?? null
}

export async function searchUsers(query: string): Promise<PublicUser[]> {
  const me = await requireUserId()
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  return db
    .select({ id: users.id, name: users.name, username: users.username, avatarUrl: users.avatarUrl })
    .from(users)
    .where(and(ilike(users.username, `${q}%`), ne(users.id, me)))
    .limit(10)
}

export async function getFriendshipWith(otherUserId: string) {
  const me = await requireUserId()
  const [row] = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, me),    eq(friendships.addresseeId, otherUserId)),
        and(eq(friendships.requesterId, otherUserId), eq(friendships.addresseeId, me)),
      ),
    )
  return row ?? null
}

export async function sendFriendRequest(addresseeId: string) {
  const me = await requireUserId()
  if (addresseeId === me) throw new Error('Cannot send a request to yourself')

  const [target] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, addresseeId))
  if (!target) throw new Error('User not found')

  const existing = await getFriendshipWith(addresseeId)
  if (existing) {
    if (existing.status === 'accepted') throw new Error('You are already friends')
    if (existing.status === 'pending')  throw new Error('A friend request is already pending')
    if (existing.status === 'blocked')  throw new Error('Unable to send request')
    // declined: allow a new request — clean up old row
    await db.delete(friendships).where(eq(friendships.id, existing.id))
  }

  const [myUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, me))

  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(friendships)
      .values({ requesterId: me, addresseeId, status: 'pending' })
      .returning({ id: friendships.id })

    await tx.insert(notifications).values({
      userId:   addresseeId,
      type:     'friend_request',
      actorId:  me,
      entityId: created.id,
      body:     `${myUser?.name ?? 'Someone'} sent you a friend request`,
    })
  })

  return { success: true }
}

export async function respondToFriendRequest(friendshipId: string, action: 'accept' | 'decline') {
  const me = await requireUserId()
  const [row] = await db.select().from(friendships).where(eq(friendships.id, friendshipId))
  if (!row) throw new Error('Friend request not found')
  if (row.addresseeId !== me) throw new Error('Not authorized to respond to this request')
  if (row.status !== 'pending') throw new Error('Request is no longer pending')

  const nextStatus = action === 'accept' ? 'accepted' : 'declined'
  const [myUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, me))

  await db.transaction(async (tx) => {
    await tx
      .update(friendships)
      .set({ status: nextStatus, respondedAt: new Date() })
      .where(eq(friendships.id, friendshipId))

    if (action === 'accept') {
      await tx.insert(notifications).values({
        userId:   row.requesterId,
        type:     'friend_accepted',
        actorId:  me,
        entityId: friendshipId,
        body:     `${myUser?.name ?? 'Someone'} accepted your friend request`,
      })
    }
  })

  return { success: true }
}

export async function removeFriend(friendUserId: string) {
  const me = await requireUserId()
  const existing = await getFriendshipWith(friendUserId)
  if (!existing) throw new Error('Friendship not found')
  await db.delete(friendships).where(eq(friendships.id, existing.id))
  return { success: true }
}

export async function getFriends(): Promise<FriendCard[]> {
  const me = await requireUserId()
  const rows = await db
    .select({
      friendshipId: friendships.id,
      otherId: sql<string>`CASE WHEN ${friendships.requesterId} = ${me} THEN ${friendships.addresseeId} ELSE ${friendships.requesterId} END`,
    })
    .from(friendships)
    .where(
      and(
        eq(friendships.status, 'accepted'),
        or(eq(friendships.requesterId, me), eq(friendships.addresseeId, me)),
      ),
    )

  if (rows.length === 0) return []

  const friendIds = rows.map((r) => r.otherId)
  const profiles = await db
    .select({
      id:          users.id,
      name:        users.name,
      username:    users.username,
      avatarUrl:   users.avatarUrl,
      level:       users.level,
      xpPoints:    users.xpPoints,
      streakCount: users.streakCount,
    })
    .from(users)
    .where(sql`${users.id} = ANY (${friendIds})`)

  const byId = new Map(profiles.map((p) => [p.id, p]))
  return rows
    .map((r) => {
      const p = byId.get(r.otherId)
      if (!p) return null
      return { ...p, friendshipId: r.friendshipId } as FriendCard
    })
    .filter((x): x is FriendCard => x !== null)
}

export async function getIncomingRequests(): Promise<IncomingRequest[]> {
  const me = await requireUserId()
  return db
    .select({
      friendshipId: friendships.id,
      id:           users.id,
      name:         users.name,
      username:     users.username,
      avatarUrl:    users.avatarUrl,
      createdAt:    friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(users, eq(users.id, friendships.requesterId))
    .where(and(eq(friendships.addresseeId, me), eq(friendships.status, 'pending')))
    .orderBy(friendships.createdAt)
}

export async function getSentRequests(): Promise<IncomingRequest[]> {
  const me = await requireUserId()
  return db
    .select({
      friendshipId: friendships.id,
      id:           users.id,
      name:         users.name,
      username:     users.username,
      avatarUrl:    users.avatarUrl,
      createdAt:    friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(users, eq(users.id, friendships.addresseeId))
    .where(and(eq(friendships.requesterId, me), eq(friendships.status, 'pending')))
    .orderBy(friendships.createdAt)
}

export async function getFriendProfileByUsername(username: string): Promise<FriendProfile | null> {
  const me = await requireUserId()
  const normalized = username.trim().toLowerCase()
  if (!normalized) return null

  const [user] = await db
    .select({
      id:          users.id,
      name:        users.name,
      username:    users.username,
      avatarUrl:   users.avatarUrl,
      level:       users.level,
      xpPoints:    users.xpPoints,
      streakCount: users.streakCount,
    })
    .from(users)
    .where(eq(users.username, normalized))
  if (!user) return null

  const isSelf = user.id === me
  const friendship = isSelf ? null : await getFriendshipWith(user.id)
  const isFriend = friendship?.status === 'accepted'
  let pendingDirection: 'incoming' | 'outgoing' | null = null
  if (friendship?.status === 'pending') {
    pendingDirection = friendship.requesterId === me ? 'outgoing' : 'incoming'
  }

  let badges: FriendProfile['badges'] = []
  if (isSelf || isFriend) {
    const { userBadges, badges: badgesTable } = await import('@/lib/schema')
    badges = await db
      .select({
        name:        badgesTable.name,
        description: badgesTable.description,
        icon:        badgesTable.icon,
        earnedAt:    userBadges.earnedAt,
      })
      .from(userBadges)
      .innerJoin(badgesTable, eq(badgesTable.id, userBadges.badgeId))
      .where(eq(userBadges.userId, user.id))
  }

  return {
    id:          user.id,
    name:        user.name,
    username:    user.username,
    avatarUrl:   user.avatarUrl,
    level:       isFriend || isSelf ? user.level : 'Beginner',
    xpPoints:    isFriend || isSelf ? user.xpPoints : 0,
    streakCount: isFriend || isSelf ? user.streakCount : 0,
    badges,
    isFriend,
    isSelf,
    pendingDirection,
  }
}

