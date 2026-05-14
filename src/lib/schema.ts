import {
  pgTable, uuid, varchar, text, integer, boolean,
  timestamp, date, pgEnum,
} from 'drizzle-orm/pg-core'

export const accountTypeEnum     = pgEnum('account_type',       ['cash', 'mobile_money', 'bank', 'sacco'])
export const transactionTypeEnum = pgEnum('transaction_type',   ['income', 'expense', 'transfer', 'investment'])
export const periodEnum          = pgEnum('period',             ['weekly', 'monthly'])
export const autoDebitEnum       = pgEnum('auto_debit_schedule',['daily', 'weekly', 'monthly'])
export const levelEnum           = pgEnum('level',              ['Beginner', 'Saver', 'Consistent', 'Master', 'Grand Master'])
export const friendshipStatusEnum = pgEnum('friendship_status', ['pending', 'accepted', 'declined', 'blocked'])
export const notificationTypeEnum = pgEnum('notification_type', [
  'friend_request',
  'friend_accepted',
  'nudge',
  'shared_goal_invite',
  'shared_goal_contribution',
  'shared_goal_completed',
  'shared_goal_removed',
])
export const sharedGoalLeavePolicyEnum = pgEnum('shared_goal_leave_policy', ['refundable', 'forfeit'])
export const sharedGoalMemberStatusEnum = pgEnum('shared_goal_member_status', ['invited', 'active', 'left', 'removed', 'declined'])

