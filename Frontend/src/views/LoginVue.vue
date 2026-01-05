<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="6" lg="4">
        <v-card class="pa-6" rounded="xl" elevation="2">
          <!-- Branding -->
          <div class="text-center mb-6">
            <!-- Si después agregás logo, podés reemplazar esto por <v-img ... /> -->
            <div class="text-h5 font-weight-bold">FeedbackApp</div>
            <div class="text-body-2 text-medium-emphasis">
              Iniciá sesión para continuar
            </div>
          </div>

          <!-- Form -->
          <LoginForm />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import LoginForm from '../components/auth/LoginForm.vue'
</script>

<style scoped>
/* Opcional: si querés un look más "auth page" con fondo suave */
.fill-height {
  min-height: 100vh;
}
</style>