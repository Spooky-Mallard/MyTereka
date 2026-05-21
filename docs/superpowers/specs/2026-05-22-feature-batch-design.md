# MyTereka Feature Batch — Design Spec
**Date:** 2026-05-22  
**Scope:** Quick fixes, Streak calendar, Financial tips, Isometric tile map (personal + shared), In-app rating

---

## Context

Several features need fixing or building across the app:
- Streak system triggers correctly but has no dedicated viewing page
- Financial tips are hardcoded strings, not a real rotating system
- Goal map works but uses a plain SVG path; user wants an isometric tile aesthetic (reference: TENS! Adventure game)
- Shared goals have no map at all
- Mobile bottom nav lacks Budgets
- Badges tab exists but may have display issues
- Registration has a personal placeholder name
- No in-app rating system

---

## A — Quick Fixes

### A1: Registration placeholder
**File:** `app/(bare)/auth/register/page.tsx` line 98  
Change `placeholder="Atong Precious Olanya"` → `placeholder="John Doe"`

### A2: Mobile bottom nav — replace Profile with Budgets
**File:** `src/components/app-shell.tsx` lines 15–21  
Replace the `Profile` nav item with `Budgets` pointing to `/budgets` (use `Wallet` icon from lucide-react).  
Profile remains accessible via the avatar in the top bar (already implemented on desktop sidebar).

### A3: Badge display audit
**File:** `app/(app)/profile/profile-client.tsx`  
Verify `getEarnedBadges()` is called with correct userId. If badges aren't showing, the likely cause is a missing `await auth()` or the seed function `seedGoalBadges()` not having been run. Add a seed call inside `registerUser` in `src/lib/actions/auth.ts` if not already present.

---

## B — Streak System

### B1: Verify streak trigger
**File:** `src/lib/actions/transactions.ts`  
`updateStreak()` must be called inside `createTransaction()` within the same DB transaction. Confirm it's called after every successful transaction write (expense, income, investment — not just one type).

### B2: Streak calendar page — `/streak`

**Route:** `app/(app)/streak/page.tsx` (Server Component)  
**Data needed:** `streakCount`, `lastActiveDate`, all transaction dates for past 90 days (to build the calendar grid)

**Layout:**
```
┌─────────────────────────────────┐
│  🔥 14-day streak               │  ← header card, gold flame
│  Keep it up!                    │
├─────────────────────────────────┤
│  This Month  │  Last Month      │  ← tab or scroll
│                                 │
│  Mon Tue Wed Thu Fri Sat Sun    │
│  [●] [●] [○] [●] [●] [●] [●]  │  ← gold = active, grey = missed
│  [●] [●] [●] [●] [●] [○] [●]  │
│  ...                            │
├─────────────────────────────────┤
│  Longest streak: 21 days        │
│  Total active days: 47          │
└─────────────────────────────────┘
```

**Calendar logic:**
- Query all distinct transaction dates for the user from the past 90 days
- Build a 3-month rolling grid (current month + 2 prior months)
- A day is "active" (gold dot, `.streak-dot`) if at least one transaction exists on that date in EAT timezone
- Missed days get `.streak-dot-empty`
- Today's cell highlighted in teal border if active, gold border if streak ongoing
- Display longest streak and total active days as stat chips

**Navigation:** Dashboard streak section (flame icon + count) → tappable → `router.push('/streak')`

**Schema:** No new columns needed. Query `transactions` table for distinct dates.

**Stats query:** Compute `longestStreak` and `totalActiveDays` in the Server Component by sorting the date array.

---

## C — Financial Tips System

### C1: Database table

Add to `src/lib/schema.ts`:
```typescript
export const financialTips = pgTable('financial_tips', {
  id:       integer('id').primaryKey().generatedAlwaysAsIdentity(),
  body:     text('body').notNull(),
  category: varchar('category', { length: 50 }),  // 'saving' | 'budgeting' | 'investing' | 'mobile_money'
})

export const userTipSeeds = pgTable('user_tip_seeds', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  seed:   integer('seed').notNull(),
})
```

