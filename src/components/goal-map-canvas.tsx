'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Flag, Sprout, Zap, Flame, Star, Trophy } from 'lucide-react'

// ─── constants ───────────────────────────────────────────────────────────────

export const MILESTONE_NODES = [
  { key: 'start', pct: 0,   label: 'Start',        Icon: Flag,   xp: 0,   badge: null           },
  { key: '10',    pct: 10,  label: 'Early Mover',  Icon: Sprout, xp: 20,  badge: 'milestone_10'  },
  { key: '25',    pct: 25,  label: 'Quarter Way',  Icon: Zap,    xp: 30,  badge: 'milestone_25'  },
  { key: '50',    pct: 50,  label: 'Halfway',      Icon: Flame,  xp: 50,  badge: 'milestone_50'  },
  { key: '75',    pct: 75,  label: 'Almost There', Icon: Star,   xp: 75,  badge: 'milestone_75'  },
  { key: '100',   pct: 100, label: 'Goal Complete',Icon: Trophy, xp: 100, badge: 'goal_completed' },
] as const

export const COIN_PCTS = [5, 17.5, 37.5, 62.5, 87.5] as const

const NODE_SPACING_Y  = 150
const NODE_R          = 24
const MILESTONE_R     = 32
const COIN_R          = 14
const PADDING_X       = 60
const PADDING_TOP     = 50
const PADDING_BOTTOM  = 70
const ANIM_DURATION   = 1200 // ms

// ─── hooks ───────────────────────────────────────────────────────────────────

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

function nodeCoords(w: number) {
  const total = MILESTONE_NODES.length
  const svgHeight = (total - 1) * NODE_SPACING_Y + PADDING_TOP + PADDING_BOTTOM
  const nodes = MILESTONE_NODES.map((m, i) => {
    const x = i % 2 === 0
      ? PADDING_X + (w - 2 * PADDING_X) * 0.25
      : PADDING_X + (w - 2 * PADDING_X) * 0.75
    const y = PADDING_TOP + (total - 1 - i) * NODE_SPACING_Y
    return { ...m, x, y }
  })
  return { nodes, svgHeight }
}

function buildPathD(nodes: { x: number; y: number }[]) {
  let d = `M ${nodes[0].x} ${nodes[0].y}`
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1]
    const mx = (a.x + b.x) / 2
    d += ` C ${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`
  }
  return d
}

// ─── component ───────────────────────────────────────────────────────────────

