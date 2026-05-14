import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getSharedGoalDetail } from '@/lib/actions/shared-goals'
import { SharedGoalDetailClient } from './shared-goal-detail-client'

export default async function SharedGoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')
  const { id } = await params

  let detail
  try {
    detail = await getSharedGoalDetail(id)
  } catch {
    redirect('/goals')
  }
  if (!detail) notFound()

  return <SharedGoalDetailClient detail={detail} meId={session.user.id} />
}
