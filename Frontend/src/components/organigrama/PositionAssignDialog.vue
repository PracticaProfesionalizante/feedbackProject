<template>
  <v-navigation-drawer
    v-model="internalOpen"
    location="end"
    temporary
    width="360"
    @update:model-value="emit('update:open', $event)"
  >
    <v-toolbar density="compact" flat>
      <v-toolbar-title class="text-subtitle-1 font-weight-medium">
        {{ position?.name }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" variant="text" @click="internalOpen = false" />
    </v-toolbar>
    <v-divider />
    <v-card-text>
      <div v-if="position" class="text-caption text-medium-emphasis mb-3">
        {{ position.area?.name ?? 'Área' }} · Asignar usuarios
      </div>

      <div class="text-body-2 font-weight-medium mb-2">Buscar y asignar usuarios</div>
      <v-autocomplete
        v-model="selectedUserId"
        :items="availableEmployees"
        item-title="name"
        item-value="id"
        placeholder="Escribí nombre o email para buscar..."
        variant="outlined"
        density="comfortable"
        :loading="props.loadingEmployees"
        :disabled="props.loadingEmployees || props.saving"
        clearable
        hide-details
        class="mb-4"
        auto-select-first
        @update:model-value="onAddUser"
      >
        <template #prepend-inner>
          <v-icon icon="mdi-magnify" size="small" class="mr-1" />
        </template>
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps" :title="item.raw.name" :subtitle="item.raw.email" />
        </template>
        <template #no-data>
          <v-list-item title="No se encontraron usuarios" />
        </template>
      </v-autocomplete>

      <div class="text-body-2 font-weight-medium mb-2">Usuarios asignados</div>
      <v-list v-if="assignedUsers.length > 0" density="compact" class="pa-0">
        <v-list-item
          v-for="u in assignedUsers"
          :key="u.id"
          class="px-0"
        >
          <template #prepend>
            <v-avatar size="32" color="primary" variant="tonal">
              <span class="text-caption">{{ (u.name?.[0] ?? '?').toUpperCase() }}</span>
            </v-avatar>
          </template>
          <v-list-item-title class="text-body-2">{{ u.name }}</v-list-item-title>
          <v-list-item-subtitle class="text-caption">{{ u.email }}</v-list-item-subtitle>
          <template #append>
            <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
              color="error"
              :disabled="props.saving"
              @click="onRemoveUser(u)"
            />
          </template>
        </v-list-item>
      </v-list>
      <v-alert v-else type="info" variant="tonal" density="compact" class="mt-2">
        No hay usuarios asignados. Selecciona uno arriba para agregar.
      </v-alert>

      <v-alert v-if="props.error" type="error" variant="tonal" density="compact" class="mt-3">
        {{ props.error }}
      </v-alert>
    </v-card-text>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { OrgPosition } from '@/types/orgChart'
import type { OrgChartUser } from '@/types/orgChart'

const props = defineProps<{
  open: boolean
  position: (OrgPosition & { area?: { id: string; name: string } }) | null
  availableEmployees: OrgChartUser[]
  loadingEmployees: boolean
  saving: boolean
  positionUsersMap: Map<string, OrgChartUser[]>
  error: string
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'assign', userId: string, positionId: string): void
  (e: 'unassign', userId: string, positionId: string): void
  (e: 'refetch'): void
}>()

const internalOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const selectedUserId = ref<string | null>(null)

const assignedUsers = computed(() => {
  if (!props.position) return []
  return props.positionUsersMap.get(props.position.id) ?? []
})

watch(
  () => props.open,
  (v) => {
    if (v) selectedUserId.value = null
  }
)

async function onAddUser(userId: string | null) {
  if (!userId || !props.position) return
  emit('assign', userId, props.position.id)
  selectedUserId.value = null
}

function onRemoveUser(user: OrgChartUser) {
  if (!props.position) return
  emit('unassign', user.id, props.position.id)
}
</script>
