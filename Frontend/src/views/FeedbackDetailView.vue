<template>
  <v-container>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="text-h6 font-weight-bold">Detalle de Feedback</div>

      <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="goBack">
        Volver
      </v-btn>
    </div>

    <!-- Loading -->
    <v-skeleton-loader v-if="isLoading" type="card" elevation="0" />

    <!-- Error -->
    <v-alert v-else-if="isError" type="error" variant="tonal" class="mb-4">
      {{ errorMessage }}
    </v-alert>

    <!-- Content -->
    <template v-else-if="feedback">
      <FeedbackDetail
        :feedback="feedback"
        :current-user-id="currentUserId"
        @update-status="handleUpdateStatus"
        @edit-content="handleEditContent"
        @delete="confirmDelete"
      />

      <!-- ✅ Acciones -->
      <v-divider class="my-6" />

      <!-- Autor: puede editar texto + check/uncheck -->
      <ActionListEditor
        v-if="isAuthor"
        v-model="actionsLocal"
      />

      <!-- Receptor: solo check/uncheck (emit-only => listo para backend) -->
      <ActionListViewer
        v-else
        :model-value="actionsLocal"
        emit-only
        @toggle="handleToggleAction"
      />

      <!-- ✅ Comentarios -->
      <v-divider class="my-6" />
      <CommentList :feedback-id="feedbackId" :refetch-interval-ms="15000" />
    </template>

    <!-- Delete confirm dialog -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="font-weight-bold">Eliminar feedback</v-card-title>

        <v-card-text>
          ¿Estás seguro de que querés eliminar este feedback?
          Esta acción no se puede deshacer.
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" @click="handleDelete">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.open" :timeout="5000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.open = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

import FeedbackDetail from '../components/feedbacks/FeedbackDetail.vue'

import ActionListViewer from '../components/feedbacks/ActionListViewer.vue'
import ActionListEditor from '../components/feedbacks/ActionListEditor.vue'

import { feedbackService } from '../services/feedbackServices'
import { useAuthStore } from '../stores/authStore'
import type { Feedback, FeedbackAction, FeedbackStatus } from '@/types/feedback'

/* =========================
   Setup
========================= */

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const auth = useAuthStore()

const feedbackId = route.params.id as string
const currentUserId = computed(() => auth.user?.id ?? '')

/**
 * ✅ Fallback local (solo para poder probar ahora)
 * Cuando el backend devuelva feedback.actions, esto se reemplaza automáticamente.
 */
const actionsDraft = ref<FeedbackAction[]>([
  { id: 'a1', text: 'Definir próximos pasos', done: false },
  { id: 'a2', text: 'Hacer seguimiento en 1 semana', done: true }
])

/**
 * ✅ Lista de acciones "local" que se muestra en UI:
 * - si el backend trae feedback.actions => usamos esas
 * - si no trae => usamos actionsDraft
 */
const actionsLocal = ref<FeedbackAction[]>([])

/* =========================
   Query: detalle feedback
========================= */

const canFetch = computed(() => auth.checked && !!auth.token && !!feedbackId)

const {
  data: feedback,
  isLoading,
  isError,
  error
} = useQuery<Feedback>({
  queryKey: ['feedback', feedbackId, auth.token],
  queryFn: () => feedbackService.getFeedback(feedbackId),
  enabled: canFetch
})

const errorMessage = computed(() => {
  if (!error.value) return 'Error al cargar el feedback'
  return error.value instanceof Error ? error.value.message : 'Error desconocido'
})

/**
 * ✅ Permisos UI (el backend igual valida)
 */
const isAuthor = computed(() => feedback.value?.fromUserId === currentUserId.value)
const isReceiver = computed(() => feedback.value?.toUserId === currentUserId.value)

/**
 * ✅ Sincroniza actionsLocal cada vez que llega/actualiza el feedback.
 * Si el backend trae actions, usamos eso; sino fallback draft.
 */
watch(
  () => feedback.value,
  (fb) => {
    const fromApi = fb?.actions
    actionsLocal.value = (fromApi && Array.isArray(fromApi) ? fromApi : actionsDraft.value).map(a => ({ ...a }))
  },
  { immediate: true }
)

/* =========================
   Mutations (feedback)
========================= */

const updateStatusMutation = useMutation({
  mutationFn: (status: FeedbackStatus) => feedbackService.updateStatus(feedbackId, status),
  onSuccess: () => {
    invalidateRelated()
    showMessage('Estado actualizado correctamente')
  },
  onError: (e: any) => {
    showMessage(e?.message ?? 'No se pudo actualizar el estado')
  }
})

const updateContentMutation = useMutation({
  mutationFn: (content: string) => feedbackService.updateFeedback(feedbackId, { content }),
  onSuccess: () => {
    invalidateRelated()
    showMessage('Contenido actualizado correctamente')
  },
  onError: (e: any) => {
    showMessage(e?.message ?? 'No se pudo editar el feedback')
  }
})

const deleteMutation = useMutation({
  mutationFn: () => feedbackService.deleteFeedback(feedbackId),
  onSuccess: () => {
    invalidateRelated()
    router.replace('/feedbacks')
  },
  onError: (e: any) => {
    showMessage(e?.message ?? 'No se pudo eliminar el feedback')
  }
})

/* =========================
   Handlers (feedback)
========================= */

function handleUpdateStatus(status: FeedbackStatus) {
  updateStatusMutation.mutate(status)
}

function handleEditContent(content: string) {
  updateContentMutation.mutate(content)
}

/* =========================
   Handlers (acciones)
========================= */

/**
 * ✅ B2: wiring listo para backend.
 * ActionListViewer emite { id, done } y acá:
 * - por ahora actualizamos actionsLocal para poder probar
 * - cuando exista endpoint, reemplazamos por mutation y luego invalidamos query
 */
function handleToggleAction(payload: { id: string; done: boolean }) {
  // UI inmediata (modo demo)
  const idx = actionsLocal.value.findIndex((a) => a.id === payload.id)
  if (idx >= 0) {
    actionsLocal.value[idx] = { ...actionsLocal.value[idx], done: payload.done }
  }

  // TODO (cuando el backend esté):
  // actionService.update(payload.id, { done: payload.done })
  //   -> onSuccess: invalidateRelated()
}

/* =========================
   Delete flow
========================= */

const deleteDialog = ref(false)

function confirmDelete() {
  deleteDialog.value = true
}

function handleDelete() {
  deleteDialog.value = false
  deleteMutation.mutate()
}

/* =========================
   Utils
========================= */

function invalidateRelated() {
  queryClient.invalidateQueries({ queryKey: ['feedback', feedbackId] })
  queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}

function goBack() {
  router.back()
}

/* =========================
   Snackbar
========================= */

const snackbar = reactive({
  open: false,
  message: ''
})

function showMessage(message: string) {
  snackbar.message = message
  snackbar.open = true
}
</script>