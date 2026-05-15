'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  sharedGoals,
  sharedGoalMembers,
  sharedGoalContributions,
  notifications,
  friendships,
  accounts,
  users,
} from '@/lib/schema'
import { and, eq, or, inArray, desc, sql } from 'drizzle-orm'
import { awardXP } from './gamification'
import type {
  SharedGoalCard,
  SharedGoalDetail,
  SharedGoalInvite,
  SharedGoalMember,
  SharedGoalContributionRow,
  LeaderboardRow,
} from '@/lib/types/shared-goals'

async function requireUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

async function assertAcceptedFriends(me: string, otherIds: string[]) {
  if (otherIds.length === 0) return
  const rows = await db
    .select({ requesterId: friendships.requesterId, addresseeId: friendships.addresseeId })
    .from(friendships)
    .where(
      and(
        eq(friendships.status, 'accepted'),
        or(
          and(eq(friendships.requesterId, me), inArray(friendships.addresseeId, otherIds)),
          and(eq(friendships.addresseeId, me), inArray(friendships.requesterId, otherIds)),
        ),
      ),
    )
  const friendSet = new Set(rows.map((r) => (r.requesterId === me ? r.addresseeId : r.requesterId)))
  for (const id of otherIds) {
    if (!friendSet.has(id)) throw new Error('Can only invite accepted friends')
  }
}

export async function createSharedGoal(data: {
  name: string
  targetAmount: number
  targetDate?: string | null
  icon?: string | null
  leavePolicy: 'refundable' | 'forfeit'
  invitedFriendIds: string[]
}) {
  const me = await requireUserId()
  const name = data.name.trim()
  if (!name) throw new Error('Name required')
  if (data.targetAmount <= 0) throw new Error('Target amount must be greater than 0')

  const uniqueInvitees = Array.from(new Set(data.invitedFriendIds.filter((id) => id !== me)))
  await assertAcceptedFriends(me, uniqueInvitees)

  const [me_row] = await db.select({ name: users.name }).from(users).where(eq(users.id, me))

  const sharedGoalId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(sharedGoals)
      .values({
        creatorId:    me,
        name,
        icon:         data.icon ?? null,
        targetAmount: data.targetAmount,
        targetDate:   data.targetDate ?? null,
        leavePolicy:  data.leavePolicy,
      })
      .returning({ id: sharedGoals.id })

    await tx.insert(sharedGoalMembers).values({
      sharedGoalId: created.id,
      userId:       me,
      status:       'active',
      isCreator:    true,
    })

    if (uniqueInvitees.length > 0) {
      await tx.insert(sharedGoalMembers).values(
        uniqueInvitees.map((userId) => ({
          sharedGoalId: created.id,
          userId,
          status:       'invited' as const,
          isCreator:    false,
        })),
      )

      await tx.insert(notifications).values(
        uniqueInvitees.map((userId) => ({
          userId,
          type:     'shared_goal_invite' as const,
          actorId:  me,
          entityId: created.id,
          body:     `${me_row?.name ?? 'Someone'} invited you to a shared goal: ${name}`,
        })),
      )
    }

    return created.id
  })

  return { success: true, sharedGoalId }
}

export async function respondToSharedGoalInvite(
  sharedGoalId: string,
  action: 'accept' | 'decline',
) {
  const me = await requireUserId()
  const [member] = await db
    .select()
    .from(sharedGoalMembers)
    .where(and(eq(sharedGoalMembers.sharedGoalId, sharedGoalId), eq(sharedGoalMembers.userId, me)))
  if (!member) throw new Error('Invite not found')
  if (member.status !== 'invited') throw new Error('Invite is no longer pending')

  const [goal] = await db.select().from(sharedGoals).where(eq(sharedGoals.id, sharedGoalId))
  if (!goal) throw new Error('Shared goal not found')

  const [me_row] = await db.select({ name: users.name }).from(users).where(eq(users.id, me))

  await db.transaction(async (tx) => {
    await tx
      .update(sharedGoalMembers)
      .set({ status: action === 'accept' ? 'active' : 'declined' })
      .where(eq(sharedGoalMembers.id, member.id))

    await tx.insert(notifications).values({
      userId:   goal.creatorId,
      type:     'shared_goal_invite',
      actorId:  me,
      entityId: sharedGoalId,
      body:
        action === 'accept'
          ? `${me_row?.name ?? 'Someone'} joined "${goal.name}"`
          : `${me_row?.name ?? 'Someone'} declined "${goal.name}"`,
    })
  })

  return { success: true }
}

