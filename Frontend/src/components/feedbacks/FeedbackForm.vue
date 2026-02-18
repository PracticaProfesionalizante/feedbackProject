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

      <!-- Acciones (estilo Jira: lista clara, + Add item abajo) -->
      <div class="checklist-block mb-4">
        <div class="text-subtitle-2 mb-3 d-flex align-center gap-2">
          <v-icon size="small" icon="mdi-format-list-checks" />
          Acciones
          <span class="text-caption text-medium-emphasis">(opcional)</span>
        </div>
        <div class="checklist-list">
          <div
            v-for="(a, idx) in formData.actions"
            :key="a.key"
            class="checklist-item-row"
          >
            <span class="checklist-item-number">{{ idx + 1 }}</span>
            <v-text-field
              v-model="a.text"
              variant="outlined"
              density="compact"
              hide-details
              placeholder="Añadir ítem..."
              class="checklist-item-input"
              @keydown.enter.prevent="addChecklistItem()"
            />
            <v-btn
              icon
              variant="text"
              size="small"
              class="checklist-item-remove"
              :disabled="formData.actions.length === 1"
              @click="removeChecklistItem(idx)"
            >
              <v-icon icon="mdi-close" size="small" />
            </v-btn>
          </div>
          <button
            type="button"
            class="checklist-add-link"
            @click="addChecklistItem"
          >
            <v-icon size="small" class="mr-1">mdi-plus</v-icon>
            Añadir ítem
          </button>
        </div>
      </div>

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
  (e: 'submit', data: { toUserId: string; content: string; actions?: { text: string }[] }): void
  (e: 'cancel'): void
}>()

const formRef = ref()
const valid = ref(false)

type ChecklistRow = { key: string; text: string }
const formData = ref({
  toUserId: props.initialToUserId || '',
  content: '',
  actions: [{ key: crypto.randomUUID(), text: '' }] as ChecklistRow[]
})

function addChecklistItem() {
  formData.value.actions.push({ key: crypto.randomUUID(), text: '' })
}
function removeChecklistItem(idx: number) {
  if (formData.value.actions.length <= 1) return
  formData.value.actions.splice(idx, 1)
}

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

  const actions = formData.value.actions
    .map((a) => ({ text: (a.text ?? '').trim() }))
    .filter((a) => a.text.length > 0)

  emit('submit', {
    toUserId: formData.value.toUserId,
    content: formData.value.content.trim(),
    ...(actions.length ? { actions } : {})
  })
}

// Exponer método para resetear el formulario
defineExpose({
  reset: () => {
    formData.value = {
      toUserId: props.initialToUserId || '',
      content: '',
      actions: [{ key: crypto.randomUUID(), text: '' }]
    }
    formRef.value?.resetValidation()
  }
})
</script>

<style scoped>
.checklist-block {
  border: 1px solid rgba(var(--v-border-color), 0.2);
  border-radius: 8px;
  padding: 1rem 1rem 0.75rem;
  background: rgba(0, 0, 0, 0.02);
}

.checklist-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.checklist-item-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  min-height: 40px;
}

.checklist-item-row:last-of-type {
  margin-bottom: 0.5rem;
}

.checklist-item-number {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-size: 0.75rem;
  font-weight: 600;
}

.checklist-item-input {
  flex: 1;
  min-width: 0;
}

.checklist-item-input :deep(.v-field) {
  font-size: 0.875rem;
}

.checklist-item-remove {
  flex-shrink: 0;
}

.checklist-add-link {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-primary));
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s ease;
}

.checklist-add-link:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}
</style>
