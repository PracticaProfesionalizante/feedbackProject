<template>
  <v-card elevation="2">
    <v-card-title class="d-flex align-center ga-2 text-subtitle-1 font-weight-bold">
      <v-icon icon="mdi-chart-donut" size="small" />
      Feedbacks por tipo
    </v-card-title>
    <v-divider />
    <v-card-text>
      <v-skeleton-loader v-if="loading" type="image" class="rounded" />
      <div v-else-if="!hasData" class="text-body-2 text-medium-emphasis py-6 text-center">
        No hay datos por tipo para mostrar.
      </div>
      <div v-else class="chart-container">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import type { DashboardStatsResponse } from '../../types/dashboard'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  data: DashboardStatsResponse | null
  loading: boolean
}>()

const stats = computed(() => {
  if (!props.data) return null
  return 'data' in props.data ? props.data.data : props.data
})

const byType = computed(() => stats.value?.byType ?? stats.value?.feedbacksByType)

const hasData = computed(() => {
  const b = byType.value
  if (!b) return false
  return (b.recognition + b.improvement + b.general) > 0
})

const chartData = computed(() => {
  const b = byType.value ?? { recognition: 0, improvement: 0, general: 0 }
  return {
    labels: ['Reconocimiento', 'Mejora', 'General'],
    datasets: [
      {
        data: [b.recognition, b.improvement, b.general],
        backgroundColor: [
          'rgba(33, 150, 243, 0.8)',   // blue
          'rgba(255, 152, 0, 0.8)',    // orange
          'rgba(76, 175, 80, 0.8)',    // green
        ],
        borderColor: ['rgb(33, 150, 243)', 'rgb(255, 152, 0)', 'rgb(76, 175, 80)'],
        borderWidth: 1,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: 'bottom' as const },
  },
}
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 280px;
  max-width: 100%;
}
</style>
