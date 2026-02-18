<template>
  <div>
    <v-alert
      v-if="!isAdmin"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      No tenés permisos para acceder a esta sección.
    </v-alert>
    <div v-else>
      <v-alert
        v-if="rolesError"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        {{ rolesError }}
      </v-alert>

      <v-row dense>
        <v-col cols="12" md="6">
          <RoleList
            :roles="roles"
            :loading="rolesQuery.isLoading.value"
            @create="openCreate"
            @edit="openEdit"
            @delete="confirmDelete"
          />
        </v-col>
        <v-col cols="12" md="6">
          <UserRoleManager @error="showError" @success="showSuccess" />
        </v-col>
      </v-row>

      <!-- Dialog crear/editar -->
      <RoleDialog
        v-model="dialogOpen"
        :mode="dialogMode"
        :initial="dialogRole"
        :loading="mutationPending"
        @submit="handleSubmit"
      />

      <!-- Confirm delete -->
      <v-dialog v-model="deleteDialog" max-width="420">
        <v-card>
          <v-card-title class="text-subtitle-1 font-weight-medium">Eliminar rol</v-card-title>
          <v-card-text>
            ¿Eliminar el rol "{{ deleteTarget?.name }}"? Esta acción no se puede deshacer.
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
            <v-btn color="error" :loading="mutationPending" @click="executeDelete">Eliminar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Snackbar -->
      <v-snackbar v-model="snackbar.open" :color="snackbar.color" :timeout="4000">
        {{ snackbar.message }}
      </v-snackbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import RoleList from '@/components/roles/RoleList.vue'
import RoleDialog from '@/components/roles/RoleDialog.vue'
import UserRoleManager from '@/components/roles/UserRoleManager.vue'
import { roleService } from '@/services/roleService'
import type { AccessRole, RoleFormValues } from '@/types/roles'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const queryClient = useQueryClient()

const snackbar = reactive({
  open: false,
  message: '',
  color: 'success',
})

const isAdmin = computed(() => auth.isAdmin)

const rolesQuery = useQuery<AccessRole[]>({
  queryKey: ['roles'],
  queryFn: roleService.getRoles,
  enabled: isAdmin,
})

const roles = computed(() => rolesQuery.data.value ?? [])

const dialogOpen = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const dialogRole = ref<AccessRole | null>(null)
const rolesError = computed(() => rolesQuery.error.value?.message || '')

const deleteDialog = ref(false)
const deleteTarget = ref<AccessRole | null>(null)

function openCreate() {
  dialogMode.value = 'create'
  dialogRole.value = null
  dialogOpen.value = true
}

function openEdit(role: AccessRole) {
  dialogMode.value = 'edit'
  dialogRole.value = role
  dialogOpen.value = true
}

function confirmDelete(role: AccessRole) {
  deleteTarget.value = role
  deleteDialog.value = true
}

function showToast(message: string, color: 'success' | 'error' = 'success') {
  snackbar.message = message
  snackbar.color = color
  snackbar.open = true
}

function showError(message: string) {
  showToast(message, 'error')
}

function showSuccess(message: string) {
  showToast(message, 'success')
}

const createMutation = useMutation({
  mutationFn: (payload: RoleFormValues) => roleService.createRole(payload),
  onSuccess: async () => {
    showSuccess('Rol creado')
    dialogOpen.value = false
    await queryClient.invalidateQueries({ queryKey: ['roles'] })
  },
  onError: (err: any) => showError(err?.message || 'No se pudo crear'),
})

const updateMutation = useMutation({
  mutationFn: (payload: { id: string; values: RoleFormValues }) =>
    roleService.updateRole(payload.id, payload.values),
  onSuccess: async () => {
    showSuccess('Rol actualizado')
    dialogOpen.value = false
    await queryClient.invalidateQueries({ queryKey: ['roles'] })
  },
  onError: (err: any) => showError(err?.message || 'No se pudo actualizar'),
})

const deleteMutation = useMutation({
  mutationFn: (id: string) => roleService.deleteRole(id),
  onSuccess: async () => {
    showSuccess('Rol eliminado')
    deleteDialog.value = false
    await queryClient.invalidateQueries({ queryKey: ['roles'] })
  },
  onError: (err: any) => showError(err?.message || 'No se pudo eliminar'),
})

const mutationPending = computed(
  () =>
    createMutation.isPending.value || updateMutation.isPending.value || deleteMutation.isPending.value
)

async function handleSubmit(values: RoleFormValues) {
  if (dialogMode.value === 'create') {
    await createMutation.mutateAsync(values)
  } else if (dialogMode.value === 'edit' && dialogRole.value) {
    await updateMutation.mutateAsync({ id: dialogRole.value.id, values })
  }
}

async function executeDelete() {
  if (!deleteTarget.value) return
  await deleteMutation.mutateAsync(deleteTarget.value.id)
}
</script>
