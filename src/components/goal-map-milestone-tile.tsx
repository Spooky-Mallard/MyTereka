'use client'

import type { LucideIcon } from 'lucide-react'
import { Lock } from 'lucide-react'

type TileState = 'completed' | 'current' | 'locked'

type Props = {
  state:    TileState
  Icon:     LucideIcon
  label:    string
  pct:      number
  xp:       number
  side:     'left' | 'right'
}

const STATE_STYLES: Record<TileState, { bg: string; iconColor: string; badgeBg: string; badgeColor: string; shadowColor: string }> = {
  completed: {
    bg:          'var(--primary)',
    iconColor:   '#ffffff',
    badgeBg:     'var(--primary-dark)',
    badgeColor:  '#fff',
    shadowColor: 'rgba(0,160,129,0.5)',
  },
  current: {
    bg:          'var(--warning)',
    iconColor:   '#ffffff',
    badgeBg:     '#92400e',
    badgeColor:  '#fef3c7',
    shadowColor: 'rgba(180,100,0,0.5)',
  },
  locked: {
    bg:          'var(--card)',
    iconColor:   'var(--muted-foreground)',
    badgeBg:     'var(--muted)',
    badgeColor:  'var(--muted-foreground)',
    shadowColor: 'rgba(0,0,0,0.3)',
  },
}

export function GoalMapMilestoneTile({ state, Icon, label, pct, xp, side }: Props) {
  const s = STATE_STYLES[state]
  const isLocked = state === 'locked'

  return (
    <div
      className={`flex ${side === 'right' ? 'justify-end' : 'justify-start'} w-full`}
      style={{ opacity: isLocked ? 0.55 : 1, transition: 'opacity 0.4s' }}
    >
      <div className="flex flex-col items-center gap-2" style={{ width: 96 }}>
        <div style={{ perspective: '400px' }}>
          <div
            className={state === 'current' ? 'tile-current' : ''}
            style={{
              width:          80,
              height:         80,
              borderRadius:   18,
              background:     s.bg,
              transform:      'rotateX(20deg) rotateZ(-5deg)',
              boxShadow:      `0 8px 0 ${s.shadowColor}, 0 12px 20px rgba(0,0,0,0.4)`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              transition:     'background 0.5s, box-shadow 0.5s',
            }}
          >
            {isLocked
              ? <Lock size={28} color={s.iconColor} strokeWidth={2} />
              : <Icon size={32} color={s.iconColor} strokeWidth={2} />
            }
          </div>
        </div>

        {pct > 0 && (
          <div
            className="rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap"
            style={{ background: s.badgeBg, color: s.badgeColor }}
          >
            {pct}% · +{xp} XP
          </div>
        )}

        <span
          className="text-[11px] font-semibold text-center leading-tight"
          style={{ color: isLocked ? 'var(--muted-foreground)' : 'var(--foreground)' }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
