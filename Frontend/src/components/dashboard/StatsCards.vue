<template>
  <div class="d-flex flex-wrap ga-4">
    <v-card
      v-for="config in statConfigs"
      :key="config.key"
      class="stat-card"
      :color="config.color"
      variant="tonal"
      elevation="2"
    >
      <v-card-title class="d-flex align-center ga-2 text-caption text-medium-emphasis">
        <v-icon :icon="config.icon" size="small" />
        {{ config.label }}
      </v-card-title>
      <v-card-text class="text-h4 font-weight-bold">
        <span v-if="!loading">{{ counts[config.key] }}</span>
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
