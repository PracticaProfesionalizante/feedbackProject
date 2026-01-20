<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="text-h6 font-weight-bold">Mi Equipo</div>
    </div>

    <!-- Tabs -->
    <v-tabs v-model="tab" color="primary" density="comfortable">
      <v-tab value="leaders">Mis Líderes</v-tab>
      <v-tab v-if="canSeeEmployees" value="employees">Mis Empleados</v-tab>
    </v-tabs>

    <v-divider class="mb-4" />

    <!-- Content -->
    <v-window v-model="tab" class="mt-2">
      <!-- Leaders -->
      <v-window-item value="leaders">
        <TeamMemberList
          title="Mis Líderes"
          :items="leaders"
          :loading="loadingLeaders"
          empty-text="Todavía no tenés líderes asignados."
          @give-feedback="goToFeedback"
        />
      </v-window-item>

      <!-- Employees (solo leaders) -->
      <v-window-item v-if="canSeeEmployees" value="employees">
        <TeamMemberList
          title="Mis Empleados"
          :items="employees"
          :loading="loadingEmployees"
          empty-text="Todavía no tenés empleados asignados."
          @give-feedback="goToFeedback"
        />
      </v-window-item>
    </v-window>

    <!-- Error snackbar -->
    <v-snackbar v-model="snackbar.open" :timeout="6000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.open = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import TeamMemberList from '../components/team/TeamMemberList.vue'
import type { TeamUser } from '../components/team/TeamMemberCard.vue'
import { useAuthStore } from '../stores/authStore'

type TabValue = 'leaders' | 'employees'

const router = useRouter()
const auth = useAuthStore()

// ✅ Usamos UNA sola variable de entorno consistente para el backend.
// Recomendado en .env: VITE_API_BASE_URL=http://localhost:3000/api
const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'http://localhost:3000/api'

const tab = ref<TabValue>('leaders')

const leaders = ref<TeamUser[]>([])
const employees = ref<TeamUser[]>([])

const loadingLeaders = ref(false)
const loadingEmployees = ref(false)

const snackbar = reactive({
  open: false,
  message: ''
})

// ✅ Solo un LEADER puede ver "Mis Empleados"
const canSeeEmployees = computed(() => auth.user?.role === 'LEADER')

function showError(message: string) {
  snackbar.message = message
  snackbar.open = true
}

/**
 * ✅ Parseo de error robusto.
 * Si el backend devuelve JSON con message/error, lo mostramos.
 * Si devuelve texto, mostramos ese texto.
 */
async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await res.json()
      return data.message || data.error || 'Error en la solicitud'
    }
    const text = await res.text()
    return text || 'Error en la solicitud'
  } catch {
    return 'Error en la solicitud'
  }
}

/**
 * ✅ Helper para asegurarnos de que estamos recibiendo JSON.
 * Esto evita el caso típico donde le pegamos al Vite dev server y vuelve HTML.
 */
async function parseJsonOrThrow(res: Response) {
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    // Normalmente, si te devuelve text/html, es porque la URL base está mal.
    const text = await res.text()
    throw new Error(
      `Respuesta inválida (no JSON). Revisá API_BASE. Content-Type: ${contentType}. ` +
        `Primeros caracteres: ${text.slice(0, 60)}`
    )
  }
  return res.json()
}

function extractUsers(raw: any): TeamUser[] {
  const payload = raw?.data ?? raw
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.users)) return payload.users
  if (Array.isArray(payload?.leaders)) return payload.leaders
  if (Array.isArray(payload?.employees)) return payload.employees
  return []
}

async function fetchLeaders() {
  loadingLeaders.value = true
  try {
    const res = await fetch(`${API_BASE}/team/leaders`, {
      headers: { ...auth.getAuthHeader() }
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))

    const raw = await parseJsonOrThrow(res)
    leaders.value = extractUsers(raw)
  } catch (e: any) {
    showError(e?.message ?? 'No se pudieron cargar tus líderes.')
    leaders.value = []
  } finally {
    loadingLeaders.value = false
  }
}

async function fetchEmployees() {
  if (!canSeeEmployees.value) return

  loadingEmployees.value = true
  try {
    const res = await fetch(`${API_BASE}/team/employees`, {
      headers: { ...auth.getAuthHeader() }
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))

    const raw = await parseJsonOrThrow(res)
    employees.value = extractUsers(raw)
  } catch (e: any) {
    showError(e?.message ?? 'No se pudieron cargar tus empleados.')
    employees.value = []
  } finally {
    loadingEmployees.value = false
  }
}

/**
 * ✅ Acción principal: dar feedback preseleccionando usuario.
 * (tu formulario de feedback debería leer route.query.to)
 */
function goToFeedback(userId: string) {
  router.push({ path: '/feedbacks/new', query: { to: userId } })
}

onMounted(async () => {
  // ✅ Hidratamos sesión: asegura auth.user (nombre/rol) y token
  await auth.checkAuth()

  // Cargamos datos de equipo
  await fetchLeaders()
  await fetchEmployees()
})

watch(
  () => canSeeEmployees.value,
  async (isLeader) => {
    // Si deja de ser leader, no permitimos permanecer en tab employees
    if (!isLeader && tab.value === 'employees') tab.value = 'leaders'

    // Si se vuelve leader y aún no cargamos empleados, los traemos
    if (isLeader && employees.value.length === 0 && !loadingEmployees.value) {
      await fetchEmployees()
    }
  }
)
</script>
