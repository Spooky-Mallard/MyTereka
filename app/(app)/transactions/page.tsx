import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTransactions, getAccountsForUser } from '@/lib/actions/transactions'
import { TransactionsClient } from './transactions-client'

export default async function TransactionsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const [data, accounts] = await Promise.all([
    getTransactions(),
    getAccountsForUser(),
  ])
  return <TransactionsClient initialData={data} accounts={accounts} />
}
