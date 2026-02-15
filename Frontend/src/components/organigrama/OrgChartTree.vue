<template>
  <div class="org-tree-wrapper">
    <!-- Controles de navegación -->
    <div class="org-tree-controls">
      <v-btn-group density="compact" variant="outlined">
        <v-btn icon="mdi-plus" size="small" @click="zoomIn" :disabled="zoomLevel >= 2" title="Acercar" />
        <v-btn icon="mdi-minus" size="small" @click="zoomOut" :disabled="zoomLevel <= 0.3" title="Alejar" />
        <v-btn icon="mdi-fit-to-screen" size="small" @click="resetView" title="Ajustar vista" />
      </v-btn-group>
      <span class="text-caption text-medium-emphasis ml-2">{{ Math.round(zoomLevel * 100) }}%</span>
    </div>

    <!-- Contenedor navegable -->
    <div
      class="org-tree-pan-container"
      @mousedown="onPanStart"
      @mousemove="onPanMove"
      @mouseup="onPanEnd"
      @mouseleave="onPanEnd"
      @wheel.prevent="onWheel"
    >
      <div
        class="org-tree-content"
        :style="{
          transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
          transformOrigin: 'center center',
        }"
      >
        <!-- Nivel 0: Raíz -->
        <div class="tree-level tree-level-0">
          <div class="tree-node tree-node-root" @click.stop @mousedown.stop>
            <span class="node-label">Institución</span>
          </div>
        </div>

        <!-- Línea conectora raíz → áreas -->
        <div class="tree-connector tree-connector-vertical" style="height: 24px" />

        <!-- Nivel 1: Áreas -->
        <div class="tree-level tree-level-1">
          <div
            v-for="area in areas"
            :key="area.id"
            class="tree-branch"
          >
            <div
              class="tree-node tree-node-area"
              :style="{ '--area-color': getAreaColor(area.id) }"
              @click.stop
              @mousedown.stop
            >
              <span class="node-label">{{ area.name }}</span>
            </div>
            <div class="tree-connector tree-connector-vertical" style="height: 20px" />
            <!-- Nivel 2: Puestos -->
            <div class="tree-level tree-level-2">
              <div
                v-for="pos in area.positions"
                :key="pos.id"
                class="tree-node tree-node-position"
                :class="{ 'tree-node-selected': selectedPositionId === pos.id }"
                :style="{ '--area-color': getAreaColor(area.id) }"
                @click="emit('select-position', pos)"
                @mousedown.stop
              >
                <span class="node-label">{{ pos.name }}</span>
                <v-badge
                  v-if="getAssignedCount(pos.id) > 0"
                  :content="getAssignedCount(pos.id)"
                  color="primary"
                  inline
                  class="ml-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { OrgArea, OrgPosition } from '@/types/orgChart'

const props = defineProps<{
  areas: OrgArea[]
  selectedPositionId: string | null
  getAssignedCount: (positionId: string) => number
}>()

const emit = defineEmits<{
  (e: 'select-position', pos: OrgPosition): void
}>()

const zoomLevel = ref(0.85)
const panX = ref(0)
const panY = ref(0)

const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })

const AREA_COLORS = [
  '#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#0288d1',
  '#388e3c', '#f57c00', '#7b1fa2', '#0097a7', '#689f38',
  '#e64a19', '#5c6bc0', '#00796b', '#c2185b', '#455a64',
]

const areaColorMap = computed(() => {
  const map = new Map<string, string>()
  props.areas.forEach((a, i) => {
    if (a.id) map.set(a.id, AREA_COLORS[i % AREA_COLORS.length] ?? '#666')
  })
  return map
})

function getAreaColor(areaId: string | undefined): string {
  return (areaId && areaColorMap.value.get(areaId)) ?? '#666'
}

function zoomIn() {
  zoomLevel.value = Math.min(2, zoomLevel.value + 0.15)
}

function zoomOut() {
  zoomLevel.value = Math.max(0.3, zoomLevel.value - 0.15)
}

function resetView() {
  zoomLevel.value = 0.85
  panX.value = 0
  panY.value = 0
}

function onWheel(e: WheelEvent) {
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  zoomLevel.value = Math.max(0.3, Math.min(2, zoomLevel.value + delta))
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
.org-tree-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 220px);
  min-height: 400px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
}

.org-tree-controls {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
}

.org-tree-pan-container {
  width: 100%;
  height: 100%;
  overflow-x: scroll;
  overflow-y: scroll;
  cursor: grab;
}
.org-tree-pan-container:active {
  cursor: grabbing;
}

.org-tree-content {
  min-width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px 80px;
  transition: transform 0.05s ease-out;
}

.tree-level {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.tree-level-0 {
  margin-bottom: 0;
}

.tree-level-1 {
  gap: 32px;
  align-items: flex-start;
}

.tree-level-2 {
  gap: 12px;
  margin-top: 0;
}

.tree-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 140px;
}

.tree-node {
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  white-space: nowrap;
}

.tree-node-root {
  background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
  color: white;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(26, 35, 126, 0.3);
}

.tree-node-area {
  background: var(--area-color);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.tree-node-position {
  background: rgba(255, 255, 255, 0.95);
  color: #1a1a1a;
  border: 2px solid var(--area-color);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
}

.tree-node-position:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tree-node-selected {
  outline: 3px solid #ff9800;
  outline-offset: 2px;
  box-shadow: 0 4px 16px rgba(255, 152, 0, 0.4);
}

.tree-connector {
  width: 2px;
  background: rgba(0, 0, 0, 0.2);
  margin: 0 auto;
}

.tree-connector-vertical {
  width: 2px;
  min-height: 16px;
}
</style>
