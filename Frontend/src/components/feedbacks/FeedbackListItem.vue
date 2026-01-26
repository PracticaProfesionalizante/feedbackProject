<template>
  <v-list-item
    :prepend-avatar="avatarInitials"
    :title="displayName"
    :subtitle="previewText"
    @click="handleClick"
  >
    <template #prepend>
      <v-avatar color="primary" size="40">
        <span class="text-subtitle-2 font-weight-bold">{{ avatarInitials }}</span>
      </v-avatar>
    </template>

    <template #title>
      <div class="d-flex align-center ga-2">
        <span class="font-weight-medium">{{ displayName }}</span>
        <v-chip
          :color="typeColor"
          size="small"
          variant="tonal"
        >
          {{ typeLabel }}
        </v-chip>
        <v-chip
          :color="statusColor"
          size="small"
          variant="tonal"
        >
          {{ statusLabel }}
        </v-chip>
      </div>
    </template>

    <template #subtitle>
      <div class="d-flex flex-column ga-1 mt-1">
        <span class="text-body-2">{{ previewText }}</span>
        <span class="text-caption text-medium-emphasis">{{ relativeTime }}</span>
      </div>
    </template>

    <template #append>
      <v-icon icon="mdi-chevron-right" />
    </template>
  </v-list-item>

  <v-divider />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Feedback } from '../../types/feedback'
import { formatRelativeTime } from '../../utils'
import { useAuthStore } from '../../stores/authStore'

const props = defineProps<{
  feedback: Feedback
}>()

const router = useRouter()
const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

const isReceived = computed(() => {
  // Verificar que currentUserId esté definido antes de comparar
  // Si no está definido, no podemos determinar si fue recibido
  const userId = currentUserId.value
  if (!userId) return false
  return props.feedback.toUserId === userId
})

const displayUser = computed(() => {
  // Si currentUserId no está definido, mostrar el destinatario por defecto
  // (asumiendo que es más probable que sea un feedback enviado)
  if (!currentUserId.value) {
    return props.feedback.toUser
  }
  return isReceived.value ? props.feedback.fromUser : props.feedback.toUser
})

const displayName = computed(() => {
  return displayUser.value?.name || 'Usuario desconocido'
})

const avatarInitials = computed(() => {
  const name = displayName.value
  // Filtrar strings vacíos para manejar múltiples espacios consecutivos
  const parts = name.trim().split(' ').filter(part => part.length > 0)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name[0]?.toUpperCase() || '?'
})

const previewText = computed(() => {
  const text = props.feedback.content || ''
  if (text.length <= 80) return text
  return `${text.slice(0, 80)}...`
})

const relativeTime = computed(() => {
  return formatRelativeTime(props.feedback.createdAt)
})

const typeLabel = computed(() => {
  switch (props.feedback.type) {
    case 'RECOGNITION':
      return 'Reconocimiento'
    case 'IMPROVEMENT':
      return 'Mejora'
    case 'GENERAL':
      return 'General'
    default:
      return props.feedback.type
  }
})

const typeColor = computed(() => {
  switch (props.feedback.type) {
    case 'RECOGNITION':
      return 'success'
    case 'IMPROVEMENT':
      return 'warning'
    case 'GENERAL':
      return 'info'
    default:
      return 'grey'
  }
})

const statusLabel = computed(() => {
  switch (props.feedback.status) {
    case 'PENDING':
      return 'Pendiente'
    case 'IN_PROGRESS':
      return 'En progreso'
    case 'COMPLETED':
      return 'Completado'
    default:
      return props.feedback.status
  }
})

const statusColor = computed(() => {
  switch (props.feedback.status) {
    case 'PENDING':
      return 'grey'
    case 'IN_PROGRESS':
      return 'primary'
    case 'COMPLETED':
      return 'success'
    default:
      return 'grey'
  }
})

function handleClick() {
  // Por ahora navega a /feedbacks, después puedes crear una vista de detalle
  router.push('/feedbacks')
}
</script>
