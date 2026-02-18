<template>
  <v-container>
    <div class="mb-4">
      <div class="text-h6 font-weight-bold">Organigrama</div>
      <div class="text-body-2 text-medium-emphasis">
        Árbol organizacional descendente. Arrastrá para mover, scroll para zoom. Hacé clic en un puesto para buscar y asignar usuarios.
      </div>
    </div>

    <v-alert
      v-if="!isLeader"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      Solo los líderes pueden ver y gestionar el organigrama.
    </v-alert>

    <template v-else>
      <div v-if="areasLoading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate size="48" />
      </div>

      <div v-else-if="areasError" class="py-6">
        <v-alert type="error" variant="tonal">
          {{ areasError }}
        </v-alert>
        <v-btn class="mt-2" @click="refetchAreas">Reintentar</v-btn>
      </div>

      <div v-else class="org-chart">
        <OrgChartTree
          :areas="areas"
          :selected-position-id="selectedPositionId"
          :get-assigned-count="getAssignedCount"
          @select-position="openPosition"
        />
      </div>

      <PositionAssignDialog
        :open="assignDialogOpen"
        :position="selectedPosition"
        :available-employees="availableEmployeesForPosition"
        :loading-employees="employeesLoading"
        :saving="saving"
        :position-users-map="positionUsersMap"
        :error="assignError"
        @update:open="assignDialogOpen = $event"
        @assign="handleAssign"
        @unassign="handleUnassign"
      />
    </template>

    <v-snackbar v-model="snackbar.open" :timeout="4000" color="success">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.open = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/authStore'
import { orgChartService } from '@/services/orgChartService'
import type { OrgArea, OrgPosition, OrgChartUser } from '@/types/orgChart'
import OrgChartTree from '@/components/organigrama/OrgChartTree.vue'
import PositionAssignDialog from '@/components/organigrama/PositionAssignDialog.vue'

const auth = useAuthStore()
const queryClient = useQueryClient()

const isLeader = computed(() => auth.isAdmin)

const areasQuery = useQuery<OrgArea[]>({
  queryKey: ['org-chart', 'areas'],
  queryFn: orgChartService.getAreasWithPositions,
  enabled: isLeader,
})

const employeesQuery = useQuery<OrgChartUser[]>({
  queryKey: ['org-chart', 'employees'],
  queryFn: orgChartService.getTeamEmployees,
  enabled: isLeader,
})

const positionMapQuery = useQuery<Map<string, OrgChartUser[]>>({
  queryKey: ['org-chart', 'position-users-map'],
  queryFn: orgChartService.buildPositionUsersMap,
  enabled: isLeader,
})

const areas = computed(() => areasQuery.data.value ?? [])
const areasLoading = computed(() => areasQuery.isLoading.value)
const areasError = computed(() => areasQuery.error.value?.message ?? '')

const employees = computed(() => employeesQuery.data.value ?? [])
const employeesLoading = computed(() => employeesQuery.isLoading.value)

const availableEmployeesForPosition = computed(() => {
  const pos = selectedPosition.value
  if (!pos) return employees.value
  const assigned = positionUsersMap.value.get(pos.id) ?? []
  const assignedIds = new Set(assigned.map((u: OrgChartUser) => u.id))
  return employees.value.filter((e: OrgChartUser) => !assignedIds.has(e.id))
})

const positionUsersMap = computed(() => positionMapQuery.data.value ?? new Map())

const assignDialogOpen = ref(false)
const selectedPositionId = ref<string | null>(null)
const selectedPosition = computed<OrgPosition | null>(() => {
  if (!selectedPositionId.value) return null
  for (const area of areas.value) {
    const pos = area.positions.find((p) => p.id === selectedPositionId.value)
    if (pos) return { ...pos, area: { id: area.id, name: area.name } }
  }
  return null
})

const saving = ref(false)
const assignError = ref('')
const snackbar = reactive({ open: false, message: '' })

function getAssignedCount(positionId: string): number {
  return positionUsersMap.value.get(positionId)?.length ?? 0
}

function openPosition(pos: OrgPosition) {
  selectedPositionId.value = pos.id
  assignDialogOpen.value = true
  assignError.value = ''
}

async function handleAssign(userId: string, positionId: string) {
  saving.value = true
  assignError.value = ''
  try {
    const current = await orgChartService.getUserPositions(userId)
    const currentIds = current.map((a) => a.position.id)
    if (currentIds.includes(positionId)) {
      assignError.value = 'El usuario ya está asignado a este puesto.'
      return
    }
    const newIds = [...currentIds, positionId]
    await orgChartService.replaceUserPositions(userId, newIds)
    snackbar.message = 'Usuario asignado correctamente'
    snackbar.open = true
    await refetchPositionMap()
  } catch (e: any) {
    assignError.value = e?.message ?? 'No se pudo asignar'
  } finally {
    saving.value = false
  }
}

async function handleUnassign(userId: string, positionId: string) {
  saving.value = true
  assignError.value = ''
  try {
    const current = await orgChartService.getUserPositions(userId)
    const newIds = current.map((a) => a.position.id).filter((id) => id !== positionId)
    await orgChartService.replaceUserPositions(userId, newIds)
    snackbar.message = 'Usuario desasignado correctamente'
    snackbar.open = true
    await refetchPositionMap()
  } catch (e: any) {
    assignError.value = e?.message ?? 'No se pudo desasignar'
  } finally {
    saving.value = false
  }
}

async function refetchPositionMap() {
  await queryClient.invalidateQueries({ queryKey: ['org-chart', 'position-users-map'] })
}

async function refetchAreas() {
  await areasQuery.refetch()
}

</script>

<style scoped>
.org-chart {
  width: 100%;
}
</style>
