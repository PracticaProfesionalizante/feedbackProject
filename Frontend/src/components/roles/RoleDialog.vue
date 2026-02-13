<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-subtitle-1 font-weight-medium">
          {{ mode === 'create' ? 'Crear rol' : 'Editar rol' }}
        </span>
        <v-btn icon="mdi-close" variant="text" @click="emit('update:modelValue', false)" />
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.name"
            label="Nombre"
            variant="outlined"
            :rules="[rules.required, rules.min, rules.max]"
            :disabled="loading"
          />
          <v-textarea
            v-model="form.description"
            label="Descripción (opcional)"
            variant="outlined"
            rows="3"
            auto-grow
            :rules="[rules.descMax]"
            :disabled="loading"
          />
        </v-form>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn color="primary" :loading="loading" :disabled="!isValid" @click="handleSubmit">
          {{ mode === 'create' ? 'Crear' : 'Guardar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { AccessRole, RoleFormValues } from '@/types/roles'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  initial?: AccessRole | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', values: RoleFormValues): void
}>()

const form = reactive<RoleFormValues>({
  name: '',
  description: '',
})

const rules = {
  required: (v: string) => (!!v && v.trim().length > 0) || 'Requerido',
  min: (v: string) => (v?.trim().length ?? 0) >= 3 || 'Mínimo 3 caracteres',
  max: (v: string) => (v?.trim().length ?? 0) <= 50 || 'Máximo 50 caracteres',
  descMax: (v: string) => (v?.trim().length ?? 0) <= 200 || 'Máximo 200 caracteres',
}

const isValid = computed(() => {
  const name = form.name?.trim() ?? ''
  return name.length >= 3 && name.length <= 50 && (form.description?.trim().length ?? 0) <= 200
})

watch(
  () => props.initial,
  (val) => {
    if (val) {
      form.name = val.name
      form.description = val.description ?? ''
    } else {
      form.name = ''
      form.description = ''
    }
  },
  { immediate: true }
)

function handleSubmit() {
  if (!isValid.value || props.loading) return
  emit('submit', {
    name: form.name.trim(),
    description: form.description?.trim() ? form.description.trim() : undefined,
  })
}
</script>
