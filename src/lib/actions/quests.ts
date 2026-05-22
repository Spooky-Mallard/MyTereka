'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { dailyQuests, userQuestCompletions, userTipSeeds, notifications } from '@/lib/schema'
import { awardXP } from '@/lib/actions/gamification'
import { eq, and, sql } from 'drizzle-orm'

export type DailyQuestRow = {
  id:          number
  title:       string
  description: string | null
  xpReward:    number
  triggerType: string
}

function todayKeyEAT(): string {
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000)
  return now.toISOString().slice(0, 10)
}

export async function getTodayQuest(): Promise<{ quest: DailyQuestRow; completed: boolean } | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const [seedRow] = await db
    .select({ seed: userTipSeeds.seed })
    .from(userTipSeeds)
    .where(eq(userTipSeeds.userId, userId))

  let seed: number
  if (!seedRow) {
    seed = Math.floor(Math.random() * 9000) + 1000
    try {
      await db.insert(userTipSeeds).values({ userId, seed })
    } catch {
      // race condition — another insert won; re-fetch
      const [refetched] = await db.select({ seed: userTipSeeds.seed }).from(userTipSeeds).where(eq(userTipSeeds.userId, userId))
      if (!refetched) return null
      seed = refetched.seed
    }
  } else {
    seed = seedRow.seed
  }

  const allQuests = await db
    .select()
    .from(dailyQuests)
    .orderBy(dailyQuests.id)

  if (allQuests.length === 0) return null

  const dayIndex = Math.floor((Date.now() + 3 * 60 * 60 * 1000) / 86400000)
  const questIndex = (seed + dayIndex) % allQuests.length
  const quest = allQuests[questIndex]

  const dateKey = todayKeyEAT()
  const [completion] = await db
    .select({ id: userQuestCompletions.id })
    .from(userQuestCompletions)
    .where(
      and(
        eq(userQuestCompletions.userId, userId),
        eq(userQuestCompletions.questId, quest.id),
        eq(userQuestCompletions.dateKey, dateKey),
      )
    )

  return { quest, completed: !!completion }
}

export async function completeQuestIfApplicable(triggerType: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return
  const userId = session.user.id

  const result = await getTodayQuest()
  if (!result || result.completed) return
  if (result.quest.triggerType !== triggerType) return

  const dateKey = todayKeyEAT()

  try {
    await db.insert(userQuestCompletions).values({
      userId,
      questId: result.quest.id,
      dateKey,
    })

    await awardXP(userId, 'quest_completed', result.quest.xpReward, `Quest: ${result.quest.title}`)

    await db.insert(notifications).values({
      userId,
      type: 'quest_completed',
      body: `Quest complete: "${result.quest.title}" — +${result.quest.xpReward} XP earned!`,
    })
  } catch {
    // unique constraint violation = already completed; ignore
  }
}
