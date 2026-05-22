'use client'

import { Flag, Sprout, Zap, Flame, Star, Trophy } from 'lucide-react'
import { GoalMapMilestoneTile } from './goal-map-milestone-tile'

export const MILESTONE_NODES = [
  { key: 'start', pct: 0,   label: 'Start',        Icon: Flag,   xp: 0   },
  { key: '10',    pct: 10,  label: 'Early Mover',  Icon: Sprout, xp: 20  },
  { key: '25',    pct: 25,  label: 'Quarter Way',  Icon: Zap,    xp: 30  },
  { key: '50',    pct: 50,  label: 'Halfway',      Icon: Flame,  xp: 50  },
  { key: '75',    pct: 75,  label: 'Almost There', Icon: Star,   xp: 75  },
  { key: '100',   pct: 100, label: 'Goal Complete',Icon: Trophy, xp: 100 },
] as const

type Props = {
  currentPct:       number
  earnedMilestones: string[]
}

function PathConnector({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`flex ${side === 'right' ? 'justify-end pr-12' : 'justify-start pl-12'} w-full py-1`}>
      <div className="flex flex-col gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border)' }} />
        ))}
      </div>
    </div>
  )
}

export function GoalMapTileCanvas({ currentPct, earnedMilestones }: Props) {
  const earnedSet = new Set(earnedMilestones)

  const nodes = MILESTONE_NODES.map((m, i) => {
    const isDone    = earnedSet.has(m.key) || m.pct === 0
    const isCurrent = !isDone && (
      i === 0 ||
      (MILESTONE_NODES[i - 1].pct <= currentPct && m.pct > currentPct)
    )
    const state = isDone ? 'completed' : isCurrent ? 'current' : 'locked'
    const side  = i % 2 === 0 ? 'left' : 'right'
    return { ...m, state, side } as const
  })

  return (
    <div className="flex flex-col items-stretch gap-0 w-full max-w-xs mx-auto select-none pb-8">
      {nodes.map((node, i) => (
        <div key={node.key}>
          <GoalMapMilestoneTile
            state={node.state}
            Icon={node.Icon}
            label={node.label}
            pct={node.pct}
            xp={node.xp}
            side={node.side}
          />
          {i < nodes.length - 1 && <PathConnector side={node.side} />}
        </div>
      ))}
    </div>
  )
}
