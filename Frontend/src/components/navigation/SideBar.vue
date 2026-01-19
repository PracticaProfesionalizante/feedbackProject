<template>
  <v-navigation-drawer
    app
    location="left"
    :model-value="permanent ? true : modelValue"
    @update:model-value="(v) => !permanent && emit('update:modelValue', v)"
    :permanent="permanent"
    :temporary="!permanent"
    :scrim="!permanent"
    width="280"
  >
    <!-- Logo / Title -->
    <div class="pa-4">
      <div class="text-h6 font-weight-bold">FeedbackApp</div>
      <div class="text-body-2 text-medium-emphasis">Navegación</div>
    </div>

    <v-divider />

    <!-- Menu items -->
    <v-list nav density="comfortable" active-color="primary">
      <v-list-item
        v-for="item in items"
        :key="item.title"
        v-bind="item.to ? { to: item.to } : {}"
        :link="Boolean(item.to)"
        :active="isActive(item)"
        :prepend-icon="item.icon"
        @click="onItemClick(item)"
      >
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

type NavItem = {
  title: string
  icon: string
  to?: string
  action?: 'logout'
}

const props = defineProps<{
  modelValue: boolean
  permanent: boolean
  items: NavItem[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'logout'): void
}>()

const route = useRoute()

function isActive(item: NavItem) {
  if (!item.to) return false
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

function onItemClick(item: NavItem) {
  // Logout: no navega, solo acción
  if (item.action === 'logout') {
    if (!props.permanent) emit('update:modelValue', false)
    emit('logout')
    return
  }

  // Mobile: cerrar drawer después de navegar
  if (!props.permanent && item.to) {
    emit('update:modelValue', false)
  }
}
</script>
