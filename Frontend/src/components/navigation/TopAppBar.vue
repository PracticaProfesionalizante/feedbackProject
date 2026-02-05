<template>
  <v-app-bar app elevation="1" color="white">
    <!-- Toggle only on mobile -->
    <v-app-bar-nav-icon v-if="isMobile" @click="emit('toggle-drawer')" />

    <!-- Título dinámico desde meta.title -->
    <v-toolbar-title class="font-weight-bold">
      {{ pageTitle }}
    </v-toolbar-title>

    <v-spacer />

    <!-- Notifications panel con badge -->
    <NotificationPanel @update:unread-count="emit('update:unreadCount', $event)">
      <template #activator="{ props: menuProps }">
        <v-btn v-bind="menuProps" icon variant="text">
          <NotificationBadge :count="unreadCount">
            <v-icon icon="mdi-bell-outline" />
          </NotificationBadge>
        </v-btn>
      </template>
    </NotificationPanel>

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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import NotificationPanel from '../notifications/NotificationPanel.vue'
import NotificationBadge from '../notifications/NotificationBadge.vue'

const props = defineProps<{
  isMobile: boolean
  unreadCount: number
}>()

const emit = defineEmits<{
  (e: 'toggle-drawer'): void
  (e: 'logout'): void
  (e: 'update:unreadCount', value: number): void
}>()

const route = useRoute()
const auth = useAuthStore()

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
