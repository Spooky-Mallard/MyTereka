import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getGoalMapData } from '@/lib/actions/goals'
import { GoalMapScreen } from './goal-map-screen'

export default async function GoalMapPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const { id } = await params
  const data = await getGoalMapData(id)
  if (!data) notFound()

  const currentPct = data.goal.targetAmount > 0
    ? Math.min(100, Math.round((data.goal.currentAmount / data.goal.targetAmount) * 100))
    : 0

  return (
    <GoalMapScreen
      goal={data.goal}
      currentPct={currentPct}
      earnedMilestones={data.earnedMilestones}
      collectedCoins={data.collectedCoins}
    />
  )
}
