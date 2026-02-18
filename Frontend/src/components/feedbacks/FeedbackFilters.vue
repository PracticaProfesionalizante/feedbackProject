<template>
  <v-card variant="tonal" class="mb-4">
    <v-card-text>
      <div class="d-flex flex-wrap align-center gap-3">
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
import { useFeedbackFilters } from '../../composables/useFeedbackFilters'

const {
  search,
  dateFrom,
  dateTo,
  hasActiveFilters,
  setSearch,
  setDateRange,
  clearFilters,
} = useFeedbackFilters()

function onDateFromChange(v: string | null | undefined) {
  setDateRange(v ?? '', dateTo.value)
}

function onDateToChange(v: string | null | undefined) {
  setDateRange(dateFrom.value, v ?? '')
}
</script>