export async function contributeToSharedGoal(
  sharedGoalId: string,
  amount: number,
  accountId: string,
  note?: string,
): Promise<{ completed: boolean; goalName: string; newTotal: number }> {
  const me = await requireUserId()
  if (amount <= 0) throw new Error('Amount must be greater than 0')

  const [member] = await db
    .select()
    .from(sharedGoalMembers)
    .where(and(eq(sharedGoalMembers.sharedGoalId, sharedGoalId), eq(sharedGoalMembers.userId, me)))
  if (!member || member.status !== 'active') throw new Error('You are not an active member of this goal')

  const [goal] = await db.select().from(sharedGoals).where(eq(sharedGoals.id, sharedGoalId))
  if (!goal) throw new Error('Shared goal not found')
  if (goal.isCompleted) throw new Error('Goal already completed')

  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, me)))
  if (!account) throw new Error('Account not found')
  if (account.balance < amount) throw new Error('Insufficient balance')

  const prevTotal = goal.currentAmount
  const prevPct   = prevTotal / goal.targetAmount
  const newTotal  = prevTotal + amount
  const newPct    = newTotal / goal.targetAmount
  const completed = newTotal >= goal.targetAmount

  const memberRows = await db
    .select({ userId: sharedGoalMembers.userId })
    .from(sharedGoalMembers)
    .where(
      and(
        eq(sharedGoalMembers.sharedGoalId, sharedGoalId),
        inArray(sharedGoalMembers.status, ['active']),
      ),
    )
  const otherMemberIds = memberRows.map((r) => r.userId).filter((id) => id !== me)

  const [me_row] = await db.select({ name: users.name }).from(users).where(eq(users.id, me))

  await db.transaction(async (tx) => {
    await tx
      .update(accounts)
      .set({ balance: sql`balance - ${amount}` })
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, me)))

    await tx
      .update(sharedGoals)
      .set({ currentAmount: newTotal, isCompleted: completed })
      .where(eq(sharedGoals.id, sharedGoalId))

    await tx.insert(sharedGoalContributions).values({
      sharedGoalId,
      userId:    me,
      accountId,
      amount,
      note:      note ?? null,
      isRefund:  false,
    })

    if (otherMemberIds.length > 0) {
      await tx.insert(notifications).values(
        otherMemberIds.map((userId) => ({
          userId,
          type:     'shared_goal_contribution' as const,
          actorId:  me,
          entityId: sharedGoalId,
          body:     `${me_row?.name ?? 'Someone'} contributed to "${goal.name}"`,
        })),
      )
    }

    if (completed) {
      const allActive = memberRows.map((r) => r.userId)
      if (allActive.length > 0) {
        await tx.insert(notifications).values(
          allActive.map((userId) => ({
            userId,
            type:     'shared_goal_completed' as const,
            actorId:  me,
            entityId: sharedGoalId,
            body:     `"${goal.name}" reached its target!`,
          })),
        )
      }
    }
  })

  await awardXP(me, 'shared_goal_contribution', 5, `Contributed to ${goal.name}`)
  if (newPct >= 0.5  && prevPct < 0.5)  await awardXP(me, 'shared_goal_milestone_50',  30, `50% of ${goal.name}`)
  if (newPct >= 0.75 && prevPct < 0.75) await awardXP(me, 'shared_goal_milestone_75',  30, `75% of ${goal.name}`)
  if (completed && prevPct < 1)         await awardXP(me, 'shared_goal_completed',     30, `Completed ${goal.name}`)

  return { completed, goalName: goal.name, newTotal }
}

