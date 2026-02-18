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
import { feedbackService } from '../services/feedbackServices'
import FeedbackForm from '../components/feedbacks/FeedbackForm.vue'
import { API_BASE_URL } from '../config/constants'

type AvailableUser = {
  id: string
  name: string
  email: string
  role?: 'LEADER' | 'EMPLOYEE'
}

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

    const isLeader = auth.isLeader
    const users: AvailableUser[] = []

    // Si es LEADER: obtener empleados directos + sus propios líderes
    if (isLeader) {
      // Empleados directos
      const employeesRes = await fetch(`${API_BASE_URL}/team/employees`, {
        headers: { ...auth.getAuthHeader() }
      })
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json()
        const employees = employeesData?.employees || employeesData || []
        users.push(...employees.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role
        })))
      }

      // Sus propios líderes
      const leadersRes = await fetch(`${API_BASE_URL}/team/leaders`, {
        headers: { ...auth.getAuthHeader() }
      })
      if (leadersRes.ok) {
        const leadersData = await leadersRes.json()
        const leaders = leadersData?.leaders || leadersData || []
        users.push(...leaders.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role
        })))
      }
    } else {
      // Si es EMPLOYEE: solo sus líderes directos
      const leadersRes = await fetch(`${API_BASE_URL}/team/leaders`, {
        headers: { ...auth.getAuthHeader() }
      })
      if (leadersRes.ok) {
        const leadersData = await leadersRes.json()
        const leaders = leadersData?.leaders || leadersData || []
        users.push(...leaders.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role
        })))
      }
    }

    // Eliminar duplicados (por si un LEADER también es líder de otro)
    const uniqueUsers = Array.from(
      new Map(users.map(u => [u.id, u])).values()
    )

    // Filtrar el usuario actual (no puede enviarse feedback a sí mismo)
    availableUsers.value = uniqueUsers.filter(u => u.id !== userId)
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
