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
        @edit-feedback="handleEditFeedback"
        @delete="confirmDelete"
        @toggle-action="handleToggleAction"
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
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

import FeedbackDetail from '@/components/feedbacks/FeedbackDetail.vue'
import CommentList from '@/components/comments/commentList.vue'

import { feedbackService } from '../services/feedbackServices' // ✅ ajustá si tu archivo se llama distinto
import { useAuthStore } from '../stores/authStore'
import type { Feedback, FeedbackStatus } from '../types/feedback'

/* =========================
   Setup
========================= */

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const auth = useAuthStore()

const feedbackId = route.params.id as string
const currentUserId = computed(() => auth.user?.id ?? '')

/* =========================
   Query: detalle feedback
========================= */

const canFetch = computed(() => auth.checked && !!auth.token && !!feedbackId)

const queryKeyDetail = computed(() => ['feedback', feedbackId, auth.token] as const)

const {
  data: feedback,
  isLoading,
  isError,
  error
} = useQuery<Feedback>({
  queryKey: queryKeyDetail,
  queryFn: () => feedbackService.getFeedback(feedbackId),
  enabled: canFetch
})

const errorMessage = computed(() => {
  if (!error.value) return 'Error al cargar el feedback'
  return error.value instanceof Error ? error.value.message : 'Error desconocido'
})

/* =========================
   Mutations
========================= */

// Cambiar estado (solo destinatario; el backend valida)
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

// Editar contenido (solo autor y solo PENDING; el backend valida)
const updateContentMutation = useMutation({
  mutationFn: (payload: { content: string; actions: any[] }) =>
    feedbackService.updateFeedback(feedbackId, payload),
  onSuccess: () => {
    invalidateRelated()
    showMessage('Feedback actualizado correctamente')
  },
  onError: (e: any) => {
    showMessage(e?.message ?? 'No se pudo editar el feedback')
  }
})

function handleEditFeedback(payload: { content: string; actions: any[] }) {
  updateContentMutation.mutate(payload)
}

// ✅ Toggle acción checklist (autor o receptor; backend valida)
const toggleActionMutation = useMutation({
  mutationFn: (payload: { actionId: string; done: boolean }) =>
    feedbackService.toggleAction(feedbackId, payload.actionId, payload.done),

  // Optimistic update para que el checkbox responda instantáneo
  onMutate: async (payload) => {
    const key = queryKeyDetail.value
    await queryClient.cancelQueries({ queryKey: key })

    const previous = queryClient.getQueryData<Feedback>(key)

    if (previous?.actions?.length) {
      const next: Feedback = {
        ...previous,
        actions: previous.actions.map((a) =>
          a.id === payload.actionId ? { ...a, done: payload.done } : a
        )
      }
      queryClient.setQueryData(key, next)
    }

    return { previous }
  },

  onError: (e: any, _payload, ctx) => {
    // revert
    if (ctx?.previous) {
      queryClient.setQueryData(queryKeyDetail.value, ctx.previous)
    }
    showMessage(e?.message ?? 'No se pudo actualizar la acción')
  },

  onSuccess: () => {
    // por seguridad, refetch
    invalidateRelated()
  }
})

// Eliminar (solo autor; el backend valida)
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
   Handlers
========================= */

function handleUpdateStatus(status: FeedbackStatus) {
  updateStatusMutation.mutate(status)
}

function handleEditContent(content: string) {
  updateContentMutation.mutate(content)
}

function handleToggleAction(payload: { feedbackId: string; actionId: string; done: boolean }) {
  // feedbackId viene del componente, pero acá usamos el del route para evitar inconsistencias
  toggleActionMutation.mutate({ actionId: payload.actionId, done: payload.done })
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