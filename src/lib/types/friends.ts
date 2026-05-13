export type PublicUser = {
  id:        string
  name:      string
  username:  string | null
  avatarUrl: string | null
}

export type FriendCard = PublicUser & {
  level:        string
  xpPoints:     number
  streakCount:  number
  friendshipId: string
}

export type IncomingRequest = PublicUser & {
  friendshipId: string
  createdAt:    Date
}

export type FriendProfile = {
  id:          string
  name:        string
  username:    string | null
  avatarUrl:   string | null
  level:       string
  xpPoints:    number
  streakCount: number
  badges:      { name: string; description: string | null; icon: string | null; earnedAt: Date }[]
  isFriend:    boolean
  isSelf:      boolean
  pendingDirection: 'incoming' | 'outgoing' | null
}
