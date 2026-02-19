<template>
  <v-card class="feedback-list-card" rounded="lg" elevation="1">
    <template v-if="!hideCardTitle">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="text-subtitle-1 font-weight-bold">
          {{ title }}
          <span class="text-medium-emphasis">({{ totalLabel }})</span>
        </div>

        <v-btn
          v-if="showNewButton"
          color="primary"
          prepend-icon="mdi-plus"
          @click="emit('new')"
        >
          Nuevo feedback
        </v-btn>
      </v-card-title>

      <v-divider />
    </template>

    <v-data-table
      :headers="headers"
      :items="items"
      :loading="loading"
      :items-per-page="itemsPerPage"
      :page="page"
      :items-length="itemsLength"
      loading-text="Cargando..."
      no-data-text="No hay feedbacks para mostrar."
      class="elevation-0 feedback-table"
      @update:page="onTablePageChange"
      @click:row="onRowClick"
    >
      <template v-if="hideFooter" #bottom />
      <!-- Indicador checklist: círculo verde sutil si pendientes, verde lleno si todo hecho -->
      <template #item.checklist="{ item }">
        <v-tooltip v-if="getChecklistStatus(item)" location="top">
          <template #activator="{ props: tooltipProps }">
            <span v-bind="tooltipProps" class="checklist-indicator" :class="getChecklistStatus(item)">
              <v-icon v-if="getChecklistStatus(item) === 'done'" size="small" color="success">mdi-check-circle-fill</v-icon>
              <v-icon v-else size="small" color="success" class="checklist-pending">mdi-check-circle-outline</v-icon>
            </span>
          </template>
          <span>{{ getChecklistStatus(item) === 'done' ? 'Checklist completada' : 'Checklist con ítems pendientes' }}</span>
        </v-tooltip>
      </template>

      <!-- De/Para según mode -->
      <template #item.counterpart="{ item }">
        <div class="d-flex flex-column">
          <span class="text-body-2 font-weight-medium">
            {{ getCounterpartName(item) }}
          </span>
          <span class="text-caption text-medium-emphasis">
            {{ getCounterpartEmail(item) }}
          </span>
        </div>
      </template>

      <!-- Fecha -->
      <template #item.createdAt="{ item }">
        <span class="text-body-2">{{ formatDate(item.createdAt) }}</span>
      </template>

      <!-- Preview -->
      <template #item.preview="{ item }">
        <span class="text-body-2">{{ preview(item.content) }}</span>
      </template>

      <!-- Acción -->
      <template #item.actions="{ item }">
        <v-btn
          size="small"
          variant="text"
          prepend-icon="mdi-eye-outline"
          @click.stop="emit('open', item.id)"
        >
          Ver
        </v-btn>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Feedback } from '../../types/feedback'

type Mode = 'received' | 'sent'

const props = withDefaults(
  defineProps<{
    title?: string
    mode: Mode
    items: Feedback[]
    loading: boolean

    // paginación controlada desde la vista
    page: number
    itemsPerPage?: number

    // si el backend pagina: total real
    total?: number

    showNewButton?: boolean
    /** Oculta el footer de paginación para usar v-pagination externo */
    hideFooter?: boolean
    /** Oculta el título de la card (solo se muestra la tabla con sus cabeceras) */
    hideCardTitle?: boolean
  }>(),
  {
    title: 'Feedbacks',
    itemsPerPage: 10,
    total: undefined,
    showNewButton: false,
    hideFooter: false,
    hideCardTitle: false
  }
)

const emit = defineEmits<{
  (e: 'open', id: string): void
  (e: 'new'): void
  (e: 'update:page', page: number): void
}>()

/**
 * Headers de la tabla.
 * Usamos una columna "counterpart" para representar De/Para según tab.
 */
const headers = computed(() => {
  return [
    { title: '', key: 'checklist', sortable: false, width: '48px', align: 'center' },
    {
      title: props.mode === 'received' ? 'De' : 'Para',
      key: 'counterpart',
      sortable: false
    },
    { title: 'Fecha', key: 'createdAt', sortable: true },
    { title: 'Contenido', key: 'preview', sortable: false },
    { title: '', key: 'actions', sortable: false, align: 'end' }
  ] as const
})

const itemsLength = computed(() => {
  // Si nos pasan total (server-side pagination), usamos ese.
  // Si no, usamos el largo del array (client-side).
  return typeof props.total === 'number' ? props.total : props.items.length
})

const totalLabel = computed(() => {
  return itemsLength.value
})

function onRowClick(_: unknown, row: any) {
  // Vuetify entrega { item } en row; defendemos por si cambia
  const id: string | undefined = row?.item?.id
  if (id) emit('open', id)
}

/** Solo reenviar cambio de página si la paginación es de la tabla (no externa). Con hideFooter la paginación es externa y la tabla no debe resetear la página. */
function onTablePageChange(newPage: number) {
  if (!props.hideFooter) emit('update:page', newPage)
}

function preview(text: string) {
  const t = (text ?? '').trim()
  if (t.length <= 100) return t
  return `${t.slice(0, 100)}…`
}

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString()
}

function getCounterpartName(f: Feedback) {
  if (props.mode === 'received') {
    return f.fromUser?.name ?? f.fromUserId
  }
  return f.toUser?.name ?? f.toUserId
}

function getCounterpartEmail(f: Feedback) {
  if (props.mode === 'received') {
    return f.fromUser?.email ?? ''
  }
  return f.toUser?.email ?? ''
}

/** 'pending' = tiene checklist con ítems pendientes, 'done' = checklist todo hecho, '' = sin checklist */
function getChecklistStatus(f: Feedback): 'pending' | 'done' | '' {
  const actions = f.actions ?? []
  if (actions.length === 0) return ''
  const allDone = actions.every((a) => a.done)
  return allDone ? 'done' : 'pending'
}
</script>

<style scoped>
.feedback-list-card {
  overflow: hidden;
}
.feedback-table :deep(thead th) {
  font-weight: 600;
  letter-spacing: 0.02em;
}
.checklist-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.checklist-pending {
  opacity: 0.6;
}
</style>