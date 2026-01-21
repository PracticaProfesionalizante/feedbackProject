<template>
  <v-layout>
    <!-- Sidebar (permanent en desktop, temporal en mobile) -->
    <Sidebar
      app
      :model-value="drawer"
      @update:model-value="drawer = $event"
      :permanent="isDesktop"
      :items="navItems"
      @logout="handleLogout"
    />

    <!-- AppBar -->
    <TopAppBar
      app
      :is-mobile="!isDesktop"
      :unread-count="0"
      @toggle-drawer="toggleDrawer"
      @logout="handleLogout"
    />

    <!-- Content -->
    <v-main>
      <v-container fluid class="pa-4">
        <router-view />
      </v-container>

      <!-- FAB Nuevo Feedback -->
      <v-btn
        class="fab"
        color="primary"
        icon="mdi-plus"
        size="large"
        @click="goToNewFeedback"
      />
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

type NavItem = {
  title: string
  icon: string
  to?: string
  action?: 'logout'
}

const auth = useAuthStore()
const router = useRouter()
const { mdAndUp } = useDisplay()
const isDesktop = computed(() => mdAndUp.value)
const drawer = ref(isDesktop.value)

const navItems: NavItem[] = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', to: '/dashboard' },
  { title: 'Feedbacks', icon: 'mdi-clipboard-text-outline', to: '/feedbacks' },
  { title: 'Mi Equipo', icon: 'mdi-account-group-outline', to: '/team' },
  { title: 'Mi Perfil', icon: 'mdi-account-outline', to: '/profile' },
  { title: 'Notificaciones', icon: 'mdi-bell-outline', to: '/notifications' },
  { title: 'Cerrar Sesión', icon: 'mdi-logout', action: 'logout' }
]

onMounted(async () => {
  await auth.checkAuth()
  drawer.value = isDesktop.value
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

function goToNewFeedback() {
  router.push('/feedbacks/new')
}
</script>

<style scoped>
.fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 10;
}
</style>
