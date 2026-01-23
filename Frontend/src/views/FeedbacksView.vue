<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="text-h6 font-weight-bold">Feedbacks</div>

      <v-btn color="primary" prepend-icon="mdi-plus" @click="goToNew">
        Nuevo Feedback
      </v-btn>
    </div>

    <!-- Tabs: al cambiar, setTab resetea filtros -->
    <v-tabs
      :model-value="tab"
      color="primary"
      density="comfortable"
      @update:model-value="onTabChange"
    >
      <v-tab value="received">Recibidos</v-tab>
      <v-tab value="sent">Enviados</v-tab>
    </v-tabs>

    <v-divider class="my-4" />

    <!-- Filtros -->
    <FeedbackFilters />

    <!-- Lista -->
    <FeedbackList
      :title="tabTitle"
      :mode="tab"
      :items="listItems"
      :total="listTotal"
      :loading="isLoading"
      :page="page"
      :items-per-page="limit"
      :hide-footer="true"
      @update:page="setPage($event)"
      @open="goToDetail"
      @new="goToNew"
    />

    <!-- Paginación: total + v-pagination + jump to page -->
    <div
      v-if="listTotal !== undefined"
      class="d-flex flex-wrap align-center justify-space-between gap-3 mt-4"
    >
      <span class="text-body-2 text-medium-emphasis">
        Total: {{ listTotal }} resultado{{ listTotal !== 1 ? 's' : '' }}
      </span>
      <div v-if="totalPages > 1" class="d-flex align-center gap-2">
        <v-pagination
          :model-value="page"
          :length="totalPages"
          :total-visible="7"
          density="comfortable"
          show-first-last-page
          @update:model-value="setPage($event)"
        />
        <span class="text-caption text-medium-emphasis px-1">Ir a</span>
        <v-text-field
          :model-value="jumpPageInput"
          type="number"
          min="1"
          :max="totalPages"
          density="compact"
          hide-details
          variant="outlined"
          style="max-width: 64px"
          @update:model-value="jumpPageInput = $event"
          @keyup.enter="applyJumpToPage"
        />
        <v-btn size="small" variant="tonal" @click="applyJumpToPage">
          Ir
        </v-btn>
      </div>
    </div>

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
import FeedbackFilters from '../components/feedbacks/FeedbackFilters.vue'
import { useFeedbackFilters } from '../composables/useFeedbackFilters'
import { feedbackService } from '../services/feedbackServices'
import type { Feedback, FeedbacksResponse } from '../types/feedback'

const router = useRouter()
const {
  tab,
  page,
  limit,
  apiFilters,
  setTab,
  setPage,
} = useFeedbackFilters()

const jumpPageInput = ref('')
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
 * Query principal con filtros y paginación.
 * queryKey incluye apiFilters para refetch al cambiar filtros/tab/page.
 */
const query = useQuery<FeedbacksResponse, Error>({
  queryKey: computed(() => ['feedbacks', { ...apiFilters.value }]),
  queryFn: () => feedbackService.getFeedbacks(apiFilters.value),
  placeholderData: (prev) => prev
})

watch(
  () => query.error.value,
  (err) => {
    if (err) showError(err.message || 'Error al cargar feedbacks')
  }
)

const listItems = computed<Feedback[]>(() => {
  const data = query.data.value as any
  if (!data) return []
  if (Array.isArray(data?.items)) return data.items as Feedback[]
  if (Array.isArray(data)) return data as Feedback[]
  if (Array.isArray(data?.data?.items)) return data.data.items as Feedback[]
  if (Array.isArray(data?.data)) return data.data as Feedback[]
  return []
})

const listTotal = computed<number | undefined>(() => {
  const data = query.data.value as any
  if (!data) return undefined
  if (typeof data?.total === 'number') return data.total
  if (Array.isArray(data)) return data.length
  return undefined
})

const isLoading = computed(() => query.isLoading.value)

const totalPages = computed(() => {
  const total = listTotal.value
  const lim = limit.value
  if (total == null || lim <= 0) return 1
  return Math.max(1, Math.ceil(total / lim))
})

function onTabChange(e: unknown) {
  const v = e as 'received' | 'sent'
  if (v === 'received' || v === 'sent') setTab(v)
}

function applyJumpToPage() {
  const n = parseInt(jumpPageInput.value, 10)
  if (!Number.isNaN(n) && n >= 1 && n <= totalPages.value) {
    setPage(n)
    jumpPageInput.value = ''
  }
}

function goToDetail(id: string) {
  router.push(`/feedbacks/${id}`)
}

function goToNew() {
  router.push('/feedbacks/new')
}
</script>
