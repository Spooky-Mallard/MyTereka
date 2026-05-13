import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Flame, Star, ArrowLeft, Lock } from 'lucide-react'
import { getFriendProfileByUsername } from '@/lib/actions/friends'
import { FriendProfileActions } from './friend-profile-actions'

export default async function FriendProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')
  const { username } = await params

  const profile = await getFriendProfileByUsername(username)
  if (!profile) notFound()

  const initials = profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const gated = !profile.isFriend && !profile.isSelf

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold"
        style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={14} /> Back to profile
      </Link>

      <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white"
          style={{ background: 'var(--gradient-primary)' }}>
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full rounded-2xl object-cover" />
          ) : initials}
        </div>
        <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{profile.name}</div>
        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>@{profile.username}</div>

        {!gated ? (
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="level-badge">{profile.level}</span>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--warning)' }}>
              <Flame size={12} /> {profile.streakCount}-day streak
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <Star size={12} style={{ color: 'var(--warning)' }} /> {profile.xpPoints} XP
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <Lock size={12} /> Add as friend to see streak, level, and badges
          </div>
        )}

        {!profile.isSelf && (
          <div className="mt-5">
            <FriendProfileActions
              userId={profile.id}
              isFriend={profile.isFriend}
              pendingDirection={profile.pendingDirection}
            />
          </div>
        )}
      </div>

      {!gated && (
        <div className="rounded-2xl p-5" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="mb-3 text-sm font-bold" style={{ color: 'var(--foreground)' }}>Badges</div>
          {profile.badges.length === 0 ? (
            <div className="rounded-xl p-6 text-center text-xs" style={{ background: 'var(--surface-alt)', color: 'var(--muted-foreground)' }}>
              No badges earned yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {profile.badges.map((b) => (
                <div key={b.name} className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center"
                  style={{ background: 'var(--surface-alt)' }}>
                  <div className="text-3xl">{b.icon ?? '🏅'}</div>
                  <div className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{b.name}</div>
                  {b.description && (
                    <div className="text-[10px] leading-snug" style={{ color: 'var(--muted-foreground)' }}>{b.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
