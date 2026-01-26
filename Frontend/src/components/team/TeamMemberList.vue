<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-subtitle-1 font-weight-bold">
        {{ title }}
        <span class="text-medium-emphasis">({{ items.length }})</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading">
      <v-skeleton-loader
        v-for="i in skeletonCount"
        :key="i"
        type="list-item-avatar, divider"
        class="mb-1"
      />
    </div>

    <!-- Empty -->
    <v-alert
      v-else-if="items.length === 0"
      type="info"
      variant="tonal"
      class="mt-2"
    >
      {{ emptyText }}
    </v-alert>

    <!-- List -->
    <v-list v-else lines="two" class="pa-0">
      <TeamMemberCard
        v-for="u in items"
        :key="u.id"
        :user="u"
        :show-feedback-button="showFeedbackButton"
        :show-profile-button="showProfileButton"
        @give-feedback="emit('give-feedback', $event)"
        @open-profile="emit('open-profile', $event)"
      />
    </v-list>
  </div>
</template>

<script setup lang="ts">
import TeamMemberCard from './TeamMemberCard.vue'
import type { TeamUser } from './TeamMemberCard.vue'

const props = withDefaults(
  defineProps<{
    title: string
    items: TeamUser[]
    loading?: boolean
    emptyText?: string
    skeletonCount?: number
    showFeedbackButton?: boolean
    showProfileButton?: boolean
  }>(),
  {
    loading: false,
    emptyText: 'No hay resultados para mostrar.',
    skeletonCount: 4,
    showFeedbackButton: true,
    showProfileButton: false
  }
)

const emit = defineEmits<{
  (e: 'give-feedback', userId: string): void
  (e: 'open-profile', userId: string): void
}>()
</script>