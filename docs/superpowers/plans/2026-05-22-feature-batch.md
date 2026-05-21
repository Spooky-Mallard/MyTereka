# MyTereka Feature Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement quick fixes, streak calendar page with bug fix, financial tips system, isometric tile goal map (personal + shared), and in-app rating prompt.

**Architecture:** Schema-first — migrate DB before touching UI. Each group (A–E) is independent after Task 0. Groups can be implemented in any order post-migration. No new external libraries needed; CSS 3D transforms for isometric tiles.

**Tech Stack:** Next.js 14 App Router, Drizzle ORM + Neon (neon-serverless Pool), NextAuth v4, Tailwind + CSS custom properties, shadcn/ui, Sonner toasts, `bun` package manager.

---

## File Map

| File | Action | Group |
|------|--------|-------|
| `src/lib/schema.ts` | Modify — add `streakHistory`, `financialTips`, `userTipSeeds`, `users.appRating`, `users.ratingAskedAt` | 0 |
| `src/lib/seed-tips.ts` | Create — 150 tip strings | C |
| `src/lib/actions/auth.ts` | Modify — assign tip seed on register | C |
| `src/lib/actions/transactions.ts` | Modify — fix `updateStreak` EAT bug + streak history + rating prompt flag | B, E |
| `src/lib/actions/profile.ts` | Modify — add `submitAppRating`, `getStreakHistory`, `getDailyTip` | B, C, E |
| `src/lib/actions/shared-goals.ts` | Modify — add `getSharedGoalMapData` | D |
| `src/components/app-shell.tsx` | Modify — replace Profile with Budgets in mobile nav | A |
| `src/components/goal-map-tile-canvas.tsx` | Create — isometric tile canvas (replaces SVG canvas) | D |
| `src/components/goal-map-milestone-tile.tsx` | Create — single tile component | D |
| `src/components/rating-modal.tsx` | Create — 1-5 star rating dialog | E |
| `app/(bare)/auth/register/page.tsx` | Modify — placeholder name | A |
| `app/(app)/streak/page.tsx` | Create — streak calendar page | B |
| `app/(app)/goals/[id]/map/goal-map-screen.tsx` | Modify — swap canvas component | D |
| `app/(app)/goals/shared/[id]/map/page.tsx` | Create — shared goal map route | D |
| `app/(app)/goals/shared/[id]/map/shared-goal-map-screen.tsx` | Create — shared map client | D |
| `app/(app)/goals/shared/[id]/shared-goal-detail-client.tsx` | Modify — add View Map button | D |
| `app/(app)/dashboard-client.tsx` | Modify — daily tip card + clickable streak | B, C |
| `app/(app)/page.tsx` | Modify — fetch daily tip server-side | C |
| `app/globals.css` | Modify — add tile-pulse + avatar-bounce keyframes | D |

---

## Task 0: Schema migration

**Files:**
- Modify: `src/lib/schema.ts`

- [ ] **Step 1: Add new tables and columns to schema**

Open `src/lib/schema.ts`. After the `notifications` table (end of file), add:

```typescript
export const streakHistory = pgTable('streak_history', {
  id:        uuid('id').defaultRandom().primaryKey(),
  userId:    uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  startDate: date('start_date').notNull(),
  endDate:   date('end_date'),
  length:    integer('length').notNull(),
})

export const financialTips = pgTable('financial_tips', {
  id:       integer('id').primaryKey().generatedAlwaysAsIdentity(),
  body:     text('body').notNull(),
  category: varchar('category', { length: 50 }),
})

export const userTipSeeds = pgTable('user_tip_seeds', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  seed:   integer('seed').notNull(),
})
```

In the `users` table definition, add two columns after `createdAt`:

```typescript
appRating:     integer('app_rating'),
ratingAskedAt: timestamp('rating_asked_at', { withTimezone: true }),
```

- [ ] **Step 2: Push schema to Neon**

```bash
bun db:push
```

Expected: Drizzle lists the new tables/columns and confirms push. No destructive changes.

- [ ] **Step 3: Commit**

```bash
git add src/lib/schema.ts
git commit -m "feat(schema): add streak_history, financial_tips, user_tip_seeds, app_rating"
```

---

## Task A1: Registration placeholder

**Files:**
- Modify: `app/(bare)/auth/register/page.tsx:98`

- [ ] **Step 1: Change placeholder**

Find line 98 in `app/(bare)/auth/register/page.tsx`. Change:
```tsx
placeholder="Atong Precious Olanya"
```
to:
```tsx
placeholder="John Doe"
```

- [ ] **Step 2: Verify**

Run `bun dev`. Open `http://localhost:3000/auth/register`. Confirm name field shows "John Doe" as placeholder.

- [ ] **Step 3: Commit**

```bash
git add app/\(bare\)/auth/register/page.tsx
git commit -m "fix: change register placeholder name to John Doe"
```

---

## Task A2: Replace Profile with Budgets in mobile nav

**Files:**
- Modify: `src/components/app-shell.tsx:1-21`

- [ ] **Step 1: Update import and nav items**

In `src/components/app-shell.tsx`, find the import line at the top (line 6). Add `Wallet` to the lucide-react import and remove `User`:

```typescript
import { Bell, House, BarChart2, Plus, Target, Wallet, LogOut, ChevronDown, UserPlus, UserCheck, Trophy, Users as UsersIcon, Sparkles } from 'lucide-react'
```

Replace the `mobileNavItems` array (lines 15–21):

```typescript
const mobileNavItems = [
  { title: 'Home',     url: '/',         icon: House },
  { title: 'Analytics',url: '/analytics',icon: BarChart2 },
  { title: 'Add',      url: '#',         icon: Plus, fab: true },
  { title: 'Goals',    url: '/goals',    icon: Target },
  { title: 'Budgets',  url: '/budgets',  icon: Wallet },
]
```

- [ ] **Step 2: Verify**

`bun dev`. On mobile viewport, confirm bottom nav shows Home / Analytics / Add / Goals / Budgets. Profile still accessible via avatar in top bar.

- [ ] **Step 3: Commit**

```bash
git add src/components/app-shell.tsx
git commit -m "fix: replace Profile with Budgets in mobile bottom nav"
```

---

## Task A3: Badge display audit

**Files:**
- Read: `app/(app)/profile/profile-client.tsx`
- Read: `src/lib/actions/auth.ts`

- [ ] **Step 1: Check badge seeding in registerUser**

