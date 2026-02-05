<template>
  <v-list v-if="!loading && notifications.length" density="comfortable" class="pa-2">
    <notification-item
      v-for="n in notifications"
      :key="n.id"
      :notification="n"
      @read="$emit('read')"
    />
  </v-list>
  <v-list v-else-if="loading" class="pa-4">
    <v-progress-circular indeterminate color="primary" class="mx-auto" />
  </v-list>
  <v-list v-else class="pa-4 text-center text-medium-emphasis">
    No hay notificaciones
  </v-list>
</template>

<script setup lang="ts">
import NotificationItem from './NotificationItem.vue'
import type { Notification } from '../../types/notification'

defineProps<{
  notifications: Notification[]
  loading: boolean
}>()

defineEmits<{
  (e: 'read'): void
}>()
</script>
