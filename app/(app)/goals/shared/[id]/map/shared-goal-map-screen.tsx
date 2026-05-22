'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { GoalMapTileCanvas } from '@/components/goal-map-tile-canvas'
import { useSetRightRail } from '@/components/right-rail-context'
import { formatUGX } from '@/lib/format'
import type { SharedGoalMapData } from '@/lib/actions/shared-goals'

function Leaderboard({ members, goalName }: { members: SharedGoalMapData['members']; goalName: string }) {
  return (
    <div className="rail-card flex flex-col gap-4">
      <div>
        <div className="eyebrow">Leaderboard</div>
        <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
          {goalName}
        </div>
      </div>
      {members.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No contributions yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((m, i) => (
            <div key={m.userId} className="flex items-center gap-3 py-2 border-b last:border-0"
              style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm font-bold w-6 text-center" style={{ color: 'var(--muted-foreground)' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: 'var(--gradient-primary)' }}>
                {m.name[0].toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                {m.name}
              </span>
              <span className="text-sm font-bold amount-income">{formatUGX(m.totalContributed)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SharedGoalMapScreen({ data }: { data: SharedGoalMapData }) {
  const { goal, members, currentPct, earnedMilestones } = data

  useSetRightRail(<Leaderboard members={members} goalName={goal.name} />)

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/goals/shared/${goal.id}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: 'var(--surface-alt)', color: 'var(--foreground)' }}>
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight"
            style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            {goal.name}
          </h1>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {currentPct}% complete · {formatUGX(goal.currentAmount)} of {formatUGX(goal.targetAmount)}
          </p>
        </div>
      </div>

      {/* Map canvas */}
      <GoalMapTileCanvas
        currentPct={currentPct}
        earnedMilestones={earnedMilestones}
        goalName={goal.name}
        targetAmount={goal.targetAmount}
        currentAmount={goal.currentAmount}
      />

      {/* Leaderboard (mobile — hidden on xl where right rail shows) */}
      <div className="xl:hidden">
        <Leaderboard members={members} goalName={goal.name} />
      </div>
    </div>
  )
}