Open `src/lib/actions/auth.ts`. Confirm `seedGoalBadges()` is NOT called (it isn't in the current code). Add base badge seeding. After `await db.insert(accounts)...`, add:

```typescript
const BASE_BADGES = [
  { name: 'First Steps',   description: 'Logged your first transaction', icon: '🐾', xpReward: 0,  triggerEvent: 'first_transaction' },
  { name: 'Streak Master', description: 'Reached a 7-day streak',        icon: '🔥', xpReward: 50, triggerEvent: 'streak_7'          },
  { name: 'Goal Getter',   description: 'Completed your first goal',     icon: '🎯', xpReward: 0,  triggerEvent: 'goal_completed'    },
  { name: 'Budget Boss',   description: 'Stayed under budget for a full period', icon: '💰', xpReward: 20, triggerEvent: 'budget_completed' },
  { name: 'Team Player',   description: 'Joined a group savings goal',   icon: '🤝', xpReward: 0,  triggerEvent: 'group_joined'      },
]

// Only seed if badges table is empty (idempotent)
const { badges: badgesTable } = await import('@/lib/schema')
const { sql: sqlFn } = await import('drizzle-orm')
const [{ count }] = await db.select({ count: sqlFn<number>`count(*)` }).from(badgesTable)
if (Number(count) === 0) {
  await db.insert(badgesTable).values(BASE_BADGES)
}
```

Add the import for `badges` to the top of the file:
```typescript
import { users, categories, accounts, badges } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
```

- [ ] **Step 2: Check profile badges tab**

Open `app/(app)/profile/profile-client.tsx`. Search for `getEarnedBadges`. Confirm it's called and the result is passed to the badges tab. If the badges array is empty, the issue is the badges table being empty — fixed by step 1 for new users. For existing users, badges must be manually seeded via Drizzle Studio (`bun db:studio`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/auth.ts
git commit -m "fix: seed base badges on user registration"
```

---

## Task B1: Fix streak EAT timezone bug + add streak history

**Files:**
- Modify: `src/lib/actions/transactions.ts:13-36`

- [ ] **Step 1: Rewrite `updateStreak` with EAT helpers and history tracking**

Replace the entire `updateStreak` function in `src/lib/actions/transactions.ts` (lines 13–36). Also add `streakHistory` to the imports at line 4:

```typescript
import { transactions, accounts, budgets, users, categories, goals, streakHistory } from '@/lib/schema'
```

Replace the `updateStreak` function:

```typescript
function todayEAT(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().split('T')[0]
}

function yesterdayEAT(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000 - 86400000).toISOString().split('T')[0]
}

export async function updateStreak(userId: string) {
  const today     = todayEAT()
  const yesterday = yesterdayEAT()

  const [user] = await db
    .select({ streakCount: users.streakCount, lastActiveDate: users.lastActiveDate })
    .from(users)
    .where(eq(users.id, userId))

  if (!user || user.lastActiveDate === today) return

  const continued = user.lastActiveDate === yesterday
  const newStreak = continued ? user.streakCount + 1 : 1

  await db
    .update(users)
    .set({ streakCount: newStreak, lastActiveDate: today })
    .where(eq(users.id, userId))

  if (continued) {
    // Extend open streak history row
    const [open] = await db
      .select({ id: streakHistory.id })
      .from(streakHistory)
      .where(and(eq(streakHistory.userId, userId), sql`end_date IS NULL`))
    if (open) {
      await db
        .update(streakHistory)
        .set({ endDate: today, length: newStreak })
        .where(eq(streakHistory.id, open.id))
    } else {
      // No open row (e.g. first transaction after schema migration)
      await db.insert(streakHistory).values({ userId, startDate: today, endDate: null, length: 1 })
    }
  } else {
    // Close old streak if open row exists
    const [open] = await db
      .select({ id: streakHistory.id, length: streakHistory.length })
      .from(streakHistory)
      .where(and(eq(streakHistory.userId, userId), sql`end_date IS NULL`))
    if (open) {
      await db
        .update(streakHistory)
        .set({ endDate: yesterday, length: open.length })
        .where(eq(streakHistory.id, open.id))
    }
    // Start new streak
    await db.insert(streakHistory).values({ userId, startDate: today, endDate: null, length: 1 })
  }

  if (newStreak === 7) {
    await awardXP(userId, 'streak_7', 50, '7-day streak milestone')
    await checkAndAwardBadge(userId, 'streak_7')
  }
}
```

- [ ] **Step 2: Verify build**

```bash
bun build 2>&1 | tail -20
```

Expected: compiled successfully, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/transactions.ts
git commit -m "fix(streak): EAT timezone, streak history tracking, open-row management"
```

---

## Task B2: Streak data server action

**Files:**
- Modify: `src/lib/actions/profile.ts`

- [ ] **Step 1: Add imports and `getStreakPageData` action**

Add to imports at top of `src/lib/actions/profile.ts`:

```typescript
import { users, userBadges, badges, transactions, streakHistory } from '@/lib/schema'
import { eq, desc, gte, sql } from 'drizzle-orm'
```

Add this function at the bottom of the file:

```typescript
export type StreakHistoryRow = {
  id:        string
  startDate: string
  endDate:   string | null
  length:    number
}

export async function getStreakPageData(): Promise<{
  streakCount:    number
  longestStreak:  number
  totalActiveDays: number
  activeDates:    string[]          // 'YYYY-MM-DD' list, past 90 days
  history:        StreakHistoryRow[]
}> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  const ninetyDaysAgo = new Date(Date.now() + 3 * 60 * 60 * 1000 - 90 * 86400000)
    .toISOString().split('T')[0]

  const [userRow, txDates, historyRows] = await Promise.all([
    db.select({ streakCount: users.streakCount })
      .from(users).where(eq(users.id, userId))
      .then((r) => r[0]),

    db.selectDistinct({ date: transactions.date })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), gte(transactions.date, ninetyDaysAgo)))
      .then((r) => r.map((x) => x.date)),

    db.select({
        id:        streakHistory.id,
        startDate: streakHistory.startDate,
        endDate:   streakHistory.endDate,
        length:    streakHistory.length,
      })
      .from(streakHistory)
      .where(eq(streakHistory.userId, userId))
      .orderBy(desc(streakHistory.startDate))
      .limit(10),
  ])

  const longestStreak = historyRows.reduce((max, r) => Math.max(max, r.length), 0)

  return {
    streakCount:     userRow?.streakCount ?? 0,
    longestStreak,
    totalActiveDays: txDates.length,
    activeDates:     txDates,
    history:         historyRows,
  }
}
```

- [ ] **Step 2: Verify build**

```bash
bun build 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/profile.ts
git commit -m "feat(streak): add getStreakPageData server action"
```

---

## Task B3: Streak calendar page `/streak`

**Files:**
- Create: `app/(app)/streak/page.tsx`
- Create: `app/(app)/streak/loading.tsx`

- [ ] **Step 1: Create loading skeleton**

Create `app/(app)/streak/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function StreakLoading() {
  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col gap-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  )
}
```

- [ ] **Step 2: Create streak page**

