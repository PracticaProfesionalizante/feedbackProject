<template>
  <v-card variant="tonal">
    <v-card-title class="d-flex justify-space-between align-center">
      <span class="text-subtitle-1 font-weight-medium">Asignar roles a usuarios</span>
      <v-btn icon="mdi-refresh" variant="text" :disabled="loadingUsers" @click="refetchUsers">
        <v-progress-circular v-if="loadingUsers" indeterminate size="16" width="2" />
        <template v-else>
          <v-icon icon="mdi-refresh" />
        </template>
      </v-btn>
    </v-card-title>
    <v-divider />
    <v-card-text>
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-3"
        density="compact"
      >
        {{ error }}
      </v-alert>

      <v-autocomplete
        v-model="selectedUserId"
        :items="users"
        item-title="name"
        item-value="id"
        label="Seleccionar usuario"
        variant="outlined"
        :loading="loadingUsers"
        :disabled="loadingUsers"
        :return-object="false"
        @update:model-value="onUserChange"
      />

      <div v-if="rolesLoading" class="mt-3">
        <v-skeleton-loader type="list-item" class="mb-2" />
        <v-skeleton-loader type="list-item" class="mb-2" />
      </div>

      <div v-else-if="availableRoles.length === 0" class="mt-3 text-body-2 text-medium-emphasis">
        No hay roles disponibles.
      </div>

      <div v-else class="mt-3">
        <div class="text-body-2 text-medium-emphasis mb-2">Selecciona roles para el usuario</div>
        <v-checkbox
          v-for="role in availableRoles"
          :key="role.id"
          v-model="selectedRoleIds"
          :label="role.name"
          :value="role.id"
          :messages="role.description || ''"
        />
      </div>

      <div class="d-flex justify-end mt-4">
        <v-btn
          color="primary"
          :loading="saving"
          :disabled="!selectedUserId || saving"
          @click="saveRoles"
        >
          Guardar roles
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { roleService } from '@/services/roleService'
import { userRoleService } from '@/services/userRoleService'
import type { AccessRole, UserListItem } from '@/types/roles'
import { useAuthStore } from '@/stores/authStore'

const emit = defineEmits<{
  (e: 'error', message: string): void
  (e: 'success', message: string): void
}>()

const queryClient = useQueryClient()
const auth = useAuthStore()

// TODO: Reemplazar con endpoint real de usuarios (usar Team endpoints como fallback)
const usersQuery = useQuery<UserListItem[]>({
  queryKey: ['role-users'],
  enabled: computed(() => auth.isAdmin),
  queryFn: async () => {
    // Preferimos /api/team/employees para líderes
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
    const res = await fetch(`${base}/team/employees`, {
      headers: { ...auth.getAuthHeader() },
    })
    if (!res.ok) throw new Error(await res.text() || 'No se pudo obtener usuarios')
    const data = await res.json()
    const employees = data.employees ?? []
    return employees as UserListItem[]
  },
})

const rolesQuery = useQuery<AccessRole[]>({
  queryKey: ['roles'],
  queryFn: roleService.getRoles,
  enabled: computed(() => auth.isAdmin),
})

const users = computed(() => usersQuery.data.value ?? [])

const selectedUserId = ref<string | null>(null)
const selectedRoleIds = ref<string[]>([])

const availableRoles = computed(() => rolesQuery.data.value ?? [])
const loadingUsers = computed(() => usersQuery.isLoading.value)
const rolesLoading = computed(() => rolesQuery.isLoading.value)
const error = computed(() => usersQuery.error.value?.message || rolesQuery.error.value?.message || '')

const userRolesQuery = useQuery({
  queryKey: computed(() => ['user-roles', selectedUserId.value]),
  enabled: computed(() => Boolean(selectedUserId.value) && auth.isAdmin),
  queryFn: async () => {
    if (!selectedUserId.value) return { roleIds: [], roles: [] }
    return userRoleService.getUserRoles(selectedUserId.value)
  },
  staleTime: 0,
  gcTime: 0,
})

watch(
  () => userRolesQuery.data.value,
  (val: { roleIds?: string[] } | undefined) => {
    if (val?.roleIds) selectedRoleIds.value = [...val.roleIds]
  }
)

watch(
  () => selectedUserId.value,
  () => {
    selectedRoleIds.value = []
    if (selectedUserId.value) {
      userRolesQuery.refetch()
    }
  }
)

function onUserChange() {
  selectedRoleIds.value = []
  userRolesQuery.refetch()
}

const saveMutation = useMutation({
  mutationFn: async () => {
    if (!selectedUserId.value) throw new Error('Selecciona un usuario')
    await userRoleService.setUserRoles(selectedUserId.value, selectedRoleIds.value)
  },
  onSuccess: async () => {
    emit('success', 'Roles actualizados')
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['user-roles', selectedUserId.value] }),
      queryClient.invalidateQueries({ queryKey: ['roles'] }),
    ])
  },
  onError: (err: any) => emit('error', err?.message || 'No se pudo guardar'),
})

const saving = computed(() => saveMutation.isPending.value)

async function saveRoles() {
  await saveMutation.mutateAsync()
}

function refetchUsers() {
  usersQuery.refetch()
}
</script>
