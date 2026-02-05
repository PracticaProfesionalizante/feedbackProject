export type NotificationType = 'FEEDBACK_RECEIVED' | 'COMMENT_RECEIVED' | 'FEEDBACK_UPDATED'

export interface Notification {
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
