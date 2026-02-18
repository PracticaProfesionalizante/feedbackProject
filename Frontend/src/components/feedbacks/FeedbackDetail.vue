<template>
  <v-card>
    <!-- Header -->
    <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
      <span />

      <v-menu v-if="canSeeMenu">
        <template #activator="{ props: menuProps }">
          <v-btn icon variant="text" v-bind="menuProps">
            <v-icon icon="mdi-dots-vertical" />
          </v-btn>
        </template>

        <v-list density="comfortable">
          <v-list-item
            v-if="canEditChecklist"
            prepend-icon="mdi-pencil-outline"
            @click="openEditDialog"
          >
            <v-list-item-title>{{ canEditContent ? 'Editar contenido y checklist' : 'Editar checklist' }}</v-list-item-title>
          </v-list-item>

          <v-list-item
            v-if="canDelete"
            prepend-icon="mdi-delete-outline"
            @click="emit('delete')"
          >
            <v-list-item-title>Eliminar</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-title>

    <v-divider />

    <v-card-text>
      <!-- Meta info -->
      <div class="d-flex flex-column ga-1 mb-4">
        <div class="text-body-2">
          <span class="text-medium-emphasis">De:</span>
          <span class="font-weight-medium">
            {{ feedback.fromUser?.name ?? feedback.fromUserId }}
          </span>
          <span class="text-medium-emphasis">·</span>
          <span class="text-medium-emphasis">
            {{ metaLabel }} {{ formatDateTime(metaDateIso) }}
          </span>
        </div>

        <div class="text-body-2">
          <span class="text-medium-emphasis">Para:</span>
          <span class="font-weight-medium">
            {{ feedback.toUser?.name ?? feedback.toUserId }}
          </span>
        </div>
      </div>

      <!-- Contenido -->
      <div class="text-subtitle-2 mb-2">Contenido</div>
      <div class="text-body-1" style="white-space: pre-wrap;">
        {{ feedback.content }}
      </div>

      <!-- Acciones (Checklist) -->
      <div class="mt-6">
        <div class="text-subtitle-2 mb-2">Acciones</div>

        <div v-if="hasActions" class="d-flex flex-column ga-2">
          <v-checkbox
            v-for="a in normalizedActions"
            :key="a.id"
            :model-value="a.done"
            :label="a.text"
            density="compact"
            hide-details
            @update:model-value="(val: boolean) => onToggleAction(a.id, val)"
          />
        </div>

        <div v-else class="text-body-2 text-medium-emphasis">
          No hay acciones asignadas.
        </div>
      </div>
    </v-card-text>
  </v-card>

  <!-- Dialog editar contenido + acciones -->
  <v-dialog v-model="editDialog.open" max-width="680">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="font-weight-bold">Editar feedback</span>
        <v-btn icon variant="text" @click="editDialog.open = false">
          <v-icon icon="mdi-close" />
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-textarea
          v-model="editDialog.content"
          label="Contenido"
          variant="outlined"
          auto-grow
          rows="5"
          :readonly="!canEditContent"
        />

        <div class="text-caption text-medium-emphasis mb-4">
          Solo el autor puede editar el contenido. Tanto el autor como el destinatario pueden editar la checklist.
        </div>

        <!-- ✅ NUEVO: editor de acciones -->
        <div class="text-subtitle-2 mb-2">Acciones</div>

        <div class="d-flex flex-column ga-2">
          <v-text-field
            v-for="(a, idx) in editDialog.actions"
            :key="a._key"
            v-model="a.text"
            :label="`Acción ${idx + 1}`"
            variant="outlined"
            density="compact"
            hide-details
          >
            <template #append-inner>
              <v-btn
                icon
                variant="text"
                :disabled="editDialog.actions.length === 1"
                @click="removeAction(idx)"
              >
                <v-icon icon="mdi-close" />
              </v-btn>
            </template>
          </v-text-field>

          <v-btn variant="tonal" prepend-icon="mdi-plus" @click="addAction">
            Agregar acción
          </v-btn>

          <div class="text-caption text-medium-emphasis">
            El receptor solo puede marcar/desmarcar (no puede cambiar el texto).
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="editDialog.open = false">Cancelar</v-btn>
        <v-btn color="primary" @click="confirmEdit">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { Feedback, FeedbackAction, FeedbackActionInput } from '../../types/feedback'

