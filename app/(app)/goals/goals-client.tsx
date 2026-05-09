'use client'

import { useState } from 'react'
import { Plus, Lock, Trophy, Target, Plane, Laptop, Car, Home, BookOpen, Heart, Star } from 'lucide-react'
import { formatUGX } from '@/lib/format'
import type { goals } from '@/lib/schema'
import type { InferSelectModel } from 'drizzle-orm'

type GoalRow = InferSelectModel<typeof goals>

const iconMap: Record<string, React.ElementType> = {
  laptop:  Laptop,
  plane:   Plane,
  car:     Car,
  home:    Home,
  book:    BookOpen,
  heart:   Heart,
  trophy:  Trophy,
  target:  Target,
  star:    Star,
}

function GoalRing({ pct, size = 80 }: { pct: number; size?: number }) {
  const r  = (size - 12) / 2
  const c  = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  return (
    <svg width={size} height={size} className="goal-ring-svg -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={6} className="goal-ring-bg" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} strokeWidth={6}
        className="goal-ring-fill" fill="none"
        strokeDasharray={c} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

function GoalCard({ goal }: { goal: GoalRow }) {
  const pct  = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0
  const Icon = goal.icon ? iconMap[goal.icon] ?? Target : Target

  return (
    <div className="rounded-2xl p-5 cursor-pointer"
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <GoalRing pct={pct} size={72} />
          <span className="absolute inset-0 flex items-center justify-center"
            style={{ color: goal.isCompleted ? 'var(--primary)' : 'var(--muted-foreground)' }}>
            {goal.isCompleted ? <Trophy size={20} /> : <Icon size={18} />}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate" style={{ color: 'var(--foreground)' }}>
              {goal.name}
            </span>
            {goal.isLocked && (
              <Lock size={13} style={{ color: 'var(--warning)', flexShrink: 0 }} />
            )}
            {goal.isCompleted && (
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: 'var(--primary)22', color: 'var(--primary)' }}>
                Done
              </span>
            )}
          </div>

          <div className="mt-1 text-sm font-bold" style={{ color: 'var(--foreground)' }}>
            {formatUGX(goal.currentAmount)}
            <span className="text-xs font-normal ml-1" style={{ color: 'var(--muted-foreground)' }}>
              of {formatUGX(goal.targetAmount)}
            </span>
          </div>

          {goal.targetDate && (
            <div className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Target: {new Date(goal.targetDate).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>

        <div className="shrink-0 text-right">
          <div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{pct}%</div>
        </div>
      </div>
    </div>
  )
}

function GoalMap({ goals: goalList }: { goals: GoalRow[] }) {
  if (goalList.length === 0) return null

  const nodeCount = goalList.length
  const svgWidth  = 320
  const nodeR     = 22
  const stepY     = 120
  const svgHeight = nodeCount * stepY + 60

  const nodes = goalList.map((g, i) => {
    const x     = i % 2 === 0 ? svgWidth * 0.35 : svgWidth * 0.65
    const y     = 50 + i * stepY
    const pct   = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0
    const done  = g.isCompleted
    const Icon  = g.icon ? iconMap[g.icon] ?? Target : Target
    return { g, x, y, pct, done, Icon }
  })

  const pathParts: string[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1]
    const mx = (a.x + b.x) / 2
    pathParts.push(`M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`)
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
      <svg width={svgWidth} height={svgHeight} style={{ display: 'block', margin: '0 auto' }}>
        {/* Path segments */}
        {pathParts.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--border)" strokeWidth={4}
            strokeDasharray="8 6" strokeLinecap="round" />
        ))}

        {/* Nodes */}
        {nodes.map(({ g, x, y, done, Icon }, i) => (
          <g key={g.id}>
            <circle cx={x} cy={y} r={nodeR + 4} fill={done ? 'var(--primary)' : 'var(--card)'}
              stroke={done ? 'var(--primary)' : 'var(--border)'} strokeWidth={3} />
            {done
              ? <Trophy x={x - 11} y={y - 11} size={22} color="white" strokeWidth={1.8} />
              : <Icon   x={x - 10} y={y - 10} size={20} color="var(--muted-foreground)" strokeWidth={1.8} />
            }
            <text x={x} y={y + nodeR + 20} textAnchor="middle"
              style={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 600 }}>
              {g.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

type Tab = 'goals' | 'map'

export function GoalsClient({ data }: { data: GoalRow[] }) {
  const [tab, setTab] = useState<Tab>('goals')

  const active    = data.filter((g) => !g.isCompleted)
  const completed = data.filter((g) => g.isCompleted)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            Goals
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {active.length} active · {completed.length} completed
          </p>
        </div>
        <button
          className="flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
          style={{ background: 'var(--primary)', boxShadow: '0 4px 12px rgba(0,184,148,0.35)' }}>
          <Plus size={16} strokeWidth={2.5} /> New goal
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-full p-1 w-fit" style={{ background: 'var(--surface-alt)' }}>
        {(['goals', 'map'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="rounded-full px-5 py-1.5 text-sm font-medium capitalize transition"
            style={tab === t
              ? { background: 'var(--primary)', color: '#fff' }
              : { color: 'var(--muted-foreground)' }}>
            {t === 'goals' ? 'My Goals' : 'Goal Map'}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl py-16 text-center"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="text-5xl">🎯</div>
          <div>
            <div className="font-semibold" style={{ color: 'var(--foreground)' }}>No goals yet</div>
            <div className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Set a savings goal to start your journey
            </div>
          </div>
          <button className="flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--primary)' }}>
            <Plus size={16} /> Create Goal
          </button>
        </div>
      ) : tab === 'goals' ? (
        <div className="flex flex-col gap-4">
          {active.length > 0 && (
            <div className="flex flex-col gap-3">
              {active.map((g) => <GoalCard key={g.id} goal={g} />)}
            </div>
          )}
          {completed.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="px-1 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--muted-foreground)' }}>
                Completed
              </div>
              {completed.map((g) => <GoalCard key={g.id} goal={g} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl p-6" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)' }}>
          <GoalMap goals={data} />
        </div>
      )}
    </div>
  )
}
