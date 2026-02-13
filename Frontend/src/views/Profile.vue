<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import ProfileInfo from '../components/profile/ProfileInfo.vue'
import ProfileStats from '../components/profile/ProfileStats.vue'
import { UserService } from '../services/userServices'
import { useAuthStore } from '../stores/authStore' 

const router = useRouter()
const authStore = useAuthStore()



const { data, isLoading, isError, error, refetch } = useQuery({
  queryKey: ['profile'],
  queryFn: UserService.getProfile,
})

const profile = computed(() => data.value)

function goBack() {
  router.back()
}

function goEdit() {
  // la armamos después: /profile/edit o modal
  router.push('/profile/edit')
}

function goTeam() {
  router.push('/team')
}

function logout() {
  authStore.logout?.() // si ya existe
  // fallback típico:
  // localStorage.removeItem('token')
  // authStore.$reset()
  router.replace('/login')
}
</script>

<template>
  <v-container class="py-6" style="max-width: 900px;">
    <v-card rounded="xl">
      <v-toolbar flat>
        <v-btn icon="mdi-arrow-left" @click="goBack" />
        <v-toolbar-title>Mi Perfil</v-toolbar-title>
        <v-spacer />
        <v-btn variant="text" prepend-icon="mdi-pencil-outline" @click="goEdit">
          Editar
        </v-btn>
      </v-toolbar>

      <v-divider />

      <v-card-text>
        <div v-if="isLoading" class="py-10 d-flex justify-center">
          <v-progress-circular indeterminate />
        </div>

        <div v-else-if="isError" class="py-6">
          <v-alert type="error" variant="tonal" class="mb-4">
            Error al cargar el perfil.
            <div class="text-caption mt-2">
              {{ (error as any)?.message ?? error }}
            </div>
          </v-alert>
          <v-btn @click="refetch()">Reintentar</v-btn>
        </div>

        <div v-else-if="profile">
          <ProfileInfo
            :name="profile.name"
            :email="profile.email"
            :role="profile.role"
            :createdAt="profile.createdAt"
            :employeesCount="profile.teamInfo.employeesCount"
            :leadersCount="profile.teamInfo.leadersCount"
            @goTeam="goTeam"
          />

          <v-divider class="my-6" />

          <ProfileStats
            :feedbacksGiven="profile.stats.feedbacksGiven"
            :feedbacksReceived="profile.stats.feedbacksReceived"
            :comments="profile.stats.comments"
          />

          <v-divider class="my-6" />

          <div class="d-flex justify-end">
            <v-btn color="error" variant="tonal" prepend-icon="mdi-logout" @click="logout">
              Cerrar sesión
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>