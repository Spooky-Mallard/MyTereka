'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { GoalMapTileCanvas } from '@/components/goal-map-tile-canvas'
import { formatUGX } from '@/lib/format'
import type { SharedGoalMapData } from '@/lib/actions/shared-goals'

function Leaderboard({ members, goalName }: { members: SharedGoalMapData['members']; goalName: string }) {
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 20,
      background: 'rgba(13,25,41,0.92)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(0,184,148,0.25)',
      borderRadius: 16,
      padding: '12px 16px',
      minWidth: 260, maxWidth: 340,
    }}>
      <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        Leaderboard · {goalName}
      </div>
      {members.length === 0 ? (
        <div style={{ fontFamily: 'Nunito Sans, sans-serif', fontSize: 12, color: 'var(--muted-foreground)' }}>No contributions yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {members.slice(0, 5).map((m, i) => (
            <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: i < members.length - 1 ? 6 : 0, borderBottom: i < Math.min(members.length, 5) - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
              <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, width: 22, textAlign: 'center', color: 'var(--muted-foreground)' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                {m.name[0].toUpperCase()}
              </div>
              <span style={{ flex: 1, fontFamily: 'Nunito Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.name}
              </span>
              <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--success)' }}>
                {formatUGX(m.totalContributed)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SharedGoalMapScreen({ data }: { data: SharedGoalMapData }) {
  const { goal, members, currentPct, earnedMilestones } = data

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--background)', zIndex: 0, overflow: 'hidden' }}>
      {/* Floating top overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(10,25,41,0.95) 0%, transparent 100%)',
      }}>
        <Link href={`/goals/shared/${goal.id}`} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)', color: '#fff',
          textDecoration: 'none',
        }}>
          <ArrowLeft size={16} />
        </Link>
        <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '-0.01em' }}>
            {goal.name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
            {currentPct}% · {formatUGX(goal.currentAmount)} of {formatUGX(goal.targetAmount)} · {members.length} members
          </div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Map — fills full screen */}
      <GoalMapTileCanvas
        currentPct={currentPct}
        earnedMilestones={earnedMilestones}
        goalName={goal.name}
        targetAmount={goal.targetAmount}
        currentAmount={goal.currentAmount}
        fullScreen
      />

      {/* Leaderboard overlay at bottom */}
      <Leaderboard members={members} goalName={goal.name} />
    </div>
  )
}
