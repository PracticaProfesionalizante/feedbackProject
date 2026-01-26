<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="6" lg="4">
        <v-card class="pa-6" rounded="xl" elevation="2">
          <div class="text-center mb-6">
            <div class="text-h5 font-weight-bold">FeedbackApp</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ mode === 'login' ? 'Iniciá sesión para continuar' : 'Creá tu cuenta para continuar' }}
            </div>
          </div>

          <LoginForm
            v-if="mode === 'login'"
            @switch-to-register="mode = 'register'"
          />

          <RegisterForm
            v-else
            @switch-to-login="mode = 'login'"
          />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LoginForm from '../components/auth/LoginForm.vue'
import RegisterForm from '../components/auth/RegisterForm.vue'

const mode = ref<'login' | 'register'>('login')
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>