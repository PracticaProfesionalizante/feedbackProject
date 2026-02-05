<template>
  <v-app-bar app elevation="1" color="white">
    <!-- Toggle only on mobile -->
    <v-app-bar-nav-icon v-if="isMobile" @click="emit('toggle-drawer')" />

    <!-- Título dinámico desde meta.title -->
    <v-toolbar-title class="font-weight-bold">
      {{ pageTitle }}
    </v-toolbar-title>

    <v-spacer />

    <!-- Notifications: menú con panel -->
    <v-menu
      v-model="notificationMenuOpen"
      :close-on-content-click="false"
      location="bottom end"
      transition="scale-transition"
      min-width="320"
    >
      <template #activator="{ props: menuProps }">
        <v-btn v-bind="menuProps" icon variant="text">
          <v-badge
            :content="notificationStore.unreadCount"
            :model-value="notificationStore.unreadCount > 0"
            color="primary"
          >
            <v-icon icon="mdi-bell-outline" />
          </v-badge>
        </v-btn>
      </template>
      <NotificationPanel
        :open="notificationMenuOpen"
        @close="notificationMenuOpen = false"
        @toast="showToast"
      />
    </v-menu>

    <!-- Toast éxito (marcar todo leído) -->
    <v-snackbar v-model="snackbar.open" :timeout="4000" color="success">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.open = false">Cerrar</v-btn>
      </template>
    </v-snackbar>

    <!-- User menu -->
    <v-menu>
      <template #activator="{ props: menuProps }">
        <v-btn v-bind="menuProps" variant="text">
          <v-icon icon="mdi-account-circle-outline" class="mr-2" />
          <span class="text-body-2">{{ userName }}</span>
        </v-btn>
      </template>

      <v-list density="comfortable">
        <v-list-item @click="emit('logout')" prepend-icon="mdi-logout">
          <v-list-item-title>Cerrar sesión</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useNotificationStore } from '../../stores/notificationStore'
import NotificationPanel from '../notifications/NotificationPanel.vue'

defineProps<{
  isMobile: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-drawer'): void
  (e: 'logout'): void
}>()

const route = useRoute()
const auth = useAuthStore()
const notificationStore = useNotificationStore()
const notificationMenuOpen = ref(false)
const snackbar = ref({ open: false, message: '' })

function showToast(message: string) {
  snackbar.value.message = message
  snackbar.value.open = true
}

/**
 * ✅ Título dinámico:
 * se obtiene desde route.meta.title
 * fallback: "FeedbackApp"
 */
const pageTitle = computed(() => {
  return (route.meta.title as string) || 'FeedbackApp'
})

const userName = computed(() => auth.user?.name ?? 'Usuario')
</script>
