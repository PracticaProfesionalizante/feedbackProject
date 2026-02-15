<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { UserService, type UserProfile } from '../services/userServices'

const router = useRouter()
const queryClient = useQueryClient()

const { data, isLoading, isError, error, refetch } = useQuery({
  queryKey: ['profile'],
  queryFn: UserService.getProfile,
})

const profile = computed(() => data.value)

const form = ref({
  name: '',
  email: '',
  birthdate: '' as string | null,
  country: '' as string | null,
})

// Sincronizar formulario cuando carga el perfil
const initForm = (p: UserProfile | undefined) => {
  if (!p) return
  const bd = p.birthdate
  form.value = {
    name: p.name ?? '',
    email: p.email ?? '',
    birthdate: bd ? String(bd).slice(0, 10) : null,
    country: p.country ?? null,
  }
}

// Lista de países (común para select)
const countries = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba',
  'Ecuador', 'El Salvador', 'España', 'Estados Unidos', 'Guatemala', 'Honduras',
  'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'República Dominicana',
  'Uruguay', 'Venezuela', 'Otro',
]

const saveMutation = useMutation({
  mutationFn: (payload: { name: string; email: string; birthdate: string | null; country: string | null }) =>
    UserService.patchProfile(payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    router.push('/profile')
  },
})

function goBack() {
  router.back()
}

function onSubmit() {
  if (!form.value.name.trim() || !form.value.email.trim()) return
  saveMutation.mutate({
    name: form.value.name.trim(),
    email: form.value.email.trim(),
    birthdate: form.value.birthdate || null,
    country: form.value.country || null,
  })
}

watch(profile, (p) => initForm(p), { immediate: true })
</script>

<template>
  <v-container class="py-6" style="max-width: 600px;">
    <v-card rounded="xl">
      <v-toolbar flat>
        <v-btn icon="mdi-arrow-left" @click="goBack" />
        <v-toolbar-title>Editar perfil</v-toolbar-title>
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

        <v-form v-else-if="profile" @submit.prevent="onSubmit">
          <v-text-field
            v-model="form.name"
            label="Nombre"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            :rules="[(v: string) => !!v?.trim() || 'El nombre es requerido']"
          />

          <v-text-field
            v-model="form.email"
            label="Email"
            type="email"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            :rules="[(v: string) => !!v?.trim() || 'El email es requerido']"
          />

          <v-text-field
            v-model="form.birthdate"
            label="Fecha de cumpleaños"
            type="date"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            hide-details
          />

          <v-select
            v-model="form.country"
            label="País"
            :items="countries"
            variant="outlined"
            density="comfortable"
            class="mb-4"
            clearable
            hide-details
          />

          <div class="d-flex gap-2 justify-end">
            <v-btn variant="text" @click="goBack">Cancelar</v-btn>
            <v-btn
              type="submit"
              color="primary"
              :loading="saveMutation.isPending.value"
              :disabled="!form.name.trim() || !form.email.trim()"
            >
              Guardar
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>
