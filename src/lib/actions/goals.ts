'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { goals, goalContributions, goalMilestones, goalCoins, accounts, badges } from '@/lib/schema'
import { eq, and, sql, inArray } from 'drizzle-orm'
import { awardXP, checkAndAwardBadge } from './gamification'
import { completeQuestIfApplicable } from './quests'

export async function createGoal(data: {
  name:         string
  targetAmount: number
  targetDate?:  string
  icon?:        string
  isLocked?:    boolean
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  await db.insert(goals).values({ ...data, userId: session.user.id, currentAmount: 0 })
}

const MILESTONES = [
  { key: '10',  pct: 0.10, xp: 20,  badge: 'milestone_10'  },
  { key: '25',  pct: 0.25, xp: 30,  badge: 'milestone_25'  },
  { key: '50',  pct: 0.50, xp: 50,  badge: 'milestone_50'  },
  { key: '75',  pct: 0.75, xp: 75,  badge: 'milestone_75'  },
  { key: '100', pct: 1.00, xp: 100, badge: 'goal_completed' },
] as const

const COIN_PCTS = [0.05, 0.175, 0.375, 0.625, 0.875] as const

export async function contributeToGoal(
  goalId:    string,
  amount:    number,
  accountId: string,
  note?:     string,
): Promise<{
  completed:              boolean
  goalName:               string
  newlyReachedMilestones: string[]
  coinsCollected:         number[]
}> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))

  if (!goal) throw new Error('Goal not found')
  if (goal.isLocked && goal.isCompleted)
    throw new Error('Goal is already completed and locked')

  const prevPct   = goal.currentAmount / goal.targetAmount
  const newAmount = goal.currentAmount + amount
  const newPct    = newAmount / goal.targetAmount

  await db.transaction(async (tx) => {
    await tx
      .update(accounts)
      .set({ balance: sql`balance - ${amount}` })
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))

    await tx
      .update(goals)
      .set({ currentAmount: newAmount, isCompleted: newAmount >= goal.targetAmount })
      .where(eq(goals.id, goalId))

    await tx.insert(goalContributions).values({ goalId, userId, amount, note })
  })

  // --- milestone checks ---
  const crossedMilestones = MILESTONES.filter(
    (m) => newPct >= m.pct && prevPct < m.pct,
  )

  const newlyReachedMilestones: string[] = []

  if (crossedMilestones.length > 0) {
    // fetch already-reached milestones for this goal to avoid double-award
    const alreadyReached = await db
      .select({ milestoneKey: goalMilestones.milestoneKey })
      .from(goalMilestones)
      .where(
        and(
          eq(goalMilestones.goalId, goalId),
          eq(goalMilestones.userId, userId),
          inArray(goalMilestones.milestoneKey, crossedMilestones.map((m) => m.key) as unknown as string[]),
        ),
      )
    const alreadySet = new Set(alreadyReached.map((r) => r.milestoneKey))

    for (const m of crossedMilestones) {
      if (alreadySet.has(m.key)) continue
      await db.insert(goalMilestones).values({
        goalId,
        userId,
        milestoneKey: m.key,
        xpAwarded:    m.xp,
        badgeKey:     m.badge,
      })
      await awardXP(userId, `goal_milestone_${m.key}`, m.xp, `${m.key}% of goal: ${goal.name}`)
      await checkAndAwardBadge(userId, m.badge)
      newlyReachedMilestones.push(m.key)
    }
  }

  // --- coin checks ---
  const crossedCoinIdxs = COIN_PCTS
    .map((pct, i) => ({ pct, i }))
    .filter(({ pct }) => newPct >= pct && prevPct < pct)
    .map(({ i }) => i)

  const coinsCollected: number[] = []

  if (crossedCoinIdxs.length > 0) {
    const alreadyCollected = await db
      .select({ coinIndex: goalCoins.coinIndex })
      .from(goalCoins)
      .where(
        and(
          eq(goalCoins.goalId, goalId),
          eq(goalCoins.userId, userId),
          inArray(goalCoins.coinIndex, crossedCoinIdxs),
        ),
      )
    const alreadySet = new Set(alreadyCollected.map((r) => r.coinIndex))

    for (const idx of crossedCoinIdxs) {
      if (alreadySet.has(idx)) continue
      await db.insert(goalCoins).values({ goalId, userId, coinIndex: idx })
      await awardXP(userId, 'goal_coin', 10, `Coin collected on goal: ${goal.name}`)
      coinsCollected.push(idx)
    }
  }

  await completeQuestIfApplicable('contribute_goal')

  return {
    completed:              newAmount >= goal.targetAmount,
    goalName:               goal.name,
    newlyReachedMilestones,
    coinsCollected,
  }
}

export type GoalMapData = {
  goal:              typeof goals.$inferSelect
  contributions:     (typeof goalContributions.$inferSelect)[]
  earnedMilestones:  string[]
  collectedCoins:    number[]
}

export async function getGoalMapData(goalId: string): Promise<GoalMapData | null> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
  if (!goal) return null

  const [contributions, milestoneRows, coinRows] = await Promise.all([
    db
      .select()
      .from(goalContributions)
      .where(and(eq(goalContributions.goalId, goalId), eq(goalContributions.userId, userId)))
      .orderBy(goalContributions.createdAt),
    db
      .select({ milestoneKey: goalMilestones.milestoneKey })
      .from(goalMilestones)
      .where(and(eq(goalMilestones.goalId, goalId), eq(goalMilestones.userId, userId))),
    db
      .select({ coinIndex: goalCoins.coinIndex })
      .from(goalCoins)
      .where(and(eq(goalCoins.goalId, goalId), eq(goalCoins.userId, userId))),
  ])

  return {
    goal,
    contributions,
    earnedMilestones: milestoneRows.map((r) => r.milestoneKey),
    collectedCoins:   coinRows.map((r) => r.coinIndex),
  }
}

const GOAL_MAP_BADGES = [
  { triggerEvent: 'milestone_10',  name: 'Early Mover',  description: 'Saved the first 10% of a savings goal', icon: '🌱' },
  { triggerEvent: 'milestone_25',  name: 'Quarter Way',  description: 'Reached 25% of a savings goal',          icon: '⚡' },
  { triggerEvent: 'milestone_50',  name: 'Halfway Hero', description: 'Hit the halfway mark on a savings goal',  icon: '🔥' },
  { triggerEvent: 'milestone_75',  name: 'Almost There', description: 'Reached 75% of a savings goal',           icon: '⭐' },
  { triggerEvent: 'goal_completed',name: 'Goal Getter',  description: 'Completed a savings goal',                icon: '🏆' },
]

export async function seedGoalBadges() {
  const existing = await db.select({ triggerEvent: badges.triggerEvent }).from(badges)
  const existingEvents = new Set(existing.map((b) => b.triggerEvent))
  const toInsert = GOAL_MAP_BADGES.filter((b) => !existingEvents.has(b.triggerEvent))
  if (toInsert.length === 0) return { inserted: 0 }
  await db.insert(badges).values(toInsert.map((b) => ({ ...b, xpReward: 0 })))
  return { inserted: toInsert.length }
}

export async function getGoals() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return db
    .select()
    .from(goals)
    .where(eq(goals.userId, session.user.id))
}
