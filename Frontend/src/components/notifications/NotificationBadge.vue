<template>
  <v-badge
    :content="count"
    :model-value="count > 0"
    color="primary"
    overlap
  >
    <slot />
  </v-badge>
</template>

<script setup lang="ts">
defineProps<{
  count: number
}>()
</script>