### C2: Tip seed assignment
- On `registerUser`, generate a random integer seed (1–9999) and insert into `userTipSeeds`
- Seed never changes — it determines tip order for that user forever

### C3: Daily tip rotation algorithm
```
dayIndex = daysSinceEpoch(today_EAT)
tipIndex = (seed + dayIndex) % totalTips
```
- Every user sees a different tip on any given day (offset by their seed)
- Same user sees the same tip on the same day across devices
- After `totalTips` days, cycle repeats (once per year if 365 tips)

### C4: Tip seen tracking
- No DB tracking of "seen" tips — the cycle handles it mathematically
- After one full cycle (365 days), tips repeat — acceptable

### C5: Tip content
Generate 150+ Ugandan-context financial tips covering:
- MTN MoMo / Airtel Money savings habits
- SACCO participation
- Market vs supermarket spending
- School fees planning
- Matooke / beans / local food budgeting
- Emergency fund in mobile money
- Interest on loans (microfinance awareness)
- Goal-based saving habits
- Budget tracking motivation

Store as a seed file: `src/lib/seed-tips.ts` — array of 150+ strings. Run once via a script or admin route.

### C6: Dashboard placement
**File:** `app/(app)/dashboard-client.tsx`  
Below the greeting section, add a `DailyTip` card:
```
┌─────────────────────────────────┐
│  💡 Tip of the Day              │
│  "Buying from local markets     │
│   instead of supermarkets saves │
│   up to 40% on groceries."      │
└─────────────────────────────────┘
```
Fetch tip server-side in `app/(app)/page.tsx` and pass as prop.

---

## D — Isometric Tile Map

### D1: Visual design

Replace the current SVG Bezier-curve path with an **isometric tile grid** aesthetic:

**Tile states:**
- **Completed milestone:** Teal tile (`--primary`) elevated with drop shadow, trophy/icon on top
- **Locked milestone:** Navy/muted tile (`--card` bg, `--muted` border), lock icon on top, 40% opacity
- **Current position (gold):** Amber tile (`--warning`), pulsing glow animation, avatar pinned on top
- **Path tiles between milestones:** Smaller neutral tiles (decorative, non-interactive), scattered between milestone tiles to give journey feel

**Badge on each milestone tile:**
```
┌────────────────┐
│  [Icon]        │  ← milestone icon (Sprout, Zap, Flame, Star, Trophy)
│  50% • +50 XP │  ← yellow pill badge below icon
└────────────────┘
```

**Implementation approach — CSS 3D transforms (not WebGL):**

Use `div`-based tiles with CSS `transform: rotateX(45deg) rotateZ(45deg)` (isometric projection) rather than true SVG. This keeps it web-native, accessible, and easier to animate.

Each tile is a styled `div` stacked vertically in a scroll container, with the isometric transform applied via a wrapper. Tiles alternate left/right offset to create the zigzag path feel from the reference image.

**Component structure:**
```
<GoalMapTileCanvas>           ← scrollable container, perspective set
  <TilePath>                  ← renders path tiles between milestones
  <MilestoneTile key="start"> ← completed/locked/current state
  <MilestoneTile key="10">
  ...
  <MilestoneTile key="100">
  <AvatarPin>                 ← sits on current tile, bounces
</GoalMapTileCanvas>
```

**Files to create/replace:**
- `src/components/goal-map-tile-canvas.tsx` — new canvas (replace `goal-map-canvas.tsx`)
- `src/components/goal-map-milestone-tile.tsx` — single tile with all states
- `src/components/goal-map-avatar-pin.tsx` — avatar on current tile (reuse from existing if possible)

**Animations:**
- Completed tiles: `scale(1)` on load, no animation (already done)
- Current tile: `--warning` amber color + CSS `box-shadow` pulse (keyframe in `globals.css`)
- Avatar pin: gentle bounce (`translateY(-4px)` loop, 1.2s ease-in-out)
- On contribution: tile transitions from locked→current or current→completed with color shift + scale pop