Create `app/(app)/streak/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getStreakPageData } from '@/lib/actions/profile'
import { Flame, Calendar, Trophy, TrendingUp } from 'lucide-react'
import Link from 'next/link'

function todayEAT(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().split('T')[0]
}

function buildCalendarMonths(activeDates: string[]): { year: number; month: number; days: { date: string; active: boolean; isToday: boolean; inMonth: boolean }[] }[] {
  const activeSet = new Set(activeDates)
  const today = todayEAT()
  const months = []
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000)

  for (let m = 2; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDow = new Date(year, month, 1).getDay()

    const days = []
    // Pad start
    for (let p = 0; p < firstDow; p++) {
      days.push({ date: '', active: false, isToday: false, inMonth: false })
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({ date: dateStr, active: activeSet.has(dateStr), isToday: dateStr === today, inMonth: true })
    }
    months.push({ year, month, days })
  }
  return months
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default async function StreakPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const data = await getStreakPageData()
  const months = buildCalendarMonths(data.activeDates)

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col gap-6 pb-24">
      {/* Header */}
      <Link href="/" className="text-sm flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
        ← Back
      </Link>

      {/* Hero card */}
      <div className="card-base flex items-center gap-4">
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl" style={{ background: 'var(--warning)', color: '#fff' }}>
          <Flame size={28} />
        </div>
        <div>
          <p className="text-3xl font-black" style={{ color: 'var(--warning)' }}>{data.streakCount}-day streak</p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {data.streakCount === 0 ? 'Log a transaction today to start your streak!' : 'Keep it up!'}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-base flex flex-col gap-1">
          <div className="flex items-center gap-2" style={{ color: 'var(--warning)' }}>
            <Trophy size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Best Streak</span>
          </div>
          <p className="text-2xl font-black">{data.longestStreak} days</p>
        </div>
        <div className="card-base flex flex-col gap-1">
          <div className="flex items-center gap-2" style={{ color: 'var(--primary)' }}>
            <TrendingUp size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Active Days</span>
          </div>
          <p className="text-2xl font-black">{data.totalActiveDays}</p>
        </div>
      </div>

      {/* Calendars */}
      {months.map(({ year, month, days }) => (
        <div key={`${year}-${month}`} className="card-base flex flex-col gap-3">
          <p className="font-bold text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {MONTH_NAMES[month]} {year}
          </p>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['S','M','T','W','T','F','S'].map((l, i) => (
              <span key={i} className="text-[10px] font-semibold pb-1" style={{ color: 'var(--muted-foreground)' }}>{l}</span>
            ))}
            {days.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day.inMonth ? (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      day.active
                        ? 'text-white'
                        : day.isToday
                        ? 'font-black'
                        : ''
                    }`}
                    style={{
                      background: day.active ? 'var(--warning)' : day.isToday ? 'var(--muted)' : 'transparent',
                      color: day.active ? '#fff' : day.isToday ? 'var(--primary)' : 'var(--muted-foreground)',
                      outline: day.isToday && !day.active ? '2px solid var(--primary)' : 'none',
                      outlineOffset: '1px',
                    }}
                  >
                    {new Date(day.date + 'T00:00:00').getDate()}
                  </div>
                ) : <div className="w-8 h-8" />}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Streak history */}
      {data.history.length > 0 && (
        <div className="card-base flex flex-col gap-3">
          <p className="font-bold text-sm" style={{ color: 'var(--muted-foreground)' }}>Recent Streaks</p>
          {data.history.map((h) => (
            <div key={h.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Flame size={14} style={{ color: 'var(--warning)' }} />
                <span className="text-sm font-semibold">{h.length}-day streak</span>
              </div>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {h.startDate} {h.endDate && h.endDate !== h.startDate ? `→ ${h.endDate}` : ''}
                {!h.endDate ? ' · ongoing' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Make streak section on dashboard clickable**

Open `app/(app)/dashboard-client.tsx`. Find the `StreakDots` component usage in the render (search for `<StreakDots`). Wrap it in a `Link` to `/streak`:

```tsx
import Link from 'next/link'
// ...
<Link href="/streak" className="block">
  <StreakDots streak={user.streak} />
</Link>
```

- [ ] **Step 4: Verify**

`bun dev`. Navigate to `http://localhost:3000/streak`. Confirm 3-month calendar renders, gold dots for days with transactions, back link works.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/streak/page.tsx app/\(app\)/streak/loading.tsx app/\(app\)/dashboard-client.tsx
git commit -m "feat(streak): /streak calendar page with gold active days and streak history"
```

---

## Task C1: Financial tips — seed data

**Files:**
- Create: `src/lib/seed-tips.ts`

- [ ] **Step 1: Create tip array**

Create `src/lib/seed-tips.ts`:

```typescript
export const FINANCIAL_TIPS: { body: string; category: string }[] = [
  // saving
  { body: "Save first, spend later. Move at least 10% of any income to MTN MoMo savings the moment it arrives.", category: "saving" },
  { body: "Set a savings goal in MyTereka and automate a weekly transfer — even UGX 5,000 builds a habit.", category: "saving" },
  { body: "Keep an emergency fund of at least 3 months of expenses in a liquid account like MTN MoMo.", category: "saving" },
  { body: "Lock your savings goal in MyTereka so you can't withdraw before the target date.", category: "saving" },
  { body: "Saving UGX 2,000 daily for a year gives you over UGX 700,000 — buy a bicycle or clear school fees.", category: "saving" },
  { body: "Join a SACCO — they pay annual dividends on savings, unlike most mobile money accounts.", category: "saving" },
  { body: "After receiving salary, immediately send savings to a separate account you don't carry on your phone.", category: "saving" },
  { body: "A small amount saved consistently beats a large amount saved occasionally. Consistency is everything.", category: "saving" },
  { body: "Review your savings goals every month. Increase your contribution by UGX 1,000 each month.", category: "saving" },
  { body: "Use mobile money group savings (chamas) with trusted friends to keep each other accountable.", category: "saving" },
  { body: "Before buying anything over UGX 50,000, wait 48 hours. Impulse purchases rarely feel necessary after that.", category: "saving" },
  { body: "Airtel Money and MTN MoMo both earn no interest — move long-term savings to a SACCO or bank.", category: "saving" },
  { body: "The best time to start saving was yesterday. The second best time is today.", category: "saving" },
  { body: "Name your savings goal — 'Kampala Land 2027' feels more real than 'savings account'.", category: "saving" },
  { body: "Windfall money (bonus, gift, refund) — save 50% before spending any of it.", category: "saving" },
  { body: "Every time you skip a chapati or soda, add that money to savings. Small swaps add up.", category: "saving" },
  { body: "Open a fixed deposit account at your bank for money you won't need for 6+ months. Rates are better.", category: "saving" },
  { body: "Track every shilling you save in MyTereka — seeing the number grow is motivating.", category: "saving" },
  { body: "If you share a home, split bills equally and each person saves their share of what would have been spent.", category: "saving" },
  { body: "Savings grow fastest when you treat them like a non-negotiable expense, not an afterthought.", category: "saving" },

  // budgeting
  { body: "Buying from Nakasero or Owino market instead of supermarkets saves up to 40% on groceries.", category: "budgeting" },
  { body: "Plan your meals for the week before shopping. You'll buy less, waste less, and spend less.", category: "budgeting" },
  { body: "Cook matooke, beans, and groundnut stew in bulk on Sundays — saves both time and money during the week.", category: "budgeting" },
  { body: "Set a weekly food budget in MyTereka and track every market purchase against it.", category: "budgeting" },
  { body: "Internet bundles bought monthly cost less per GB than daily bundles. Plan ahead.", category: "budgeting" },
  { body: "Boda fares add up. Walk routes under 1km — it's cheaper and better for your health.", category: "budgeting" },
  { body: "Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Adjust for Ugandan realities.", category: "budgeting" },
  { body: "Log every transaction in MyTereka immediately — guessing later leads to budget overruns.", category: "budgeting" },
  { body: "Before buying anything, ask: is this a need or a want? Pause for 30 seconds.", category: "budgeting" },
  { body: "Airtime: buy weekly bundles instead of buying airtime in small tops-up — you spend less overall.", category: "budgeting" },
  { body: "School fees come every term. Start saving for next term the day you pay this term.", category: "budgeting" },
  { body: "Review last month's spending in MyTereka Analytics — one surprising category will reveal itself.", category: "budgeting" },
  { body: "Eating out once a week costs what home cooking costs in 5 days. Limit restaurant meals.", category: "budgeting" },
  { body: "Carry only the cash you need for the day. Leaving your card home reduces impulse spending.", category: "budgeting" },
  { body: "Entertainment budget: decide a fixed amount per month. When it's gone, it's gone.", category: "budgeting" },
  { body: "Track taxi and boda fares for one week. You might be surprised how much transport costs.", category: "budgeting" },
  { body: "Cancel subscriptions you haven't used this month. DStv, Netflix, gym — audit them all.", category: "budgeting" },
  { body: "Buy clothing at end-of-season sales. Prices drop 30–50% and quality doesn't change.", category: "budgeting" },
  { body: "Use a shopping list and stick to it. Supermarkets are designed to make you spend more.", category: "budgeting" },
  { body: "Cook tea and pack lunch from home. Buying tea daily at work can cost UGX 30,000+ per month.", category: "budgeting" },
  { body: "Review your phone data usage. Most people pay for data plans larger than what they actually need.", category: "budgeting" },
  { body: "Budget for irregular expenses: car service, medical, school items. Divide annual cost by 12.", category: "budgeting" },
  { body: "Whenever you go over budget in a category, investigate why — not to punish, but to learn.", category: "budgeting" },

  // mobile_money
  { body: "MTN MoMo float: keep small operational cash on mobile money, larger savings elsewhere.", category: "mobile_money" },
  { body: "Always verify recipient numbers before sending mobile money. Mistakes are hard to reverse.", category: "mobile_money" },
  { body: "MTN MoMo and Airtel Money charge withdrawal fees. Reduce trips to the agent — batch withdrawals.", category: "mobile_money" },
  { body: "Send money between mobile networks using bank transfers to avoid high cross-network fees.", category: "mobile_money" },
  { body: "Check mobile money transaction limits. Large transfers may require multiple transactions with fees on each.", category: "mobile_money" },
  { body: "Mobile money is convenient but not a savings account. Don't keep all your money on it.", category: "mobile_money" },
  { body: "MTN MoMo agents charge different fees. Shop around in your area for lower withdrawal rates.", category: "mobile_money" },
  { body: "Use mobile money payment (Pay Bill / Paybill) instead of cash for utilities — faster and traceable.", category: "mobile_money" },
  { body: "Never share your mobile money PIN. Airtel and MTN will never call asking for your PIN.", category: "mobile_money" },
  { body: "Register for Airtel Money or MTN MoMo merchant account if you run a business — lower fees for you.", category: "mobile_money" },
  { body: "Set up auto-save through MTN MoMo if available in your plan — automatic saving beats manual every time.", category: "mobile_money" },

  // investing
  { body: "SACCOs in Uganda pay annual dividends of 8–15% — far better than leaving money idle on MoMo.", category: "investing" },
  { body: "Ugandan Treasury Bills offer government-backed returns. Check Bank of Uganda for current rates.", category: "investing" },
  { body: "Invest in skills: a short course that increases your income is the best ROI you can get.", category: "investing" },
  { body: "Don't invest money you'll need in the next 6 months. Keep that in liquid savings.", category: "investing" },
  { body: "Start with what you have. Investing UGX 10,000/month is better than waiting until you have UGX 1,000,000.", category: "investing" },
  { body: "Diversify: don't put everything in one SACCO, one stock, or one business.", category: "investing" },
  { body: "Beware of get-rich-quick schemes promising 50%+ returns. If it sounds too good, it's a scam.", category: "investing" },
  { body: "Business investment: calculate your break-even point before starting. Know when you'll profit.", category: "investing" },
  { body: "Agricultural investment: land near Kampala appreciates. But it requires patience — 5+ year horizon.", category: "investing" },
  { body: "Unit trusts on the Uganda Securities Exchange allow investing in diversified funds with small amounts.", category: "investing" },
  { body: "Reinvest profits from your business for at least 2 years before increasing personal withdrawals.", category: "investing" },
  { body: "Your network is your net worth. Relationships with trustworthy business people create investment opportunities.", category: "investing" },

  // mindset
  { body: "Financial stress is normal. The fact that you're tracking money means you're already ahead of most.", category: "mindset" },
  { body: "Compare your finances to your past self, not to others. Everyone's journey is different.", category: "mindset" },
  { body: "A missed savings day is not a failure — just resume the next day. Streaks reset; discipline doesn't.", category: "mindset" },
  { body: "Money is a tool. The goal isn't to accumulate it — it's to use it to build the life you want.", category: "mindset" },
  { body: "Talk about money with your spouse or partner. Financial secrecy destroys households.", category: "mindset" },
  { body: "Teach your children about money early. Let them save part of any pocket money they receive.", category: "mindset" },
  { body: "Don't lend money you can't afford to lose. Treat loans to friends and family as gifts mentally.", category: "mindset" },
  { body: "Celebrate small financial wins. Hitting a savings milestone deserves recognition.", category: "mindset" },
  { body: "Avoid financial FOMO. Someone else's phone upgrade or holiday shouldn't derail your plan.", category: "mindset" },
  { body: "The best financial plan is one you can actually follow. Don't build a budget too strict to sustain.", category: "mindset" },
  { body: "Give generously within your means. Generosity creates community, and community creates resilience.", category: "mindset" },
  { body: "If you earn more, save more — not just spend more. Lifestyle inflation is the silent budget killer.", category: "mindset" },
  { body: "Financial goals without a timeline are just wishes. Set a date for every goal in MyTereka.", category: "mindset" },

  // income
  { body: "Diversify income streams. If your main income stopped tomorrow, would you survive 3 months?", category: "income" },
  { body: "Freelance skills (design, coding, writing, tutoring) can earn extra income on weekends.", category: "income" },
  { body: "Upwork and online platforms pay in USD — at today's rates, even $50/month is significant in UGX.", category: "income" },
  { body: "Your salary is not your only option. Identify one skill you can monetize outside of work.", category: "income" },
  { body: "Track all income sources in MyTereka — even small amounts from side work.", category: "income" },
  { body: "Negotiate your salary at review time. Silence costs you money every month.", category: "income" },
  { body: "Agribusiness: growing tomatoes, onions, or maize seasonally can generate meaningful income with low capital.", category: "income" },
  { body: "Renting out a room, a vehicle, or equipment you own is passive income. List what you have.", category: "income" },
  { body: "Every skill can be taught. If you know Excel, Photoshop, or cooking, you can charge for lessons.", category: "income" },
  { body: "Identify one recurring expense you can turn into a business — e.g. pay rent for a house vs. build and charge others.", category: "income" },

  // debt
  { body: "Pay off high-interest debt before saving for anything else. Interest is the enemy of savings.", category: "debt" },
  { body: "If you have mobile money loans (MoMo loan, Airtel Mambo), pay them off at month-end — interest is steep.", category: "debt" },
  { body: "Don't borrow for consumption (food, clothes, entertainment). Only borrow for assets that generate income.", category: "debt" },
  { body: "Microfinance interest rates in Uganda can exceed 30% annually. Read the fine print before borrowing.", category: "debt" },
  { body: "Clear one debt fully before starting a new one. Focus beats spreading thin payments.", category: "debt" },
  { body: "If you're in debt, pause non-essential savings goals and redirect to debt repayment first.", category: "debt" },
  { body: "Credit is not free money. Every UGX borrowed today costs more UGX tomorrow.", category: "debt" },

  // school_fees
  { body: "Schools release fee balances every term. Budget for them in January, May, and September.", category: "school_fees" },
  { body: "Start saving for next term's school fees on the first day you pay this term's fees.", category: "school_fees" },
  { body: "School requirements lists come late. Budget UGX 20–50k above stated fees for extras.", category: "school_fees" },
  { body: "Some schools offer discounts for early or full fee payment. Ask your school about this.", category: "school_fees" },
  { body: "University application and enrollment fees add up — save specifically for these, separate from tuition.", category: "school_fees" },
  { body: "Government bursary programs exist for top-performing students. Investigate NCHE and government schemes.", category: "school_fees" },

  // health
  { body: "Budget for medical costs. Even if you're healthy, set aside UGX 20,000/month for emergencies.", category: "health" },
  { body: "NHIF/NMS health schemes can reduce out-of-pocket hospital costs. Ask your employer if enrolled.", category: "health" },
  { body: "Preventive health (clean water, mosquito nets, fruit, vegetables) is cheaper than hospital treatment.", category: "health" },
  { body: "Generic medicines at government health centers cost far less than branded drugs at private clinics.", category: "health" },
  { body: "Mental health matters. Financial stress is one of the biggest causes of poor health — address both.", category: "health" },

  // goals
  { body: "A goal without a number is just a wish. Set the exact amount you want to save, and by when.", category: "goals" },
  { body: "Break big goals into milestones. Celebrate when you hit 25%, 50%, and 75% — not just 100%.", category: "goals" },
  { body: "Shared savings goals with family or friends create accountability and reduce temptation to quit.", category: "goals" },
  { body: "When you miss a savings deposit, don't skip the next one — make it up plus the usual amount.", category: "goals" },
  { body: "Your goals will change. Review them every 3 months and adjust — that's wisdom, not failure.", category: "goals" },
  { body: "Completing a savings goal, no matter how small, builds the muscle memory for larger ones.", category: "goals" },
  { body: "Visualize what completing your goal looks like — the house, the graduation, the trip. Keep that in mind.", category: "goals" },
  { body: "Auto-debit to your goal account on payday. What you don't see, you don't spend.", category: "goals" },

  // general_ug
  { body: "End-month prices in Kampala rise. Do grocery shopping in the middle of the month to spend less.", category: "general_ug" },
  { body: "Bodaboda is convenient but expensive for daily commutes. Matatus cost 2–5x less per trip.", category: "general_ug" },
  { body: "Power outages increase generator fuel costs. Invest in energy-saving bulbs and charge devices during grid hours.", category: "general_ug" },
  { body: "Seasonal price drops: buy in bulk during harvest season (beans, maize, groundnuts) and store.", category: "general_ug" },
  { body: "Foreign exchange moves. If you earn in UGX but have USD costs, track the rate monthly.", category: "general_ug" },
  { body: "During Ramadan and holidays, markets get expensive. Stock essentials a week before.", category: "general_ug" },
  { body: "Water jerry cans: if you buy water, track the monthly cost — it's often more than people think.", category: "general_ug" },
  { body: "Charcoal prices spike in dry season. Buy and store a bag or two when prices are low.", category: "general_ug" },
  { body: "Many Ugandan banks charge monthly account maintenance fees. Check your statement and switch if needed.", category: "general_ug" },
  { body: "Property in peri-urban areas (Wakiso, Mukono, Jinja) is cheaper than Kampala and appreciating fast.", category: "general_ug" },
  { body: "Reinvesting profits in your own business before paying yourself is how small businesses survive the first two years.", category: "general_ug" },
  { body: "Wedding contributions (kwanjula, introduction): budget for these as a social obligation expense, not a surprise.", category: "general_ug" },
  { body: "Church tithe and giving: if you practice this, budget it explicitly — don't let it disrupt your savings plan.", category: "general_ug" },
  { body: "Funeral contributions happen unexpectedly. Keep UGX 20,000–50,000 reserved for this social obligation.", category: "general_ug" },
  { body: "Tax on MoMo withdrawals (0.5% levy) adds up. Factor it into your cash-out calculations.", category: "general_ug" },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/seed-tips.ts
git commit -m "feat(tips): add 150 Ugandan financial tips seed data"
```

---

## Task C2: Tips DB schema, seeding, and rotation logic

**Files:**
- Modify: `src/lib/actions/auth.ts`
- Modify: `src/lib/actions/profile.ts`

- [ ] **Step 1: Assign tip seed on registration**

In `src/lib/actions/auth.ts`, add to imports:

```typescript
import { users, categories, accounts, badges, userTipSeeds } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
```

After the badge seeding block in `registerUser`, add:

```typescript
const tipSeed = Math.floor(Math.random() * 9000) + 1000 // 1000–9999
await db.insert(userTipSeeds).values({ userId: user.id, seed: tipSeed })
```

- [ ] **Step 2: Add tip seeding script (one-time)**

Add a new server action at the bottom of `src/lib/actions/profile.ts` — this will be called once manually:

```typescript
import { financialTips, userTipSeeds } from '@/lib/schema'
import { FINANCIAL_TIPS } from '@/lib/seed-tips'

export async function seedFinancialTips(): Promise<{ inserted: number }> {
  // Only run if table is empty
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(financialTips)
  if (Number(count) > 0) return { inserted: 0 }
  const rows = await db.insert(financialTips).values(FINANCIAL_TIPS).returning({ id: financialTips.id })
  return { inserted: rows.length }
}
```

- [ ] **Step 3: Add `getDailyTip` action**

Add to `src/lib/actions/profile.ts`:

```typescript
export type DailyTip = { body: string; category: string | null }

export async function getDailyTip(): Promise<DailyTip | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const [seedRow] = await db
    .select({ seed: userTipSeeds.seed })
    .from(userTipSeeds)
    .where(eq(userTipSeeds.userId, userId))

  if (!seedRow) return null

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(financialTips)

  if (!total || Number(total) === 0) return null

  // Days since Unix epoch in EAT
  const dayIndex = Math.floor((Date.now() + 3 * 60 * 60 * 1000) / 86400000)
  const tipId = ((seedRow.seed + dayIndex) % Number(total)) + 1

  const [tip] = await db
    .select({ body: financialTips.body, category: financialTips.category })
    .from(financialTips)
    .where(eq(financialTips.id, tipId))

  return tip ?? null
}
```

- [ ] **Step 4: Seed tips via Drizzle Studio**

```bash
bun db:studio
```

In Studio, manually call or verify the `financial_tips` table is populated. Alternatively, create a temporary API route to trigger `seedFinancialTips()` once, then delete it:

Create `app/api/seed-tips/route.ts` (delete after use):
```typescript
import { seedFinancialTips } from '@/lib/actions/profile'
import { NextResponse } from 'next/server'

export async function GET() {
  const result = await seedFinancialTips()
  return NextResponse.json(result)
}
```

Run: `curl http://localhost:3000/api/seed-tips`  
Expected: `{"inserted":150}`  
Then delete this file.

- [ ] **Step 5: Wire daily tip to dashboard**

In `app/(app)/page.tsx`, add tip fetch alongside existing data fetches:

```typescript
import { getDailyTip } from '@/lib/actions/profile'
// ...
const [/* existing */, dailyTip] = await Promise.all([
  /* existing fetches */,
  getDailyTip(),
])
// Pass dailyTip to DashboardClient
```

In `app/(app)/dashboard-client.tsx`, add `dailyTip` prop to the `Props` type:
```typescript
dailyTip: { body: string; category: string | null } | null
```

Add the tip card below the greeting section:
```tsx
{dailyTip && (
  <div className="card-base flex gap-3 items-start">
    <div className="mt-0.5 shrink-0">💡</div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--primary)' }}>
        Tip of the Day
      </p>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{dailyTip.body}</p>
    </div>
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/actions/auth.ts src/lib/actions/profile.ts app/\(app\)/page.tsx app/\(app\)/dashboard-client.tsx
git commit -m "feat(tips): daily tip rotation with user seed, dashboard tip card"
```

---

## Task D1: CSS keyframes for isometric map

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add tile and avatar keyframes**

Find the end of the `@keyframes` blocks in `app/globals.css` and add:

```css
@keyframes tile-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
  50%       { box-shadow: 0 0 0 14px rgba(245, 158, 11, 0); }
}

@keyframes avatar-bounce {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-7px); }
}

.tile-current {
  animation: tile-pulse 1.8s ease-in-out infinite;
}

.avatar-pin {
  animation: avatar-bounce 1.4s ease-in-out infinite;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat(map): add tile-pulse and avatar-bounce CSS animations"
```

---

## Task D2: Isometric milestone tile component

**Files:**
- Create: `src/components/goal-map-milestone-tile.tsx`

- [ ] **Step 1: Create component**

Create `src/components/goal-map-milestone-tile.tsx`:

```tsx
'use client'

import type { LucideIcon } from 'lucide-react'

type TileState = 'completed' | 'current' | 'locked'

type Props = {
  state:      TileState
  Icon:       LucideIcon
  label:      string
  pct:        number
  xp:         number
  side:       'left' | 'right'
}

const STATE_STYLES: Record<TileState, { bg: string; iconColor: string; badgeStyle: string }> = {
  completed: {
    bg:          'var(--primary)',
    iconColor:   '#ffffff',
    badgeStyle:  'background: var(--primary-dark); color: #fff;',
  },
  current: {
    bg:          'var(--warning)',
    iconColor:   '#ffffff',
    badgeStyle:  'background: #92400e; color: #fef3c7;',
  },
  locked: {
    bg:          'var(--card)',
    iconColor:   'var(--muted-foreground)',
    badgeStyle:  'background: var(--muted); color: var(--muted-foreground);',
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
        {/* Tile — isometric using CSS 3D */}
        <div style={{ perspective: '400px' }}>
          <div
            className={state === 'current' ? 'tile-current' : ''}
            style={{
              width:            80,
              height:           80,
              borderRadius:     18,
              background:       s.bg,
              transform:        'rotateX(20deg) rotateZ(-5deg)',
              boxShadow:        state === 'completed'
                ? '0 8px 0 rgba(0,160,129,0.5), 0 12px 20px rgba(0,0,0,0.4)'
                : state === 'current'
                ? '0 8px 0 rgba(180,100,0,0.5), 0 12px 20px rgba(0,0,0,0.4)'
                : '0 6px 0 rgba(0,0,0,0.3), 0 10px 16px rgba(0,0,0,0.3)',
              display:          'flex',
              alignItems:       'center',
              justifyContent:   'center',
              transition:       'background 0.5s, box-shadow 0.5s',
              cursor:           isLocked ? 'default' : 'pointer',
            }}
          >
            <Icon size={32} color={s.iconColor} strokeWidth={2} />
          </div>
        </div>

        {/* Badge */}
        {pct > 0 && (
          <div
            className="rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap"
            style={Object.fromEntries(s.badgeStyle.split(';').filter(Boolean).map((p) => {
              const [k, v] = p.split(':').map((x) => x.trim())
              return [k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v]
            }))}
          >
            {pct}% · +{xp} XP
          </div>
        )}

        {/* Label */}
        <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: isLocked ? 'var(--muted-foreground)' : 'var(--foreground)' }}>
          {label}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/goal-map-milestone-tile.tsx
git commit -m "feat(map): isometric GoalMapMilestoneTile component"
```

---

## Task D3: Isometric tile canvas

**Files:**
- Create: `src/components/goal-map-tile-canvas.tsx`

- [ ] **Step 1: Create canvas**

Create `src/components/goal-map-tile-canvas.tsx`:

```tsx
'use client'

import { Flag, Sprout, Zap, Flame, Star, Trophy, Lock } from 'lucide-react'
import { GoalMapMilestoneTile } from './goal-map-milestone-tile'

export const MILESTONE_NODES = [
  { key: 'start', pct: 0,   label: 'Start',         Icon: Flag,   xp: 0   },
  { key: '10',    pct: 10,  label: 'Early Mover',   Icon: Sprout, xp: 20  },
  { key: '25',    pct: 25,  label: 'Quarter Way',   Icon: Zap,    xp: 30  },
  { key: '50',    pct: 50,  label: 'Halfway',       Icon: Flame,  xp: 50  },
  { key: '75',    pct: 75,  label: 'Almost There',  Icon: Star,   xp: 75  },
  { key: '100',   pct: 100, label: 'Goal Complete', Icon: Trophy, xp: 100 },
] as const

type Props = {
  currentPct:        number
  earnedMilestones:  string[]
}

// Decorative path dots between tiles
function PathConnector({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`flex ${side === 'right' ? 'justify-end pr-12' : 'justify-start pl-12'} w-full py-1`}>
      <div className="flex flex-col gap-1.5">
        {[0,1,2].map((i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border)' }} />
        ))}
      </div>
    </div>
  )
}

export function GoalMapTileCanvas({ currentPct, earnedMilestones }: Props) {
  const earnedSet = new Set(earnedMilestones)

  // Determine state of each node
  const nodes = MILESTONE_NODES.map((m, i) => {
    const isDone    = earnedSet.has(m.key) || m.pct === 0
    const isCurrent = !isDone && (
      i === 0 ||
      MILESTONE_NODES[i - 1].pct <= currentPct && m.pct > currentPct
    )
    const state = isDone ? 'completed' : isCurrent ? 'current' : 'locked'
    const side  = i % 2 === 0 ? 'left' : 'right'
    return { ...m, state, side } as const
  })

  // Current node index for avatar
  const currentIdx = nodes.findIndex((n) => n.state === 'current')

  return (
    <div className="flex flex-col items-stretch gap-0 w-full max-w-xs mx-auto select-none pb-8">
      {nodes.map((node, i) => (
        <div key={node.key}>
          <GoalMapMilestoneTile
            state={node.state}
            Icon={node.Icon}
            label={node.label}
            pct={node.pct}
            xp={node.xp}
            side={node.side}
          />
          {i < nodes.length - 1 && (
            <PathConnector side={node.side} />
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/goal-map-tile-canvas.tsx
git commit -m "feat(map): GoalMapTileCanvas with isometric tiles and path connectors"
```

---

## Task D4: Wire tile canvas into personal goal map screen

**Files:**
- Modify: `app/(app)/goals/[id]/map/goal-map-screen.tsx`

- [ ] **Step 1: Replace GoalMapCanvas import**

In `app/(app)/goals/[id]/map/goal-map-screen.tsx` line 11, change:

```typescript
import { GoalMapCanvas, MILESTONE_NODES } from '@/components/goal-map-canvas'
```

to:

```typescript
import { GoalMapTileCanvas, MILESTONE_NODES } from '@/components/goal-map-tile-canvas'
```

- [ ] **Step 2: Replace canvas usage**

Search for `<GoalMapCanvas` in the file and replace with `<GoalMapTileCanvas`. The props are:
- `currentPct` — same
- `earnedMilestones` — same

Remove any props that `GoalMapCanvas` had but `GoalMapTileCanvas` doesn't (e.g., `collectedCoins`, `onCoinCollect`, `onMilestoneFirstEarned`). The new canvas is display-only; coin and milestone events are handled by the screen after contribution via the existing `onSuccess` callback.

- [ ] **Step 3: Verify personal map**

`bun dev`. Open any personal goal's map page. Confirm isometric tiles render, completed milestones are teal, current is gold/amber, locked are dark.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/goals/\[id\]/map/goal-map-screen.tsx
git commit -m "feat(map): wire isometric tile canvas into personal goal map"
```

---

## Task D5: Shared goal map

**Files:**
- Modify: `src/lib/actions/shared-goals.ts`
- Create: `app/(app)/goals/shared/[id]/map/page.tsx`
- Create: `app/(app)/goals/shared/[id]/map/shared-goal-map-screen.tsx`
- Create: `app/(app)/goals/shared/[id]/map/loading.tsx`
- Modify: `app/(app)/goals/shared/[id]/shared-goal-detail-client.tsx`

- [ ] **Step 1: Add `getSharedGoalMapData` server action**

In `src/lib/actions/shared-goals.ts`, add at the bottom:

```typescript
export type SharedGoalMapData = {
  goal: {
    id:            string
    name:          string
    icon:          string | null
    targetAmount:  number
    currentAmount: number
    isCompleted:   boolean
  }
  members: {
    userId:           string
    name:             string
    avatarUrl:        string | null
    totalContributed: number
  }[]
  currentPct: number
  earnedMilestones: string[]
}

export async function getSharedGoalMapData(sharedGoalId: string): Promise<SharedGoalMapData | null> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const userId = session.user.id

  const [goal] = await db
    .select({
      id:            sharedGoals.id,
      name:          sharedGoals.name,
      icon:          sharedGoals.icon,
      targetAmount:  sharedGoals.targetAmount,
      currentAmount: sharedGoals.currentAmount,
      isCompleted:   sharedGoals.isCompleted,
    })
    .from(sharedGoals)
    .innerJoin(sharedGoalMembers, eq(sharedGoalMembers.sharedGoalId, sharedGoals.id))
    .where(and(eq(sharedGoals.id, sharedGoalId), eq(sharedGoalMembers.userId, userId), eq(sharedGoalMembers.status, 'active')))

  if (!goal) return null

  const contributions = await db
    .select({
      userId:    sharedGoalContributions.userId,
      name:      users.name,
      avatarUrl: users.avatarUrl,
      amount:    sharedGoalContributions.amount,
      isRefund:  sharedGoalContributions.isRefund,
    })
    .from(sharedGoalContributions)
    .innerJoin(users, eq(sharedGoalContributions.userId, users.id))
    .where(eq(sharedGoalContributions.sharedGoalId, sharedGoalId))

  // Aggregate per member
  const memberMap = new Map<string, { userId: string; name: string; avatarUrl: string | null; totalContributed: number }>()
  for (const c of contributions) {
    const prev = memberMap.get(c.userId) ?? { userId: c.userId, name: c.name, avatarUrl: c.avatarUrl, totalContributed: 0 }
    prev.totalContributed += c.isRefund ? -c.amount : c.amount
    memberMap.set(c.userId, prev)
  }
  const members = [...memberMap.values()].sort((a, b) => b.totalContributed - a.totalContributed)

  const currentPct = goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
    : 0

  // Derive earned milestones from currentPct
  const MILESTONE_PCTS = [10, 25, 50, 75, 100]
  const earnedMilestones = MILESTONE_PCTS.filter((p) => currentPct >= p).map((p) => String(p))
  if (currentPct >= 0) earnedMilestones.unshift('start')

  return { goal, members, currentPct, earnedMilestones }
}
```

Also add missing imports at top of the file if not present:
```typescript
import { sharedGoals, sharedGoalMembers, sharedGoalContributions, users } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
```

- [ ] **Step 2: Create shared map page**

Create `app/(app)/goals/shared/[id]/map/page.tsx`:

```tsx
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getSharedGoalMapData } from '@/lib/actions/shared-goals'
import { SharedGoalMapScreen } from './shared-goal-map-screen'

export default async function SharedGoalMapPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')
  const { id } = await params
  const data = await getSharedGoalMapData(id)
  if (!data) notFound()
  return <SharedGoalMapScreen data={data} />
}
```

- [ ] **Step 3: Create loading skeleton**

Create `app/(app)/goals/shared/[id]/map/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function SharedGoalMapLoading() {
  return (
    <div className="max-w-xs mx-auto p-4 flex flex-col gap-6">
      <Skeleton className="h-10 w-40" />
      {[0,1,2,3,4,5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
    </div>
  )
}
```

- [ ] **Step 4: Create shared map screen client**

Create `app/(app)/goals/shared/[id]/map/shared-goal-map-screen.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { GoalMapTileCanvas } from '@/components/goal-map-tile-canvas'
import { formatUGX } from '@/lib/format'
import type { SharedGoalMapData } from '@/lib/actions/shared-goals'

export function SharedGoalMapScreen({ data }: { data: SharedGoalMapData }) {
  const { goal, members, currentPct, earnedMilestones } = data

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pt-6">
        <Link href={`/goals/shared/${goal.id}`} style={{ color: 'var(--muted-foreground)' }}>←</Link>
        <h1 className="font-bold text-lg truncate">{goal.name}</h1>
      </div>

      {/* Group avatar + progress */}
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="avatar-pin flex items-center justify-center w-16 h-16 rounded-full" style={{ background: 'var(--primary)' }}>
          <Users size={28} color="#fff" />
        </div>
        <p className="text-2xl font-black" style={{ color: 'var(--primary)' }}>{currentPct}%</p>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {formatUGX(goal.currentAmount)} of {formatUGX(goal.targetAmount)}
        </p>
      </div>

      {/* Tile map */}
      <div className="flex-1 overflow-y-auto px-4">
        <GoalMapTileCanvas currentPct={currentPct} earnedMilestones={earnedMilestones} />
      </div>

      {/* Member leaderboard */}
      <div className="mx-4 mb-4 card-base">
        <p className="font-bold text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>Contributors</p>
        {members.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No contributions yet.</p>
        )}
        {members.map((m, i) => (
          <div key={m.userId} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--muted-foreground)' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--primary)', color: '#fff' }}>
                {m.name[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium">{m.name}</span>
            </div>
            <span className="text-sm font-bold amount-income">{formatUGX(m.totalContributed)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Add View Map button to shared goal detail**

Open `app/(app)/goals/shared/[id]/shared-goal-detail-client.tsx`. Find the header or action area and add:

```tsx
import Link from 'next/link'
import { Map } from 'lucide-react'
// In the component JSX, add near the top actions area:
<Link
  href={`/goals/shared/${detail.id}/map`}
  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
  style={{ background: 'var(--primary)', color: '#fff' }}
>
  <Map size={16} /> View Map
</Link>
```

- [ ] **Step 6: Verify**

`bun dev`. Open a shared goal → click "View Map". Confirm tile map renders with group avatar and contributor leaderboard.

- [ ] **Step 7: Commit**

```bash
git add src/lib/actions/shared-goals.ts app/\(app\)/goals/shared/\[id\]/map/ app/\(app\)/goals/shared/\[id\]/shared-goal-detail-client.tsx
git commit -m "feat(map): shared goal isometric map with group avatar and contributor leaderboard"
```

---

## Task E1: In-app rating prompt

**Files:**
- Modify: `src/lib/actions/transactions.ts`
- Modify: `src/lib/actions/profile.ts`
- Create: `src/components/rating-modal.tsx`
- Modify: `src/components/add-transaction-sheet.tsx`

- [ ] **Step 1: Return rating prompt flag from createTransaction**

In `src/lib/actions/transactions.ts`, add `users` column references to the select and update return type. Change the return at line 102:

```typescript
// After updateStreak and badge calls, check if rating should be prompted
const [{ txCount }] = await db
  .select({ txCount: sql<number>`count(*)` })
  .from(transactions)
  .where(eq(transactions.userId, userId))

const [userRating] = await db
  .select({ appRating: users.appRating, ratingAskedAt: users.ratingAskedAt })
  .from(users)
  .where(eq(users.id, userId))

const promptRating = Number(txCount) === 3 && userRating?.ratingAskedAt === null

if (promptRating) {
  await db
    .update(users)
    .set({ ratingAskedAt: sql`now()` })
    .where(eq(users.id, userId))
}

return { negativeBalance: willGoNegative, promptRating }
```

- [ ] **Step 2: Add `submitAppRating` server action**

Add to `src/lib/actions/profile.ts`:

```typescript
export async function submitAppRating(rating: number): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  if (rating < 1 || rating > 5) throw new Error('Invalid rating')
  await db
    .update(users)
    .set({ appRating: rating })
    .where(eq(users.id, session.user.id))
}
```

- [ ] **Step 3: Create rating modal component**

Create `src/components/rating-modal.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { submitAppRating } from '@/lib/actions/profile'

type Props = {
  open:    boolean
  onClose: () => void
}

export function RatingModal({ open, onClose }: Props) {
  const [hovered,  setHovered]  = useState(0)
  const [selected, setSelected] = useState(0)
  const [pending,  start]       = useTransition()

  function handleSubmit() {
    if (!selected) { toast.error('Please select a rating'); return }
    start(async () => {
      try {
        await submitAppRating(selected)
        toast.success('Thanks for your feedback!')
        onClose()
      } catch {
        toast.error('Could not save rating')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-xs" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <DialogHeader>
          <DialogTitle className="text-center text-lg">How are you liking MyTereka?</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-4">
          {[1,2,3,4,5].map((n) => (
            <button
              key={n}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setSelected(n)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={36}
                strokeWidth={1.5}
                fill={(hovered || selected) >= n ? 'var(--warning)' : 'transparent'}
                color={(hovered || selected) >= n ? 'var(--warning)' : 'var(--muted-foreground)'}
              />
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending || !selected}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {pending ? 'Saving…' : 'Submit'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Trigger rating modal from add-transaction sheet**

Open `src/components/add-transaction-sheet.tsx`. Find where `createTransaction` is called and its result used. Add:

```typescript
import { RatingModal } from '@/components/rating-modal'
// ...
const [showRating, setShowRating] = useState(false)
// ...
// After successful createTransaction:
const result = await createTransaction(...)
if (result.promptRating) {
  setShowRating(true)
}
// ...
// In JSX, before closing tag:
<RatingModal open={showRating} onClose={() => setShowRating(false)} />
```

- [ ] **Step 5: Verify**

`bun dev`. Create exactly 3 transactions. On the 3rd, confirm the rating modal appears. Select stars and submit. Check DB via `bun db:studio` → `users` table → `app_rating` column is set. Creating a 4th transaction must NOT show the modal again.

- [ ] **Step 6: Commit**

```bash
git add src/lib/actions/transactions.ts src/lib/actions/profile.ts src/components/rating-modal.tsx src/components/add-transaction-sheet.tsx
git commit -m "feat(rating): in-app star rating prompt on 3rd transaction"
```

---

## Self-review checklist

**Spec coverage:**
- [x] A1 placeholder — Task A1
- [x] A2 mobile nav budgets — Task A2
- [x] A3 badge display — Task A3
- [x] B0 streak schema — Task 0
- [x] B1 EAT fix + streak history — Task B1
- [x] B2 streak page /streak — Task B2, B3
- [x] C1 tips table — Task 0
- [x] C2 tip seed on register — Task C2
- [x] C3 rotation algorithm — Task C2 `getDailyTip`
- [x] C5 tip content — Task C1
- [x] C6 dashboard tip card — Task C2 step 5
- [x] D1 keyframes — Task D1
- [x] D2 tile component — Task D2
- [x] D3 tile canvas — Task D3
- [x] D4 personal map wired — Task D4
- [x] D5 shared map — Task D5
- [x] E1 rating schema — Task 0
- [x] E2 trigger logic — Task E1 step 1
- [x] E3 rating modal — Task E1 step 3
- [x] E4 server action — Task E1 step 2

**Type consistency:**
- `GoalMapTileCanvas` props: `currentPct: number`, `earnedMilestones: string[]` — consistent D3→D4→D5
- `getSharedGoalMapData` returns `SharedGoalMapData` — used in D5 page and screen
- `createTransaction` returns `{ negativeBalance: boolean, promptRating: boolean }` — E1 step 1 and step 4 match
- `getStreakPageData` return type defined in B2, consumed in B3

**No placeholders found.**
