"use client";

import { useState } from "react";
import { formatCurrency, mockGoals, mockGroupSavings, mockUser } from "@/lib/mock-data";
import { Plus, Lock, Users, Trophy, Star } from "lucide-react";

/* ── Circular progress ring ── */
const RING_R = 42;
const RING_C = 2 * Math.PI * RING_R;

function GoalRing({ pct }: { pct: number }) {
  const offset = RING_C * (1 - pct / 100);
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="goal-ring-svg">
      <circle cx="48" cy="48" r={RING_R} strokeWidth="8" className="goal-ring-bg" />
      <circle cx="48" cy="48" r={RING_R} strokeWidth="8"
        strokeDasharray={RING_C} strokeDashoffset={offset} className="goal-ring-fill" />
    </svg>
  );
}

/* ── Duolingo-style goal map ── */
function GoalMap() {
  const allGoals = mockGoals;
  const avatarIndex = allGoals.findIndex((g) => g.current < g.target);
  const activeIndex = avatarIndex === -1 ? allGoals.length : avatarIndex;

  /* SVG path: weaving vertical path with alternating left/right nodes */
  const NODE_X_LEFT  = 80;
  const NODE_X_RIGHT = 240;
  const NODE_Y_START = 60;
  const NODE_SPACING = 120;
  const WIDTH = 320;

  const nodes = allGoals.map((g, i) => ({
    ...g,
    x: i % 2 === 0 ? NODE_X_RIGHT : NODE_X_LEFT,
    y: NODE_Y_START + i * NODE_SPACING,
    done: g.current >= g.target,
    active: i === activeIndex,
  }));

  /* Build a serpentine path through nodes */
  const totalH = NODE_Y_START + allGoals.length * NODE_SPACING + 60;
  let pathD = `M ${nodes[0].x} ${nodes[0].y}`;
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];
    const midY = (prev.y + curr.y) / 2;
    pathD += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
  }

  return (
    <div
      className="relative overflow-y-auto rounded-2xl p-4"
      style={{
        background: "var(--card)",
        boxShadow: "var(--shadow-card)",
        maxHeight: 520,
      }}
    >
      <div className="mb-3 flex items-center justify-between px-2">
        <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Your Journey</h3>
        <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--warning)" }}>
          <Star size={14} />
          <span className="font-medium">{mockUser.level}</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${totalH}`}
        width="100%"
        style={{ display: "block" }}
      >
        {/* Path */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--border)"
          strokeWidth="3"
          strokeDasharray="8 6"
        />
        <path
          d={pathD}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeDasharray="8 6"
          strokeDashoffset={0}
          opacity={0.4}
        />

        {/* Nodes */}
        {nodes.map((node, i) => (
          <g key={node.id}>
            {/* Outer glow for active */}
            {node.active && (
              <circle
                cx={node.x}
                cy={node.y}
                r={28}
                fill="rgba(0,184,148,0.15)"
                className="goal-map-node-active"
              />
            )}

            {/* Node circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r={22}
              fill={node.done ? "var(--primary)" : node.active ? "var(--card)" : "var(--surface-alt)"}
              stroke={node.done || node.active ? "var(--primary)" : "var(--border)"}
              strokeWidth={node.active ? 3 : 2}
            />

            {/* Icon/emoji */}
            <text
              x={node.x}
              y={node.y + 7}
              textAnchor="middle"
              fontSize={node.done ? 18 : 16}
            >
              {node.done ? "🏆" : node.icon}
            </text>

            {/* Label */}
            <text
              x={node.x}
              y={node.y + 38}
              textAnchor="middle"
              fontSize={11}
              fontFamily="Poppins, sans-serif"
              fontWeight={node.active ? 700 : 500}
              fill={node.active ? "var(--primary)" : "var(--muted-foreground)"}
            >
              {node.name}
            </text>
            <text
              x={node.x}
              y={node.y + 52}
              textAnchor="middle"
              fontSize={10}
              fill="var(--muted-foreground)"
            >
              {Math.round((node.current / node.target) * 100)}%
            </text>
          </g>
        ))}

        {/* Avatar on active node */}
        {activeIndex < nodes.length && (
          <g className="goal-map-avatar">
            <circle
              cx={nodes[activeIndex].x}
              cy={nodes[activeIndex].y - 40}
              r={16}
              fill="var(--gradient-primary)"
              stroke="var(--primary)"
              strokeWidth={2}
            />
            <text
              x={nodes[activeIndex].x}
              y={nodes[activeIndex].y - 35}
              textAnchor="middle"
              fontSize={14}
            >
              {mockUser.initials[0]}
            </text>
          </g>
        )}

        {/* Start flag */}
        <text x={nodes[0]?.x ?? 80} y={20} textAnchor="middle" fontSize={16}>🚩</text>
      </svg>
    </div>
  );
}

type Tab = "goals" | "map" | "group";

export default function GoalsPage() {
  const [tab, setTab] = useState<Tab>("goals");

  const totalSaved  = mockGoals.reduce((s, g) => s + g.current, 0);
  const totalTarget = mockGoals.reduce((s, g) => s + g.target, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: "var(--foreground)", fontFamily: "Poppins, sans-serif" }}
          >
            Savings Goals
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Stay on track with what matters most.
          </p>
        </div>
        <button
          className="flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
          style={{ background: "var(--primary)", boxShadow: "0 4px 12px rgba(0,184,148,0.35)" }}
        >
          <Plus size={16} strokeWidth={2.5} /> New goal
        </button>
      </div>

      {/* Summary banner */}
      <div
        className="flex flex-wrap items-center gap-6 rounded-2xl p-6"
        style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
      >
        {[
          { label: "Total saved",      value: formatCurrency(totalSaved),  color: "var(--success)" },
          { label: "Total target",     value: formatCurrency(totalTarget), color: "var(--foreground)" },
          { label: "Overall progress", value: `${Math.round((totalSaved / totalTarget) * 100)}%`, color: "var(--primary)" },
        ].map(({ label, value, color }, i) => (
          <div key={label} className="flex items-center gap-6">
            {i > 0 && <div className="hidden h-10 w-px sm:block" style={{ background: "var(--border)" }} />}
            <div>
              <div className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{label}</div>
              <div className="mt-1 text-2xl font-bold" style={{ color, fontFamily: "Poppins, sans-serif" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl p-1" style={{ background: "var(--surface-alt)" }}>
        {([
          { key: "goals", label: "My Goals" },
          { key: "map",   label: "🗺 Goal Map" },
          { key: "group", label: "👥 Group" },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition"
            style={
              tab === key
                ? { background: "var(--card)", color: "var(--primary)", boxShadow: "var(--shadow-sm)" }
                : { color: "var(--muted-foreground)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Individual goals ── */}
      {tab === "goals" && (
        <div className="grid gap-4 md:grid-cols-2">
          {mockGoals.length === 0 ? (
            <div
              className="col-span-2 flex flex-col items-center gap-4 rounded-2xl py-16 text-center"
              style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
            >
              <div className="text-5xl">🎯</div>
              <div className="font-semibold" style={{ color: "var(--foreground)" }}>No goals yet</div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Create your first savings goal
              </div>
              <button
                className="flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "var(--primary)" }}
              >
                <Plus size={16} /> Create Goal
              </button>
            </div>
          ) : (
            mockGoals.map((g) => {
              const pct = Math.min(100, Math.round((g.current / g.target) * 100));
              const remaining = Math.max(0, g.target - g.current);
              const deadline = new Date(g.targetDate);
              const daysLeft = Math.ceil((deadline.getTime() - new Date("2026-05-09").getTime()) / 86400000);

              return (
                <div
                  key={g.id}
                  className="rounded-2xl p-6 cursor-pointer"
                  style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex shrink-0 items-center justify-center">
                      <GoalRing pct={pct} />
                      <span className="absolute text-2xl">{g.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                          {g.name}
                        </div>
                        {g.locked && (
                          <Lock size={12} style={{ color: "var(--warning)" }} />
                        )}
                      </div>
                      <div className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        Target: {deadline.toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                      <div
                        className="mt-1 text-xs font-medium"
                        style={{ color: daysLeft < 30 ? "var(--danger)" : "var(--muted-foreground)" }}
                      >
                        {daysLeft > 0 ? `${daysLeft} days left` : "Deadline passed"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="text-xl font-bold"
                        style={{ color: "var(--primary)", fontFamily: "Poppins, sans-serif" }}
                      >
                        {pct}%
                      </div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>complete</div>
                    </div>
                  </div>

                  <div
                    className="mt-5 grid grid-cols-3 gap-3 rounded-xl p-3 text-center"
                    style={{ background: "var(--surface-alt)" }}
                  >
                    {[
                      { label: "Saved",     value: formatCurrency(g.current),   color: "var(--success)" },
                      { label: "Remaining", value: formatCurrency(remaining),    color: "var(--foreground)" },
                      { label: "Target",    value: formatCurrency(g.target),     color: "var(--primary)" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</div>
                        <div className="mt-0.5 text-xs font-semibold" style={{ color }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="mt-4 w-full rounded-full border py-2.5 text-sm font-semibold transition hover:opacity-80 active:scale-95"
                    style={{
                      borderColor: g.locked ? "var(--warning)" : "var(--primary)",
                      color: g.locked ? "var(--warning)" : "var(--primary)",
                      background: "transparent",
                    }}
                  >
                    {g.locked ? `🔒 Locked until target` : "Add contribution"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Goal map ── */}
      {tab === "map" && <GoalMap />}

      {/* ── Group savings ── */}
      {tab === "group" && (
        <div className="flex flex-col gap-4">
          {mockGroupSavings.length === 0 ? (
            <div
              className="flex flex-col items-center gap-4 rounded-2xl py-16 text-center"
              style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
            >
              <div className="text-5xl">🤝</div>
              <div className="font-semibold" style={{ color: "var(--foreground)" }}>No group savings yet</div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Save together with friends and hold each other accountable
              </div>
              <button
                className="flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "var(--primary)" }}
              >
                <Plus size={16} /> Create Group Pool
              </button>
            </div>
          ) : (
            mockGroupSavings.map((group) => {
              const pct = Math.round((group.contributed / group.target) * 100);
              return (
                <div
                  key={group.id}
                  className="rounded-2xl p-6"
                  style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl"
                        style={{ background: "rgba(0,184,148,0.15)", color: "var(--primary)" }}
                      >
                        <Users size={20} />
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: "var(--foreground)" }}>{group.name}</div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {group.members.length} members
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-xl font-bold"
                        style={{ color: "var(--primary)", fontFamily: "Poppins, sans-serif" }}
                      >
                        {pct}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span style={{ color: "var(--muted-foreground)" }}>Group progress</span>
                      <span style={{ color: "var(--foreground)" }}>
                        {formatCurrency(group.contributed)} / {formatCurrency(group.target)}
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: "var(--primary)" }} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {group.members.map((m) => {
                      const mPct = Math.round((m.contributed / group.target) * 100);
                      const isMe = m.name === mockUser.name;
                      return (
                        <div key={m.name} className="flex items-center gap-3">
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ background: isMe ? "var(--primary)" : "var(--surface-alt)", color: isMe ? "#fff" : "var(--foreground)" }}
                          >
                            {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span
                                className="font-medium"
                                style={{ color: isMe ? "var(--primary)" : "var(--foreground)" }}
                              >
                                {isMe ? "You" : m.name}
                              </span>
                              <span style={{ color: "var(--muted-foreground)" }}>
                                {formatCurrency(m.contributed)}
                              </span>
                            </div>
                            <div className="progress-track" style={{ height: 5 }}>
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${mPct}%`,
                                  background: isMe ? "var(--primary)" : "var(--success)",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition hover:opacity-80"
            style={{ borderColor: "var(--primary)", color: "var(--primary)", background: "transparent" }}
          >
            <Plus size={16} /> Create New Group Pool
          </button>
        </div>
      )}
    </div>
  );
}
