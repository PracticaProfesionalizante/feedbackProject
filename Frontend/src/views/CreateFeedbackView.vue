<template>
  <v-container>
    <!-- Header -->
    <div class="d-flex align-center mb-6">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        @click="goBack"
      />
      <h1 class="text-h5 font-weight-bold ml-2">Nuevo Feedback</h1>
    </div>

    <!-- Formulario -->
    <v-card>
      <v-card-text>
        <FeedbackForm
          :available-users="availableUsers"
          :loading-users="loadingUsers"
          :loading="submitting"
          :initial-to-user-id="initialToUserId"
          @submit="handleSubmit"
          @cancel="goBack"
        />
      </v-card-text>
    </v-card>

    <!-- Snackbars -->
    <v-snackbar v-model="snackbar.open" :timeout="6000" :color="snackbar.color">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.open = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { feedbackService, type AvailableRecipient } from '../services/feedbackServices'
import FeedbackForm from '../components/feedbacks/FeedbackForm.vue'

type AvailableUser = AvailableRecipient

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const loadingUsers = ref(false)
const submitting = ref(false)
const availableUsers = ref<AvailableUser[]>([])

const snackbar = ref({
  open: false,
  message: '',
  color: 'success' as 'success' | 'error'
})

// Obtener userId inicial desde query params (si viene de TeamView)
const initialToUserId = computed(() => {
  const to = route.query.to
  return typeof to === 'string' ? to : undefined
})

async function fetchAvailableUsers() {
  loadingUsers.value = true
  try {
    const userId = auth.user?.id
    if (!userId) {
      showError('No estás autenticado')
      return
    }

    // Cualquier usuario puede dar feedback a cualquier otro (sin restricción por puesto ni jerarquía)
    const users = await feedbackService.getAvailableRecipients()

    // Filtrar el usuario actual (no puede enviarse feedback a sí mismo)
    availableUsers.value = users.filter(u => u.id !== userId)
  } catch (error: any) {
    showError(error?.message || 'Error al cargar usuarios disponibles')
    availableUsers.value = []
  } finally {
    loadingUsers.value = false
  }
}

async function handleSubmit(data: {
  toUserId: string
  content: string
  actions?: { text: string }[]
}) {
  submitting.value = true
  try {
    const feedback = await feedbackService.createFeedback({
      toUserId: data.toUserId,
      content: data.content,
      ...(data.actions?.length ? { actions: data.actions } : {})
    })

    showSuccess('Feedback creado exitosamente')
    
    // Redirigir al detalle del feedback después de un breve delay
    setTimeout(() => {
      router.push(`/feedbacks/${feedback.id}`)
    }, 1000)
  } catch (error: any) {
    showError(error?.message || 'Error al crear el feedback')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.back()
}

function showSuccess(message: string) {
  snackbar.value = {
    open: true,
    message,
    color: 'success'
  }
}

function showError(message: string) {
  snackbar.value = {
    open: true,
    message,
    color: 'error'
  }
}

onMounted(async () => {
  await auth.checkAuth()
  await fetchAvailableUsers()
})
</script>
