<template>
  <v-container class="feedbacks-view">
    <!-- Pestañas superiores (zona separada) -->
    <div class="tabs-bar">
      <v-tabs
        :model-value="tab"
        color="primary"
        density="comfortable"
        class="feedbacks-tabs"
        @update:model-value="onTabChange"
      >
        <v-tab value="received">Recibidos</v-tab>
        <v-tab value="sent">Enviados</v-tab>
      </v-tabs>

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        variant="elevated"
        rounded="lg"
        class="btn-new"
        @click="goToNew"
      >
        Nuevo Feedback
      </v-btn>
    </div>

    <!-- Separador visual: todo el contenido debajo queda claramente separado -->
    <v-divider class="content-divider" />
    <div class="content-area">
      <!-- Búsqueda -->
      <div class="search-row">
        <v-text-field
          :model-value="searchInput"
          placeholder="Buscar por fecha, descripción o contenido..."
          density="comfortable"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded="lg"
          class="search-field"
          :loading="isSearching"
          @update:model-value="onSearchInput($event ?? '')"
        />
      </div>

      <!-- Tabla -->
      <FeedbackList
        :title="tabTitle"
        :mode="tab"
        :items="listItems"
        :total="listTotal"
        :loading="isLoading"
        :page="page"
        :items-per-page="limit"
        :hide-footer="true"
        :hide-card-title="true"
        @update:page="setPage($event)"
        @open="goToDetail"
        @new="goToNew"
      />

      <!-- Paginación -->
      <div
        v-if="listTotal !== undefined"
        class="d-flex flex-wrap align-center justify-space-between gap-3 mt-4 pagination-row"
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
            rounded="lg"
            @update:model-value="jumpPageInput = $event"
            @keyup.enter="applyJumpToPage"
          />
          <v-btn size="small" variant="tonal" rounded="lg" @click="applyJumpToPage">
            Ir
          </v-btn>
        </div>
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

<style scoped>
.feedbacks-view {
  max-width: 1200px;
  margin-inline: auto;
  padding-bottom: 2rem;
}

/* Zona de pestañas: bien separada del contenido */
.tabs-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: 0.5rem 0.25rem;
}
.content-divider {
  margin: 0.5rem 0 1.5rem;
  opacity: 0.6;
}

/* Área de contenido (búsqueda + tabla): más aire y separación clara */
.content-area {
  padding-top: 0.5rem;
}

.search-row {
  margin-bottom: 1.25rem;
  width: 50%;
  max-width: 100%;
}
.search-field :deep(.v-field--focused) {
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
}

.pagination-row {
  padding-block: 0.5rem;
}
</style>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import FeedbackList from '../components/feedbacks/FeedbackList.vue'
import { useFeedbackFilters } from '../composables/useFeedbackFilters'
import { feedbackService } from '../services/feedbackServices'
import type { Feedback, FeedbacksResponse } from '../types/feedback'

const router = useRouter()
const {
  tab,
  page,
  limit,
  search,
  apiFilters,
  setTab,
  setPage,
  setSearch,
} = useFeedbackFilters()

const jumpPageInput = ref('')
const snackbar = reactive({
  open: false,
  message: ''
})

/** Valor del input; la búsqueda se aplica con debounce para no saturar el backend */
const searchInput = ref('')
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
const SEARCH_DEBOUNCE_MS = 550

function onSearchInput(value: string) {
  searchInput.value = value
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    setSearch(value)
    searchDebounceTimer = null
  }, SEARCH_DEBOUNCE_MS)
}

/** Solo true cuando está cargando por un cambio de búsqueda (feedback visual) */
const isSearching = computed(() => isLoading.value && !!searchInput.value?.trim())

onMounted(() => {
  searchInput.value = search.value ?? ''
})
watch(search, (newVal) => {
  if (searchInput.value !== (newVal ?? '')) {
    searchInput.value = newVal ?? ''
  }
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