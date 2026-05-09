import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTransactions } from '@/lib/actions/transactions'
import { TransactionsClient } from './transactions-client'

export default async function TransactionsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const data = await getTransactions()
  return <TransactionsClient initialData={data} />
}
