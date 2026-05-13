import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getNotifications } from '@/lib/actions/notifications'
import { NotificationsClient } from './notifications-client'

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')
  const initial = await getNotifications(50)
  return <NotificationsClient initial={initial} />
}
