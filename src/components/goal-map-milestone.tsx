'use client'

import { useRef, useEffect, useState } from 'react'
import type { MILESTONE_NODES } from './goal-map-canvas'

type MilestoneNode = (typeof MILESTONE_NODES)[number] & { x: number; y: number }

const NODE_R      = 24
const MILESTONE_R = 32
const PULSE_DURATION = 4000 // ms — 2 cycles of the 2s keyframe

export function GoalMapMilestoneNode({
  node,
  earned,
  isCompleted,
  reduced,
  onFirstEarn,
}: {
  node:        MilestoneNode
  earned:      boolean
  isCompleted: boolean
  reduced:     boolean
  onFirstEarn: (node: MilestoneNode) => void
}) {
  const circleRef      = useRef<SVGCircleElement>(null)
  const prevEarnedRef  = useRef(earned)
  const [pulsing, setPulsing] = useState(false)

  const isStart = node.key === 'start'
  const isEnd   = node.key === '100'
  const r       = isStart || isEnd ? MILESTONE_R : NODE_R + 4
  const NodeIcon = node.Icon

  useEffect(() => {
    const wasEarned = prevEarnedRef.current
    prevEarnedRef.current = earned

    // Only trigger on transition false → true, and not for start node
    if (!earned || wasEarned || isStart) return

    if (!reduced) {
      setPulsing(true)
      const timer = setTimeout(() => {
        setPulsing(false)
        onFirstEarn(node)
      }, PULSE_DURATION)
      return () => clearTimeout(timer)
    } else {
      // Skip pulse, show modal immediately
      onFirstEarn(node)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earned])

  const effectiveEarned = earned || isStart || (isCompleted && isEnd)

  return (
    <g>
      {!isStart && (
        <circle
          cx={node.x} cy={node.y}
          r={r + 8}
          fill="none"
          stroke={effectiveEarned ? 'var(--warning)' : 'var(--border)'}
          strokeWidth={2}
          opacity={effectiveEarned ? 0.5 : 0.2}
        />
      )}
      <circle
        ref={circleRef}
        cx={node.x} cy={node.y} r={r}
        fill={effectiveEarned ? 'var(--primary)' : 'var(--surface-alt)'}
        stroke={effectiveEarned ? 'var(--primary-light)' : 'var(--border)'}
        strokeWidth={2.5}
        className={pulsing ? 'goal-map-node-active' : undefined}
        style={{ transformOrigin: `${node.x}px ${node.y}px`, transformBox: 'fill-box' }}
      />
      <foreignObject
        x={node.x - 12} y={node.y - 12}
        width={24} height={24}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <NodeIcon
          size={22}
          color={effectiveEarned ? '#ffffff' : 'var(--muted-foreground)'}
          strokeWidth={1.8}
        />
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
}
