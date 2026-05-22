import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { dailyQuests } from '@/lib/schema'
import { QUEST_SEEDS } from '@/lib/seed-quests'
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await db.select({ count: sql<number>`count(*)` }).from(dailyQuests)
  if (Number(existing[0].count) > 0) {
    return NextResponse.json({ message: 'Quests already seeded', count: existing[0].count })
  }

  await db.insert(dailyQuests).values(QUEST_SEEDS)
  return NextResponse.json({ message: 'Quests seeded', count: QUEST_SEEDS.length })
}
