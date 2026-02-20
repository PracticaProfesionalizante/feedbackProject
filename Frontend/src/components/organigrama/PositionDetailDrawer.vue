<template>
  <v-navigation-drawer
    :model-value="open"
    location="right"
    width="400"
    temporary
    @update:model-value="(v: boolean) => emit('update:open', v)"
  >
    <v-list density="compact" class="pa-3">
      <v-list-item class="text-h6 font-weight-bold px-0">
        <template #prepend>
          <v-btn icon="mdi-close" variant="text" size="small" @click="emit('update:open', false)" />
        </template>
        Detalle del puesto
      </v-list-item>
    </v-list>
    <v-divider />
    <v-container v-if="position" class="px-4 pb-6">
      <!-- Editar: nombre, área, rinde cuentas a -->
      <v-card variant="tonal" class="mb-4">
        <v-card-title class="text-subtitle-1">Datos del puesto</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editName"
            label="Nombre del puesto"
            density="compact"
            hide-details="auto"
            class="mb-2"
          />
          <v-select
            v-model="editAreaId"
            :items="areasForSelect"
            item-title="name"
            item-value="id"
            label="Área"
            density="compact"
            hide-details="auto"
            class="mb-2"
          />
          <v-select
            v-model="editParentId"
            :items="parentPositionOptions"
            item-title="label"
            item-value="id"
            label="Rinde cuentas a"
            density="compact"
            hide-details="auto"
            clearable
          />
          <v-btn
            block
            color="primary"
            class="mt-3"
            :loading="savingPosition"
            @click="savePosition"
          >
            Guardar cambios
          </v-btn>
          <v-alert v-if="positionError" type="error" density="compact" class="mt-2">
            {{ positionError }}
          </v-alert>
        </v-card-text>
      </v-card>

      <!-- Le rinden cuentas (hijos) -->
      <v-card variant="tonal" class="mb-4">
        <v-card-title class="text-subtitle-1">Le rinden cuentas</v-card-title>
        <v-card-text>
          <div v-if="position.children.length === 0" class="text-body-2 text-medium-emphasis">
            Ningún puesto reporta directamente a este.
          </div>
          <v-chip
            v-for="child in position.children"
            :key="child.id"
            class="ma-1"
            size="small"
            variant="outlined"
          >
            {{ child.name }} ({{ child.area.name }})
          </v-chip>
        </v-card-text>
      </v-card>

      <!-- Usuarios en el puesto -->
      <v-card variant="tonal">
        <v-card-title class="text-subtitle-1">Usuarios en este puesto</v-card-title>
        <v-card-text>
          <div v-if="position.assignedUsers.length === 0" class="text-body-2 text-medium-emphasis mb-3">
            Sin usuarios asignados.
          </div>
          <v-list v-else density="compact" class="py-0">
            <v-list-item
              v-for="u in position.assignedUsers"
              :key="u.id"
              class="px-0"
            >
              <template #prepend>
                <v-icon icon="mdi-account" size="small" />
              </template>
              <v-list-item-title>{{ u.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ u.email }}</v-list-item-subtitle>
              <template #append>
                <v-btn
                  icon="mdi-close"
                  size="x-small"
                  variant="text"
                  color="error"
                  @click="removeUser(u.id)"
                />
              </template>
            </v-list-item>
          </v-list>

          <v-divider class="my-3" />
          <div class="text-caption text-medium-emphasis mb-2">Asignar usuario</div>
          <v-autocomplete
            v-model="selectedUserToAdd"
            :items="userSearchResults"
            :loading="usersLoading"
            item-title="name"
            item-value="id"
            placeholder="Buscar por nombre o email (o hacer clic para ver todos)..."
            density="compact"
            hide-details="auto"
            clearable
            no-filter
            @update:search="searchUsers"
            @focus="loadAllUsersIfEmpty"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" :subtitle="(item.raw as AssignedUser).email" />
            </template>
          </v-autocomplete>
          <v-btn
            block
            variant="tonal"
            class="mt-2"
            :disabled="!selectedUserToAdd"
            :loading="assigningUser"
            @click="assignUser"
          >
            Asignar al puesto
          </v-btn>
          <v-alert v-if="assignError" type="error" density="compact" class="mt-2">
            {{ assignError }}
          </v-alert>
        </v-card-text>
      </v-card>
    </v-container>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { orgChartService } from '@/services/orgChartService'
