import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getSharedGoalMapData } from '@/lib/actions/shared-goals'
import { SharedGoalMapScreen } from './shared-goal-map-screen'

export default async function SharedGoalMapPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')
  const { id } = await params
  const data = await getSharedGoalMapData(id)
  if (!data) notFound()
  return <SharedGoalMapScreen data={data} />
}
