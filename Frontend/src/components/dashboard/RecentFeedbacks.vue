<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="text-subtitle-1 font-weight-bold">Feedbacks recientes</div>
    </v-card-title>

    <v-divider />

    <v-card-text>
      <v-skeleton-loader v-if="loading" type="list-item-two-line@6" />

      <v-list v-else density="comfortable">
        <v-list-item
          v-for="f in items"
          :key="f.id"
          class="rounded"
          @click="emit('open', f.id)"
        >
          <template #prepend>
            <v-icon icon="mdi-message-text-outline" />
          </template>

          <v-list-item-title class="d-flex flex-wrap align-center ga-2">
            <v-chip size="x-small" variant="tonal">{{ formatType(f.type) }}</v-chip>
            <v-chip size="x-small" variant="tonal">{{ formatStatus(f.status) }}</v-chip>
          </v-list-item-title>

          <v-list-item-subtitle class="mt-1">
            <div class="text-caption text-medium-emphasis">
              {{ whoLabel(f) }} · {{ formatDate(f.createdAt) }}
            </div>
            <div class="text-body-2">
              {{ preview(f.content) }}
            </div>
          </v-list-item-subtitle>
        </v-list-item>

        <div v-if="items.length === 0" class="text-body-2 text-medium-emphasis">
          No hay feedbacks recientes.
        </div>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Feedback } from '../../types/feedback'

const props = defineProps<{
  items: Feedback[]
  loading: boolean
  currentUserId?: string
}>()

const emit = defineEmits<{
  (e: 'open', id: string): void
}>()

function preview(text: string) {
  const t = (text ?? '').trim()
  if (t.length <= 100) return t
  return `${t.slice(0, 100)}…`
}

function formatType(type: Feedback['type']) {
  switch (type) {
    case 'RECOGNITION':
      return 'Reconocimiento'
    case 'IMPROVEMENT':
      return 'Mejora'
    case 'GENERAL':
      return 'General'
    default:
      return type
  }
}

function formatStatus(status: Feedback['status']) {
  switch (status) {
    case 'PENDING':
      return 'Pendiente'
    case 'IN_PROGRESS':
      return 'En progreso'
    case 'COMPLETED':
      return 'Completado'
    default:
      return status
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

function whoLabel(f: Feedback) {
  // Si nos pasan currentUserId, mostramos "De/Para" relativo
  const me = props.currentUserId
  if (!me) {
    return `${f.fromUser?.name ?? f.fromUserId} → ${f.toUser?.name ?? f.toUserId}`
  }

  if (f.toUserId === me) return `De: ${f.fromUser?.name ?? f.fromUserId}`
  if (f.fromUserId === me) return `Para: ${f.toUser?.name ?? f.toUserId}`
  return `${f.fromUser?.name ?? f.fromUserId} → ${f.toUser?.name ?? f.toUserId}`
}
</script>