const props = defineProps<{
  feedback: Feedback
  currentUserId: string
}>()

const emit = defineEmits<{
  (e: 'edit-content', content: string): void
  (e: 'edit-feedback', payload: { content: string; actions: FeedbackActionInput[] }): void
  (e: 'delete'): void
  (e: 'toggle-action', payload: { feedbackId: string; actionId: string; done: boolean }): void
}>()

/* =========================
   Permisos (UI)
========================= */

const isAuthor = computed(() => props.feedback.fromUserId === props.currentUserId)
const isRecipient = computed(() => props.feedback.toUserId === props.currentUserId)

const canDelete = computed(() => isAuthor.value)
const canEditContent = computed(() => isAuthor.value)
const canEditChecklist = computed(() => isAuthor.value || isRecipient.value)
const canSeeMenu = computed(() => canEditChecklist.value || canDelete.value)

/* =========================
   Meta: Creado vs Editado
========================= */

const metaLabel = computed(() => (props.feedback.contentEditedAt ? 'Editado ·' : 'Creado ·'))
const metaDateIso = computed(() => (props.feedback.contentEditedAt ?? props.feedback.createdAt))

/* =========================
   Acciones (Checklist)
========================= */

const normalizedActions = computed<FeedbackAction[]>(() => {
  return Array.isArray(props.feedback.actions) ? props.feedback.actions : []
})
const hasActions = computed(() => normalizedActions.value.length > 0)

function onToggleAction(actionId: string, done: boolean) {
  if (!isAuthor.value && !isRecipient.value) return
  emit('toggle-action', { feedbackId: props.feedback.id, actionId, done })
}

/* =========================
   Edit dialog (contenido + acciones)
========================= */

type EditActionRow = { _key: string; id?: string; text: string }

const editDialog = reactive({
  open: false,
  content: '',
  actions: [] as EditActionRow[],
})

function openEditDialog() {
  editDialog.content = props.feedback.content

  // clonamos acciones existentes (solo texto, done se mantiene por backend si trae id)
  const current = normalizedActions.value
  editDialog.actions = (current.length ? current : [{ id: undefined, text: '' }]).map((a) => ({
    _key: crypto.randomUUID(),
    id: a.id,
    text: a.text ?? '',
  }))

  editDialog.open = true
}

function addAction() {
  editDialog.actions.push({ _key: crypto.randomUUID(), text: '' })
}

function removeAction(idx: number) {
  if (editDialog.actions.length <= 1) return
  editDialog.actions.splice(idx, 1)
}

function confirmEdit() {
  const nextContent = (editDialog.content ?? '').trim()
  if (canEditContent.value && !nextContent) return

  const nextActions: FeedbackActionInput[] = editDialog.actions
    .map((a) => ({
      id: a.id,
      text: (a.text ?? '').trim(),
    }))
    .filter((a) => a.text.length > 0)

  const currentContent = props.feedback.content.trim()
  const currentActions = normalizedActions.value.map((a) => ({ id: a.id, text: a.text.trim() }))

  const changedContent = canEditContent.value && nextContent !== currentContent
  const changedActions =
    nextActions.length !== currentActions.length ||
    nextActions.some((a, i) => a.text !== currentActions[i]?.text)

  if (!changedContent && !changedActions) {
    editDialog.open = false
    return
  }

  // Enviar contenido solo si es autor; si es destinatario se mantiene el actual
  const contentToSend = canEditContent.value ? nextContent : currentContent
  emit('edit-feedback', { content: contentToSend, actions: nextActions })
  editDialog.open = false
}

/* =========================
   Format helpers
========================= */

function formatDateTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}
</script>