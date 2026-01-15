<template>
  <v-app>
    <AppNavbar />

    <v-main>
      <v-container fluid class="pa-4">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import AppNavbar from '../../src/components/navigation/AppNavbar.vue'
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'

const auth = useAuthStore()

onMounted(() => {
  auth.checkAuth()
})
</script>