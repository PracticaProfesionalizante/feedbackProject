<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-subtitle-1 font-weight-bold">Acciones</div>
      <v-chip v-if="items.length" size="small" variant="tonal">
        {{ items.length }}
      </v-chip>
    </div>

    <!-- Add action -->
    <div class="d-flex ga-2 align-start">
      <v-text-field
        v-model="newText"
        label="Agregar acción"
        placeholder="Ej: Armar un plan de carrera"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        :error="Boolean(inputError)"
        :error-messages="inputError"
        @keydown.enter.prevent="addAction"
        class="flex-1"
      />
      <v-btn
        color="primary"
        variant="flat"
        :disabled="!canAdd"
        @click="addAction"
      >
        Agregar
      </v-btn>
    </div>

    <!-- Empty state -->
    <v-alert
      v-if="items.length === 0"
      type="info"
      variant="tonal"
      class="mt-3"
    >
      Todavía no agregaste acciones.
    </v-alert>

    <!-- List -->
    <v-list v-else class="mt-2" density="comfortable">
      <v-list-item
        v-for="(action, idx) in items"
        :key="actionKey(action, idx)"
        class="rounded"
      >
        <template #prepend>
          <v-checkbox-btn
            :model-value="action.done"
            @update:model-value="toggleDone(idx, $event)"
          />
        </template>

        <v-list-item-title>
          <!-- Inline edit -->
          <v-text-field
            v-model="action.text"
            variant="plain"
            density="compact"
            hide-details
            class="action-input"
            @blur="commitText(idx)"
            @keydown.enter.prevent="commitText(idx)"
          />
        </v-list-item-title>

        <template #append>
          <v-btn
            icon
            variant="text"
            color="error"
            @click="removeAction(idx)"
          >
            <v-icon icon="mdi-delete-outline" />
          </v-btn>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FeedbackAction } from '@/types/feedback'

/**
 * Componente "controlado" vía v-model
 * modelValue: lista de acciones editables (draft)
 */
const props = defineProps<{
  modelValue: FeedbackAction[]
  minActionLength?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FeedbackAction[]): void
}>()

const minLen = computed(() => props.minActionLength ?? 3)

/**
 * Copia local para edición (evita mutar props directamente)
 */
const items = ref<FeedbackAction[]>([])

watch(
  () => props.modelValue,
  (val) => {
    items.value = (val ?? []).map((a) => ({ ...a }))
  },
  { immediate: true, deep: true }
)

function sync() {
  emit('update:modelValue', items.value.map((a) => ({ ...a })))
}

/* =========================
   Add
========================= */

const newText = ref('')
const inputError = ref<string | null>(null)

const canAdd = computed(() => newText.value.trim().length >= minLen.value)

function addAction() {
  const text = newText.value.trim()

  if (text.length < minLen.value) {
    inputError.value = `Mínimo ${minLen.value} caracteres`
    return
  }

  inputError.value = null

  items.value.push({
    id: crypto.randomUUID(), // draft id (front-only)
    text,
    done: false,
  })

  newText.value = ''
  sync()
}

/* =========================
   Edit
========================= */

function commitText(index: number) {
  const a = items.value[index]
  if (!a) return

  const text = a.text.trim()
  if (text.length < minLen.value) {
    // Si queda inválido, restauramos a string mínima segura
    a.text = text // mantiene lo que escribió
    return
  }

  a.text = text
  sync()
}

function toggleDone(index: number, done: boolean) {
  const a = items.value[index]
  if (!a) return
  a.done = done
  sync()
}

/* =========================
   Remove
========================= */

function removeAction(index: number) {
  items.value.splice(index, 1)
  sync()
}

/* =========================
   Key helper
========================= */

function actionKey(action: FeedbackAction, idx: number) {
  return action.id || `${idx}-${action.text}`
}
</script>

<style scoped>
.action-input :deep(input) {
  padding-top: 4px;
  padding-bottom: 4px;
}
</style>