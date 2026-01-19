<template>
  <v-list-item class="py-3">
    <template #prepend>
      <v-avatar size="40">
        <v-img
          v-if="user.avatarUrl"
          :src="user.avatarUrl"
          :alt="user.name"
          cover
        />
        <span v-else class="text-subtitle-2 font-weight-bold">
          {{ initials }}
        </span>
      </v-avatar>
    </template>

    <v-list-item-title class="font-weight-medium">
      {{ user.name }}
    </v-list-item-title>

    <v-list-item-subtitle>
      <a
        class="text-decoration-none"
        :href="`mailto:${user.email}`"
        @click.stop
      >
        {{ user.email }}
      </a>
    </v-list-item-subtitle>

    <template #append>
      <div class="d-flex align-center ga-2">
        <!-- Opcional: botón de perfil -->
        <v-btn
          v-if="showProfileButton"
          variant="text"
          @click="emit('open-profile', user.id)"
        >
          Ver perfil
        </v-btn>

        <v-btn
          v-if="showFeedbackButton"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-message-text-outline"
          @click="emit('give-feedback', user.id)"
        >
          Dar Feedback
        </v-btn>
      </div>
    </template>
  </v-list-item>

  <v-divider />
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Role = 'LEADER' | 'EMPLOYEE'

export type TeamUser = {
  id: string
  name: string
  email: string
  role?: Role
  avatarUrl?: string | null
}

const props = withDefaults(
  defineProps<{
    user: TeamUser
    showFeedbackButton?: boolean
    showProfileButton?: boolean
  }>(),
  {
    showFeedbackButton: true,
    showProfileButton: false
  }
)

const emit = defineEmits<{
  (e: 'give-feedback', userId: string): void
  (e: 'open-profile', userId: string): void
}>()

const initials = computed(() => {
  const name = props.user.name?.trim() || ''
  if (!name) return '?'

  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  const result = (first + second).toUpperCase()

  return result || '?'
})
</script>