# MyTereka

A personal finance app built for Ugandan users — track income, expenses, savings goals, and budgets in UGX, with a gamification layer (XP, streaks, badges, goal maps) that makes the habit stick.

---

## What it does

| Feature | Description |
|---------|-------------|
| **Transaction tracking** | Log income, expenses, investments, and transfers. All amounts in UGX, no decimals. |
| **Budgets** | Weekly or monthly spending limits per category. Color-coded progress: green < 70%, amber 70–90%, red > 90%. |
| **Savings goals** | Personal and shared (group) goals with contribution tracking and optional auto-debit. Goals can be locked until a target date. |
| **Goal map** | Duolingo-style isometric tile journey per goal. Six milestone tiles (0/10/25/50/75/100%). Tiles animate: teal = completed, amber pulse = current position, muted = locked. |
| **Shared goals** | Multiple users contribute toward one goal. Separate map with a group avatar and a contributor leaderboard ranked by amount. |
| **Streaks** | One streak point per calendar day with at least one transaction (EAT timezone). 7-day streak awards +50 XP and the Streak Master badge. Full streak history stored with start/end dates. |
| **Streak calendar** | `/streak` — 3-month rolling calendar with gold dots for active days. Shows best streak, total active days, and recent streak history. |
| **Financial tips** | 130+ Ugandan-context tips (MTN MoMo, SACCOs, market shopping, school fees). Each user has a random seed assigned at registration. Daily tip = `(seed + daysSinceEpoch) % totalTips` — deterministic, no DB tracking needed. |
| **Gamification** | XP awarded for logging transactions (+5), reaching goal milestones (+20–100), completing budgets (+20), 7-day streaks (+50). Five levels: Beginner → Saver → Consistent → Master → Grand Master. |
| **Badges** | First Steps, Streak Master, Goal Getter, Budget Boss, Team Player. Awarded automatically, shown in the Profile badges tab. |
| **In-app rating** | After the 3rd transaction, a 1–5 star modal appears once. Stored in `users.app_rating`. `ratingAskedAt` is set when the prompt fires — skip does not re-trigger it. |
| **Friends and nudges** | Friend requests, friend profiles, and the ability to nudge a friend to keep their streak alive. |
| **Analytics** | Bar chart (income vs expense by period) and donut chart (spending by category). Period tabs: week / month / year. |
| **Import** | CSV/TSV import with deduplication for bulk transaction entry. |
| **Notifications** | In-app notification feed for friend requests, nudges, shared goal invites and contributions. |

---

## Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 14 (App Router) | Server Components for data fetching, Server Actions for writes, no separate API layer needed |
| Language | TypeScript | Full type safety across DB schema → server action → component |
| Package manager | Bun | Faster installs and script execution than npm/yarn |
| Database | Neon (serverless PostgreSQL) | Scales to zero between requests, native Vercel integration, supports WebSocket for connection pooling |
| ORM | Drizzle ORM | Type-safe queries, schema-as-code, `drizzle-kit push` for migrations |
| DB driver | `drizzle-orm/neon-serverless` with `Pool` | Required for `db.transaction()` — `neon-http` silently fails on transactions |
| Auth | NextAuth.js v4 | Session management, credential provider for email/password login |
| UI components | shadcn/ui (Radix primitives) | Accessible, unstyled base components that respect the custom token system |
| Styling | Tailwind CSS + CSS custom properties | Tailwind for spacing/layout, CSS vars for all colors and design tokens |
| Charts | Recharts (via shadcn chart wrapper) | Bar and donut charts on the analytics page |
| Toasts | Sonner | Non-blocking, dismissable notifications |
| Deployment | Vercel | Zero-config Next.js deployment, connected to Neon via native integration |

---

## Architecture

### Route groups

```
app/
├── (bare)/          — unauthenticated pages (login, register, forgot-password, launch, onboarding)
└── (app)/           — authenticated pages wrapped in the app shell (sidebar + mobile nav)
```

Middleware (`src/middleware.ts`) uses `getToken` from `next-auth/jwt` — not `auth()` — to stay Edge-compatible. All routes except `/auth/*`, `/launch`, and `/onboarding` require a valid session token.

### Server vs Client Components

Pages are Server Components by default. They fetch data directly from the DB and pass it as props to a `*-client.tsx` child. The client component handles all interactivity (state, transitions, event handlers).

```
app/(app)/goals/page.tsx          ← Server Component: DB query, auth check
app/(app)/goals/goals-client.tsx  ← Client Component: modals, contributions, UI state
```

### Server Actions

All DB writes are Server Actions (`'use server'` at top of file). They:
1. Call `auth()` and reject if no session
2. Validate input
3. Write to DB (using `db.transaction()` where multiple tables must be updated atomically)
4. Return a plain object to the client

No API routes used for mutations — only for NextAuth's `[...nextauth]` handler.

### Database connection

