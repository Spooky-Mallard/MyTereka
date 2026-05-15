export type SharedGoalLeavePolicy = 'refundable' | 'forfeit'
export type SharedGoalMemberStatus = 'invited' | 'active' | 'left' | 'removed' | 'declined'

export type SharedGoalCard = {
  id: string
  name: string
  icon: string | null
  targetAmount: number
  currentAmount: number
  targetDate: string | null
  leavePolicy: SharedGoalLeavePolicy
  isCompleted: boolean
  createdAt: Date
  creatorId: string
  creatorName: string
  myStatus: SharedGoalMemberStatus
  isCreator: boolean
  memberCount: number
}

export type SharedGoalMember = {
  userId: string
  name: string
  username: string | null
  avatarUrl: string | null
  status: SharedGoalMemberStatus
  isCreator: boolean
  totalContributed: number
  contributionCount: number
}

export type SharedGoalContributionRow = {
  id: string
  userId: string
  userName: string
  username: string | null
  avatarUrl: string | null
  amount: number
  note: string | null
  isRefund: boolean
  createdAt: Date
}

export type SharedGoalDetail = {
  id: string
  name: string
  icon: string | null
  targetAmount: number
  currentAmount: number
  targetDate: string | null
  leavePolicy: SharedGoalLeavePolicy
  isCompleted: boolean
  createdAt: Date
  creatorId: string
  myStatus: SharedGoalMemberStatus | null
  isCreator: boolean
  members: SharedGoalMember[]
  contributions: SharedGoalContributionRow[]
}

export type LeaderboardRow = {
  rank: number
  userId: string
  name: string
  username: string | null
  avatarUrl: string | null
  level: 'Beginner' | 'Saver' | 'Consistent' | 'Master' | 'Grand Master'
  xpPoints: number
  status: SharedGoalMemberStatus
  isCreator: boolean
  totalContributed: number
  contributionCount: number
}

export type SharedGoalInvite = {
  sharedGoalId: string
  name: string
  icon: string | null
  targetAmount: number
  targetDate: string | null
  leavePolicy: SharedGoalLeavePolicy
  creatorId: string
  creatorName: string
  invitedAt: Date
}