async function refundUserContributions(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  sharedGoalId: string,
  userId: string,
): Promise<number> {
  const contribs = await tx
    .select({
      id:        sharedGoalContributions.id,
      amount:    sharedGoalContributions.amount,
      accountId: sharedGoalContributions.accountId,
      isRefund:  sharedGoalContributions.isRefund,
    })
    .from(sharedGoalContributions)
    .where(
      and(
        eq(sharedGoalContributions.sharedGoalId, sharedGoalId),
        eq(sharedGoalContributions.userId, userId),
      ),
    )

  const net = contribs.reduce((sum, c) => sum + (c.isRefund ? -c.amount : c.amount), 0)
  if (net <= 0) return 0

  const lastDebit = [...contribs].reverse().find((c) => !c.isRefund)
  if (!lastDebit) return 0

  const [acct] = await tx
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.id, lastDebit.accountId), eq(accounts.userId, userId)))

  let refundAccountId = acct?.id
  if (!refundAccountId) {
    const [fallback] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .limit(1)
    if (!fallback) return 0
    refundAccountId = fallback.id
  }

  await tx
    .update(accounts)
    .set({ balance: sql`balance + ${net}` })
    .where(eq(accounts.id, refundAccountId))

  await tx.insert(sharedGoalContributions).values({
    sharedGoalId,
    userId,
    accountId: refundAccountId,
    amount:    net,
    note:      'Refund on leave',
    isRefund:  true,
  })

  await tx
    .update(sharedGoals)
    .set({ currentAmount: sql`current_amount - ${net}` })
    .where(eq(sharedGoals.id, sharedGoalId))

  return net
}

export async function leaveSharedGoal(sharedGoalId: string) {
  const me = await requireUserId()
  const [member] = await db
    .select()
    .from(sharedGoalMembers)
    .where(and(eq(sharedGoalMembers.sharedGoalId, sharedGoalId), eq(sharedGoalMembers.userId, me)))
  if (!member) throw new Error('Not a member')
  if (member.status !== 'active') throw new Error('Not an active member')
  if (member.isCreator) throw new Error('Creator cannot leave their own goal')

  const [goal] = await db.select().from(sharedGoals).where(eq(sharedGoals.id, sharedGoalId))
  if (!goal) throw new Error('Shared goal not found')

  const [me_row] = await db.select({ name: users.name }).from(users).where(eq(users.id, me))

  await db.transaction(async (tx) => {
    if (goal.leavePolicy === 'refundable') {
      await refundUserContributions(tx, sharedGoalId, me)
    }
    await tx
      .update(sharedGoalMembers)
      .set({ status: 'left', leftAt: new Date() })
      .where(eq(sharedGoalMembers.id, member.id))

    await tx.insert(notifications).values({
      userId:   goal.creatorId,
      type:     'shared_goal_removed',
      actorId:  me,
      entityId: sharedGoalId,
      body:     `${me_row?.name ?? 'Someone'} left "${goal.name}"`,
    })
  })

  return { success: true }
}

export async function removeMember(sharedGoalId: string, userId: string) {
  const me = await requireUserId()
  if (userId === me) throw new Error('Use leaveSharedGoal to leave your own goal')

  const [goal] = await db.select().from(sharedGoals).where(eq(sharedGoals.id, sharedGoalId))
  if (!goal) throw new Error('Shared goal not found')
  if (goal.creatorId !== me) throw new Error('Only the creator can remove members')

  const [target] = await db
    .select()
    .from(sharedGoalMembers)
    .where(and(eq(sharedGoalMembers.sharedGoalId, sharedGoalId), eq(sharedGoalMembers.userId, userId)))
  if (!target) throw new Error('Member not found')
  if (target.status !== 'active' && target.status !== 'invited') throw new Error('Member already inactive')

  await db.transaction(async (tx) => {
    if (target.status === 'active' && goal.leavePolicy === 'refundable') {
      await refundUserContributions(tx, sharedGoalId, userId)
    }
    await tx
      .update(sharedGoalMembers)
      .set({ status: 'removed', leftAt: new Date() })
      .where(eq(sharedGoalMembers.id, target.id))

    await tx.insert(notifications).values({
      userId,
      type:     'shared_goal_removed',
      actorId:  me,
      entityId: sharedGoalId,
      body:     `You were removed from "${goal.name}"`,
    })
  })

  return { success: true }
}

