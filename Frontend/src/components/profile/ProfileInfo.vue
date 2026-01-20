<script setup lang="ts">
import { computed } from 'vue'

type Props = {
  name: string
  email: string
  role: 'LEADER' | 'EMPLOYEE'
  createdAt: string
  employeesCount: number
  leadersCount: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'goTeam'): void
}>()

const initial = computed(() => (props.name?.trim()?.[0] ?? '?').toUpperCase())

const memberSince = computed(() => {
  // simple: formateo local (después si quieren lo pasamos a date-fns)
  const d = new Date(props.createdAt)
  return isNaN(d.getTime()) ? props.createdAt : d.toLocaleDateString()
})
</script>

<template>
  <div class="d-flex flex-column align-center">
    <v-avatar size="96" class="mb-3" color="primary">
      <span class="text-h5">{{ initial }}</span>
    </v-avatar>

    <div class="text-h6 font-weight-medium">{{ name }}</div>
  </div>

  <v-divider class="my-6" />

  <v-list density="comfortable" lines="one">
    <v-list-item>
      <template #prepend>
        <v-icon icon="mdi-email-outline" />
      </template>
      <v-list-item-title>Email</v-list-item-title>
      <v-list-item-subtitle class="mt-1">
        <a :href="`mailto:${email}`">{{ email }}</a>
      </v-list-item-subtitle>
    </v-list-item>

    <v-list-item>
      <template #prepend>
        <v-icon icon="mdi-badge-account-outline" />
      </template>
      <v-list-item-title>Rol</v-list-item-title>
      <v-list-item-subtitle class="mt-1">{{ role }}</v-list-item-subtitle>
    </v-list-item>

    <v-list-item>
      <template #prepend>
        <v-icon icon="mdi-calendar-outline" />
      </template>
      <v-list-item-title>Miembro desde</v-list-item-title>
      <v-list-item-subtitle class="mt-1">{{ memberSince }}</v-list-item-subtitle>
    </v-list-item>
  </v-list>

  <v-divider class="my-6" />

  <div class="text-subtitle-1 font-weight-medium mb-2">Relaciones Jerárquicas</div>

  <v-list density="comfortable" lines="one">
    <v-list-item>
      <template #prepend>
        <v-icon icon="mdi-account-group-outline" />
      </template>
      <v-list-item-title>Lidera a</v-list-item-title>
      <v-list-item-subtitle class="mt-1">
        {{ employeesCount }} empleados
      </v-list-item-subtitle>
    </v-list-item>

    <v-list-item>
      <template #prepend>
        <v-icon icon="mdi-account-arrow-up-outline" />
      </template>
      <v-list-item-title>Reporta a</v-list-item-title>
      <v-list-item-subtitle class="mt-1">
        {{ leadersCount }} líderes
      </v-list-item-subtitle>
    </v-list-item>
  </v-list>

  <div class="d-flex">
    <v-btn
      class="mt-2"
      variant="text"
      append-icon="mdi-chevron-right"
      @click="emit('goTeam')"
    >
      Ver mi equipo
    </v-btn>
  </div>
</template>