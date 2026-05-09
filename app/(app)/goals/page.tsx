import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getGoals } from '@/lib/actions/goals'
import { GoalsClient } from './goals-client'

export default async function GoalsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const data = await getGoals()
  return <GoalsClient data={data} />
}
