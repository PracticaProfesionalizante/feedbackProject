<script setup lang="ts">
type Props = {
  feedbacksGiven: number
  feedbacksReceived: number
  comments: number
}
defineProps<Props>()
</script>

<template>
  <div class="text-subtitle-1 font-weight-medium mb-3">Estadísticas</div>

  <v-row>
    <v-col cols="12" md="4">
      <v-card variant="tonal" rounded="lg">
        <v-card-text class="d-flex align-center justify-space-between">
          <div>
            <div class="text-caption text-medium-emphasis">Feedbacks dados</div>
            <div class="text-h5 font-weight-medium">{{ feedbacksGiven }}</div>
          </div>
          <v-icon icon="mdi-send-outline" size="28" />
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" md="4">
      <v-card variant="tonal" rounded="lg">
        <v-card-text class="d-flex align-center justify-space-between">
          <div>
            <div class="text-caption text-medium-emphasis">Feedbacks recibidos</div>
            <div class="text-h5 font-weight-medium">{{ feedbacksReceived }}</div>
          </div>
          <v-icon icon="mdi-inbox-arrow-down-outline" size="28" />
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" md="4">
      <v-card variant="tonal" rounded="lg">
        <v-card-text class="d-flex align-center justify-space-between">
          <div>
            <div class="text-caption text-medium-emphasis">Comentarios</div>
            <div class="text-h5 font-weight-medium">{{ comments }}</div>
          </div>
          <v-icon icon="mdi-comment-text-outline" size="28" />
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>