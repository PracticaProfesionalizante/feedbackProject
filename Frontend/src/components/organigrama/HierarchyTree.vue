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
          <p v-if="hasMultipleRootsAndNoChildren" class="tree-hint text-caption text-medium-emphasis mt-2 mb-0">
            Para ver el árbol jerárquico, hacé clic en un puesto y asigná «Rinde cuentas a» en el panel.
          </p>
          <div class="tree-connector-vertical" style="height: 20px" />

          <!-- Raíces: puestos sin padre (hijos se muestran recursivamente; expand/collapse tipo Humand) -->
          <div class="tree-level tree-level-roots">
            <HierarchyNodeCard
              v-for="node in tree"
              :key="node.id"
              :node="node"
              :depth="0"
              :area-color="areaColorMap.get(node.area.id)"
              :area-colors-map="areaColorMap"
              :expanded-ids="expandedIds"
              :selectable="isAdmin"
              @select="(n) => emit('select', n)"
              @toggle-expand="toggleExpand"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { HierarchyNode } from '@/types/orgChart'
import HierarchyNodeCard from './HierarchyNodeCard.vue'

function collectAllIds(nodes: HierarchyNode[]): string[] {
  const ids: string[] = []
  function walk(n: HierarchyNode) {
    ids.push(n.id)
    n.children.forEach(walk)
  }
  nodes.forEach(walk)
  return ids
}

const props = defineProps<{
  tree: HierarchyNode[]
  isAdmin?: boolean
}>()

const expandedIds = ref<Set<string>>(new Set())

watch(
  () => props.tree,
  (t) => {
    if (t && t.length) expandedIds.value = new Set(collectAllIds(t))
  },
  { immediate: true }
)

function toggleExpand(nodeId: string) {
  const next = new Set(expandedIds.value)
  if (next.has(nodeId)) next.delete(nodeId)
  else next.add(nodeId)
  expandedIds.value = next
}

const AREA_PALETTE = [
  '#0d47a1', '#1565c0', '#1976d2', '#1e88e5', '#0277bd', '#0288d1', '#039be5',
  '#2e7d32', '#388e3c', '#43a047', '#66bb6a', '#00897b', '#26a69a',
  '#7b1fa2', '#8e24aa', '#ab47bc', '#6a1b9a',
  '#e65100', '#ef6c00', '#f57c00', '#ff9800', '#ffa726',
  '#c62828', '#d32f2f', '#e53935',
]

const areaColorMap = computed(() => {
  const map = new Map<string, string>()
  const areas: string[] = []
  function collectAreas(nodes: HierarchyNode[]) {
    for (const n of nodes) {
      if (!map.has(n.area.id)) {
        map.set(n.area.id, AREA_PALETTE[areas.length % AREA_PALETTE.length]!)
        areas.push(n.area.id)
      }
      if (n.children.length) collectAreas(n.children)
    }
  }
  collectAreas(props.tree)
  return map
})

const hasMultipleRootsAndNoChildren = computed(() => {
  if (props.tree.length <= 1) return false
  const hasAnyChild = props.tree.some((n) => n.children.length > 0)
  return !hasAnyChild
})

const emit = defineEmits<{
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

.tree-hint {
  max-width: 360px;
  text-align: center;
}

.tree-connector-vertical {
  width: 2px;
  background: rgba(0, 0, 0, 0.22);
  margin: 0 auto;
  min-height: 16px;
  border-radius: 1px;
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
