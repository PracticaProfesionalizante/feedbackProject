<template>
  <div class="d-flex flex-wrap ga-4">
    <v-card class="stat-card" variant="tonal" color="grey">
      <v-card-title class="text-caption text-medium-emphasis">Pendientes</v-card-title>
      <v-card-text class="text-h4 font-weight-bold">
        <span v-if="!loading">{{ counts.pending }}</span>
        <v-skeleton-loader v-else type="text" />
      </v-card-text>
    </v-card>

    <v-card class="stat-card" variant="tonal" color="warning">
      <v-card-title class="text-caption text-medium-emphasis">En progreso</v-card-title>
      <v-card-text class="text-h4 font-weight-bold">
        <span v-if="!loading">{{ counts.inProgress }}</span>
        <v-skeleton-loader v-else type="text" />
      </v-card-text>
    </v-card>

    <v-card class="stat-card" variant="tonal" color="success">
      <v-card-title class="text-caption text-medium-emphasis">Completados</v-card-title>
      <v-card-text class="text-h4 font-weight-bold">
        <span v-if="!loading">{{ counts.completed }}</span>
        <v-skeleton-loader v-else type="text" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardStatsResponse } from '../../types/dashboard'

const props = defineProps<{
  data: DashboardStatsResponse | null
  loading: boolean
}>()

const statConfigs = [
  {
    key: 'pending' as const,
    label: 'Feedbacks Pendientes',
    color: 'grey',
    icon: 'mdi-clock-outline',
  },
  {
    key: 'inProgress' as const,
    label: 'Feedbacks En Proceso',
    color: 'warning',
    icon: 'mdi-progress-clock',
  },
  {
    key: 'completed' as const,
    label: 'Feedbacks Completados',
    color: 'success',
    icon: 'mdi-check-circle-outline',
  },
]

// Normalizar la respuesta (puede venir como { data: ... } o directo)
const stats = computed(() => {
  if (!props.data) return null
  return 'data' in props.data ? props.data.data : props.data
})

const counts = computed(() => ({
  pending: stats.value?.pending ?? 0,
  inProgress: stats.value?.inProgress ?? 0,
  completed: stats.value?.completed ?? 0,
}))
</script>

<style scoped>
.stat-card {
  width: 280px;
  max-width: 100%;
}
</style>
