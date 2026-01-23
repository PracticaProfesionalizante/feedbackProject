<template>
  <v-card variant="tonal" class="mb-4">
    <v-card-text>
      <div class="d-flex flex-wrap align-center gap-3">
        <!-- Tipo -->
        <v-select
          :model-value="typeValue"
          :items="typeItems"
          item-title="title"
          item-value="value"
          label="Tipo"
          density="comfortable"
          hide-details
          clearable
          style="max-width: 180px"
          @update:model-value="onTypeChange($event)"
        />

        <!-- Estado -->
        <v-select
          :model-value="statusValue"
          :items="statusItems"
          item-title="title"
          item-value="value"
          label="Estado"
          density="comfortable"
          hide-details
          clearable
          style="max-width: 180px"
          @update:model-value="onStatusChange($event)"
        />

        <!-- Búsqueda por contenido o usuario -->
        <v-text-field
          :model-value="search"
          label="Buscar (contenido o usuario)"
          placeholder="Texto..."
          density="comfortable"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          style="max-width: 260px"
          @update:model-value="setSearch($event ?? '')"
        />

        <!-- Rango de fechas (opcional) -->
        <v-text-field
          :model-value="dateFrom"
          type="date"
          label="Desde"
          density="comfortable"
          hide-details
          clearable
          style="max-width: 150px"
          @update:model-value="onDateFromChange($event)"
        />
        <v-text-field
          :model-value="dateTo"
          type="date"
          label="Hasta"
          density="comfortable"
          hide-details
          clearable
          style="max-width: 150px"
          @update:model-value="onDateToChange($event)"
        />

        <!-- Limpiar filtros -->
        <v-btn
          v-if="hasActiveFilters"
          variant="outlined"
          color="secondary"
          prepend-icon="mdi-filter-off"
          @click="clearFilters"
        >
          Limpiar filtros
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFeedbackFilters } from '../../composables/useFeedbackFilters'
import type { FeedbackStatus, FeedbackType } from '../../types/feedback'

const {
  type,
  status,
  search,
  dateFrom,
  dateTo,
  hasActiveFilters,
  setType,
  setStatus,
  setSearch,
  setDateRange,
  clearFilters,
} = useFeedbackFilters()

const typeValue = computed(() => type.value ?? 'Todos')
const statusValue = computed(() => status.value ?? 'Todos')

const typeItems = [
  { title: 'Todos', value: 'Todos' },
  { title: 'Reconocimiento', value: 'RECOGNITION' },
  { title: 'Mejora', value: 'IMPROVEMENT' },
  { title: 'General', value: 'GENERAL' },
]

const statusItems = [
  { title: 'Todos', value: 'Todos' },
  { title: 'Pendiente', value: 'PENDING' },
  { title: 'En progreso', value: 'IN_PROGRESS' },
  { title: 'Completado', value: 'COMPLETED' },
]

function onTypeChange(v: string | FeedbackType | 'Todos' | null | undefined) {
  setType((v && v !== 'Todos' ? v : 'Todos') as FeedbackType | 'Todos' | '')
}

function onStatusChange(v: string | FeedbackStatus | 'Todos' | null | undefined) {
  setStatus((v && v !== 'Todos' ? v : 'Todos') as FeedbackStatus | 'Todos' | '')
}

function onDateFromChange(v: string | null | undefined) {
  setDateRange(v ?? '', dateTo.value)
}

function onDateToChange(v: string | null | undefined) {
  setDateRange(dateFrom.value, v ?? '')
}
</script>
