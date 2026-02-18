<template>
  <div class="d-flex flex-wrap ga-4">
    <v-card class="stat-card" variant="tonal" color="success">
      <v-card-title class="text-caption text-medium-emphasis">Reconocimiento</v-card-title>
      <v-card-text class="text-h4 font-weight-bold">
        <span v-if="!loading">{{ counts.recognition }}</span>
        <v-skeleton-loader v-else type="text" />
      </v-card-text>
    </v-card>

    <v-card class="stat-card" variant="tonal" color="warning">
      <v-card-title class="text-caption text-medium-emphasis">Mejora</v-card-title>
      <v-card-text class="text-h4 font-weight-bold">
        <span v-if="!loading">{{ counts.improvement }}</span>
        <v-skeleton-loader v-else type="text" />
      </v-card-text>
    </v-card>

    <v-card class="stat-card" variant="tonal" color="info">
      <v-card-title class="text-caption text-medium-emphasis">General</v-card-title>
      <v-card-text class="text-h4 font-weight-bold">
        <span v-if="!loading">{{ counts.general }}</span>
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

const stats = computed(() => {
  if (!props.data) return null
  return 'data' in props.data ? props.data.data : props.data
})

const byType = computed(() => stats.value?.feedbacksByType ?? stats.value?.byType)

const counts = computed(() => ({
  recognition: byType.value?.recognition ?? 0,
  improvement: byType.value?.improvement ?? 0,
  general: byType.value?.general ?? 0,
}))
</script>

<style scoped>
.stat-card {
  width: 280px;
  max-width: 100%;
}
</style>