export const users = pgTable('users', {
  id:             uuid('id').defaultRandom().primaryKey(),
  name:           varchar('name',           { length: 100 }).notNull(),
  username:       varchar('username',       { length: 20 }).unique(),
  email:          varchar('email',          { length: 255 }).notNull().unique(),
  passwordHash:   text('password_hash').notNull(),
  mobileNumber:   varchar('mobile_number',  { length: 20 }),
  avatarUrl:      text('avatar_url'),
  currency:       varchar('currency',       { length: 10  }).default('UGX').notNull(),
  theme:          varchar('theme',          { length: 10  }).default('dark').notNull(),
  xpPoints:       integer('xp_points').default(0).notNull(),
  level:          levelEnum('level').default('Beginner').notNull(),
  streakCount:    integer('streak_count').default(0).notNull(),
  lastActiveDate: date('last_active_date'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id:           uuid('id').defaultRandom().primaryKey(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name:         varchar('name',  { length: 100 }).notNull(),
  type:         accountTypeEnum('type').notNull(),
  balance:      integer('balance').default(0).notNull(),
  icon:         varchar('icon',  { length: 50 }),
  color:        varchar('color', { length: 7  }),
  isFixed:      boolean('is_fixed').default(false).notNull(),
  lockedUntil:  date('locked_until'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const categories = pgTable('categories', {
  id:        uuid('id').defaultRandom().primaryKey(),
  userId:    uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name:      varchar('name',  { length: 50 }).notNull(),
  type:      transactionTypeEnum('type').notNull(),
  icon:      varchar('icon',  { length: 50 }),
  color:     varchar('color', { length: 7  }),
  isDefault: boolean('is_default').default(false).notNull(),
})

export const transactions = pgTable('transactions', {
  id:          uuid('id').defaultRandom().primaryKey(),
  userId:      uuid('user_id').references(() => users.id,     { onDelete: 'cascade' }).notNull(),
  accountId:   uuid('account_id').references(() => accounts.id).notNull(),
  categoryId:  uuid('category_id').references(() => categories.id).notNull(),
  type:        transactionTypeEnum('type').notNull(),
  amount:      integer('amount').notNull(),
  note:        text('note'),
  date:        date('date').notNull(),
  goalId:      uuid('goal_id').references(() => goals.id, { onDelete: 'set null' }),
  transferFee: integer('transfer_fee'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const budgets = pgTable('budgets', {
  id:              uuid('id').defaultRandom().primaryKey(),
  userId:          uuid('user_id').references(() => users.id,     { onDelete: 'cascade' }).notNull(),
  categoryId:      uuid('category_id').references(() => categories.id).notNull(),
  limitAmount:     integer('limit_amount').notNull(),
  spentAmount:     integer('spent_amount').default(0).notNull(),
  period:          periodEnum('period').notNull(),
  periodStartDate: date('period_start_date').notNull(),
  periodEndDate:   date('period_end_date').notNull(),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const goals = pgTable('goals', {
  id:                  uuid('id').defaultRandom().primaryKey(),
  userId:              uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name:                varchar('name',  { length: 100 }).notNull(),
  icon:                varchar('icon',  { length: 50  }),
  targetAmount:        integer('target_amount').notNull(),
  currentAmount:       integer('current_amount').default(0).notNull(),
  targetDate:          date('target_date'),
  isLocked:            boolean('is_locked').default(false).notNull(),
  autoDebitAmount:     integer('auto_debit_amount'),
  autoDebitSchedule:   autoDebitEnum('auto_debit_schedule'),
  autoDebitAccountId:  uuid('auto_debit_account_id').references(() => accounts.id),
  isCompleted:         boolean('is_completed').default(false).notNull(),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const goalContributions = pgTable('goal_contributions', {
  id:        uuid('id').defaultRandom().primaryKey(),
  goalId:    uuid('goal_id').references(() => goals.id, { onDelete: 'cascade' }).notNull(),
  userId:    uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount:    integer('amount').notNull(),
  note:      text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const badges = pgTable('badges', {
  id:           uuid('id').defaultRandom().primaryKey(),
  name:         varchar('name',          { length: 100 }).notNull(),
  description:  text('description'),
  icon:         varchar('icon',          { length: 50  }),
  xpReward:     integer('xp_reward').default(0).notNull(),
  triggerEvent: varchar('trigger_event', { length: 100 }).notNull(),
})

export const userBadges = pgTable('user_badges', {
  id:       uuid('id').defaultRandom().primaryKey(),
  userId:   uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  badgeId:  uuid('badge_id').references(() => badges.id).notNull(),
  earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow().notNull(),
})

export const xpEvents = pgTable('xp_events', {
  id:          uuid('id').defaultRandom().primaryKey(),
  userId:      uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  eventType:   varchar('event_type', { length: 100 }).notNull(),
  xpAwarded:   integer('xp_awarded').notNull(),
  description: text('description'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const friendships = pgTable('friendships', {
  id:           uuid('id').defaultRandom().primaryKey(),
  requesterId:  uuid('requester_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  addresseeId:  uuid('addressee_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status:       friendshipStatusEnum('status').default('pending').notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  respondedAt:  timestamp('responded_at', { withTimezone: true }),
})

export const sharedGoals = pgTable('shared_goals', {
  id:            uuid('id').defaultRandom().primaryKey(),
  creatorId:     uuid('creator_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name:          varchar('name', { length: 100 }).notNull(),
  icon:          varchar('icon', { length: 50 }),
  targetAmount:  integer('target_amount').notNull(),
  currentAmount: integer('current_amount').default(0).notNull(),
  targetDate:    date('target_date'),
  leavePolicy:   sharedGoalLeavePolicyEnum('leave_policy').default('forfeit').notNull(),
  isCompleted:   boolean('is_completed').default(false).notNull(),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const sharedGoalMembers = pgTable('shared_goal_members', {
  id:           uuid('id').defaultRandom().primaryKey(),
  sharedGoalId: uuid('shared_goal_id').references(() => sharedGoals.id, { onDelete: 'cascade' }).notNull(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status:       sharedGoalMemberStatusEnum('status').default('invited').notNull(),
  isCreator:    boolean('is_creator').default(false).notNull(),
  joinedAt:     timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  leftAt:       timestamp('left_at',   { withTimezone: true }),
})

export const sharedGoalContributions = pgTable('shared_goal_contributions', {
  id:           uuid('id').defaultRandom().primaryKey(),
  sharedGoalId: uuid('shared_goal_id').references(() => sharedGoals.id, { onDelete: 'cascade' }).notNull(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountId:    uuid('account_id').references(() => accounts.id).notNull(),
  amount:       integer('amount').notNull(),
  note:         text('note'),
  isRefund:     boolean('is_refund').default(false).notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const notifications = pgTable('notifications', {
  id:        uuid('id').defaultRandom().primaryKey(),
  userId:    uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type:      notificationTypeEnum('type').notNull(),
  actorId:   uuid('actor_id').references(() => users.id, { onDelete: 'cascade' }),
  entityId:  uuid('entity_id'),
  body:      text('body'),
  readAt:    timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
