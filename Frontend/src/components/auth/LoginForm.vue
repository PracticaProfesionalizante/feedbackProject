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

      <!-- Register switch (SIN cambiar de vista) -->
      <div class="text-center mt-4">
        <span class="text-body-2 text-medium-emphasis">¿No tenés cuenta?</span>
        <v-btn
          variant="text"
          class="px-1"
          @click="emit('switch-to-register')"
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

const emit = defineEmits<{
  (e: 'switch-to-register'): void
}>()

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const showPassword = ref(false)
const snackbar = reactive({ open: false, message: '' })

function showError(message: string) {
  snackbar.message = message
  snackbar.open = true
}

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

const { errors, defineField, handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: { email: '', password: '' }
})

const [email] = defineField('email')
const [password] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  const ok = await auth.login({ email: values.email, password: values.password })

  if (!ok) {
    showError(auth.error || 'No se pudo iniciar sesión. Verificá tus credenciales.')
    return
  }

  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
  await router.replace(redirect || '/dashboard')
})
</script>