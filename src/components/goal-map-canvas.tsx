'use client'

import { useRef, useEffect, useState } from 'react'
import {
  Flag, Sprout, Zap, Flame, Star, Trophy,
} from 'lucide-react'

// ─── constants ──────────────────────────────────────────────────────────────

export const MILESTONE_NODES = [
  { key: 'start', pct: 0,   label: 'Start',        Icon: Flag,    xp: 0,   badge: null          },
  { key: '10',    pct: 10,  label: 'Early Mover',  Icon: Sprout,  xp: 20,  badge: 'milestone_10' },
  { key: '25',    pct: 25,  label: 'Quarter Way',  Icon: Zap,     xp: 30,  badge: 'milestone_25' },
  { key: '50',    pct: 50,  label: 'Halfway',      Icon: Flame,   xp: 50,  badge: 'milestone_50' },
  { key: '75',    pct: 75,  label: 'Almost There', Icon: Star,    xp: 75,  badge: 'milestone_75' },
  { key: '100',   pct: 100, label: 'Goal Complete',Icon: Trophy,  xp: 100, badge: 'goal_completed' },
] as const

export const COIN_PCTS = [5, 17.5, 37.5, 62.5, 87.5] as const

const NODE_SPACING_Y = 150
const NODE_R = 24
const MILESTONE_R = 32
const COIN_R = 14
const PADDING_X = 60
const PADDING_TOP = 50
const PADDING_BOTTOM = 70

// ─── helpers ────────────────────────────────────────────────────────────────

