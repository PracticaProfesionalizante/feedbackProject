<template>
  <v-container>
    <div class="mb-4">
      <div class="text-h6 font-weight-bold">Dashboard</div>
      <div class="text-body-2 text-medium-emphasis">
        Resumen y actividad reciente
      </div>
    </div>

    <StatsCards :data="statsData" :loading="statsLoading" />

    <div class="mt-6">
      <RecentFeedbacks
        :items="recentItems"
        :loading="recentLoading"
        :current-user-id="auth.user?.id"
        @open="goToDetail"
        @new="goToNew"
      />
    </div>

    <v-snackbar v-model="snackbar.open" :timeout="6000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.open = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '../stores/authStore'
import { dashboardService } from '../services/dashboardService'
import StatsCards from '../components/dashboard/StatsCards.vue'
import RecentFeedbacks from '../components/dashboard/RecentFeedbacks.vue'

const router = useRouter()
const auth = useAuthStore()

const snackbar = reactive({ open: false, message: '' })
function showError(msg: string) {
  snackbar.message = msg
  snackbar.open = true
}

const canFetch = computed(() => auth.checked && !!auth.token)

const statsQuery = useQuery({
  queryKey: ['dashboard', 'stats', auth.token],
  queryFn: () => dashboardService.getStats(),
  enabled: canFetch,
})

const recentQuery = useQuery({
  queryKey: ['dashboard', 'recent', auth.token],
  queryFn: () => dashboardService.getRecent(),
  enabled: canFetch,
})

watch(
  () => statsQuery.error.value,
  (e) => e && showError(e.message || 'Error al cargar estadísticas')
)
watch(
  () => recentQuery.error.value,
  (e) => e && showError(e.message || 'Error al cargar feedbacks recientes')
)

const statsData = computed(() => statsQuery.data.value ?? null)
const statsLoading = computed(() => statsQuery.isLoading.value)

const recentItems = computed(() => recentQuery.data.value?.items ?? [])
const recentLoading = computed(() => recentQuery.isLoading.value)

function goToDetail(id: string) {
  router.push(`/feedbacks/${id}`)
}

function goToNew() {
  router.push('/feedbacks/new')
}
</script>