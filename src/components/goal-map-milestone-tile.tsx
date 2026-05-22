'use client'

import type { LucideIcon } from 'lucide-react'

type TileState = 'completed' | 'current' | 'locked'

type Props = {
  state:    TileState
  Icon:     LucideIcon
  label:    string
  pct:      number
  xp:       number
  side:     'left' | 'right'
  initials?: string
}

const COLORS: Record<TileState, { face: string; light: string; side: string }> = {
  completed: { face: '#00B894', light: '#1DD1A1', side: '#007a60' },
  current:   { face: '#F59E0B', light: '#FBBF24', side: '#b8730a' },
  locked:    { face: '#1A2F45', light: '#243B55', side: '#0A1929' },
}

function StarPill({ stars }: { stars: number }) {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '60%',
      transform: 'translate(-50%, -50%)',
      background: '#F2C94C',
      borderRadius: 9999,
      padding: '4px 7px',
      display: 'flex', alignItems: 'center', gap: 2,
      boxShadow: '0 2px 0 rgba(0,0,0,0.18)',
    }}>
      {[0, 1, 2].map(i => (
        <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i < stars ? '#fff' : '#b8861a'}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

function PinBalloon({ label, isLock }: { label: string; isLock: boolean }) {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: -30,
      transform: 'translate(-50%, 0)',
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'relative',
        width: 34, height: 34,
        background: isLock ? '#1A2F45' : '#0a0a0a',
        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff',
        fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14,
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
      }}>
        {isLock ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        ) : (
          <span>{label}</span>
        )}
        <div style={{
          position: 'absolute', bottom: -5, left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: 10, height: 10,
          background: isLock ? '#1A2F45' : '#0a0a0a',
        }}/>
      </div>
    </div>
  )
}

export function GoalMapMilestoneTile({ state, Icon, label, pct, xp, side, initials }: Props) {
  const c = COLORS[state]
  const isLocked    = state === 'locked'
  const isCompleted = state === 'completed'
  const isCurrent   = state === 'current'
  const pinLabel    = isLocked ? '' : String(Math.round(pct / 10) || 1)
  const TILE = 80

  return (
    <div className={`flex ${side === 'right' ? 'justify-end' : 'justify-start'} w-full`}>
      <div className="flex flex-col items-center gap-2.5" style={{ width: 100 }}>
        <div style={{ position: 'relative', paddingTop: 36, paddingBottom: 18 }}>
          {isCurrent && (
            <div className="tile-pulse" style={{
              position: 'absolute',
              inset: '-4px -4px 8px -4px',
              top: 32,
              borderRadius: TILE * 0.28,
              pointerEvents: 'none',
            }}/>
          )}

          {/* Avatar pin above current tile */}
          {isCurrent && initials && (
            <div className="avatar-bounce" style={{
              position: 'absolute',
              left: '50%', top: 0,
              transform: 'translateX(-50%)',
              width: 36, height: 36,
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              border: '2.5px solid var(--background)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11,
              zIndex: 10,
            }}>
              {initials}
            </div>
          )}

          <PinBalloon label={pinLabel} isLock={isLocked} />

          {/* Chunky tile */}
          <div style={{
            width: TILE, height: TILE,
            borderRadius: TILE * 0.28,
            background: `linear-gradient(160deg, ${c.light} 0%, ${c.face} 75%)`,
            boxShadow: `0 13px 0 ${c.side}, 0 16px 0 rgba(0,0,0,0.25), 0 24px 26px rgba(0,0,0,0.5)`,
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: isLocked ? 0.6 : 1,
            transition: 'opacity 0.4s',
          }}>
            <Icon
              size={isCompleted ? 28 : 26}
              color={isLocked ? 'var(--muted-foreground)' : '#ffffff'}
              strokeWidth={2}
            />
            {isCompleted && <StarPill stars={3} />}
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span style={{
            fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 10,
            color: isCurrent ? 'var(--warning)' : isCompleted ? 'var(--primary)' : 'var(--muted-foreground)',
            textAlign: 'center', lineHeight: 1.2,
          }}>{label}</span>
          {!isLocked && (
            <span style={{
              fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 9,
              color: 'var(--muted-foreground)',
            }}>+{xp} XP</span>
          )}
        </div>
      </div>
    </div>
  )
}
