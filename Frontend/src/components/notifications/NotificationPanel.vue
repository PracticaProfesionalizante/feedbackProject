<template>
  <v-menu
    :close-on-content-click="false"
    location="bottom end"
    max-width="400"
    min-width="360"
  >
    <template #activator="{ props: menuProps }">
      <slot name="activator" :props="menuProps" />
    </template>

    <v-card class="notification-panel">
      <v-card-title class="d-flex align-center pa-3">
        <v-icon icon="mdi-bell-outline" class="mr-2" />
        Notificaciones
      </v-card-title>

      <v-card-subtitle class="d-flex align-center pa-2 pb-0">
        <v-btn
          size="small"
          variant="text"
          color="primary"
          :disabled="unreadCount === 0 || loading"
          @click="handleMarkAllRead"
        >
          Marcar todo leído
        </v-btn>
      </v-card-subtitle>

      <v-tabs v-model="activeTab" density="compact" class="px-2">
        <v-tab value="all">
          Todas ({{ notifications.length }})
        </v-tab>
        <v-tab value="unread">
          No leídas ({{ unreadCount }})
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-window v-model="activeTab" class="notification-window">
        <v-window-item value="all">
          <notification-list
            :notifications="notifications"
            :loading="loading"
            @read="onRead"
          />
        </v-window-item>
        <v-window-item value="unread">
          <notification-list
            :notifications="unreadNotifications"
            :loading="loading"
            @read="onRead"
          />
        </v-window-item>
      </v-window>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import NotificationList from './NotificationList.vue'
import type { Notification } from '../../types/notification'
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead
} from '../../services/notificationService'

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:unreadCount', value: number): void
}>()

const loading = ref(false)
const notifications = ref<Notification[]>([])
const activeTab = ref<'all' | 'unread'>('all')

const unreadCount = computed(() =>
  notifications.value.filter((n) => !n.read).length
)

const unreadNotifications = computed(() =>
  notifications.value.filter((n) => !n.read)
)

async function loadNotifications() {
  loading.value = true
  try {
    notifications.value = await fetchNotifications()
    const count = await fetchUnreadCount()
    emit('update:unreadCount', count)
  } finally {
    loading.value = false
  }
}

async function handleMarkAllRead() {
  if (unreadCount.value === 0) return
  loading.value = true
  try {
    await markAllAsRead()
    await loadNotifications()
  } finally {
    loading.value = false
  }
}

function onRead() {
  loadNotifications()
}

let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  loadNotifications()
  refreshInterval = setInterval(loadNotifications, 30000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) loadNotifications()
  }
)

defineExpose({
  refresh: loadNotifications,
  unreadCount
})
</script>

<style scoped>
.notification-panel {
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.notification-window {
  overflow-y: auto;
  max-height: 400px;
}
</style>
