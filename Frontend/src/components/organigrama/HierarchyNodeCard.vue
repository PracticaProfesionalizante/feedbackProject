<template>
  <div class="node-branch">
    <!-- Tarjeta del PUESTO -->
    <div
      class="node-card"
      :class="[depthClass, { 'node-card-clickable': selectable }]"
      @click.stop="selectable && $emit('select', node)"
    >
      <div class="node-card-name">{{ node.name }}</div>
      <div class="node-card-area">{{ node.area.name }}</div>
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

    <!-- Conector hacia abajo y luego puestos hijos -->
    <template v-if="node.children.length > 0">
      <div class="node-connector-down" />
      <div class="node-children-row">
        <template v-for="child in node.children" :key="child.id">
          <div class="node-child-wrapper">
            <div class="node-connector-horizontal" v-if="node.children.length > 1" />
            <HierarchyNodeCard
              :node="child"
              :depth="depth + 1"
              :selectable="selectable"
              @select="$emit('select', $event)"
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

const props = defineProps<{
  node: HierarchyNode
  depth: number
  selectable?: boolean
}>()

defineEmits<{
  (e: 'select', node: HierarchyNode): void
}>()

const depthClass = computed(() => {
  if (props.depth === 0) return 'node-card-depth-0'
  if (props.depth === 1) return 'node-card-depth-1'
  return 'node-card-depth-2'
})
</script>

<style scoped>
.node-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.node-card {
  padding: 10px 16px;
  border-radius: 10px;
  text-align: center;
  min-width: 160px;
  max-width: 220px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.15s, box-shadow 0.15s;
}

.node-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
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
  height: 18px;
  background: rgba(0, 0, 0, 0.25);
  margin: 0 auto;
}

.node-children-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px 24px;
  align-items: flex-start;
  margin-top: 4px;
}

.node-child-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.node-connector-horizontal {
  position: absolute;
  top: -18px;
  left: 50%;
  width: 2px;
  height: 18px;
  background: rgba(0, 0, 0, 0.25);
}
</style>
