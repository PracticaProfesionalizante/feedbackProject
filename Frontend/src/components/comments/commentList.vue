<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-subtitle-1 font-weight-medium">
        Comentarios ({{ commentsCount }})
      </div>
      <v-progress-circular
        v-if="isLoading"
        indeterminate
        color="primary"
        size="20"
      />
    </div>

    <div v-if="isLoading">
      <v-skeleton-loader type="list-item-two-line" class="mb-2" />
      <v-skeleton-loader type="list-item-two-line" class="mb-2" />
    </div>

    <div v-else>
      <div v-if="comments.length === 0" class="text-body-2 text-medium-emphasis mb-4">
        Aún no hay comentarios.
      </div>
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :current-user-id="currentUserId"
        @delete="handleDelete"
      />
      <div ref="listEnd" />
    </div>

    <CommentForm
      class="mt-4"
      :loading="isCreating"
      :reset-key="resetKey"
      @submit="handleCreate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/authStore'
import { feedbackService } from '@/services/feedbackServices'
import { commentService } from '@/services/commentService'
import CommentForm from '@/components/comments/CommentForm.vue'
import CommentItem from '@/components/comments/CommentItem.vue'
import type { Comment, Feedback } from '@/types/feedback'

const props = defineProps<{
  feedbackId: string
}>()

const auth = useAuthStore()
const queryClient = useQueryClient()

const listEnd = ref<HTMLElement | null>(null)
const resetKey = ref(0)

const feedbackQuery = useQuery<Feedback>({
  queryKey: ['feedback', props.feedbackId],
  queryFn: () => feedbackService.getFeedback(props.feedbackId),
})

const comments = computed<Comment[]>(() => {
  const raw = feedbackQuery.data.value?.comments ?? []
  return [...raw].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
})

const commentsCount = computed(() => comments.value.length)
const isLoading = computed(() => feedbackQuery.isLoading.value)
const currentUserId = computed(() => auth.user?.id)

const createMutation = useMutation({
  mutationFn: (content: string) =>
    commentService.createComment({ feedbackId: props.feedbackId, content }),
  onSuccess: async (created) => {
    resetKey.value += 1
    // Optimista: agregamos al cache actual para respuesta inmediata
    queryClient.setQueryData<Feedback | undefined>(
      ['feedback', props.feedbackId],
      (prev: Feedback | undefined) =>
        prev
          ? { ...prev, comments: [...(prev.comments ?? []), created] }
          : prev
    )
    await invalidateRelated()
    await scrollToEnd()
  },
})

const deleteMutation = useMutation({
  mutationFn: (commentId: string) => commentService.deleteComment(commentId),
  onSuccess: async (_, variables) => {
    // variables = commentId
    queryClient.setQueryData<Feedback | undefined>(
      ['feedback', props.feedbackId],
      (prev: Feedback | undefined) =>
        prev
          ? {
              ...prev,
              comments: (prev.comments ?? []).filter((c: Comment) => c.id !== variables),
            }
          : prev
    )
    await invalidateRelated()
  },
})

const isCreating = computed(() => createMutation.isPending.value)

async function invalidateRelated() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['feedback', props.feedbackId] }),
    queryClient.invalidateQueries({ queryKey: ['feedbacks'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  ])
}

async function handleCreate(content: string) {
  await createMutation.mutateAsync(content)
}

async function handleDelete(commentId: string) {
  const confirmed = window.confirm('¿Eliminar este comentario?')
  if (!confirmed) return
  await deleteMutation.mutateAsync(commentId)
}

async function scrollToEnd() {
  await nextTick()
  listEnd.value?.scrollIntoView({ behavior: 'smooth' })
}

watch(
  () => comments.value.length,
  async (len: number, prev: number | undefined) => {
    if (len > (prev ?? 0)) {
      await scrollToEnd()
    }
  }
)
</script>
