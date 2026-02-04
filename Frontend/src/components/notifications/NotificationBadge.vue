<template>
  <v-menu
    v-model="panelOpen"
    :close-on-content-click="false"
    location="bottom end"
    transition="scale-transition"
    offset="8"
  >
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        icon
        variant="text"
        class="notification-trigger"
        @click="handleClick"
      >
        <v-badge
          :content="displayCount"
          :model-value="unreadCount > 0"
          color="error"
          overlap
          :class="{ 'badge-bump': showBump }"
        >
          <v-icon>mdi-bell</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <v-card min-width="320" max-width="400">
      <v-card-title class="d-flex align-center justify-space-between pa-3">
        <span class="text-subtitle-1 font-weight-medium">Notificaciones</span>
        <v-btn
          v-if="unreadCount > 0"
          size="small"
          variant="text"
          color="primary"
          @click="goToNotifications"
        >
          Ver todas
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-0" style="max-height: 360px; overflow-y: auto">
        <div
          v-if="loading && unreadCount === 0"
          class="pa-4 text-center text-medium-emphasis"
        >
          <v-progress-circular indeterminate size="24" />
        </div>
        <div
          v-else-if="unreadCount === 0"
          class="pa-6 text-center text-medium-emphasis text-body-2"
        >
          No hay notificaciones nuevas
        </div>
        <v-list v-else density="compact">
          <v-list-item
            :title="`Tienes ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`"
            subtitle="Haz clic en Ver todas para gestionarlas"
            @click="goToNotifications"
          />
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '../../stores/notificationStore'

const router = useRouter()
const {
  unreadCount,
  loading,
  startPolling,
  stopPolling,
} = useNotifications()

const panelOpen = ref(false)
const showBump = ref(false)
const prevCount = ref(0)

/** Máximo 99+ en el badge */
const displayCount = computed(() => {
  const n = unreadCount.value
  return n > 99 ? '99+' : String(n)
})

function handleClick() {
  panelOpen.value = !panelOpen.value
}

function goToNotifications() {
  panelOpen.value = false
  router.push('/notifications')
}

// Animación sutil al incrementar
watch(
  unreadCount,
  (newVal) => {
    if (newVal > prevCount.value && prevCount.value >= 0) {
      showBump.value = true
      setTimeout(() => {
        showBump.value = false
      }, 400)
    }
    prevCount.value = newVal
  },
  { immediate: true }
)

onMounted(() => {
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.badge-bump {
  animation: badge-bump 0.3s ease-out;
}

@keyframes badge-bump {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