function nodeCoords(w: number) {
  const totalNodes = MILESTONE_NODES.length
  const svgHeight = (totalNodes - 1) * NODE_SPACING_Y + PADDING_TOP + PADDING_BOTTOM

  // node[0] = start = bottom, node[5] = goal = top
  // In SVG: y increases downward. Bottom = high y, top = low y.
  const nodes = MILESTONE_NODES.map((m, i) => {
    const x = i % 2 === 0
      ? PADDING_X + (w - 2 * PADDING_X) * 0.25
      : PADDING_X + (w - 2 * PADDING_X) * 0.75
    // index 0 at bottom (high y), index 5 at top (low y)
    const y = PADDING_TOP + (totalNodes - 1 - i) * NODE_SPACING_Y
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

// Linearly interpolate point on path between two pct values
function pctToPathPct(pct: number) {
  // path goes from node[0] (pct=0) at path start to node[5] (pct=100) at path end
  return pct / 100
}

// ─── component ──────────────────────────────────────────────────────────────

export function GoalMapCanvas({
  currentPct,
  earnedMilestones,
  collectedCoins,
  isCompleted,
}: {
  currentPct:      number
  earnedMilestones: string[]
  collectedCoins:  number[]
  isCompleted:     boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackPathRef = useRef<SVGPathElement>(null)
  const avatarRef    = useRef<SVGCircleElement>(null)
  const [width, setWidth] = useState(320)
  const [totalLength, setTotalLength] = useState(0)
  const [avatarPos, setAvatarPos] = useState<{ x: number; y: number } | null>(null)

  const earnedSet    = new Set(earnedMilestones)
  const collectedSet = new Set(collectedCoins)

  // measure container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 320
      setWidth(Math.min(w, 480))
    })
    ro.observe(el)
    setWidth(Math.min(el.offsetWidth, 480))
    return () => ro.disconnect()
  }, [])

  const { nodes, svgHeight } = nodeCoords(width)
  const pathD = buildPathD(nodes)

  // cache path length + compute initial avatar pos after mount
  useEffect(() => {
    const path = trackPathRef.current
    if (!path) return
    const len = path.getTotalLength()
    setTotalLength(len)
    const t = pctToPathPct(currentPct)
    const pt = path.getPointAtLength(len * t)
    setAvatarPos({ x: pt.x, y: pt.y })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, pathD])

  // update avatar position when pct changes (no animation yet — Phase 4)
  useEffect(() => {
    const path = trackPathRef.current
    if (!path || totalLength === 0) return
    const t = pctToPathPct(currentPct)
    const pt = path.getPointAtLength(totalLength * t)
    setAvatarPos({ x: pt.x, y: pt.y })
  }, [currentPct, totalLength])

  // scroll avatar into view on load
  useEffect(() => {
    avatarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [avatarPos])

  // coin positions — computed from path
  function getCoinPos(coinPct: number): { x: number; y: number } | null {
    const path = trackPathRef.current
    if (!path || totalLength === 0) return null
    const t = pctToPathPct(coinPct)
    const pt = path.getPointAtLength(totalLength * t)
    return { x: pt.x, y: pt.y }
  }

  const dashOffset = totalLength > 0 ? totalLength * (1 - currentPct / 100) : 0

  return (
    <div ref={containerRef} className="w-full overflow-y-auto rounded-2xl"
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)', maxHeight: '70vh' }}>
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

        {/* ── completed fill ── */}
        <path
          ref={trackPathRef}
          d={pathD}
          fill="none"
          stroke={isCompleted ? 'var(--primary)' : 'var(--primary)'}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={totalLength || undefined}
          strokeDashoffset={dashOffset || undefined}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />

        {/* ── milestone nodes ── */}
        {nodes.map((node) => {
          const isStart    = node.key === 'start'
          const isEnd      = node.key === '100'
          const earned     = earnedSet.has(node.key) || isStart || (isCompleted && isEnd)
          const r          = isStart || isEnd ? MILESTONE_R : NODE_R + 4
          const NodeIcon   = node.Icon

          return (
            <g key={node.key}>
              {/* glow ring for milestone (not start) */}
              {!isStart && (
                <circle
                  cx={node.x} cy={node.y}
                  r={r + 8}
                  fill="none"
                  stroke={earned ? 'var(--warning)' : 'var(--border)'}
                  strokeWidth={2}
                  opacity={earned ? 0.5 : 0.25}
                />
              )}

              {/* main circle */}
              <circle
                cx={node.x} cy={node.y}
                r={r}
                fill={earned ? 'var(--primary)' : 'var(--surface-alt)'}
                stroke={earned ? 'var(--primary-light)' : 'var(--border)'}
                strokeWidth={2.5}
              />

              {/* icon */}
              <foreignObject
                x={node.x - 12} y={node.y - 12}
                width={24} height={24}
                style={{ overflow: 'visible', pointerEvents: 'none' }}
              >
                <NodeIcon
                  size={22}
                  color={earned ? '#ffffff' : 'var(--muted-foreground)'}
                  strokeWidth={1.8}
                />
              </foreignObject>

              {/* label */}
              <text
                x={node.x}
                y={node.y + r + 18}
                textAnchor="middle"
                style={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}
              >
                {node.label}
              </text>

              {/* XP label below milestone label */}
              {node.xp > 0 && (
                <text
                  x={node.x}
                  y={node.y + r + 31}
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
        {COIN_PCTS.map((coinPct, idx) => {
          const collected = collectedSet.has(idx)
          const pos = getCoinPos(coinPct)
          if (!pos) return null
          return (
            <g
              key={idx}
              style={{
                opacity: collected ? 0 : 1,
                animation: collected ? 'none' : `float-avatar 2s ease-in-out ${idx * 0.3}s infinite`,
                transformOrigin: `${pos.x}px ${pos.y}px`,
                transformBox: 'fill-box',
              }}
            >
              <circle
                cx={pos.x} cy={pos.y}
                r={COIN_R}
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
        {avatarPos && (
          <g>
            {/* shadow */}
            <circle
              cx={avatarPos.x} cy={avatarPos.y + 3}
              r={NODE_R - 2}
              fill="rgba(0,0,0,0.25)"
            />
            {/* white border */}
            <circle
              cx={avatarPos.x} cy={avatarPos.y}
              r={NODE_R}
              fill="white"
            />
            {/* teal fill */}
            <circle
              ref={avatarRef}
              cx={avatarPos.x} cy={avatarPos.y}
              r={NODE_R - 3}
              fill="var(--primary)"
            />
            {/* avatar label — percent text */}
            <text
              x={avatarPos.x} y={avatarPos.y + 5}
              textAnchor="middle"
              style={{ fill: '#ffffff', fontSize: 10, fontWeight: 700 }}
            >
              {currentPct}%
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
