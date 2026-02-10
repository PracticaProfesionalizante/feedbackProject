<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-subtitle-1 font-weight-bold">Acciones</div>
      <v-chip v-if="items.length" size="small" variant="tonal">
        {{ doneCount }}/{{ items.length }}
      </v-chip>
    </div>

    <!-- Empty state -->
    <v-alert v-if="items.length === 0" type="info" variant="tonal">
      No hay acciones para este feedback.
    </v-alert>

    <!-- List -->
    <v-list v-else density="comfortable">
      <v-list-item
        v-for="(action, idx) in items"
        :key="actionKey(action, idx)"
        class="rounded"
      >
        <template #prepend>
          <v-checkbox-btn
            :model-value="action.done"
            :disabled="disabled"
            @update:model-value="onToggle(idx, $event)"
          />
        </template>

        <v-list-item-title class="text-body-2">
          {{ action.text }}
        </v-list-item-title>

        <template #append>
          <v-chip
            v-if="action.done"
            size="small"
            color="primary"
            variant="tonal"
          >
            Hecho
          </v-chip>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FeedbackAction } from '@/types/feedback'

/**
 * Viewer: NO permite editar texto.
 * Permite toggle done (si disabled=false).
 *
 * Soporta 2 estrategias:
 * 1) Local/draft: actualiza modelValue y emite update:modelValue
 * 2) Integrado con backend: emite toggle(actionId, done) y el parent muta
 */
const props = defineProps<{
  modelValue: FeedbackAction[]
  disabled?: boolean

  /** si true, el toggle NO muta localmente y solo emite "toggle" */
  emitOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FeedbackAction[]): void
  (e: 'toggle', payload: { id: string; done: boolean }): void
}>()

const items = ref<FeedbackAction[]>([])

watch(
  () => props.modelValue,
  (val) => {
    items.value = (val ?? []).map((a) => ({ ...a }))
  },
  { immediate: true, deep: true }
)

const doneCount = computed(() => items.value.filter((a) => a.done).length)

function sync() {
  emit('update:modelValue', items.value.map((a) => ({ ...a })))
}

function onToggle(index: number, done: boolean) {
  const a = items.value[index]
  if (!a) return

  // Siempre emitimos "toggle" para que el parent pueda mutar en backend si quiere
  emit('toggle', { id: a.id, done })

  // Si emitOnly=true, no tocamos el estado local
  if (props.emitOnly) return

  // Modo local/draft: actualizamos lista y emitimos update:modelValue
  a.done = done
  sync()
}

function actionKey(action: FeedbackAction, idx: number) {
  return action.id || `${idx}-${action.text}`
}
</script>