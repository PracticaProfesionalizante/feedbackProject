<template>
  <div class="d-flex flex-wrap ga-4">
    <v-card class="stat-card" variant="tonal" color="primary">
      <v-card-title class="text-caption text-medium-emphasis">Recibidos</v-card-title>
      <v-card-text class="text-h4 font-weight-bold">
        <span v-if="!loading">{{ counts.totalReceived }}</span>
        <v-skeleton-loader v-else type="text" />
      </v-card-text>
    </v-card>

    <v-card class="stat-card" variant="tonal" color="secondary">
      <v-card-title class="text-caption text-medium-emphasis">Enviados</v-card-title>
      <v-card-text class="text-h4 font-weight-bold">
        <span v-if="!loading">{{ counts.totalSent }}</span>
        <v-skeleton-loader v-else type="text" />
      </v-card-text>
    </v-card>

    <v-card class="stat-card" variant="tonal" color="grey">
      <v-card-title class="text-caption text-medium-emphasis">Notificaciones sin leer</v-card-title>
      <v-card-text class="text-h4 font-weight-bold">
        <span v-if="!loading">{{ counts.unreadNotifications }}</span>
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

const counts = computed(() => ({
  totalReceived: stats.value?.totalReceived ?? 0,
  totalSent: stats.value?.totalSent ?? 0,
  unreadNotifications: stats.value?.unreadNotifications ?? 0,
}))
</script>

<style scoped>
.stat-card {
  width: 280px;
  max-width: 100%;
}
</style>
