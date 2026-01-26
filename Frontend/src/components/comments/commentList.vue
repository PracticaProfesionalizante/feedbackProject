<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="text-subtitle-1 font-weight-bold">
        Comentarios ({{ count }})
      </div>
    </v-card-title>

    <v-divider />

    <v-card-text>
      <!-- Loading -->
      <v-skeleton-loader v-if="isLoading" type="list-item-two-line@4" />

      <!-- Error -->
      <v-alert v-else-if="isError" type="error" variant="tonal">
        {{ errorMessage }}
      </v-alert>

      <!-- List -->
      <div v-else>
        <div v-if="count === 0" class="text-body-2 text-medium-emphasis">
          Todavía no hay comentarios.
        </div>

        <v-list v-else density="comfortable">
          <v-list-item
            v-for="c in comments"
            :key="c.id"
            class="rounded mb-2"
          >
            <template #prepend>
              <v-avatar size="32">
                <span class="text-caption font-weight-bold">
                  {{ initials(c.user?.name) }}
                </span>
              </v-avatar>
            </template>

            <v-list-item-title class="d-flex align-center justify-space-between">
              <span class="text-body-2 font-weight-medium">
                {{ c.user?.name ?? c.userId }}
              </span>
              <span class="text-caption text-medium-emphasis">
                {{ formatDateTime(c.createdAt) }}
              </span>
            </v-list-item-title>

            <v-list-item-subtitle class="mt-1" style="white-space: pre-wrap;">
              {{ c.content }}
            </v-list-item-subtitle>
          </v-list-item>

          <!-- Ancla para scroll -->
          <div ref="bottomAnchor" />
        </v-list>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { feedbackService } from '../../services/feedbackServices'
import { useAuthStore } from '../../stores/authStore'
import type { Feedback } from '../../types/feedback'
import type {Comment} from '../../types/comment'

/* =========================
   Setup
========================= */


const props = defineProps<{
  feedbackId: string
  /** polling opcional (ms). Ej: 15000 para “semi realtime”. */
  refetchIntervalMs?: number
}>()

const auth = useAuthStore()

/**
 * Leemos comentarios desde el detalle del feedback.
 * Ventaja: no requiere endpoint extra para comments.
 * (Si luego creamos /feedbacks/:id/comments, cambiamos este queryFn)
 */
const query = useQuery<Feedback, Error>({
  queryKey: computed(() => ['feedback', props.feedbackId]),
  queryFn: () => feedbackService.getFeedback(props.feedbackId),
  enabled: computed(() => auth.checked && !!auth.token && !!props.feedbackId),
  refetchOnWindowFocus: false,
  // “Tiempo real” simple por polling (opcional)
  refetchInterval: computed(() => props.refetchIntervalMs ?? false)
})

const isLoading = computed(() => query.isLoading.value)
const isError = computed(() => query.isError.value)
const errorMessage = computed(() => query.error.value?.message ?? 'Error al cargar comentarios')

const comments = computed<Comment[]>(() => {
  // El backend devuelve comments en GET /feedbacks/:id
  const data: any = query.data.value
  return (data?.comments ?? []) as Comment[]
})

const count = computed(() => comments.value.length)

/**
 * Scroll automático cuando aparece un comentario nuevo.
 */
const bottomAnchor = ref<HTMLElement | null>(null)

watch(
  () => count.value,
  async (newCount, oldCount) => {
    if (newCount <= 0) return
    // solo scrollear cuando crece (nuevo comentario)
    if (oldCount !== undefined && newCount <= oldCount) return

    await nextTick()
    bottomAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }
)

/* =========================
   Helpers UI
========================= */

function formatDateTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

function initials(name?: string) {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase()).join('')
}
</script>