export type NotificationType = 'FEEDBACK_RECEIVED' | 'COMMENT_RECEIVED' | 'FEEDBACK_UPDATED'

export type Notification = {
  id: string
  userId: string
  type: NotificationType
  message: string
  read: boolean
  createdAt: string
}

export type UnreadCountResponse = {
  unreadCount: number
}
