import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTransactions } from '@/lib/actions/transactions'
import { AnalyticsClient } from './analytics-client'

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const data = await getTransactions()
  return <AnalyticsClient data={data} />
}