export function GoalMapCanvas({
  currentPct,
  earnedMilestones,
  collectedCoins,
  isCompleted,
}: {
  currentPct:       number
  earnedMilestones: string[]
  collectedCoins:   number[]
  isCompleted:      boolean
}) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const fillPathRef    = useRef<SVGPathElement>(null)
  const avatarGroupRef = useRef<SVGGElement>(null)
  const avatarRef      = useRef<SVGCircleElement>(null)

  const [width, setWidth]           = useState(320)
  const [totalLength, setTotalLength] = useState(0)

  // animated pct — what the avatar currently displays
  const [displayPct, setDisplayPct]   = useState(currentPct)
  const [displayPos, setDisplayPos]   = useState<{ x: number; y: number } | null>(null)

  // refs for RAF
  const rafRef      = useRef<number | undefined>(undefined)
  const startRef    = useRef<number | undefined>(undefined)
  const fromPctRef  = useRef(currentPct)
  const toPctRef    = useRef(currentPct)

  const reduced = usePrefersReducedMotion()

  // ── resize observer ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setWidth(Math.min(entries[0]?.contentRect.width ?? 320, 480))
    })
    ro.observe(el)
    setWidth(Math.min(el.offsetWidth, 480))
    return () => ro.disconnect()
  }, [])

  const { nodes, svgHeight } = nodeCoords(width)
  const pathD = buildPathD(nodes)

  // ── cache total length after path renders ────────────────────────────────
  useEffect(() => {
    const path = fillPathRef.current
    if (!path) return
    const len = path.getTotalLength()
    setTotalLength(len)
  }, [width, pathD])

  // ── helper: pct → SVG point ──────────────────────────────────────────────
  const pctToPoint = useCallback((pct: number) => {
    const path = fillPathRef.current
    if (!path || totalLength === 0) return null
    return path.getPointAtLength(totalLength * (pct / 100))
  }, [totalLength])

  // ── initial avatar placement (no animation) ──────────────────────────────
  useEffect(() => {
    if (totalLength === 0) return
    const pt = pctToPoint(currentPct)
    if (pt) setDisplayPos({ x: pt.x, y: pt.y })
    setDisplayPct(currentPct)
    fromPctRef.current = currentPct
    toPctRef.current   = currentPct
  // only on totalLength change (width change) — not on every currentPct change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalLength])

  // ── animated movement when currentPct changes ────────────────────────────
  useEffect(() => {
    if (totalLength === 0) return
    const from = fromPctRef.current
    const to   = currentPct
    if (from === to) return

    toPctRef.current = to

    // cancel any in-progress animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = undefined

    if (reduced) {
      // snap instantly
      const pt = pctToPoint(to)
      if (pt) setDisplayPos({ x: pt.x, y: pt.y })
      setDisplayPct(to)
      fromPctRef.current = to
      return
    }

    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now
      const elapsed = now - startRef.current
      const t = Math.min(elapsed / ANIM_DURATION, 1)
      const eased = easeInOut(t)

      const animPct = from + (to - from) * eased
      // exact curve-following: interpolate getPointAtLength over sub-range
      const fromLen = totalLength * (from / 100)
      const toLen   = totalLength * (to   / 100)
      const pt = fillPathRef.current?.getPointAtLength(fromLen + (toLen - fromLen) * eased)
      if (pt) setDisplayPos({ x: pt.x, y: pt.y })
      setDisplayPct(Math.round(animPct))

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromPctRef.current = to
        // scroll avatar into view after animation completes
        avatarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPct, totalLength, reduced])

  // ── scroll avatar into view on initial load ──────────────────────────────
  useEffect(() => {
    if (!displayPos) return
    avatarRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
  // only on first render after pos is set
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!displayPos])

  const earnedSet    = new Set(earnedMilestones)
  const collectedSet = new Set(collectedCoins)

  const dashOffset = totalLength > 0 ? totalLength * (1 - currentPct / 100) : undefined

  // coin positions (computed after totalLength known)
  const coinPositions = COIN_PCTS.map((coinPct) => pctToPoint(coinPct))

  return (
    <div
      ref={containerRef}
      className="w-full overflow-y-auto rounded-2xl"
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)', maxHeight: '70vh' }}
    >
      <svg
        width={width}
        height={svgHeight}
        style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
      >
        {/* ── background track ── */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ── completed fill (dashoffset CSS transition) ── */}
        <path
          ref={fillPathRef}
          d={pathD}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={totalLength || undefined}
          strokeDashoffset={dashOffset}
          style={{
            transition: reduced ? 'none' : 'stroke-dashoffset 1.2s ease-in-out',
          }}
        />

        {/* ── milestone nodes ── */}
        {nodes.map((node) => {
          const isStart  = node.key === 'start'
          const isEnd    = node.key === '100'
          const earned   = earnedSet.has(node.key) || isStart || (isCompleted && isEnd)
          const r        = isStart || isEnd ? MILESTONE_R : NODE_R + 4
          const NodeIcon = node.Icon

          return (
            <g key={node.key}>
              {!isStart && (
                <circle
                  cx={node.x} cy={node.y}
                  r={r + 8}
                  fill="none"
                  stroke={earned ? 'var(--warning)' : 'var(--border)'}
                  strokeWidth={2}
                  opacity={earned ? 0.5 : 0.2}
                />
              )}
              <circle
                cx={node.x} cy={node.y} r={r}
                fill={earned ? 'var(--primary)' : 'var(--surface-alt)'}
                stroke={earned ? 'var(--primary-light)' : 'var(--border)'}
                strokeWidth={2.5}
              />
              <foreignObject
                x={node.x - 12} y={node.y - 12}
                width={24} height={24}
                style={{ overflow: 'visible', pointerEvents: 'none' }}
              >
                <NodeIcon size={22} color={earned ? '#ffffff' : 'var(--muted-foreground)'} strokeWidth={1.8} />
              </foreignObject>
              <text
                x={node.x} y={node.y + r + 18}
                textAnchor="middle"
                style={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}
              >
                {node.label}
              </text>
              {node.xp > 0 && (
                <text
                  x={node.x} y={node.y + r + 31}
                  textAnchor="middle"
                  style={{ fill: 'var(--warning)', fontSize: 10, fontWeight: 500 }}
                >
                  +{node.xp} XP
                </text>
              )}
            </g>
          )
        })}

        {/* ── XP coins ── */}
        {COIN_PCTS.map((_, idx) => {
          const collected = collectedSet.has(idx)
          const pos = coinPositions[idx]
          if (!pos) return null
          return (
            <g
              key={idx}
              style={{
                opacity: collected ? 0 : 1,
                animation: collected || reduced
                  ? 'none'
                  : `float-avatar 2s ease-in-out ${idx * 0.3}s infinite`,
                transformOrigin: `${pos.x}px ${pos.y}px`,
                transformBox: 'fill-box',
              }}
            >
              <circle
                cx={pos.x} cy={pos.y} r={COIN_R}
                fill="rgba(245,158,11,0.20)"
                stroke="var(--warning)"
                strokeWidth={2}
              />
              <text
                x={pos.x} y={pos.y + 4}
                textAnchor="middle"
                style={{ fill: 'var(--warning)', fontSize: 9, fontWeight: 700 }}
              >
                +10
              </text>
            </g>
          )
        })}

        {/* ── avatar ── */}
        {displayPos && (
          <g ref={avatarGroupRef}>
            <circle
              cx={displayPos.x} cy={displayPos.y + 3}
              r={NODE_R - 2}
              fill="rgba(0,0,0,0.25)"
            />
            <circle
              cx={displayPos.x} cy={displayPos.y}
              r={NODE_R}
              fill="white"
            />
            <circle
              ref={avatarRef}
              cx={displayPos.x} cy={displayPos.y}
              r={NODE_R - 3}
              fill="var(--primary)"
            />
            <text
              x={displayPos.x} y={displayPos.y + 5}
              textAnchor="middle"
              style={{ fill: '#ffffff', fontSize: 10, fontWeight: 700 }}
            >
              {displayPct}%
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
