<template>
  <v-container class="feedbacks-view">
    <!-- Pestañas + acciones -->
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

    <v-divider class="content-divider" />

    <div class="clear-filters-row">
      <v-btn
        :disabled="!hasActiveFilters"
        color="secondary"
        variant="tonal"
        icon="mdi-filter-off"
        rounded="lg"
        class="btn-clear-filters"
        title="Borrar filtros"
        @click="clearFilters"
      />
    </div>

    <div class="layout-row">
      <!-- Sidebar izquierdo: filtro por usuario -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <v-text-field
            v-model="userSearchInput"
            placeholder="Buscar usuario..."
            density="compact"
            hide-details
            clearable
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            rounded="lg"
            class="user-search"
          />
        </div>
        <div class="user-list-wrap">
          <div v-if="counterpartsLoading" class="user-list-loading">
            <v-progress-circular indeterminate size="24" />
            <span>Cargando usuarios...</span>
          </div>
          <div v-else-if="filteredCounterparts.length === 0" class="user-list-empty">
            {{ userSearchInput ? 'Sin coincidencias' : 'No hay usuarios' }}
          </div>
          <v-list v-else density="compact" class="user-list">
            <v-list-item
              v-for="u in sortedCounterparts"
              :key="u.id"
              :title="u.name"
              :subtitle="u.email"
              rounded="lg"
              :class="['user-list-item', { 'user-list-item--selected': userId === u.id }]"
              @click="toggleUserFilter(u.id)"
            />
          </v-list>
        </div>
      </aside>

      <!-- Área principal: búsqueda + tabla -->
      <div class="content-area">
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
    </div>

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
  max-width: 1400px;
  margin-inline: auto;
  padding-bottom: 2rem;
}

.tabs-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: 0.5rem 0.25rem;
}
.content-divider {
  margin: 0.5rem 0 1rem;
  opacity: 0.6;
}
.clear-filters-row {
  margin-bottom: 1rem;
  padding: 0.25rem 0;
}
.layout-row {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.sidebar {
  flex: 0 0 280px;
  min-width: 0;
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}
.sidebar-header {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.user-search :deep(.v-field) {
  font-size: 0.9rem;
}
.user-list-wrap {
  max-height: 420px;
  overflow-y: auto;
}
.user-list-loading,
.user-list-empty {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.875rem;
}
.user-list {
  padding: 0.5rem !important;
}
.user-list-item {
  margin-bottom: 2px;
}
.user-list-item--selected {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.user-list-item--selected :deep(.v-list-item-subtitle) {
  opacity: 0.9;
}

.content-area {
  flex: 1;
  min-width: 0;
  padding-top: 0.25rem;
}

.search-row {
  margin-bottom: 1rem;
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
import type { Feedback, FeedbacksResponse, FeedbackCounterpart } from '../types/feedback'

const router = useRouter()
const {
  tab,
  page,
  limit,
  search,
  userId,
  hasActiveFilters,
  apiFilters,
  setTab,
  setPage,
  setSearch,
  setUserId,
  clearFilters,
} = useFeedbackFilters()

const jumpPageInput = ref('')
const userSearchInput = ref('')
const snackbar = reactive({
  open: false,
  message: ''
})

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

const counterpartsQuery = useQuery<FeedbackCounterpart[]>({
  queryKey: ['feedbacks-counterparts'],
  queryFn: () => feedbackService.getCounterparts(),
})
const counterparts = computed(() => counterpartsQuery.data.value ?? [])
const counterpartsLoading = computed(() => counterpartsQuery.isLoading.value)

const filteredCounterparts = computed(() => {
  const list = counterparts.value
  const q = (userSearchInput.value ?? '').trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q))
  )
})

/** Lista con el usuario seleccionado siempre primero (y con estilo distinto) */
const sortedCounterparts = computed(() => {
  const list = filteredCounterparts.value
  const selectedId = userId.value
  if (!selectedId) return list
  const selected = list.find((u) => u.id === selectedId)
  if (!selected) return list
  const rest = list.filter((u) => u.id !== selectedId)
  return [selected, ...rest]
})

const query = useQuery<FeedbacksResponse, Error>({
  queryKey: computed(() => ['feedbacks', { ...apiFilters.value }]),
  queryFn: ({ queryKey }) => {
    const [, filters] = queryKey as [string, typeof apiFilters.value]
    return feedbackService.getFeedbacks(filters ?? apiFilters.value)
  },
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

// Si la página actual queda fuera de rango (ej. filtros redujeron el total), volver a página 1
watch([listTotal, limit, page], () => {
  const total = listTotal.value
  const lim = limit.value
  const p = page.value
  if (total == null || lim <= 0) return
  const maxPage = Math.max(1, Math.ceil(total / lim))
  if (p > maxPage) setPage(1)
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

function toggleUserFilter(id: string) {
  setUserId(userId.value === id ? undefined : id)
}

function goToDetail(id: string) {
  router.push(`/feedbacks/${id}`)
}

function goToNew() {
  router.push('/feedbacks/new')
}
</script>
