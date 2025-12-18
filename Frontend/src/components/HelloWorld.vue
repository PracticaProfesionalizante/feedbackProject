<template>
  <div>
    <h1>{{ msg }}</h1>
    <button @click="count++">Contador: {{ count }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>
