import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationService } from '../services/notificationService'
import type { Notification } from '../types/notification'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)

  const hasUnread = computed(() => unreadCount.value > 0)

  async function fetchNotifications() {
    notifications.value = await notificationService.getNotifications()
  }

  async function fetchUnreadCount() {
    unreadCount.value = await notificationService.getUnreadCount()
  }

  async function markAsRead(notificationId: string) {
    await notificationService.markAsRead(notificationId)
    const notification = notifications.value.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
    if (unreadCount.value > 0) {
      unreadCount.value--
    }
  }

  /** Marcar como leídas las notificaciones del feedback (al abrir el detalle). Actualiza contador. */
  async function markReadByFeedback(feedbackId: string) {
    await notificationService.markReadByFeedback(feedbackId)
    notifications.value.forEach((n) => {
      if (n.feedbackId === feedbackId) n.read = true
    })
    await fetchUnreadCount()
  }

  async function markAllAsRead() {
    await notificationService.markAllAsRead()
    notifications.value.forEach((n) => {
      n.read = true
    })
    unreadCount.value = 0
  }

  return {
    notifications,
    unreadCount,
    hasUnread,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markReadByFeedback,
    markAllAsRead,
  }
})
