<template>
  <div class="d-flex flex-wrap ga-4">
    <v-card class="stat-card" variant="tonal">
      <v-card-title class="text-caption text-medium-emphasis">Pendientes</v-card-title>
      <v-card-text class="text-h4 font-weight-bold">
        <span v-if="!loading">{{ pending }}</span>
        <v-skeleton-loader v-else type="text" />
      </v-card-text>
    </v-card>

    <v-card class="stat-card" variant="tonal">
      <v-card-title class="text-caption text-medium-emphasis">En progreso</v-card-title>
      <v-card-text class="text-h4 font-weight-bold">
        <span v-if="!loading">{{ inProgress }}</span>
        <v-skeleton-loader v-else type="text" />
      </v-card-text>
    </v-card>

    <v-card class="stat-card" variant="tonal">
      <v-card-title class="text-caption text-medium-emphasis">Completados</v-card-title>
      <v-card-text class="text-h4 font-weight-bold">
        <span v-if="!loading">{{ completed }}</span>
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

const pending = computed(() => props.data?.feedbacksByStatus?.pending ?? 0)
const inProgress = computed(() => props.data?.feedbacksByStatus?.inProgress ?? 0)
const completed = computed(() => props.data?.feedbacksByStatus?.completed ?? 0)
</script>

<style scoped>
.stat-card {
  width: 280px;
  max-width: 100%;
}
</style>