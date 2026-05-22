export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'nudge'
  | 'shared_goal_invite'
  | 'shared_goal_contribution'
  | 'shared_goal_completed'
  | 'shared_goal_removed'
  | 'quest_completed'

export type NotificationRow = {
  id:        string
  type:      NotificationType
  body:      string | null
  entityId:  string | null
  readAt:    Date | null
  createdAt: Date
  actor: {
    id:        string | null
    name:      string | null
    username:  string | null
    avatarUrl: string | null
  } | null
}
