'use client'

import { Flag, Sprout, Zap, Flame, Star, Trophy } from 'lucide-react'
import { formatUGX } from '@/lib/format'

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
  goalName?:        string
  targetAmount?:    number
  currentAmount?:   number
  userInitials?:    string
}

// Zigzag x positions for the path
const TILE_XS = [80, 230, 80, 230, 80, 230] as const

// Road stone between two milestones
function RoadStone({ x, y, tone }: { x: number; y: number; tone: 'a' | 'b' | 'c' }) {
  const colors = {
    a: 'rgba(0,184,148,0.4)',
    b: 'rgba(245,158,11,0.4)',
    c: 'rgba(94,128,168,0.35)',
  }
  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width: 28, height: 16,
      transform: 'translate(-50%, -50%)',
      background: colors[tone],
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      pointerEvents: 'none',
    }}/>
  )
}

// Atmospheric ground rhombus
function GroundRhombus({ x, y, tone, size }: { x: number; y: number; tone: 'a' | 'b'; size: number }) {
  const colors = { a: 'rgba(45,74,107,0.4)', b: 'rgba(36,59,85,0.5)' }
  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width: size, height: size * 0.55,
      transform: 'translate(-50%, -50%)',
      background: colors[tone],
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      pointerEvents: 'none',
    }}/>
  )
}

// Coin / bill / slime sprite
function CoinSprite({ x, y, kind }: { x: number; y: number; kind: 'coin' | 'bill' | 'slime' }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
    }}>
      {kind === 'coin' && (
        <svg width="38" height="38" viewBox="0 0 40 40">
          <ellipse cx="20" cy="32" rx="13" ry="3" fill="rgba(0,0,0,0.4)"/>
          <circle cx="20" cy="20" r="12" fill="#F2C94C" stroke="#b8861a" strokeWidth="2"/>
          <circle cx="20" cy="20" r="8" fill="none" stroke="#d4a32f" strokeWidth="1.5"/>
          <text x="20" y="25" textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="10" fill="#7a5a0d">U</text>
        </svg>
      )}
      {kind === 'bill' && (
        <svg width="40" height="40" viewBox="0 0 40 40">
          <ellipse cx="20" cy="32" rx="12" ry="2.5" fill="rgba(0,0,0,0.35)"/>
          <rect x="6" y="14" width="28" height="16" rx="2" fill="#10B981" stroke="#0a8a5e" strokeWidth="1.5"/>
          <circle cx="20" cy="22" r="4" fill="none" stroke="#0a8a5e" strokeWidth="1.2"/>
          <text x="20" y="25" textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="6" fill="#0a8a5e">UGX</text>
        </svg>
      )}
      {kind === 'slime' && (
        <svg width="34" height="34" viewBox="0 0 40 40">
          <ellipse cx="20" cy="34" rx="12" ry="2" fill="rgba(0,0,0,0.35)"/>
          <path d="M8 22 C 8 13, 32 13, 32 22 L 32 30 C 32 32, 28 33, 26 31 C 24 33, 20 33, 18 31 C 16 33, 12 33, 10 31 C 8 33, 6 31, 6 30 Z" fill="#7B61FF"/>
          <circle cx="15" cy="22" r="2" fill="#fff"/>
          <circle cx="25" cy="22" r="2" fill="#fff"/>
        </svg>
      )}
    </div>
  )
}

// Region banner label
function RegionBanner({ y, label, kicker }: { y: number; label: string; kicker: string }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: y,
      transform: 'translateY(-50%)',
      display: 'flex', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 5,
    }}>
      <div style={{
        background: 'rgba(13,33,55,0.88)',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(0,184,148,0.35)',
        borderRadius: 9999,
        padding: '5px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          fontFamily: 'Poppins, sans-serif', fontSize: 9, fontWeight: 700,
          color: 'var(--primary)', letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>{kicker}</span>
        <div style={{ width: 3, height: 3, borderRadius: 9999, background: 'var(--muted-foreground)' }}/>
        <span style={{
          fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 700, color: '#fff',
        }}>{label}</span>
      </div>
    </div>
  )
}

