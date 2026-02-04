import apiClient from './api'

export type NotificationCountResponse = { count: number }

export const notificationService = {
  async getUnreadCount(): Promise<number> {
    const { data } = await apiClient.get<NotificationCountResponse>(
      '/notifications/count'
    )
    return data?.count ?? 0
  },
}
