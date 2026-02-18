import apiClient from './api'
import type { Notification, UnreadCountResponse } from '../types/notification'

const BASE = '/notifications'

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const { data } = await apiClient.get<{ notifications: Notification[] }>(BASE)
    return data?.notifications ?? []
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await apiClient.get<UnreadCountResponse>(`${BASE}/count`)
    return data?.unreadCount ?? 0
  },

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`${BASE}/${notificationId}/read`)
  },

  /** Marcar como leídas las notificaciones de este feedback (cuando el usuario abre el detalle). */
  async markReadByFeedback(feedbackId: string): Promise<void> {
    await apiClient.patch(`${BASE}/read-by-feedback/${feedbackId}`)
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch(`${BASE}/read-all`)
  },
}
