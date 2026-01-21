<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="text-h6 font-weight-bold">Feedbacks</div>

      <v-btn color="primary" prepend-icon="mdi-plus" @click="goToNew">
        Nuevo Feedback
      </v-btn>
    </div>

    <!-- Tabs -->
    <v-tabs v-model="tab" color="primary" density="comfortable">
      <v-tab value="received">Recibidos</v-tab>
      <v-tab value="sent">Enviados</v-tab>
    </v-tabs>

    <v-divider class="my-4" />

    <!-- List -->
    <FeedbackList
      :title="tabTitle"
      :mode="tab"
      :items="listItems"
      :total="listTotal"
      :loading="isLoading"
      :page="page"
      :items-per-page="ITEMS_PER_PAGE"
      @update:page="page = $event"
      @open="goToDetail"
      @new="goToNew"
    />

    <!-- Error snackbar -->
    <v-snackbar v-model="snackbar.open" :timeout="6000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.open = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import FeedbackList from '../components/feedbacks/FeedbackList.vue'
import { feedbackService } from '../services/feedbackServices'
import type { Feedback, FeedbacksResponse } from '../types/feedback'

type TabValue = 'received' | 'sent'

const router = useRouter()

const ITEMS_PER_PAGE = 20

const tab = ref<TabValue>('received')
const page = ref(1)

const snackbar = reactive({
  open: false,
  message: ''
})

function showError(message: string) {
  snackbar.message = message
  snackbar.open = true
}

const tabTitle = computed(() => (tab.value === 'received' ? 'Feedbacks Recibidos' : 'Feedbacks Enviados'))

/**
 * Query principal
 * - queryKey incluye tab y page para cache/paginación correcta
 * - keepPreviousData permite que al cambiar de página no "parpadee"
 */
const query = useQuery<FeedbacksResponse, Error>({
  queryKey: computed(() => ['feedbacks', tab.value, page.value]),
  queryFn: () =>
    feedbackService.getFeedbacks({
      type: tab.value, // backend: received | sent
      page: page.value,
      limit: ITEMS_PER_PAGE
    } as any),
  keepPreviousData: true
})

// Manejo de error
watch(
  () => query.error.value,
  (err) => {
    if (err) showError(err.message || 'Error al cargar feedbacks')
  }
)

/**
 * Normalización de respuesta:
 * - Si backend devuelve array directo => items = data
 * - Si devuelve { items, total } => items/total
 * - Si devuelve { data: ... } => ya viene unwrap en service (ideal)
 */
const listItems = computed<Feedback[]>(() => {
  const data = query.data.value as any
  if (!data) return []

  // Caso: { items: [...] }
  if (Array.isArray(data?.items)) return data.items as Feedback[]

  // Caso: array directo
  if (Array.isArray(data)) return data as Feedback[]

  // Caso raro: { users: [...] } o similar
  if (Array.isArray(data?.data?.items)) return data.data.items as Feedback[]
  if (Array.isArray(data?.data)) return data.data as Feedback[]

  return []
})

const listTotal = computed<number | undefined>(() => {
  const data = query.data.value as any
  if (!data) return undefined

  // Caso: { total }
  if (typeof data?.total === 'number') return data.total

  // Si es array, el total sería el length (pero no sirve para paginación server-side)
  if (Array.isArray(data)) return data.length

  return undefined
})

const isLoading = computed(() => query.isLoading.value)

/**
 * UX: al cambiar de tab, reseteamos page a 1
 */
watch(tab, () => {
  page.value = 1
})

function goToDetail(id: string) {
  router.push(`/feedbacks/${id}`)
}

function goToNew() {
  router.push('/feedbacks/new')
}
</script>
