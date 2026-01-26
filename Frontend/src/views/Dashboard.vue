<template>
  <div class="pa-4">
    <h1 class="text-h4 mb-4">Dashboard</h1>
    
    <v-row>
      <v-col cols="12" md="8">
        <RecentFeedbacks />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import RecentFeedbacks from '../components/dashboard/RecentFeedbacks.vue'
</script>

