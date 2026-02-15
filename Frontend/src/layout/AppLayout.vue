<template>
  <v-layout>
    <!-- Sidebar (permanent en desktop, temporal en mobile) -->
    <Sidebar
      app
      :model-value="drawer"
      @update:model-value="drawer = $event"
      :permanent="isDesktop"
      :items="filteredNavItems"
      @logout="handleLogout"
    />

    <!-- AppBar -->
    <TopAppBar
      app
      :is-mobile="!isDesktop"
      @toggle-drawer="toggleDrawer"
      @logout="handleLogout"
      @update:unread-count="unreadCount = $event"
    />

    <!-- Content -->
    <v-main>
      <v-container fluid class="pa-4">
        <router-view />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import Sidebar from '../components/navigation/SideBar.vue'
import TopAppBar from '../components/navigation/TopAppBar.vue'
import { useAuthStore } from '../stores/authStore'
import { useNotificationStore } from '../stores/notificationStore'

type NavItem = {
  title: string
  icon: string
  to?: string
  action?: 'logout'
  requireLeader?: boolean
}

const auth = useAuthStore()
const notificationStore = useNotificationStore()
const router = useRouter()
const { mdAndUp } = useDisplay()
const isDesktop = computed(() => mdAndUp.value)
const drawer = ref(isDesktop.value)
const unreadCount = ref(0)

const navItems: NavItem[] = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', to: '/dashboard' },
  { title: 'Feedbacks', icon: 'mdi-clipboard-text-outline', to: '/feedbacks' },
  { title: 'Mi Equipo', icon: 'mdi-account-group-outline', to: '/team' },
  { title: 'Gestión de roles', icon: 'mdi-shield-account-outline', to: '/roles', requireLeader: true },
  { title: 'Notificaciones', icon: 'mdi-bell-outline', to: '/notifications' }
]

const filteredNavItems = computed(() =>
  navItems.filter((item) => !item.requireLeader || auth.isLeader)
)

onMounted(async () => {
  await auth.checkAuth()
  drawer.value = isDesktop.value
  try {
    await notificationStore.fetchUnreadCount()
  } catch {
    // Backend puede no tener aún /api/notifications (ej. Render sin deploy)
    // El contador queda en 0 y la app sigue funcionando
  }
})

watch(isDesktop, (desktop) => {
  drawer.value = desktop
})

function toggleDrawer() {
  if (!isDesktop.value) {
    drawer.value = !drawer.value
  }
}

function handleLogout() {
  auth.logout()
  router.replace('/login')
}
</script>
