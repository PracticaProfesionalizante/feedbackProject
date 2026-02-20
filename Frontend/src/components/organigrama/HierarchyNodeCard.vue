<template>
  <div class="node-branch">
    <!-- Tarjeta del PUESTO -->
    <div
      class="node-card"
      :class="[depthClass, { 'node-card-clickable': selectable }]"
      :style="areaColor ? { '--area-color': areaColor, '--area-color-light': areaColorLight } : undefined"
      @click.stop="selectable && emit('select', node)"
    >
      <div class="node-card-header">
        <div class="node-card-main">
          <div class="node-card-name">{{ node.name }}</div>
          <div class="node-card-area">{{ node.area.name }}</div>
        </div>
        <button
          v-if="node.children.length > 0"
          type="button"
          class="node-expand-btn"
          :aria-label="isExpanded ? 'Colapsar' : 'Expandir'"
          @click.stop="emit('toggle-expand', node.id)"
        >
          <v-icon :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="small" />
        </button>
      </div>
      <!-- Usuarios asignados: 0, 1 o varios -->
      <div v-if="node.assignedUsers.length === 0" class="node-card-users empty">
        Sin asignar
      </div>
      <div v-else class="node-card-users">
        <div
          v-for="u in node.assignedUsers"
          :key="u.id"
          class="assigned-user"
          :title="u.email"
        >
          {{ u.name }}
        </div>
      </div>
    </div>

    <!-- Conector hacia abajo y luego puestos hijos en columna (solo si está expandido y no se renderizan fuera) -->
    <template v-if="node.children.length > 0 && isExpanded && !hideChildren">
      <div class="node-connector-down" />
      <div class="node-children-column">
        <template v-for="(child, idx) in node.children" :key="child.id">
          <div class="node-child-wrapper">
            <div v-if="idx > 0" class="node-connector-down" />
            <HierarchyNodeCard
              :node="child"
              :depth="depth + 1"
              :area-color="areaColorsMap?.get(child.area.id)"
              :area-colors-map="areaColorsMap"
              :expanded-ids="expandedIds"
              :selectable="selectable"
              @select="emit('select', $event)"
              @toggle-expand="(id: string) => emit('toggle-expand', id)"
            />
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HierarchyNode } from '@/types/orgChart'

const props = withDefaults(
  defineProps<{
    node: HierarchyNode
    depth: number
    /** Color por área (hex). Si viene, se usa en lugar del color por profundidad. */
    areaColor?: string
    /** Mapa areaId -> color para pasar a hijos */
    areaColorsMap?: Map<string, string>
    /** IDs de nodos expandidos (estilo Human). Si no se pasa, se considera expandido. */
    expandedIds?: Set<string>
    selectable?: boolean
    /** Si true, no se renderizan los hijos (para que el padre los muestre en layout horizontal). */
    hideChildren?: boolean
  }>(),
  { hideChildren: false }
)

const emit = defineEmits<{
  (e: 'select', node: HierarchyNode): void
  (e: 'toggle-expand', nodeId: string): void
}>()

const isExpanded = computed(() => {
  if (props.expandedIds == null) return true
  return props.expandedIds.has(props.node.id)
})

const depthClass = computed(() => {
  if (props.areaColor) return 'node-card-by-area'
  if (props.depth === 0) return 'node-card-depth-0'
  if (props.depth === 1) return 'node-card-depth-1'
  return 'node-card-depth-2'
})

const areaColorLight = computed(() => {
  if (!props.areaColor) return ''
  const hex = props.areaColor.replace('#', '')
  const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + 40)
  const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + 40)
  const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + 40)
  return `rgb(${r}, ${g}, ${b})`
})
</script>

<style scoped>
.node-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.node-card {
  padding: 12px 16px;
  border-radius: 12px;
  text-align: center;
  min-width: 168px;
  max-width: 220px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.15s, box-shadow 0.15s;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.node-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 8px 24px rgba(0, 0, 0, 0.08);
}

.node-card-clickable {
  cursor: pointer;
}

.node-card-depth-0 {
  background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%);
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.node-card-depth-1 {
  background: linear-gradient(135deg, #1976d2 0%, #1e88e5 100%);
  color: white;
  font-weight: 600;
  font-size: 0.88rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.node-card-depth-2 {
  background: #fff;
  color: #1a1a1a;
  font-weight: 500;
  font-size: 0.82rem;
  border: 2px solid #1976d2;
}

.node-card-by-area {
  background: var(--area-color);
  color: white;
  font-weight: 600;
  font-size: 0.88rem;
  border: 2px solid var(--area-color-light);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.node-card-header {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
}

.node-card-main {
  flex: 1;
  min-width: 0;
}

.node-expand-btn {
  flex-shrink: 0;
  margin: -4px -4px 0 0;
  padding: 4px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.25);
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.node-expand-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}

.node-card-depth-2 .node-expand-btn,
.node-card-depth-2 .node-expand-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}
.node-card-depth-2 .node-expand-btn:hover {
  background: rgba(0, 0, 0, 0.14);
}

.node-card-name {
  font-weight: inherit;
  line-height: 1.25;
  word-break: break-word;
}

.node-card-area {
  margin-top: 4px;
  font-size: 0.75rem;
  opacity: 0.95;
}

.node-card-users {
  margin-top: 6px;
  font-size: 0.75rem;
  line-height: 1.3;
  text-align: left;
}

.node-card-users.empty {
  font-style: italic;
  opacity: 0.8;
}

.assigned-user {
  padding: 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-connector-down {
  width: 2px;
  height: 20px;
  background: rgba(0, 0, 0, 0.22);
  margin: 0 auto;
  border-radius: 1px;
}

.node-children-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin-top: 6px;
}

.node-child-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