```typescript
// src/lib/db.ts
import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import ws from 'ws'

neonConfig.webSocketConstructor = ws
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool)
```

`Pool` (WebSocket) is mandatory. `neon-http` works for single queries but silently fails inside `db.transaction()`.

---

## Design system

All design tokens live in `app/globals.css`. No hex values in components — only `var(--token-name)`.

### Color palette

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#00B894` | MyTereka teal — buttons, active states, CTAs |
| `--primary-light` | `#1DD1A1` | Hover states |
| `--primary-dark` | `#00A381` | Pressed states |
| `--warning` | `#F59E0B` | Amber — streak highlights, current tile, alerts |
| `--success` | `#10B981` | Income amounts, positive values |
| `--danger` | `#EF4444` | Expense amounts, errors, over-budget |
| `--background` | `#0D2137` | Dark navy — default app background |
| `--card` | `#1A2F45` | Card/panel background |
| `--surface-alt` | `#243B55` | Input backgrounds, chips |
| `--muted` | `#2D4A6B` | Muted backgrounds |
| `--muted-foreground` | `#94A3B8` | Secondary text |

Dark mode is the default. Theme stored in `localStorage` key `mt-theme`. Applied via inline script in `app/layout.tsx` before React hydrates, preventing flash.

### Utility classes

```css
.card-base           /* var(--card) + radius-xl + shadow-card + 24px padding */
.amount-income       /* color: var(--success) — always used for income amounts */
.amount-expense      /* color: var(--danger)  — always used for expense amounts */
.streak-dot          /* filled teal dot — active streak day */
.streak-dot-empty    /* muted empty dot — missed day */
.tile-current        /* amber pulse animation — current milestone tile */
.avatar-pin          /* bounce animation — avatar on goal map / shared goal avatar */
.mytereka-input      /* styled input: 52px height, teal focus ring */
.bottom-nav          /* mobile bottom navigation bar */
```

### Layout

- **Desktop (> 1024px):** 240px fixed sidebar + main content max-width 1024px centered
- **Tablet (768–1024px):** Sidebar collapses to icons via shadcn `collapsible="icon"`
- **Mobile (< 768px):** Sidebar hidden, top bar + fixed bottom navigation (5 tabs)

Mobile bottom nav tabs: Home / Analytics / Add (FAB) / Goals / Budgets

---

## Database schema

31 tables across the following domains:

### Core
| Table | Purpose |
|-------|---------|
| `users` | Auth, profile, XP, level, streak, currency, theme, app rating |
| `accounts` | MTN MoMo, Airtel Money, Cash, Bank — per user, tracks balance |
| `categories` | Income/expense/investment categories, seeded with Uganda-relevant defaults on registration |
| `transactions` | All financial transactions — income, expense, transfer, investment |

### Budgets & Goals
| Table | Purpose |
|-------|---------|
| `budgets` | Spending limits per category per period (weekly/monthly) |
| `goals` | Personal savings goals with lock, auto-debit, and completion tracking |
| `goal_contributions` | Individual contributions to a personal goal |
| `goal_milestones` | Records when a user reaches 10/25/50/75/100% — drives XP and badge awards |
| `goal_coins` | Collectible coins along the goal map path (legacy — coins from the SVG map era) |

### Gamification
| Table | Purpose |
|-------|---------|
| `badges` | Badge definitions (name, icon, XP reward, trigger event) |
| `user_badges` | Which users have earned which badges and when |
| `xp_events` | Full XP event log per user |
| `streak_history` | Every streak with start date, end date (null = active), and length |

### Social
| Table | Purpose |
|-------|---------|
| `friendships` | Bidirectional friend relationships with status |
| `nudges` | One-tap encouragement nudges between friends |
| `notifications` | In-app notification feed |
| `shared_goals` | Group savings goals |
| `shared_goal_members` | Membership with status (invited/active/left/removed) and leave policy |
| `shared_goal_contributions` | Individual contributions to shared goals, with refund flag |

### Tips
| Table | Purpose |
|-------|---------|
| `financial_tips` | 130+ Ugandan financial tips with category tags |
| `user_tip_seeds` | Per-user random seed for deterministic daily tip rotation |

---

## Key business rules

1. **Transaction save** triggers (in order): account balance update, budget `spentAmount` increment, streak update, +5 XP, first-transaction badge check, rating prompt check — all in a single `db.transaction()` where atomicity matters.

2. **Streak logic** — runs in EAT (UTC+3):
   - `lastActiveDate === today` → skip (already counted)
   - `lastActiveDate === yesterday` → extend streak, update open `streak_history` row
   - Gap > 1 day → close old history row, open new one, reset streak to 1
   - First ever transaction → open first history row

3. **Budget tracking** — only expense transactions decrement `spentAmount`. Color thresholds: < 70% green, 70–90% amber, > 90% red.

