import { auth } from '@/lib/auth'
import { seedGoalBadges } from '@/lib/actions/goals'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const result = await seedGoalBadges()
  return NextResponse.json(result)
}
