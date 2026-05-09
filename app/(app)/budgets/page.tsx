import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getBudgets } from '@/lib/actions/budgets'
import { BudgetsClient } from './budgets-client'

export default async function BudgetsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const data = await getBudgets()
  return <BudgetsClient data={data} />
}
