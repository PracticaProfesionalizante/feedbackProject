import apiClient from './api'
import type { Notification, UnreadCountResponse } from '../types/notification'

const BASE = '/notifications'

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const { data } = await apiClient.get<Notification[]>(BASE)
    return data ?? []
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await apiClient.get<UnreadCountResponse>(`${BASE}/count`)
    return data?.unreadCount ?? 0
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    const { data } = await apiClient.patch<Notification>(`${BASE}/${notificationId}/read`)
    return data
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch(`${BASE}/read-all`)
  }
}
