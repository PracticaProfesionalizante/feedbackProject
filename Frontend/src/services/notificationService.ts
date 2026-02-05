import apiClient from './api'
import type { Notification, UnreadCountResponse } from '../types/notification'

const BASE = '/notifications'

export async function fetchNotifications(): Promise<Notification[]> {
  const { data } = await apiClient.get<Notification[]>(BASE)
  return data ?? []
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<UnreadCountResponse>(`${BASE}/count`)
  return data?.unreadCount ?? 0
}

export async function markAsRead(id: string): Promise<void> {
  await apiClient.patch(`${BASE}/${id}/read`)
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.patch(`${BASE}/read-all`)
}
