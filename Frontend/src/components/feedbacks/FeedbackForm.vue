<template>
  <v-form ref="formRef" v-model="valid">
    <v-container>
      <!-- Destinatario -->
      <v-select
        v-model="formData.toUserId"
        :items="availableUsers"
        item-title="name"
        item-value="id"
        label="Para"
        :rules="[rules.required]"
        :loading="loadingUsers"
        prepend-inner-icon="mdi-account"
        variant="outlined"
        density="comfortable"
        class="mb-4"
      >
        <template #item="{ props, item }">
          <v-list-item v-bind="props">
            <template #prepend>
              <v-avatar size="32" color="primary">
                <span class="text-white text-caption">
                  {{ getInitials(item.raw.name) }}
                </span>
              </v-avatar>
            </template>
            <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ item.raw.email }}</v-list-item-subtitle>
          </v-list-item>
        </template>
      </v-select>

      <!-- Tipo de Feedback -->
      <v-select
        v-model="formData.type"
        :items="feedbackTypes"
        item-title="label"
        item-value="value"
        label="Tipo de Feedback"
        :rules="[rules.required]"
        prepend-inner-icon="mdi-tag"
        variant="outlined"
        density="comfortable"
        class="mb-4"
      >
        <template #item="{ props, item }">
          <v-list-item v-bind="props">
            <template #prepend>
              <v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>
            </template>
          </v-list-item>
        </template>
      </v-select>

      <!-- Contenido -->
      <v-textarea
        v-model="formData.content"
        label="Contenido"
        :rules="[rules.required, rules.minLength]"
        prepend-inner-icon="mdi-text"
        variant="outlined"
        rows="6"
        counter
        :maxlength="5000"
        class="mb-4"
      />

      <!-- Botones -->
      <div class="d-flex justify-end gap-2">
        <v-btn
          variant="outlined"
          color="grey"
          @click="emit('cancel')"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="!valid"
          @click="handleSubmit"
        >
          Enviar
        </v-btn>
      </div>
    </v-container>
  </v-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FeedbackType } from '../../types/feedback'

type AvailableUser = {
  id: string
  name: string
  email: string
  role?: 'LEADER' | 'EMPLOYEE'
}

const props = defineProps<{
  availableUsers: AvailableUser[]
  loadingUsers?: boolean
  loading?: boolean
  initialToUserId?: string
}>()

const emit = defineEmits<{
  (e: 'submit', data: { toUserId: string; type: FeedbackType; content: string }): void
  (e: 'cancel'): void
}>()

const formRef = ref()
const valid = ref(false)

const formData = ref({
  toUserId: props.initialToUserId || '',
  type: '' as FeedbackType | '',
  content: ''
})

const feedbackTypes = [
  {
    value: 'RECOGNITION' as FeedbackType,
    label: 'Reconocimiento',
    icon: 'mdi-star',
    color: 'success'
  },
  {
    value: 'IMPROVEMENT' as FeedbackType,
    label: 'Mejora',
    icon: 'mdi-trending-up',
    color: 'warning'
  },
  {
    value: 'GENERAL' as FeedbackType,
    label: 'General',
    icon: 'mdi-information',
    color: 'info'
  }
]

const rules = {
  required: (v: any) => !!v || 'Este campo es requerido',
  minLength: (v: string) => (v?.length >= 10) || 'Mínimo 10 caracteres'
}

function getInitials(name: string): string {
  if (!name) return ''
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

async function handleSubmit() {
  const { valid: isValid } = await formRef.value.validate()
  if (!isValid) return

  emit('submit', {
    toUserId: formData.value.toUserId,
    type: formData.value.type as FeedbackType,
    content: formData.value.content.trim()
  })
}

// Exponer método para resetear el formulario
defineExpose({
  reset: () => {
    formData.value = {
      toUserId: props.initialToUserId || '',
      type: '' as FeedbackType | '',
      content: ''
    }
    formRef.value?.resetValidation()
  }
})
</script>
