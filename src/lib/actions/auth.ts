'use server'

import { db } from '@/lib/db'
import { users, categories, accounts, badges } from '@/lib/schema'
import bcrypt from 'bcryptjs'
import { eq, sql } from 'drizzle-orm'

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

const BASE_BADGES = [
  { name: 'First Steps',   description: 'Logged your first transaction',          icon: '🐾', xpReward: 0,  triggerEvent: 'first_transaction' },
  { name: 'Streak Master', description: 'Reached a 7-day streak',                 icon: '🔥', xpReward: 50, triggerEvent: 'streak_7'          },
  { name: 'Goal Getter',   description: 'Completed your first goal',              icon: '🎯', xpReward: 0,  triggerEvent: 'goal_completed'    },
  { name: 'Budget Boss',   description: 'Stayed under budget for a full period',  icon: '💰', xpReward: 20, triggerEvent: 'budget_completed'  },
  { name: 'Team Player',   description: 'Joined a group savings goal',            icon: '🤝', xpReward: 0,  triggerEvent: 'group_joined'      },
]

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

export async function registerUser(formData: FormData) {
  const name     = (formData.get('name')     as string)?.trim()
  const email    = (formData.get('email')    as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)
  const mobile   = (formData.get('mobile')   as string)?.trim()
  const username = (formData.get('username') as string)?.trim().toLowerCase()

  if (!name || !email || !password || !username) return { error: 'All fields are required' }
  if (password.length < 8)          return { error: 'Password must be at least 8 characters' }
  if (mobile && !/^256[0-9]{9}$/.test(mobile))
    return { error: 'Mobile number must be in format 256XXXXXXXXX (Uganda)' }
  if (!USERNAME_REGEX.test(username))
    return { error: 'Username must be 3-20 characters, lowercase letters, numbers, or underscore' }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existing.length > 0) return { error: 'An account with this email already exists' }

  const usernameTaken = await db.select({ id: users.id }).from(users).where(eq(users.username, username))
  if (usernameTaken.length > 0) return { error: 'Username is already taken' }

  const passwordHash = await bcrypt.hash(password, 12)

  const [user] = await db.insert(users).values({
    name,
    username,
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

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(badges)
  if (Number(count) === 0) {
    await db.insert(badges).values(BASE_BADGES)
  }

  return { success: true }
}