export async function getSharedGoalsForUser(): Promise<SharedGoalCard[]> {
  const me = await requireUserId()
  const myMemberships = await db
    .select({
      sharedGoalId: sharedGoalMembers.sharedGoalId,
      status:       sharedGoalMembers.status,
      isCreator:    sharedGoalMembers.isCreator,
    })
    .from(sharedGoalMembers)
    .where(
      and(
        eq(sharedGoalMembers.userId, me),
        inArray(sharedGoalMembers.status, ['active', 'invited']),
      ),
    )
  if (myMemberships.length === 0) return []

  const goalIds = myMemberships.map((m) => m.sharedGoalId)
  const goalRows = await db
    .select({
      id:            sharedGoals.id,
      name:          sharedGoals.name,
      icon:          sharedGoals.icon,
      targetAmount:  sharedGoals.targetAmount,
      currentAmount: sharedGoals.currentAmount,
      targetDate:    sharedGoals.targetDate,
      leavePolicy:   sharedGoals.leavePolicy,
      isCompleted:   sharedGoals.isCompleted,
      createdAt:     sharedGoals.createdAt,
      creatorId:     sharedGoals.creatorId,
      creatorName:   users.name,
    })
    .from(sharedGoals)
    .innerJoin(users, eq(users.id, sharedGoals.creatorId))
    .where(inArray(sharedGoals.id, goalIds))

  const counts = await db
    .select({
      sharedGoalId: sharedGoalMembers.sharedGoalId,
      count:        sql<number>`count(*)::int`,
    })
    .from(sharedGoalMembers)
    .where(
      and(
        inArray(sharedGoalMembers.sharedGoalId, goalIds),
        eq(sharedGoalMembers.status, 'active'),
      ),
    )
    .groupBy(sharedGoalMembers.sharedGoalId)

  const countMap = new Map(counts.map((c) => [c.sharedGoalId, c.count]))
  const myMap = new Map(myMemberships.map((m) => [m.sharedGoalId, m]))

  return goalRows.map((g) => {
    const me_membership = myMap.get(g.id)!
    return {
      ...g,
      myStatus:    me_membership.status,
      isCreator:   me_membership.isCreator,
      memberCount: countMap.get(g.id) ?? 0,
    }
  })
}

