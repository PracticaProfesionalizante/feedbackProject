export type NotificationType = 'FEEDBACK_RECEIVED' | 'COMMENT_RECEIVED' | 'FEEDBACK_UPDATED'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  message: string
  read: boolean
  createdAt: string
  /** Solo en notificaciones de tipo FEEDBACK_RECEIVED; para navegar y marcar leído al abrir */
  feedbackId?: string | null
}

export type UnreadCountResponse = {
  unreadCount: number
}
