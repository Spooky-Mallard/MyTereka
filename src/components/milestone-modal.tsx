'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { MILESTONE_NODES } from './goal-map-tile-canvas'

type MilestoneNode = (typeof MILESTONE_NODES)[number]

export function MilestoneModal({
  milestone,
  onDismiss,
}: {
  milestone: MilestoneNode
  onDismiss: () => void
}) {
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    btnRef.current?.focus()
  }, [])

  const iconMap: Record<string, string> = {
    start:  '🏁',
    '10':   '🌱',
    '25':   '⚡',
    '50':   '🔥',
    '75':   '⭐',
    '100':  '🏆',
  }

  const icon = iconMap[milestone.key] ?? '🎯'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div
        className="w-full max-w-xs rounded-2xl p-6 flex flex-col items-center gap-4 text-center"
        style={{
          background: 'var(--card)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'xp-pop 0.4s ease forwards',
        }}
      >
        <button
          onClick={onDismiss}
          className="self-end"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <X size={18} />
        </button>

        <div className="text-5xl leading-none">{icon}</div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: 'var(--muted-foreground)' }}>
            Milestone Reached
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            {milestone.label}
          </div>
        </div>

        {milestone.xp > 0 && (
          <div
            className="rounded-full px-5 py-2 text-sm font-bold"
            style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}
          >
            +{milestone.xp} XP earned
          </div>
        )}

        <button
          ref={btnRef}
          onClick={onDismiss}
          className="w-full rounded-full py-3 text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: 'var(--gradient-primary)' }}
        >
          Awesome!
        </button>
      </div>
    </div>
  )
}
