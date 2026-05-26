import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProfile, getEarnedBadges } from '@/lib/actions/profile'
import { ProfileClient } from './profile-client'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const [profile, earnedBadges] = await Promise.all([
    getProfile(),
    getEarnedBadges(),
  ])

  return (
    <ProfileClient
      profile={profile}
      earnedBadges={earnedBadges}
      initialTab={searchParams.tab as 'settings' | 'friends' | 'accounts' | 'categories' | 'badges' | 'import' | undefined}
    />
  )
}
