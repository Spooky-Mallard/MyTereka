import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getGoals } from '@/lib/actions/goals'
import { getSharedGoalsForUser, getSharedGoalInvites } from '@/lib/actions/shared-goals'
import { GoalsClient } from './goals-client'

export default async function GoalsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const [data, sharedGoals, sharedInvites] = await Promise.all([
    getGoals(),
    getSharedGoalsForUser(),
    getSharedGoalInvites(),
  ])
  return <GoalsClient data={data} sharedGoals={sharedGoals} sharedInvites={sharedInvites} />
}
