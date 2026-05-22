'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { GoalMapTileCanvas } from '@/components/goal-map-tile-canvas'
import { formatUGX } from '@/lib/format'
import type { SharedGoalMapData } from '@/lib/actions/shared-goals'

export function SharedGoalMapScreen({ data }: { data: SharedGoalMapData }) {
  const { goal, members, currentPct, earnedMilestones } = data

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: 'var(--background)' }}>
      <div className="flex items-center gap-3 p-4 pt-6">
        <Link href={`/goals/shared/${goal.id}`} style={{ color: 'var(--muted-foreground)' }}>←</Link>
        <h1 className="font-bold text-lg truncate">{goal.name}</h1>
      </div>

      <div className="flex flex-col items-center gap-2 py-4">
        <div className="avatar-pin flex items-center justify-center w-16 h-16 rounded-full" style={{ background: 'var(--primary)' }}>
          <Users size={28} color="#fff" />
        </div>
        <p className="text-2xl font-black" style={{ color: 'var(--primary)' }}>{currentPct}%</p>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {formatUGX(goal.currentAmount)} of {formatUGX(goal.targetAmount)}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <GoalMapTileCanvas currentPct={currentPct} earnedMilestones={earnedMilestones} />
      </div>

      <div className="mx-4 mb-4 card-base">
        <p className="font-bold text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>Contributors</p>
        {members.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No contributions yet.</p>
        )}
        {members.map((m, i) => (
          <div key={m.userId} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--muted-foreground)' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--primary)', color: '#fff' }}>
                {m.name[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium">{m.name}</span>
            </div>
            <span className="text-sm font-bold amount-income">{formatUGX(m.totalContributed)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
