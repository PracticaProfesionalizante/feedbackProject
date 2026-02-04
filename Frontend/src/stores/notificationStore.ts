import { defineStore } from 'pinia'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { notificationService } from '../services/notificationService'
import { useAuthStore } from './authStore'

const POLL_INTERVAL_MS = 30_000 // 30 segundos
const APP_TITLE = 'FeedbackApp'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let pollTimer: ReturnType<typeof setInterval> | null = null

  async function fetchUnreadCount() {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) {
      unreadCount.value = 0
      return
    }

    loading.value = true
    error.value = null
    try {
      const count = await notificationService.getUnreadCount()
      unreadCount.value = count
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al obtener notificaciones'
      error.value = msg
      unreadCount.value = 0
    } finally {
      loading.value = false
    }
  }

  function setUnreadCount(count: number) {
    unreadCount.value = Math.max(0, count)
  }

  function decrement() {
    if (unreadCount.value > 0) unreadCount.value--
  }

  function reset() {
    unreadCount.value = 0
  }

  function startPolling() {
    stopPolling()
    fetchUnreadCount()
    pollTimer = setInterval(fetchUnreadCount, POLL_INTERVAL_MS)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  return {
    unreadCount,
    loading,
    error,
    fetchUnreadCount,
    setUnreadCount,
    decrement,
    reset,
    startPolling,
    stopPolling,
  }
})

/**
 * Composable para usar el store con watcher del título de página
 */
export function useNotifications() {
  const store = useNotificationStore()
  const { unreadCount, loading, error } = storeToRefs(store)

  watch(
    unreadCount,
    (newCount) => {
      document.title =
        newCount > 0 ? `(${newCount}) ${APP_TITLE}` : APP_TITLE
    },
    { immediate: true }
  )

  return {
    unreadCount,
    loading,
    error,
    fetchUnreadCount: store.fetchUnreadCount,
    setUnreadCount: store.setUnreadCount,
    decrement: store.decrement,
    reset: store.reset,
    startPolling: store.startPolling,
    stopPolling: store.stopPolling,
  }
}
