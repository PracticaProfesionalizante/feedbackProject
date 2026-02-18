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
  (e: 'submit', data: { toUserId: string; content: string }): void
  (e: 'cancel'): void
}>()

const formRef = ref()
const valid = ref(false)

const formData = ref({
  toUserId: props.initialToUserId || '',
  content: ''
})

const rules = {
  required: (v: any) => !!v || 'Este campo es requerido',
  minLength: (v: string) => (v?.length >= 10) || 'Mínimo 10 caracteres'
}

function getInitials(name: string): string {
  if (!name) return ''
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    const first = parts[0]?.[0] || ''
    const last = parts[parts.length - 1]?.[0] || ''
    return (first + last).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

async function handleSubmit() {
  const { valid: isValid } = await formRef.value.validate()
  if (!isValid) return

  emit('submit', {
    toUserId: formData.value.toUserId,
    content: formData.value.content.trim()
  })
}

// Exponer método para resetear el formulario
defineExpose({
  reset: () => {
    formData.value = {
      toUserId: props.initialToUserId || '',
      content: ''
    }
    formRef.value?.resetValidation()
  }
})
</script>
