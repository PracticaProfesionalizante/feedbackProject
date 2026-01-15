<template>
  <v-app-bar elevation="1" color="white">
    <!-- Left -->
    <v-app-bar-nav-icon @click="emit('toggle-drawer')" />

    <v-toolbar-title class="font-weight-bold">
      FeedbackApp
    </v-toolbar-title>

    <v-spacer />

    <!-- User info (opcional) -->
    <div class="text-body-2 mr-4" v-if="auth.user">
      {{ auth.user.name }}
    </div>

    <!-- Logout -->
    <v-btn
      color="error"
      variant="tonal"
      prepend-icon="mdi-logout"
      @click="logout"
    >
      Logout
    </v-btn>
  </v-app-bar>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

const emit = defineEmits<{
  (e: 'toggle-drawer'): void
}>()

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.replace('/login')
}
</script>