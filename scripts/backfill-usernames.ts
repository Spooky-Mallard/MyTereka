/**
 * One-off backfill: assign a synthetic username to any user that has none.
 * Pattern: lowercased email prefix + short id suffix to guarantee uniqueness.
 * Safe to re-run — only touches rows where username IS NULL.
 *
 * Run with: npx tsx scripts/backfill-usernames.ts
 */

import { db } from '../src/lib/db'
import { users } from '../src/lib/schema'
import { isNull, eq } from 'drizzle-orm'

async function main() {
  const rows = await db.select({ id: users.id, email: users.email }).from(users).where(isNull(users.username))
  if (rows.length === 0) {
    console.log('No users need backfill.')
    return
  }
  console.log(`Backfilling ${rows.length} user(s)...`)
  for (const row of rows) {
    const prefix = row.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 14)
    const suffix = row.id.replace(/-/g, '').slice(0, 5)
    const handle = `${prefix || 'user'}_${suffix}`.slice(0, 20)
    await db.update(users).set({ username: handle }).where(eq(users.id, row.id))
    console.log(`  ${row.email} -> ${handle}`)
  }
  console.log('Done.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
