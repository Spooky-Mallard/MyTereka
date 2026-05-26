import {
  pgTable, uuid, varchar, text, integer, boolean,
  timestamp, date, pgEnum, serial, unique,
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
  'quest_completed',
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
  avatarId:       varchar('avatar_id', { length: 10 }),
  currency:       varchar('currency',       { length: 10  }).default('UGX').notNull(),
  theme:          varchar('theme',          { length: 10  }).default('dark').notNull(),
  xpPoints:       integer('xp_points').default(0).notNull(),
  level:          levelEnum('level').default('Beginner').notNull(),
  streakCount:    integer('streak_count').default(0).notNull(),
  lastActiveDate: date('last_active_date'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  appRating:     integer('app_rating'),
  ratingAskedAt: timestamp('rating_asked_at', { withTimezone: true }),
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
  categoryId:  uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
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
  categoryId:      uuid('category_id').references(() => categories.id, { onDelete: 'restrict' }).notNull(),
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

export const goalMilestones = pgTable('goal_milestones', {
  id:           uuid('id').defaultRandom().primaryKey(),
  goalId:       uuid('goal_id').references(() => goals.id, { onDelete: 'cascade' }).notNull(),
  userId:       uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  milestoneKey: varchar('milestone_key', { length: 20 }).notNull(),
  xpAwarded:    integer('xp_awarded').notNull(),
  badgeKey:     varchar('badge_key', { length: 100 }),
  reachedAt:    timestamp('reached_at', { withTimezone: true }).defaultNow().notNull(),
})

export const goalCoins = pgTable('goal_coins', {
  id:          uuid('id').defaultRandom().primaryKey(),
  goalId:      uuid('goal_id').references(() => goals.id, { onDelete: 'cascade' }).notNull(),
  userId:      uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  coinIndex:   integer('coin_index').notNull(),
  collectedAt: timestamp('collected_at', { withTimezone: true }).defaultNow().notNull(),
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

export const nudges = pgTable('nudges', {
  id:         uuid('id').defaultRandom().primaryKey(),
  fromUserId: uuid('from_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  toUserId:   uuid('to_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
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

export const dailyQuests = pgTable('daily_quests', {
  id:          serial('id').primaryKey(),
  title:       varchar('title', { length: 120 }).notNull(),
  description: varchar('description', { length: 255 }),
  xpReward:    integer('xp_reward').notNull().default(25),
  triggerType: varchar('trigger_type', { length: 50 }).notNull(),
})

export const userQuestCompletions = pgTable('user_quest_completions', {
  id:          serial('id').primaryKey(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questId:     integer('quest_id').notNull().references(() => dailyQuests.id),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow(),
  dateKey:     varchar('date_key', { length: 10 }).notNull(),
}, (t) => ({
  uniq: unique().on(t.userId, t.questId, t.dateKey),
}))
