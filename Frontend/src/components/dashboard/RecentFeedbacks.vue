<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <span class="text-h6 font-weight-bold">Feedbacks Recientes</span>
      <v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-arrow-right"
        @click="goToFeedbacks"
      >
        Ver todos
      </v-btn>
    </v-card-title>

    <v-divider />

    <v-list v-if="loading" density="comfortable">
      <v-list-item v-for="i in 3" :key="i">
        <v-skeleton-loader type="list-item-avatar-two-line" />
      </v-list-item>
    </v-list>

    <v-list v-else-if="feedbacks.length > 0" density="comfortable">
      <FeedbackListItem
        v-for="feedback in feedbacks"
        :key="feedback.id"
        :feedback="feedback"
      />
    </v-list>

    <v-card-text v-else class="text-center text-medium-emphasis py-8">
      No hay feedbacks recientes
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { feedbackService } from '../../services/feedbackServices'
import type { Feedback } from '../../types/feedback'
import FeedbackListItem from '../feedbacks/FeedbackListItem.vue'

const router = useRouter()
const feedbacks = ref<Feedback[]>([])
const loading = ref(true)

async function loadFeedbacks() {
  try {
    loading.value = true
    feedbacks.value = await feedbackService.getRecentFeedbacks(10)
  } catch (error) {
    console.error('Error al cargar feedbacks recientes:', error)
  } finally {
    loading.value = false
  }
}

function goToFeedbacks() {
  router.push('/feedbacks')
}

onMounted(() => {
  loadFeedbacks()
})
</script>
