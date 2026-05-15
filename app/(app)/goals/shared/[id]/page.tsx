import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getSharedGoalDetail, getSharedGoalLeaderboard } from '@/lib/actions/shared-goals'
import { SharedGoalDetailClient } from './shared-goal-detail-client'

export default async function SharedGoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')
  const { id } = await params

  let detail
  let leaderboard
  try {
    [detail, leaderboard] = await Promise.all([
      getSharedGoalDetail(id),
      getSharedGoalLeaderboard(id),
    ])
  } catch {
    redirect('/goals')
  }
  if (!detail) notFound()

  return <SharedGoalDetailClient detail={detail} leaderboard={leaderboard} meId={session.user.id} />
}
