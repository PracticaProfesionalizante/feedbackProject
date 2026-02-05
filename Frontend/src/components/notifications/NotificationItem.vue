<template>
  <div class="notification-item">
    <div class="d-flex align-center mb-1">
      <v-icon
        :icon="typeIcon"
        :color="typeColor"
        size="small"
        class="mr-2"
      />
      <span class="text-caption text-medium-emphasis">{{ typeLabel }}</span>
      <span class="text-caption text-disabled ml-2">{{ timeAgo }}</span>
    </div>
    <v-card variant="tonal" :color="typeColor" class="pa-3" rounded="lg">
      <p class="text-body-2 mb-2">{{ notification.message }}</p>
      <v-btn
        size="small"
        variant="flat"
        :color="typeColor"
        @click="handleClick"
      >
        Ver feedback
      </v-btn>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Notification, NotificationType } from '../../types/notification'
import { markAsRead } from '../../services/notificationService'

const props = defineProps<{
  notification: Notification
}>()

const emit = defineEmits<{
  (e: 'read'): void
}>()

const router = useRouter()

const typeConfig: Record<NotificationType, { icon: string; color: string; label: string }> = {
  FEEDBACK_RECEIVED: { icon: 'mdi-email-check', color: 'primary', label: 'FEEDBACK_RECEIVED' },
  COMMENT_RECEIVED: { icon: 'mdi-comment-text', color: 'success', label: 'COMMENT_RECEIVED' },
  FEEDBACK_UPDATED: { icon: 'mdi-cog', color: 'warning', label: 'FEEDBACK_UPDATED' }
}

const typeIcon = computed(() => typeConfig[props.notification.type]?.icon ?? 'mdi-bell')
const typeColor = computed(() => typeConfig[props.notification.type]?.color ?? 'grey')
const typeLabel = computed(() => typeConfig[props.notification.type]?.label ?? props.notification.type)

const timeAgo = computed(() => {
  const date = new Date(props.notification.createdAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} horas`
  if (diffDays === 1) return 'Ayer'
  return `Hace ${diffDays} días`
})

async function handleClick() {
  if (!props.notification.read) {
    await markAsRead(props.notification.id)
    emit('read')
  }
  router.push('/feedbacks')
}
</script>

<style scoped>
.notification-item {
  margin-bottom: 12px;
}
</style>
