<template>
  <v-card>
    <!-- Header -->
    <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
      <div class="d-flex align-center ga-2 flex-wrap">
        <!-- Tipo -->
        <v-chip size="small" variant="tonal">
          {{ formatType(feedback.type) }}
        </v-chip>

        <!-- Estado -->
        <v-chip size="small" variant="tonal">
          {{ formatStatus(feedback.status) }}
        </v-chip>
      </div>

      <!-- Menú acciones (solo autor) -->
      <v-menu v-if="canSeeMenu">
        <template #activator="{ props: menuProps }">
          <v-btn icon variant="text" v-bind="menuProps">
            <v-icon icon="mdi-dots-vertical" />
          </v-btn>
        </template>

        <v-list density="comfortable">
          <v-list-item
            v-if="canEditContent"
            prepend-icon="mdi-pencil-outline"
            @click="openEditDialog"
          >
            <v-list-item-title>Editar</v-list-item-title>
          </v-list-item>

          <v-list-item
            v-if="canDelete"
            prepend-icon="mdi-delete-outline"
            @click="emit('delete')"
          >
            <v-list-item-title>Eliminar</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-title>

    <v-divider />

    <v-card-text>
      <!-- Meta info -->
      <div class="d-flex flex-column ga-1 mb-4">
        <div class="text-body-2">
          <span class="text-medium-emphasis">De:</span>
          <span class="font-weight-medium">
            {{ feedback.fromUser?.name ?? feedback.fromUserId }}
          </span>
          <span class="text-medium-emphasis">·</span>
          <span class="text-medium-emphasis">{{ formatDateTime(feedback.createdAt) }}</span>
        </div>

        <div class="text-body-2">
          <span class="text-medium-emphasis">Para:</span>
          <span class="font-weight-medium">
            {{ feedback.toUser?.name ?? feedback.toUserId }}
          </span>
        </div>
      </div>

      <!-- Estado editable (solo destinatario) -->
      <div v-if="canChangeStatus" class="mb-4 d-flex align-center ga-2 flex-wrap">
        <div class="text-body-2 text-medium-emphasis">Cambiar estado:</div>

        <v-select
          v-model="statusModel"
          :items="statusOptions"
          item-title="label"
          item-value="value"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 240px"
          @update:model-value="onStatusChange"
        />
      </div>

      <!-- Contenido -->
      <div class="text-subtitle-2 mb-2">Contenido</div>
      <div class="text-body-1" style="white-space: pre-wrap;">
        {{ feedback.content }}
      </div>

      <!-- Comentarios (Sprint 3.1): por ahora solo placeholder si existen -->
      <div class="mt-6">
        <div class="text-subtitle-2 mb-2">Comentarios</div>

        <div v-if="hasComments" class="d-flex flex-column ga-3">
          <v-card
            v-for="c in (feedback as any).comments"
            :key="c.id"
            variant="outlined"
            class="pa-3"
          >
            <div class="d-flex align-center justify-space-between">
              <div class="text-body-2 font-weight-medium">
                {{ c.user?.name ?? c.userId }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ formatDateTime(c.createdAt) }}
              </div>
            </div>
            <div class="text-body-2 mt-2" style="white-space: pre-wrap;">
              {{ c.content }}
            </div>
          </v-card>
        </div>

        <div v-else class="text-body-2 text-medium-emphasis">
          Todavía no hay comentarios.
        </div>
      </div>
    </v-card-text>
  </v-card>

  <!-- Dialog editar contenido -->
  <v-dialog v-model="editDialog.open" max-width="680">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="font-weight-bold">Editar feedback</span>
        <v-btn icon variant="text" @click="editDialog.open = false">
          <v-icon icon="mdi-close" />
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-textarea
          v-model="editDialog.content"
          label="Contenido"
          variant="outlined"
          auto-grow
          rows="5"
        />
        <div class="text-caption text-medium-emphasis">
          Solo el autor puede editar el contenido y únicamente si el feedback está en estado “Pendiente”.
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="editDialog.open = false">Cancelar</v-btn>
        <v-btn color="primary" @click="confirmEdit">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { Feedback, FeedbackStatus } from '../../types/feedback'

const props = defineProps<{
  feedback: Feedback
  currentUserId: string
}>()

const emit = defineEmits<{
  (e: 'update-status', status: FeedbackStatus): void
  (e: 'edit-content', content: string): void
  (e: 'delete'): void
}>()

/* =========================
   Permisos (UI)
========================= */

const isAuthor = computed(() => props.feedback.fromUserId === props.currentUserId)
const isRecipient = computed(() => props.feedback.toUserId === props.currentUserId)

const canChangeStatus = computed(() => isRecipient.value)
const canDelete = computed(() => isAuthor.value)
// regla: solo autor y solo si PENDING
const canEditContent = computed(() => isAuthor.value && props.feedback.status === 'PENDING')

// Mostrar menú solo si hay alguna acción
const canSeeMenu = computed(() => canEditContent.value || canDelete.value)

/* =========================
   Estado editable
========================= */

const statusOptions: Array<{ label: string; value: FeedbackStatus }> = [
  { label: 'Pendiente', value: 'PENDING' },
  { label: 'En progreso', value: 'IN_PROGRESS' },
  { label: 'Completado', value: 'COMPLETED' }
]

const statusModel = ref<FeedbackStatus>(props.feedback.status)

// Si cambia el feedback (por refetch), sincronizamos el select
watch(
  () => props.feedback.status,
  (s) => {
    statusModel.value = s
  }
)

function onStatusChange(next: FeedbackStatus) {
  // Si no cambió, no hacemos nada
  if (next === props.feedback.status) return
  // Emitimos para que la vista haga la mutation (TanStack Query)
  emit('update-status', next)
}

/* =========================
   Edit dialog
========================= */

const editDialog = reactive({
  open: false,
  content: ''
})

function openEditDialog() {
  editDialog.content = props.feedback.content
  editDialog.open = true
}

function confirmEdit() {
  const next = (editDialog.content ?? '').trim()
  if (!next) return
  if (next === props.feedback.content.trim()) {
    editDialog.open = false
    return
  }
  emit('edit-content', next)
  editDialog.open = false
}

/* =========================
   Comments (placeholder)
========================= */

const hasComments = computed(() => Array.isArray((props.feedback as any)?.comments) && (props.feedback as any).comments.length > 0)

/* =========================
   Format helpers
========================= */

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

function formatDateTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}
</script>