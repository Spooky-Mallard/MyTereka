'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { goals, goalContributions, accounts, badges } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'
import { awardXP, checkAndAwardBadge } from './gamification'

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

export async function contributeToGoal(
  goalId:    string,
  amount:    number,
  accountId: string,
  note?:     string,
): Promise<{ completed: boolean; goalName: string }> {
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

  const prevPct  = goal.currentAmount / goal.targetAmount
  const newAmount = goal.currentAmount + amount
  const newPct   = newAmount / goal.targetAmount

  await db.transaction(async (tx) => {
    await tx
      .update(accounts)
      .set({ balance: sql`balance - ${amount}` })
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))

    await tx
      .update(goals)
      .set({
        currentAmount: newAmount,
        isCompleted:   newAmount >= goal.targetAmount,
      })
      .where(eq(goals.id, goalId))

    await tx.insert(goalContributions).values({ goalId, userId, amount, note })
  })

  if (newPct >= 0.5  && prevPct < 0.5)
    await awardXP(userId, 'goal_milestone_50', 30, `50% of goal: ${goal.name}`)
  if (newPct >= 0.75 && prevPct < 0.75)
    await awardXP(userId, 'goal_milestone_75', 30, `75% of goal: ${goal.name}`)

  if (newAmount >= goal.targetAmount) {
    await awardXP(userId, 'goal_completed', 30, `Completed goal: ${goal.name}`)
    await checkAndAwardBadge(userId, 'goal_completed')
    return { completed: true, goalName: goal.name }
  }

  return { completed: false, goalName: goal.name }
}

const GOAL_MAP_BADGES = [
  { triggerEvent: 'milestone_10',  name: 'Early Mover',   description: 'Saved the first 10% of a savings goal', icon: '🌱' },
  { triggerEvent: 'milestone_25',  name: 'Quarter Way',   description: 'Reached 25% of a savings goal',         icon: '⚡' },
  { triggerEvent: 'milestone_50',  name: 'Halfway Hero',  description: 'Hit the halfway mark on a savings goal', icon: '🔥' },
  { triggerEvent: 'milestone_75',  name: 'Almost There',  description: 'Reached 75% of a savings goal',          icon: '⭐' },
  { triggerEvent: 'goal_completed',name: 'Goal Getter',   description: 'Completed a savings goal',               icon: '🏆' },
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
