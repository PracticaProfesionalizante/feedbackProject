<template>
  <v-card min-width="320" max-width="400" class="overflow-hidden">
    <!-- Header del panel -->
    <v-card-title class="d-flex align-center pa-3">
      <span class="text-subtitle-1 font-weight-medium">Notificaciones</span>
      <v-spacer />
      <v-btn
        v-if="notificationStore.hasUnread"
        variant="text"
        size="small"
        color="primary"
        @click="handleMarkAllAsRead"
      >
        Marcar todo leído
      </v-btn>
    </v-card-title>

    <v-divider />

    <!-- Lista de notificaciones -->
    <v-list class="py-0" density="comfortable">
      <template v-if="notificationStore.notifications.length === 0">
        <v-list-item>
          <v-list-item-title class="text-medium-emphasis text-center py-4">
            No hay notificaciones
          </v-list-item-title>
        </v-list-item>
      </template>
      <template v-else>
        <v-list-item
          v-for="n in notificationStore.notifications"
          :key="n.id"
        :class="[
          'notification-item',
          n.read ? 'notification-read' : 'notification-unread'
        ]"
        :active="false"
        rounded="lg"
        class="mx-2 my-1"
        @click="handleNotificationClick(n)"
      >
        <template #prepend>
          <span
            class="notification-dot mr-2"
            :class="n.read ? 'dot-read' : 'dot-unread'"
            aria-hidden="true"
          >
            {{ n.read ? '○' : '●' }}
          </span>
        </template>
        <v-list-item-title class="text-body-2">
          {{ n.message }}
        </v-list-item-title>
        <v-list-item-subtitle class="text-caption text-medium-emphasis">
          {{ formatDate(n.createdAt) }}
        </v-list-item-subtitle>
      </v-list-item>
      </template>
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../../stores/notificationStore'
import type { Notification } from '../../types/notification'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toast', message: string): void
}>()

const router = useRouter()
const notificationStore = useNotificationStore()

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await notificationStore.fetchNotifications()
      await notificationStore.fetchUnreadCount()
    }
  }
)

function formatDate(createdAt: string) {
  const date = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Hace ${diffHours} h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  return date.toLocaleDateString()
}

async function handleNotificationClick(notification: Notification) {
  if (!notification.read) {
    await notificationStore.markAsRead(notification.id)
  }
  emit('close')
  router.push('/feedbacks')
}

async function handleMarkAllAsRead() {
  try {
    await notificationStore.markAllAsRead()
    emit('toast', 'Todas las notificaciones marcadas como leídas')
    emit('close')
  } catch {
    emit('toast', 'Error al marcar como leídas')
  }
}
</script>

<style scoped>
.notification-item {
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.notification-unread {
  background-color: rgb(var(--v-theme-primary), 0.08);
}

.notification-read {
  background-color: transparent;
}

.notification-dot {
  font-size: 0.75rem;
  line-height: 1;
}

.dot-unread {
  color: rgb(var(--v-theme-primary));
}

.dot-read {
  color: rgba(var(--v-theme-on-surface), 0.5);
}
</style>