4. **Locked goals** — `is_locked = true` disables withdrawal in UI and the Server Action rejects the request with "Goal is locked until target date".

5. **Daily tip rotation** — `tipId = ((userSeed + daysSinceUnixEpoch) % totalTips) + 1`. Same user sees same tip on same day across devices. No DB tracking of "seen" tips needed.

6. **Rating prompt** — fires when `totalTransactions === 3` AND `ratingAskedAt IS NULL`. Sets `ratingAskedAt = now()` before the client receives the flag. Skip leaves `appRating` null but `ratingAskedAt` set, so the prompt never fires again.

7. **Shared goal leave policy** — `refundable`: contributions returned on leave. `forfeit`: contributions stay with the group. Enforced in the Server Action.

---

## Gamification system

### XP events

| Trigger | XP |
|---------|-----|
| Log any transaction | +5 |
| Reach a goal milestone (10/25/50/75%) | +20/30/50/75 |
| Complete a goal (100%) | +100 |
| Complete a budget period under limit | +20 |
| 7-day streak | +50 |

### Levels

| Level | XP threshold |
|-------|-------------|
| Beginner | 0 |
| Saver | 100 |
| Consistent | 300 |
| Master | 700 |
| Grand Master | 1500 |

### Badges

| Badge | Trigger |
|-------|---------|
| First Steps | First transaction logged |
| Streak Master | 7-day streak reached |
| Goal Getter | First savings goal completed |
| Budget Boss | Budget period completed under limit |
| Team Player | First shared goal joined |

---

## Goal map design

The isometric tile map replaces a flat list of goal cards with a visual journey.

**Tile states:**
- **Completed** — teal (`--primary`), elevated 3D shadow, milestone icon
- **Current** — amber (`--warning`), continuous pulse animation (`tile-pulse` keyframe), milestone icon
- **Locked** — muted navy, 55% opacity, lock icon

**CSS 3D technique** — no WebGL or Canvas. Each tile is a `div` with:
```css
transform: rotateX(20deg) rotateZ(-5deg);
```
applied inside a `perspective: 400px` wrapper. Zigzag layout alternates tiles left/right using a `side` prop.

**Path connectors** — three small dots between each tile pair, offset to the same side as the departing tile, giving a road/path feel.

**Shared goal map** differs from personal:
- Single group avatar (`Users` icon) with bounce animation replaces individual avatars
- Contributor leaderboard below the map (sorted by total contributed, podium medals for top 3)
- Progress derived from aggregated `sharedGoals.currentAmount / targetAmount`

---

## Ugandan context

All monetary values are stored and displayed in UGX (whole numbers, no decimals):
```typescript
new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(amount)
```

Mobile number format: `256XXXXXXXXX` (Uganda country code + 9 digits). Validated on registration.

Default accounts seeded on registration: MTN Mobile Money, Cash.

Default expense categories include: Food, Internet/Data, Transport, Rent, School Materials, Clothing/Fashion, Giving/Charity, Entertainment, Health.

Financial tips reference Ugandan realities: MTN MoMo withdrawal fees, SACCO dividends, Nakasero/Owino market shopping, school fees cycles, bodaboda vs matatu costs, seasonal produce buying, kwanjula contribution budgeting.

---

## Development

```bash
bun dev          # dev server at localhost:3000
bun build        # production build
bun lint         # ESLint
bun db:push      # push schema changes to Neon
bun db:studio    # open Drizzle Studio (visual DB browser)
```

### Environment variables

```
DATABASE_URL=          # Neon connection string (pooled, WebSocket)
NEXTAUTH_SECRET=       # Random secret for JWT signing
NEXTAUTH_URL=          # e.g. http://localhost:3000
```

### Adding a new screen

1. Create `app/(app)/your-route/page.tsx` — Server Component, auth check, DB query
2. Create `app/(app)/your-route/your-route-client.tsx` — `'use client'`, receives data as props
3. Create `app/(app)/your-route/loading.tsx` — `<Skeleton />` matching the page layout
4. Add Server Actions in `src/lib/actions/` — always call `auth()` first, write via `db.transaction()` where multiple tables change
5. All currency → `formatUGX()`. All amounts → no decimals. All dates → `Intl.DateTimeFormat('en-UG')`.

### Hard rules

- `bun add` only — never `npm install`
- No hardcoded hex values — `var(--token-name)` only
- No Tailwind default color classes (`bg-blue-500` etc.)
- Income amounts → `class="amount-income"` always
- Expense amounts → `class="amount-expense"` always
- `'use client'` only when strictly necessary
- Dark mode is the default — never assume light
- Never use `drizzle-orm/neon-http` — use `drizzle-orm/neon-serverless` with `Pool`
- Never use NextAuth v5 API (`handlers`, default `auth()` export)
- Middleware must use `getToken` from `next-auth/jwt` — not `auth()` — for Edge compatibility
