<template>
  <div class="hierarchy-tree-wrapper">
    <div class="hierarchy-tree-controls">
      <v-btn-group density="compact" variant="outlined">
        <v-btn icon="mdi-plus" size="small" @click="zoomIn" :disabled="zoomLevel >= 2" title="Acercar" />
        <v-btn icon="mdi-minus" size="small" @click="zoomOut" :disabled="zoomLevel <= 0.35" title="Alejar" />
        <v-btn icon="mdi-fit-to-screen" size="small" @click="resetView" title="Ajustar vista" />
      </v-btn-group>
      <span class="text-caption text-medium-emphasis ml-2">{{ Math.round(zoomLevel * 100) }}%</span>
    </div>

    <div
      class="hierarchy-tree-pan"
      @mousedown="onPanStart"
      @mousemove="onPanMove"
      @mouseup="onPanEnd"
      @mouseleave="onPanEnd"
      @wheel.prevent="onWheel"
    >
      <div
        class="hierarchy-tree-content"
        :style="{
          transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
          transformOrigin: 'top center',
        }"
      >
        <div v-if="tree.length === 0" class="empty-tree">
          <v-icon icon="mdi-sitemap" size="64" color="grey" />
          <p class="text-body-1 mt-3">No hay puestos en el organigrama</p>
          <p class="text-caption text-medium-emphasis">
            Creá áreas y puestos (con padre opcional) y asigná usuarios a cada puesto. Un puesto puede tener 0, 1 o varios usuarios.
          </p>
          <v-btn class="mt-3" variant="outlined" size="small" @click="$emit('refresh')">Refrescar</v-btn>
        </div>

        <template v-else>
          <!-- Nivel raíz: título Sociallearning -->
          <div class="tree-root-label">
            <span class="company-name">Sociallearning</span>
          </div>
          <div class="tree-connector-vertical" style="height: 20px" />

          <!-- Raíces: puestos sin padre -->
          <div class="tree-level tree-level-roots">
            <HierarchyNodeCard
              v-for="node in tree"
              :key="node.id"
              :node="node"
              :depth="0"
              :selectable="isAdmin"
              @select="(n) => emit('select', n)"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { HierarchyNode } from '@/types/orgChart'
import HierarchyNodeCard from './HierarchyNodeCard.vue'

defineProps<{
  tree: HierarchyNode[]
  isAdmin?: boolean
}>()

defineEmits<{
  (e: 'refresh'): void
  (e: 'select', node: HierarchyNode): void
}>()

const zoomLevel = ref(0.8)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })

function zoomIn() {
  zoomLevel.value = Math.min(2, zoomLevel.value + 0.15)
}

function zoomOut() {
  zoomLevel.value = Math.max(0.35, zoomLevel.value - 0.15)
}

function resetView() {
  zoomLevel.value = 0.8
  panX.value = 0
  panY.value = 0
}

function onWheel(e: WheelEvent) {
  const delta = e.deltaY > 0 ? -0.08 : 0.08
  zoomLevel.value = Math.max(0.35, Math.min(2, zoomLevel.value + delta))
}

function onPanStart(e: MouseEvent) {
  if (e.button !== 0) return
  isPanning.value = true
  panStart.value = { x: e.clientX - panX.value, y: e.clientY - panY.value }
}

function onPanMove(e: MouseEvent) {
  if (!isPanning.value) return
  panX.value = e.clientX - panStart.value.x
  panY.value = e.clientY - panStart.value.y
}

function onPanEnd() {
  isPanning.value = false
}
</script>

<style scoped>
.hierarchy-tree-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 200px);
  min-height: 420px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(180deg, #f8f9fa 0%, #eef0f2 100%);
}

.hierarchy-tree-controls {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
}

.hierarchy-tree-pan {
  width: 100%;
  height: 100%;
  overflow: auto;
  cursor: grab;
}
.hierarchy-tree-pan:active {
  cursor: grabbing;
}

.hierarchy-tree-content {
  min-width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px 80px;
  transition: transform 0.05s ease-out;
}

.tree-root-label {
  padding: 8px 20px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 10px rgba(26, 35, 126, 0.35);
}

.tree-connector-vertical {
  width: 2px;
  background: rgba(0, 0, 0, 0.2);
  margin: 0 auto;
  min-height: 16px;
}

.tree-level-roots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 32px;
  align-items: flex-start;
}

.empty-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: rgba(0, 0, 0, 0.6);
}
</style>
