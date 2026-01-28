<template>
  <v-card variant="outlined" class="mb-3">
    <v-card-title class="d-flex align-center justify-space-between py-2">
      <div class="d-flex align-center ga-3">
        <v-avatar color="primary" size="36">
          <span class="text-white text-subtitle-2">{{ initials }}</span>
        </v-avatar>
        <div>
          <div class="font-weight-medium text-body-2">{{ authorName }}</div>
          <div class="text-caption text-medium-emphasis">{{ formattedDate }}</div>
        </div>
      </div>

      <v-btn
        v-if="isOwner"
        icon="mdi-delete-outline"
        size="small"
        variant="text"
        color="error"
        @click="emitDelete"
      />
    </v-card-title>

    <v-card-text class="text-body-2">
      {{ comment.content }}
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Comment } from '@/types/feedback'

const props = defineProps<{
  comment: Comment
  currentUserId?: string
}>()

const emit = defineEmits<{
  (e: 'delete', commentId: string): void
}>()

const authorName = computed(() => props.comment.user?.name ?? 'Usuario')
const initials = computed(() =>
  authorName.value
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
)

const isOwner = computed(() => props.currentUserId === props.comment.userId)

const formattedDate = computed(() =>
  new Date(props.comment.createdAt).toLocaleString()
)

function emitDelete() {
  emit('delete', props.comment.id)
}
</script>
