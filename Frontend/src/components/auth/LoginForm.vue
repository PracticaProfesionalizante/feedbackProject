<template>
  <div>
    <v-form @submit.prevent="onSubmit">
      <!-- Email -->
      <v-text-field
        v-model="email"
        label="Email"
        type="email"
        variant="outlined"
        autocomplete="email"
        :error="Boolean(errors.email)"
        :error-messages="errors.email"
        class="mb-2"
      />

      <!-- Password -->
      <v-text-field
        v-model="password"
        label="Contraseña"
        :type="showPassword ? 'text' : 'password'"
        variant="outlined"
        autocomplete="current-password"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showPassword = !showPassword"
        :error="Boolean(errors.password)"
        :error-messages="errors.password"
        class="mb-4"
      />

      <!-- Button -->
      <v-btn
        type="submit"
        block
        color="primary"
        size="large"
        :loading="auth.loading"
        :disabled="auth.loading"
      >
        Iniciar sesión
      </v-btn>

      <!-- Register link -->
      <div class="text-center mt-4">
        <span class="text-body-2 text-medium-emphasis">¿No tenés cuenta?</span>
        <v-btn
          variant="text"
          class="px-1"
          @click="goToRegister"
          :disabled="auth.loading"
        >
          Registrate
        </v-btn>
      </div>
    </v-form>

    <!-- Snackbar de error -->
    <v-snackbar v-model="snackbar.open" :timeout="5000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.open = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useAuthStore } from '../../stores/authStore'

// Store / Router
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

// UI
const showPassword = ref(false)
const snackbar = reactive({
  open: false,
  message: ''
})

// ✅ Zod schema
const schema = toTypedSchema(
  z.object({
    email: z
      .string({ required_error: 'El email es requerido' })
      .min(1, 'El email es requerido')
      .email('Ingresá un email válido'),
    password: z
      .string({ required_error: 'La contraseña es requerida' })
      .min(6, 'La contraseña debe tener al menos 6 caracteres')
  })
)

// ✅ VeeValidate form
const { errors, defineField, handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: {
    email: '',
    password: ''
  }
})

const [email] = defineField('email')
const [password] = defineField('password')

// Helpers
function showError(message: string) {
  snackbar.message = message
  snackbar.open = true
}

// Submit
const onSubmit = handleSubmit(async (values) => {
  const ok = await auth.login({
    email: values.email,
    password: values.password
  })

  if (!ok) {
    // Si auth.error viene del store, lo mostramos, sino mensaje genérico
    showError(auth.error || 'No se pudo iniciar sesión. Verificá tus credenciales.')
    return
  }

  // ✅ Redirect post-login
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
  await router.replace(redirect || '/dashboard')
})

function goToRegister() {
  router.push('/register')
}
</script>