'use client'

import { Trophy, Crown, Medal } from 'lucide-react'
import { formatUGX } from '@/lib/format'
import type { LeaderboardRow } from '@/lib/types/shared-goals'

function Avatar({ name, src, size = 40, ring }: { name: string; src?: string | null; size?: number; ring?: string }) {
  const initials = name.split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="relative flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        background: 'var(--gradient-primary)',
        boxShadow: ring ? `0 0 0 3px ${ring}` : undefined,
        fontSize: size <= 36 ? 11 : 13,
      }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : initials}
    </div>
  )
}

function podiumColor(rank: number): string {
  if (rank === 1) return 'var(--podium-gold)'
  if (rank === 2) return 'var(--podium-silver)'
  return 'var(--podium-bronze)'
}

function PodiumPlate({ row, meId }: { row: LeaderboardRow; meId: string }) {
  const isMe = row.userId === meId
  const color = podiumColor(row.rank)
  const isFirst = row.rank === 1
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <Avatar name={row.name} src={row.avatarUrl} size={isFirst ? 64 : 56} ring={color} />
        {isFirst && (
          <Crown size={18} className="absolute -top-3 left-1/2 -translate-x-1/2"
            style={{ color: 'var(--podium-gold)' }} fill="var(--podium-gold)" />
        )}
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: color, boxShadow: 'var(--shadow-sm)' }}>
          {row.rank}
        </span>
      </div>
      <div className="max-w-[100px] text-center">
        <div className="truncate text-xs font-bold" style={{ color: isMe ? 'var(--primary)' : 'var(--foreground)' }}>
          {isMe ? 'You' : row.name}
        </div>
        <div className="text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>
          {formatUGX(row.totalContributed)}
        </div>
      </div>
    </div>
  )
}

export function SharedGoalLeaderboard({
  rows,
  meId,
}: {
  rows: LeaderboardRow[]
  meId: string
}) {
  const withContributions = rows.filter((r) => r.contributionCount > 0)

  if (withContributions.length === 0) {
    return (
      <div className="rounded-2xl p-5"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
        <div className="mb-3 flex items-center gap-2">
          <Trophy size={16} style={{ color: 'var(--muted-foreground)' }} />
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            Leaderboard
          </h2>
        </div>
        <div className="rounded-xl p-6 text-center text-sm"
          style={{ background: 'var(--surface-alt)', color: 'var(--muted-foreground)' }}>
          No contributions yet. Be the first to chip in!
        </div>
      </div>
    )
  }

  const podium = withContributions.slice(0, 3)
  const rest   = withContributions.slice(3)
  const totalContributed = withContributions.reduce((s, r) => s + r.totalContributed, 0)

  const me = rows.find((r) => r.userId === meId)
  const myPct = me && totalContributed > 0
    ? Math.round((me.totalContributed / totalContributed) * 100)
    : null

  const podiumOrder = [
    podium.find((r) => r.rank === 2),
    podium.find((r) => r.rank === 1),
    podium.find((r) => r.rank === 3),
  ].filter(Boolean) as LeaderboardRow[]

  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
      <div className="mb-4 flex items-center gap-2">
        <Trophy size={16} style={{ color: 'var(--podium-gold)' }} />
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
          Leaderboard
        </h2>
      </div>

      <div className="flex items-end justify-center gap-3 sm:gap-5 mb-5 mt-2">
        {podiumOrder.map((r) => (
          <PodiumPlate key={r.userId} row={r} meId={meId} />
        ))}
      </div>

      {rest.length > 0 && (
        <div className="flex flex-col gap-2">
          {rest.map((r) => {
            const isMe = r.userId === meId
            return (
              <div key={r.userId} className="flex items-center gap-3 rounded-xl p-2.5"
                style={{
                  background: isMe ? 'rgba(0,184,148,0.10)' : 'var(--surface-alt)',
                  border: isMe ? '1px solid var(--primary)' : '1px solid transparent',
                }}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>
                  {r.rank}
                </div>
                <Avatar name={r.name} src={r.avatarUrl} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold"
                      style={{ color: isMe ? 'var(--primary)' : 'var(--foreground)' }}>
                      {isMe ? `${r.name} (You)` : r.name}
                    </span>
                    {r.isCreator && <Crown size={11} style={{ color: 'var(--warning)' }} />}
                    {r.status !== 'active' && (
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>
                        {r.status}
                      </span>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {r.contributionCount} contribution{r.contributionCount === 1 ? '' : 's'} · {r.level}
                  </div>
                </div>
                <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                  {formatUGX(r.totalContributed)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {me && me.contributionCount > 0 && myPct !== null && (
        <div className="mt-4 rounded-xl p-3 text-center text-xs font-medium"
          style={{ background: 'rgba(0,184,148,0.08)', color: 'var(--primary)' }}>
          <Medal size={12} className="mr-1 inline" />
          You account for <span className="font-bold">{myPct}%</span> of the pot
          {me.rank === 1 && ' — leading the pack!'}
        </div>
      )}
    </div>
  )
}