export function GoalMapTileCanvas({ currentPct, earnedMilestones, goalName, targetAmount, currentAmount, userInitials }: Props) {
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

  // Layout constants — each milestone row = 170px tall
  const ROW_H = 170
  const CONTENT_HEIGHT = ROW_H * MILESTONE_NODES.length + 120

  // Tile positions (bottom-anchored: last milestone at bottom, scroll up to flag)
  // Node 0 = bottom, node 5 = top
  const tilePositions = MILESTONE_NODES.map((_, i) => {
    const rev = MILESTONE_NODES.length - 1 - i
    return {
      y: 80 + rev * ROW_H,
      x: TILE_XS[i],
    }
  })

  // Road stones between consecutive milestones
  const roads: { x: number; y: number; tone: 'a' | 'b' | 'c' }[] = []
  for (let i = 0; i < tilePositions.length - 1; i++) {
    const a = tilePositions[i]
    const b = tilePositions[i + 1]
    const tone: 'a' | 'b' | 'c' = i < 2 ? 'a' : i < 4 ? 'b' : 'c'
    const STEPS = 5
    for (let s = 1; s < STEPS; s++) {
      const f = s / STEPS
      roads.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, tone })
    }
  }

  // Ground rhombuses (seeded, deterministic)
  const ground = Array.from({ length: 55 }, (_, i) => {
    const seed = i * 137.508
    return {
      x: ((seed * 13) % 320) + 10,
      y: ((seed * 7) % CONTENT_HEIGHT),
      tone: (i % 2 === 0 ? 'a' : 'b') as 'a' | 'b',
      size: 28 + (i % 5) * 10,
    }
  })

  // Decorative sprites
  const sprites: { x: number; y: number; kind: 'coin' | 'bill' | 'slime' }[] = [
    { x: 280, y: tilePositions[0].y + 80,  kind: 'coin' },
    { x:  50, y: tilePositions[1].y - 60,  kind: 'bill' },
    { x: 295, y: tilePositions[1].y + 80,  kind: 'slime' },
    { x:  45, y: tilePositions[2].y - 60,  kind: 'coin' },
    { x: 290, y: tilePositions[3].y - 60,  kind: 'bill' },
    { x:  40, y: tilePositions[3].y + 80,  kind: 'slime' },
    { x: 285, y: tilePositions[4].y - 60,  kind: 'coin' },
    { x:  50, y: tilePositions[5].y + 60,  kind: 'bill' },
  ]

  const FLAG_X = 155, FLAG_Y = 40
  const pct = Math.min(100, currentPct)
  const pctLabel = targetAmount && currentAmount != null
    ? `${pct}% · ${formatUGX(currentAmount)} / ${formatUGX(targetAmount)}`
    : `${pct}%`

  // Region banners at 1/3 and 2/3 of the map height
  const bannerY1 = CONTENT_HEIGHT * 0.7
  const bannerY2 = CONTENT_HEIGHT * 0.35

  return (
    <div style={{
      width: '100%',
      maxWidth: 340,
      margin: '0 auto',
      height: '70vh',
      minHeight: 420,
      maxHeight: 680,
      position: 'relative',
      borderRadius: 'var(--radius-2xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
    }}>
      {/* Corner banner (sticky) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, zIndex: 30,
        width: 170, height: 90,
        background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 70%)',
        clipPath: 'polygon(0 0, 100% 0, 65% 50%, 0 100%)',
        padding: '12px 10px 12px 12px',
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 9, color: '#fff', letterSpacing: '0.16em', textShadow: '0 1px 0 rgba(0,0,0,0.18)' }}>
          GOAL MAP
        </div>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 15, color: '#fff', lineHeight: 1.1, marginTop: 2, textShadow: '0 1px 0 rgba(0,0,0,0.18)' }}>
          {goalName ?? 'Quest'}
        </div>
        <div style={{ fontFamily: 'Nunito Sans, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.9)', fontWeight: 700, marginTop: 3 }}>
          {pctLabel}
        </div>
      </div>

      {/* Scrolling map */}
      <div style={{
        width: '100%', height: '100%',
        overflowY: 'auto', overflowX: 'hidden',
        position: 'relative',
        background: 'radial-gradient(ellipse at center top, #11304a 0%, #0a1c2f 60%, #050e1c 100%)',
      }}>
        <div style={{ position: 'relative', height: CONTENT_HEIGHT, width: '100%' }}>
          {/* Ground atmosphere */}
          {ground.map((g, i) => (
            <GroundRhombus key={`g${i}`} {...g} />
          ))}

          {/* Soft glow center */}
          <div style={{
            position: 'absolute', left: 30, right: 30, top: 0, bottom: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(0,184,148,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}/>

          {/* Region banners */}
          <RegionBanner y={bannerY1} kicker="Region 1" label="First savings"/>
          <RegionBanner y={bannerY2} kicker="Region 2" label="Final stretch"/>

          {/* Road stones */}
          {roads.map((r, i) => (
            <RoadStone key={`r${i}`} {...r} />
          ))}

          {/* Decorative sprites */}
          {sprites.map((s, i) => (
            <CoinSprite key={`s${i}`} {...s} />
          ))}

          {/* Goal flag at top */}
          <div style={{
            position: 'absolute',
            left: FLAG_X, top: FLAG_Y - 20,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 20,
          }}>
            <div style={{ position: 'relative', width: 56, height: 90 }}>
              <div style={{
                position: 'absolute', left: '50%', top: 12, bottom: 0,
                width: 4, transform: 'translateX(-50%)',
                background: 'linear-gradient(180deg, #C9D2DA, #6b7a88)',
                borderRadius: 2,
              }}/>
              <div style={{
                position: 'absolute', left: '50%', top: 6,
                width: 52, height: 32,
                background: 'var(--primary)',
                clipPath: 'polygon(0 0, 100% 0, 75% 50%, 100% 100%, 0 100%)',
                display: 'flex', alignItems: 'center',
                paddingLeft: 8,
                fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 9,
                color: '#fff', letterSpacing: '0.04em',
                boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
              }}>
                GOAL!
              </div>
            </div>
            {targetAmount && (
              <div style={{
                textAlign: 'center', marginTop: 4,
                fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--primary)',
              }}>{formatUGX(targetAmount)}</div>
            )}
          </div>

          {/* Milestone tiles (reversed: index 0 at bottom) */}
          {nodes.map((node, i) => {
            const pos = tilePositions[i]
            const isRight = node.side === 'right'
            return (
              <div key={node.key} style={{
                position: 'absolute',
                left: isRight ? 'auto' : pos.x - 50,
                right: isRight ? 340 - pos.x - 50 : 'auto',
                top: pos.y,
                transform: 'translateY(-50%)',
                zIndex: 10 + i,
                width: 100,
              }}>
                <div className="flex flex-col items-center gap-2.5">
                  <div style={{ position: 'relative', paddingTop: 40, paddingBottom: 20 }}>
                    {node.state === 'current' && (
                      <div className="tile-pulse" style={{
                        position: 'absolute',
                        inset: '-4px',
                        top: 36,
                        borderRadius: 80 * 0.28,
                        pointerEvents: 'none',
                      }}/>
                    )}

                    {node.state === 'current' && userInitials && (
                      <div className="avatar-bounce" style={{
                        position: 'absolute',
                        left: '50%', top: 4,
                        transform: 'translateX(-50%)',
                        width: 32, height: 32,
                        borderRadius: '50%',
                        background: 'var(--gradient-primary)',
                        border: '2.5px solid #0a1c2f',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff',
                        fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 10,
                        zIndex: 20,
                      }}>
                        {userInitials}
                      </div>
                    )}

                    {/* Pin balloon */}
                    <div style={{
                      position: 'absolute',
                      left: '50%', top: 8,
                      transform: 'translate(-50%, 0)',
                      pointerEvents: 'none',
                    }}>
                      <div style={{
                        position: 'relative',
                        width: 30, height: 30,
                        background: node.state === 'locked' ? '#1A2F45' : '#0a0a0a',
                        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff',
                        fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 12,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                      }}>
                        {node.state === 'locked' ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        ) : (
                          <span>{i + 1}</span>
                        )}
                        <div style={{
                          position: 'absolute', bottom: -4, left: '50%',
                          transform: 'translateX(-50%) rotate(45deg)',
                          width: 9, height: 9,
                          background: node.state === 'locked' ? '#1A2F45' : '#0a0a0a',
                        }}/>
                      </div>
                    </div>

                    {/* Tile face */}
                    {(() => {
                      const c = node.state === 'completed'
                        ? { face: '#00B894', light: '#1DD1A1', side: '#007a60' }
                        : node.state === 'current'
                        ? { face: '#F59E0B', light: '#FBBF24', side: '#b8730a' }
                        : { face: '#1A2F45', light: '#243B55', side: '#0A1929' }
                      const NodeIcon = node.Icon
                      return (
                        <div style={{
                          width: 80, height: 80,
                          borderRadius: 80 * 0.28,
                          background: `linear-gradient(160deg, ${c.light} 0%, ${c.face} 75%)`,
                          boxShadow: `0 13px 0 ${c.side}, 0 16px 0 rgba(0,0,0,0.25), 0 24px 26px rgba(0,0,0,0.5)`,
                          position: 'relative',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: node.state === 'locked' ? 0.6 : 1,
                          transition: 'opacity 0.4s',
                        }}>
                          <NodeIcon size={28} color={node.state === 'locked' ? 'var(--muted-foreground)' : '#ffffff'} strokeWidth={2}/>
                          {node.state === 'completed' && (
                            <div style={{
                              position: 'absolute', left: '50%', top: '60%',
                              transform: 'translate(-50%, -50%)',
                              background: '#F2C94C', borderRadius: 9999,
                              padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 2,
                              boxShadow: '0 2px 0 rgba(0,0,0,0.18)',
                            }}>
                              {[0,1,2].map(si => (
                                <svg key={si} width="9" height="9" viewBox="0 0 24 24" fill="#fff">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Label */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 10,
                      color: node.state === 'current' ? 'var(--warning)' : node.state === 'completed' ? 'var(--primary)' : 'var(--muted-foreground)',
                    }}>{node.label}</div>
                    {node.state !== 'locked' && (
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 9, color: 'var(--muted-foreground)' }}>
                        +{node.xp} XP
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
