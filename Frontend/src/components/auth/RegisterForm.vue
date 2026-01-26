<template>
  <div>
    <v-form @submit.prevent="onSubmit">
      <!-- Nombre -->
      <v-text-field
        v-model="name"
        label="Nombre completo"
        variant="outlined"
        autocomplete="name"
        :error="Boolean(errors.name)"
        :error-messages="errors.name"
        class="mb-2"
      />

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
        autocomplete="new-password"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showPassword = !showPassword"
        :error="Boolean(errors.password)"
        :error-messages="errors.password"
        class="mb-2"
      />

      <!-- Confirm Password -->
      <v-text-field
        v-model="confirmPassword"
        label="Confirmar contraseña"
        :type="showConfirmPassword ? 'text' : 'password'"
        variant="outlined"
        autocomplete="new-password"
        :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showConfirmPassword = !showConfirmPassword"
        :error="Boolean(errors.confirmPassword)"
        :error-messages="errors.confirmPassword"
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
        Registrarse
      </v-btn>

      <!-- Link a Login (sin cambiar vista, solo swap de componente) -->
      <div class="text-center mt-4">
        <span class="text-body-2 text-medium-emphasis">¿Ya tenés cuenta?</span>
        <v-btn
          variant="text"
          class="px-1"
          @click="emit('switch-to-login')"
          :disabled="auth.loading"
        >
          Iniciá sesión
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
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useAuthStore } from '../../stores/authStore'

const emit = defineEmits<{
  (e: 'switch-to-login'): void
}>()

const auth = useAuthStore()
const router = useRouter()

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const snackbar = reactive({
  open: false,
  message: ''
})

function showError(message: string) {
  snackbar.message = message
  snackbar.open = true
}

const schema = toTypedSchema(
  z
    .object({
      name: z
        .string({ required_error: 'El nombre es requerido' })
        .min(3, 'El nombre debe tener al menos 3 caracteres'),
      email: z
        .string({ required_error: 'El email es requerido' })
        .min(1, 'El email es requerido')
        .email('Ingresá un email válido'),
      password: z
        .string({ required_error: 'La contraseña es requerida' })
        .min(6, 'La contraseña debe tener al menos 6 caracteres'),
      confirmPassword: z
        .string({ required_error: 'Confirmá tu contraseña' })
        .min(1, 'Confirmá tu contraseña')
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword']
    })
)

const { errors, defineField, handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  }
})

const [name] = defineField('name')
const [email] = defineField('email')
const [password] = defineField('password')
const [confirmPassword] = defineField('confirmPassword')

const onSubmit = handleSubmit(async (values) => {
  const ok = await auth.register({
    name: values.name,
    email: values.email,
    password: values.password
  })

  if (!ok) {
    showError(auth.error || 'No se pudo registrar. Probá con otro email.')
    return
  }

  // ✅ auto-login: si el backend devuelve token en register, ya está.
  // Si no devuelve token, tu authStore.register debería manejarlo (o llamar /auth/me)
  await router.replace('/dashboard')
})
</script>