import type { HierarchyNode, AssignedUser } from '@/types/orgChart'
import type { OrgArea } from '@/types/orgChart'

const props = defineProps<{
  open: boolean
  position: HierarchyNode | null
  areas: OrgArea[]
  allPositions: Array<{ id: string; name: string; area: { id: string; name: string } }>
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'saved'): void
}>()

const editName = ref('')
const editAreaId = ref('')
const editParentId = ref<string | null>(null)
const savingPosition = ref(false)
const positionError = ref('')
const userSearchResults = ref<AssignedUser[]>([])
const usersLoading = ref(false)
const searchQuery = ref('')
const selectedUserToAdd = ref<string | null>(null)
const assigningUser = ref(false)
const assignError = ref('')

// Opciones para "rinde cuentas a": todos los puestos excepto este y sus descendientes
const parentPositionOptions = computed(() => {
  if (!props.position || !props.allPositions.length) return []
  const excludeIds = new Set<string>()
  function collectIds(n: HierarchyNode) {
    excludeIds.add(n.id)
    n.children.forEach(collectIds)
  }
  collectIds(props.position)
  return props.allPositions
    .filter((p) => !excludeIds.has(p.id))
    .map((p) => ({ id: p.id, label: `${p.name} (${p.area.name})` }))
})

const areasForSelect = computed(() =>
  props.areas.map((a) => ({ id: a.id, name: a.name }))
)

watch(
  () => props.position,
  (p) => {
    if (!p) return
    editName.value = p.name
    editAreaId.value = p.area.id
    editParentId.value = p.parentPositionId ?? null
    positionError.value = ''
    assignError.value = ''
    selectedUserToAdd.value = null
    userSearchResults.value = []
  },
  { immediate: true }
)

watch(
  () => props.open && props.position,
  (shouldLoad) => {
    if (shouldLoad) loadAllUsers()
  }
)

async function loadAllUsers() {
  usersLoading.value = true
  try {
    userSearchResults.value = await orgChartService.getUsersForAssignment()
  } catch {
    userSearchResults.value = []
  } finally {
    usersLoading.value = false
  }
}

function loadAllUsersIfEmpty() {
  if (userSearchResults.value.length === 0 && !usersLoading.value) loadAllUsers()
}

async function searchUsers(q: string) {
  const term = typeof q === 'string' ? q.trim() : ''
  searchQuery.value = term
  usersLoading.value = true
  try {
    userSearchResults.value = await orgChartService.getUsersForAssignment(term || undefined)
  } catch {
    userSearchResults.value = []
  } finally {
    usersLoading.value = false
  }
}

async function savePosition() {
  if (!props.position) return
  savingPosition.value = true
  positionError.value = ''
  try {
    await orgChartService.updatePosition(props.position.id, {
      name: editName.value.trim() || undefined,
      areaId: editAreaId.value || undefined,
      parentPositionId: editParentId.value === '' ? null : editParentId.value ?? undefined,
    })
    emit('saved')
  } catch (e: unknown) {
    positionError.value = (e as Error)?.message ?? 'Error al guardar'
  } finally {
    savingPosition.value = false
  }
}

async function removeUser(userId: string) {
  if (!props.position) return
  assigningUser.value = true
  assignError.value = ''
  try {
    const current = await orgChartService.getUserPositions(userId)
    const newIds = current.map((a) => a.position.id).filter((id) => id !== props.position!.id)
    await orgChartService.replaceUserPositions(userId, newIds)
    emit('saved')
  } catch (e: unknown) {
    assignError.value = (e as Error)?.message ?? 'Error al quitar'
  } finally {
    assigningUser.value = false
  }
}

async function assignUser() {
  if (!props.position || !selectedUserToAdd.value) return
  assigningUser.value = true
  assignError.value = ''
  try {
    const current = await orgChartService.getUserPositions(selectedUserToAdd.value)
    const currentIds = current.map((a) => a.position.id)
    if (currentIds.includes(props.position.id)) {
      assignError.value = 'El usuario ya está en este puesto.'
      return
    }
    await orgChartService.replaceUserPositions(selectedUserToAdd.value, [...currentIds, props.position.id])
    selectedUserToAdd.value = null
    userSearchResults.value = []
    emit('saved')
  } catch (e: unknown) {
    assignError.value = (e as Error)?.message ?? 'Error al asignar'
  } finally {
    assigningUser.value = false
  }
}
</script>
