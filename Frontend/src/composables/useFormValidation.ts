import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'

// Ejemplo de esquema de validación con Zod
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type LoginForm = z.infer<typeof loginSchema>

// Composable para usar validación de formularios
export function useLoginForm() {
  const { handleSubmit, defineField, errors } = useForm({
    validationSchema: toTypedSchema(loginSchema),
  })

  const [email, emailAttrs] = defineField('email')
  const [password, passwordAttrs] = defineField('password')

  const onSubmit = handleSubmit((values) => {
    console.log('Formulario válido:', values)
    // Aquí puedes hacer la llamada a la API
  })

  return {
    email,
    emailAttrs,
    password,
    passwordAttrs,
    errors,
    onSubmit,
  }
}

