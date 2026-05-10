'use server'

import { db } from '@/lib/db'
import { users, categories, accounts } from '@/lib/schema'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food',              icon: 'utensils',    color: '#F59E0B' },
  { name: 'Internet/Data',     icon: 'wifi',        color: '#3B82F6' },
  { name: 'Transport',         icon: 'bus',         color: '#8B5CF6' },
  { name: 'Rent',              icon: 'home',        color: '#EF4444' },
  { name: 'School Materials',  icon: 'book',        color: '#10B981' },
  { name: 'Clothing/Fashion',  icon: 'shirt',       color: '#EC4899' },
  { name: 'Giving/Charity',    icon: 'heart',       color: '#F97316' },
  { name: 'Entertainment',     icon: 'music',       color: '#6366F1' },
  { name: 'Health',            icon: 'activity',    color: '#14B8A6' },
]

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary/Wages',    icon: 'briefcase',   color: '#00B894' },
  { name: 'Allowance',       icon: 'wallet',      color: '#00B894' },
  { name: 'Freelance/Gigs',  icon: 'laptop',      color: '#00B894' },
  { name: 'Business',        icon: 'trending-up', color: '#00B894' },
  { name: 'Upwork',          icon: 'globe',       color: '#00B894' },
  { name: 'Other',           icon: 'plus-circle', color: '#94A3B8' },
]

const DEFAULT_INVESTMENT_CATEGORIES = [
  { name: 'Savings',     icon: 'piggy-bank',  color: '#00B894' },
  { name: 'SACCO',       icon: 'building',    color: '#3B82F6' },
  { name: 'Stocks',      icon: 'trending-up', color: '#8B5CF6' },
  { name: 'Crypto',      icon: 'bitcoin',     color: '#F59E0B' },
  { name: 'Fixed Deposit', icon: 'lock',      color: '#10B981' },
]

const DEFAULT_ACCOUNTS = [
  { name: 'MTN Mobile Money', type: 'mobile_money' as const, balance: 0 },
  { name: 'Cash',             type: 'cash'         as const, balance: 0 },
]

export async function registerUser(formData: FormData) {
  const name     = (formData.get('name')     as string)?.trim()
  const email    = (formData.get('email')    as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)
  const mobile   = (formData.get('mobile')   as string)?.trim()

  if (!name || !email || !password) return { error: 'All fields are required' }
  if (password.length < 8)          return { error: 'Password must be at least 8 characters' }
  if (mobile && !/^256[0-9]{9}$/.test(mobile))
    return { error: 'Mobile number must be in format 256XXXXXXXXX (Uganda)' }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existing.length > 0) return { error: 'An account with this email already exists' }

  const passwordHash = await bcrypt.hash(password, 12)

  const [user] = await db.insert(users).values({
    name,
    email,
    passwordHash,
    mobileNumber: mobile || null,
    theme:        'dark',
    currency:     'UGX',
    xpPoints:     0,
    level:        'Beginner',
    streakCount:  0,
  }).returning({ id: users.id })

  await db.insert(categories).values([
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
      ...c, userId: user.id, type: 'expense' as const, isDefault: true,
    })),
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({
      ...c, userId: user.id, type: 'income' as const, isDefault: true,
    })),
    ...DEFAULT_INVESTMENT_CATEGORIES.map((c) => ({
      ...c, userId: user.id, type: 'investment' as const, isDefault: true,
    })),
  ])

  await db.insert(accounts).values(
    DEFAULT_ACCOUNTS.map((a) => ({ ...a, userId: user.id })),
  )

  return { success: true }
}