export async function getSharedGoalDetail(sharedGoalId: string): Promise<SharedGoalDetail | null> {
  const me = await requireUserId()

  const [myMembership] = await db
    .select()
    .from(sharedGoalMembers)
    .where(and(eq(sharedGoalMembers.sharedGoalId, sharedGoalId), eq(sharedGoalMembers.userId, me)))
  if (!myMembership) throw new Error('Unauthorized')

  const [goal] = await db.select().from(sharedGoals).where(eq(sharedGoals.id, sharedGoalId))
  if (!goal) return null

  const memberRows = await db
    .select({
      userId:    sharedGoalMembers.userId,
      status:    sharedGoalMembers.status,
      isCreator: sharedGoalMembers.isCreator,
      name:      users.name,
      username:  users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(sharedGoalMembers)
    .innerJoin(users, eq(users.id, sharedGoalMembers.userId))
    .where(eq(sharedGoalMembers.sharedGoalId, sharedGoalId))

  const contribAgg = await db
    .select({
      userId:            sharedGoalContributions.userId,
      totalContributed:  sql<number>`COALESCE(SUM(CASE WHEN ${sharedGoalContributions.isRefund} THEN -${sharedGoalContributions.amount} ELSE ${sharedGoalContributions.amount} END), 0)::int`,
      contributionCount: sql<number>`SUM(CASE WHEN ${sharedGoalContributions.isRefund} THEN 0 ELSE 1 END)::int`,
    })
    .from(sharedGoalContributions)
    .where(eq(sharedGoalContributions.sharedGoalId, sharedGoalId))
    .groupBy(sharedGoalContributions.userId)
  const contribMap = new Map(contribAgg.map((c) => [c.userId, c]))

  const members: SharedGoalMember[] = memberRows.map((m) => {
    const agg = contribMap.get(m.userId)
    return {
      ...m,
      totalContributed:  agg?.totalContributed ?? 0,
      contributionCount: agg?.contributionCount ?? 0,
    }
  })

  const contribRows = await db
    .select({
      id:        sharedGoalContributions.id,
      userId:    sharedGoalContributions.userId,
      userName:  users.name,
      username:  users.username,
      avatarUrl: users.avatarUrl,
      amount:    sharedGoalContributions.amount,
      note:      sharedGoalContributions.note,
      isRefund:  sharedGoalContributions.isRefund,
      createdAt: sharedGoalContributions.createdAt,
    })
    .from(sharedGoalContributions)
    .innerJoin(users, eq(users.id, sharedGoalContributions.userId))
    .where(eq(sharedGoalContributions.sharedGoalId, sharedGoalId))
    .orderBy(desc(sharedGoalContributions.createdAt))
    .limit(50)

  const contributions: SharedGoalContributionRow[] = contribRows

  return {
    id:            goal.id,
    name:          goal.name,
    icon:          goal.icon,
    targetAmount:  goal.targetAmount,
    currentAmount: goal.currentAmount,
    targetDate:    goal.targetDate,
    leavePolicy:   goal.leavePolicy,
    isCompleted:   goal.isCompleted,
    createdAt:     goal.createdAt,
    creatorId:     goal.creatorId,
    myStatus:      myMembership.status,
    isCreator:     myMembership.isCreator,
    members,
    contributions,
  }
}

export async function getSharedGoalLeaderboard(sharedGoalId: string): Promise<LeaderboardRow[]> {
  const me = await requireUserId()

  const [myMembership] = await db
    .select({ id: sharedGoalMembers.id })
    .from(sharedGoalMembers)
    .where(and(eq(sharedGoalMembers.sharedGoalId, sharedGoalId), eq(sharedGoalMembers.userId, me)))
  if (!myMembership) throw new Error('Unauthorized')

  const memberRows = await db
    .select({
      userId:    sharedGoalMembers.userId,
      status:    sharedGoalMembers.status,
      isCreator: sharedGoalMembers.isCreator,
      name:      users.name,
      username:  users.username,
      avatarUrl: users.avatarUrl,
      level:     users.level,
      xpPoints:  users.xpPoints,
    })
    .from(sharedGoalMembers)
    .innerJoin(users, eq(users.id, sharedGoalMembers.userId))
    .where(
      and(
        eq(sharedGoalMembers.sharedGoalId, sharedGoalId),
        inArray(sharedGoalMembers.status, ['active', 'left', 'removed']),
      ),
    )

  const contribAgg = await db
    .select({
      userId:            sharedGoalContributions.userId,
      totalContributed:  sql<number>`COALESCE(SUM(CASE WHEN ${sharedGoalContributions.isRefund} THEN -${sharedGoalContributions.amount} ELSE ${sharedGoalContributions.amount} END), 0)::int`,
      contributionCount: sql<number>`SUM(CASE WHEN ${sharedGoalContributions.isRefund} THEN 0 ELSE 1 END)::int`,
    })
    .from(sharedGoalContributions)
    .where(eq(sharedGoalContributions.sharedGoalId, sharedGoalId))
    .groupBy(sharedGoalContributions.userId)
  const contribMap = new Map(contribAgg.map((c) => [c.userId, c]))

  const enriched = memberRows.map((m) => {
    const agg = contribMap.get(m.userId)
    return {
      ...m,
      totalContributed:  agg?.totalContributed ?? 0,
      contributionCount: agg?.contributionCount ?? 0,
    }
  })

  enriched.sort((a, b) => {
    if (b.totalContributed !== a.totalContributed) return b.totalContributed - a.totalContributed
    if (b.contributionCount !== a.contributionCount) return b.contributionCount - a.contributionCount
    return a.name.localeCompare(b.name)
  })

  return enriched.map((row, i) => ({ rank: i + 1, ...row }))
}

export async function getSharedGoalInvites(): Promise<SharedGoalInvite[]> {
  const me = await requireUserId()
  const rows = await db
    .select({
      sharedGoalId: sharedGoals.id,
      name:         sharedGoals.name,
      icon:         sharedGoals.icon,
      targetAmount: sharedGoals.targetAmount,
      targetDate:   sharedGoals.targetDate,
      leavePolicy:  sharedGoals.leavePolicy,
      creatorId:    sharedGoals.creatorId,
      creatorName:  users.name,
      invitedAt:    sharedGoalMembers.joinedAt,
    })
    .from(sharedGoalMembers)
    .innerJoin(sharedGoals, eq(sharedGoals.id, sharedGoalMembers.sharedGoalId))
    .innerJoin(users, eq(users.id, sharedGoals.creatorId))
    .where(and(eq(sharedGoalMembers.userId, me), eq(sharedGoalMembers.status, 'invited')))
    .orderBy(desc(sharedGoalMembers.joinedAt))
  return rows
}
