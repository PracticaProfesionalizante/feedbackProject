<template>
  <v-card variant="tonal">
    <v-card-title class="d-flex justify-space-between align-center">
      <span class="text-subtitle-1 font-weight-medium">Roles</span>
      <v-btn color="primary" prepend-icon="mdi-plus" size="small" @click="emit('create')">Nuevo</v-btn>
    </v-card-title>
    <v-divider />
    <v-card-text>
      <div v-if="loading">
        <v-skeleton-loader type="list-item" class="mb-2" />
        <v-skeleton-loader type="list-item" class="mb-2" />
      </div>
      <div v-else-if="roles.length === 0" class="text-body-2 text-medium-emphasis">
        No hay roles.
      </div>
      <v-list v-else density="comfortable" nav>
        <v-list-item
          v-for="role in roles"
          :key="role.id"
          :value="role.id"
          @click="emit('select', role.id)"
        >
          <template #prepend>
            <v-avatar color="primary" size="32">
              <span class="text-white text-caption">{{ role.name.slice(0, 2).toUpperCase() }}</span>
            </v-avatar>
          </template>
          <v-list-item-title>{{ role.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ role.description || 'Sin descripción' }}</v-list-item-subtitle>
          <template #append>
            <v-btn icon="mdi-pencil" variant="text" size="small" @click.stop="emit('edit', role)" />
            <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" @click.stop="emit('delete', role)" />
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { AccessRole } from '@/types/roles'

defineProps<{
  roles: AccessRole[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', role: AccessRole): void
  (e: 'delete', role: AccessRole): void
  (e: 'select', roleId: string): void
}>()
</script>
