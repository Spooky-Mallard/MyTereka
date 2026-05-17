'use client'

import { useRef, useEffect, useState } from 'react'

const COIN_R = 14
const FLY_DURATION = 600 // ms
const FADE_DELAY   = 400 // ms — start fading 400ms into flight

interface FlyState {
  startX: number
  startY: number
  endX:   number
  endY:   number
}

export function GoalMapCoin({
  coinIndex,
  x,
  y,
  collected,
  reduced,
  onCollect,
}: {
  coinIndex:  number
  x:          number
  y:          number
  collected:  boolean
  reduced:    boolean
  onCollect?: (coinIndex: number) => void
}) {
  const groupRef  = useRef<SVGGElement>(null)
  const flyRef    = useRef<HTMLDivElement>(null)
  const prevCollectedRef = useRef(collected)

  const [flyState, setFlyState]   = useState<FlyState | null>(null)
  const [flying,   setFlying]     = useState(false)

  useEffect(() => {
    const wasCollected = prevCollectedRef.current
    prevCollectedRef.current = collected

    // Only trigger on the transition false → true
    if (!collected || wasCollected) return
    if (reduced) {
      // No animation — just pop XP counter
      popXpCounter()
      return
    }

    const groupEl = groupRef.current
    if (!groupEl) return

    const coinRect   = groupEl.getBoundingClientRect()
    const counterEl  = document.getElementById('goal-map-xp-counter')
    const counterRect = counterEl?.getBoundingClientRect()

    if (!counterRect) { popXpCounter(); return }

    const startX = coinRect.left + coinRect.width  / 2
    const startY = coinRect.top  + coinRect.height / 2
    const endX   = counterRect.left + counterRect.width  / 2
    const endY   = counterRect.top  + counterRect.height / 2

    setFlyState({ startX, startY, endX, endY })
    setFlying(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collected])

  // Once flyState is set, the CSS transition fires automatically via the style change.
  // After FLY_DURATION + a little buffer, clean up and pop the XP counter.
  useEffect(() => {
    if (!flying) return
    const timer = setTimeout(() => {
      setFlying(false)
      setFlyState(null)
      popXpCounter()
      onCollect?.(coinIndex)
    }, FLY_DURATION + 100)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flying])

  return (
    <>
      {/* SVG coin — hidden once collected */}
      <g
        ref={groupRef}
        style={{
          opacity: collected ? 0 : 1,
          animation: collected || reduced
            ? 'none'
            : `float-avatar 2s ease-in-out ${coinIndex * 0.3}s infinite`,
          transformOrigin: `${x}px ${y}px`,
          transformBox: 'fill-box',
          transition: 'opacity 0.2s',
        }}
      >
        <circle
          cx={x} cy={y} r={COIN_R}
          fill="rgba(245,158,11,0.20)"
          stroke="var(--warning)"
          strokeWidth={2}
        />
        <text
          x={x} y={y + 4}
          textAnchor="middle"
          style={{ fill: 'var(--warning)', fontSize: 9, fontWeight: 700 }}
        >
          +10
        </text>
      </g>

      {/* Fixed-position flying overlay — rendered via portal-like fixed div */}
      {flyState && (
        <FlyingCoin
          key={`fly-${coinIndex}`}
          startX={flyState.startX}
          startY={flyState.startY}
          endX={flyState.endX}
          endY={flyState.endY}
          flying={flying}
        />
      )}
    </>
  )
}

function FlyingCoin({ startX, startY, endX, endY, flying }: {
  startX: number; startY: number; endX: number; endY: number; flying: boolean
}) {
  const [active, setActive] = useState(false)

  // Defer to next frame so the initial transform is painted before we switch
  useEffect(() => {
    const id = requestAnimationFrame(() => setActive(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const translateX = active ? endX - startX : 0
  const translateY = active ? endY - startY : 0
  const opacity    = active ? 0 : 1

  return (
    <div
      style={{
        position:  'fixed',
        left:      startX - COIN_R,
        top:       startY - COIN_R,
        width:     COIN_R * 2,
        height:    COIN_R * 2,
        borderRadius: '50%',
        background: 'rgba(245,158,11,0.85)',
        border:    '2px solid var(--warning)',
        display:   'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize:  9,
        fontWeight: 700,
        color:     'var(--warning)',
        pointerEvents: 'none',
        zIndex:    9999,
        transform: `translate(${translateX}px, ${translateY}px) scale(${active ? 0.6 : 1.4})`,
        opacity,
        transition: `transform ${FLY_DURATION}ms ease-in, opacity 200ms ease-in ${FADE_DELAY}ms`,
        willChange: 'transform, opacity',
      }}
    >
      +10
    </div>
  )
}

function popXpCounter() {
  const el = document.getElementById('goal-map-xp-counter')
  if (!el) return
  el.classList.remove('xp-pop')
  // Force reflow so the class removal takes effect before re-adding
  void el.offsetWidth
  el.classList.add('xp-pop')
  setTimeout(() => el.classList.remove('xp-pop'), 800)
}