### D2: Personal goal map — no data changes
The existing route `app/(app)/goals/[id]/map/` stays. Only the canvas component is replaced. Data fetching (`getGoalMapData`) unchanged.

### D3: Shared goal map — new route

**Route:** `app/(app)/goals/shared/[id]/map/page.tsx`

**Data:** `getSharedGoalMapData(id)` — new server action in `src/lib/actions/shared-goals.ts`
```typescript
// Returns:
{
  goal: SharedGoal,
  members: { userId, name, avatarUrl, totalContributed }[],
  milestones: { key, reachedAt }[],
  coins: { coinIndex, collectedAt }[],
  currentPct: number,
}
```

**Shared map differences vs personal:**
- **Single shared avatar** = group icon (e.g., `Users` lucide icon in a circle, teal bg)
- Tile progression = aggregated `currentAmount / targetAmount` — same milestone thresholds (10/25/50/75/100%)
- **Leaderboard panel** below the map: who contributed what (sorted by amount desc), showing name + avatar + UGX amount
- No individual avatars moving — one group avatar on the current tile

**Navigation:** From `app/(app)/goals/shared/[id]/page.tsx`, add a "View Map" button (same pattern as personal goal's Map button in GoalCard)

### D4: Globals.css additions
```css
/* Isometric tile pulse — current position */
@keyframes tile-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); }
  50%       { box-shadow: 0 0 0 12px rgba(245, 158, 11, 0); }
}

/* Avatar pin bounce */
@keyframes avatar-bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}
```

---

## E — In-App Rating

### E1: Schema
Add to `users` table in `src/lib/schema.ts`:
```typescript
appRating:     integer('app_rating'),           // 1-5, null = not yet rated
ratingAskedAt: timestamp('rating_asked_at', { withTimezone: true }),
```

### E2: Trigger logic
- After `createTransaction()` succeeds, count the user's total transactions
- If `totalTransactions === 3` AND `ratingAskedAt IS NULL`: set `ratingAskedAt = now()` and return a flag `{ promptRating: true }` to the client
- Client receives the flag → shows rating modal

### E3: Rating modal UI
**Component:** `src/components/rating-modal.tsx`  
Shown as a Dialog (shadcn `dialog.tsx`):

```
┌─────────────────────────────────┐
│  How are you liking MyTereka?   │
│                                 │
│  ⭐ ⭐ ⭐ ⭐ ⭐               │  ← tap stars
│                                 │
│  [Skip]          [Submit]       │
└─────────────────────────────────┘
```

- Stars are interactive — tap to select 1–5
- "Skip" → closes modal, does NOT set rating. `ratingAskedAt` was already set when the prompt triggered, so the gate (`ratingAskedAt IS NOT NULL`) prevents re-prompting on future transactions.
- "Submit" → calls `submitAppRating(rating)` server action, closes modal, shows success toast

### E4: Server action
`src/lib/actions/profile.ts` — add `submitAppRating(rating: number)`:
- Validates 1 ≤ rating ≤ 5
- Updates `users.appRating` and `users.ratingAskedAt` for the authenticated user

---

## Schema Migration Summary

New columns/tables requiring `bun db:push`:
1. `users.appRating` (integer, nullable)
2. `users.ratingAskedAt` (timestamp, nullable)
3. `financial_tips` table (id, body, category)
4. `user_tip_seeds` table (userId, seed)

No existing columns removed or renamed.

---

## Verification

1. **Quick fixes:** Register page shows "John Doe" placeholder; mobile nav shows Budgets instead of Profile; badges tab shows earned badges
2. **Streak:** Create a transaction → `streakCount` increments in DB; navigate to `/streak` → calendar shows today as gold dot
3. **Tips:** Seed tips table with script; dashboard shows tip card; different users on same day see different tips
4. **Map:** Personal goal map renders isometric tiles; contribute → tile transitions color; shared goal → map button visible → shared map shows group avatar + member leaderboard
5. **Rating:** On 3rd transaction creation, rating modal appears; star selection + submit → `appRating` saved in DB; modal does not appear again on 4th+ transaction
