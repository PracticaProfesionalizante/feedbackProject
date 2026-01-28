<template>
  <v-form @submit.prevent="handleSubmit">
    <v-textarea
      v-model="content"
      label="Agregar comentario"
      variant="outlined"
      rows="3"
      auto-grow
      :disabled="loading"
      :error-messages="errorMessage"
      prepend-inner-icon="mdi-comment-text-outline"
    />
    <div class="d-flex justify-end">
      <v-btn
        color="primary"
        :loading="loading"
        :disabled="isDisabled"
        type="submit"
      >
        Enviar comentario
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const MIN_LENGTH = 5
const MAX_LENGTH = 500

const props = defineProps<{
  loading?: boolean
  resetKey?: number
}>()

const emit = defineEmits<{
  (e: 'submit', content: string): void
}>()

const content = ref('')
const errorMessage = ref('')

const isDisabled = computed(
  () =>
    (props.loading ?? false) ||
    content.value.trim().length < MIN_LENGTH ||
    content.value.trim().length > MAX_LENGTH
)

function validate(): boolean {
  const trimmed = content.value.trim()
  if (trimmed.length < MIN_LENGTH) {
    errorMessage.value = `Mínimo ${MIN_LENGTH} caracteres`
    return false
  }
  if (trimmed.length > MAX_LENGTH) {
    errorMessage.value = `Máximo ${MAX_LENGTH} caracteres`
    return false
  }
  errorMessage.value = ''
  return true
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', content.value.trim())
}

watch(
  () => props.resetKey,
  () => {
    // El padre incrementa resetKey al submit exitoso
    content.value = ''
    errorMessage.value = ''
  }
)
</script>
