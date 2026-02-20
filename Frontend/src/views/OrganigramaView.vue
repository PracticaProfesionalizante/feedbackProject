<template>
  <v-container>
    <div class="mb-4 d-flex flex-wrap align-center justify-space-between gap-2">
      <div>
        <div class="text-h6 font-weight-bold">Organigrama</div>
        <div class="text-body-2 text-medium-emphasis">
          Árbol de puestos por área. Cada puesto puede tener 0, 1 o varios usuarios asignados.
          <template v-if="isAdmin">
            Hacé clic en un puesto para ver detalle, editar (área, a quién rinde cuentas) y asignar usuarios.
          </template>
          <template v-else>
            Arrastrá para mover, scroll para zoom.
          </template>
        </div>
      </div>
      <v-btn
        variant="tonal"
        size="small"
        icon="mdi-refresh"
        :loading="treeLoading"
        @click="refetchTree"
        title="Refrescar árbol"
      />
    </div>

    <div v-if="treeLoading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate size="48" />
    </div>

    <div v-else-if="treeError" class="py-6">
      <v-alert type="error" variant="tonal">
        {{ treeError }}
      </v-alert>
      <v-btn class="mt-2" @click="refetchTree">Reintentar</v-btn>
    </div>

    <div v-else class="org-chart">
      <HierarchyTree
        :tree="tree"
        :is-admin="isAdmin"
        @refresh="refetchTree"
        @select="openDrawer"
      />
    </div>

    <!-- Panel lateral solo para admin -->
    <PositionDetailDrawer
      v-if="isAdmin"
      :open="!!selectedNode"
      :position="selectedNode"
      :areas="areas"
      :all-positions="allPositions"
      @update:open="(v) => !v && (selectedNode = null)"
      @saved="onDrawerSaved"
    />
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/authStore'
import { orgChartService } from '@/services/orgChartService'
import type { HierarchyNode } from '@/types/orgChart'
import HierarchyTree from '@/components/organigrama/HierarchyTree.vue'
import PositionDetailDrawer from '@/components/organigrama/PositionDetailDrawer.vue'

const auth = useAuthStore()
const isAdmin = computed(() => auth.isAdmin)

const treeQuery = useQuery({
  queryKey: ['org-chart', 'hierarchy'],
  queryFn: orgChartService.getHierarchyTree,
  staleTime: 0,
})

const areasQuery = useQuery({
  queryKey: ['org-chart', 'areas'],
  queryFn: orgChartService.getAreasWithPositions,
  enabled: isAdmin,
})

const positionsQuery = useQuery({
  queryKey: ['org-chart', 'positions'],
  queryFn: orgChartService.getPositions,
  enabled: isAdmin,
})

const tree = computed(() => treeQuery.data.value ?? [])
const treeLoading = computed(() => treeQuery.isLoading.value)
const treeError = computed(() => treeQuery.error.value?.message ?? '')

const areas = computed(() => areasQuery.data.value ?? [])
const allPositions = computed(() => positionsQuery.data.value ?? [])

const selectedNode = ref<HierarchyNode | null>(null)

function openDrawer(node: HierarchyNode) {
  selectedNode.value = node
}

function refetchTree() {
  treeQuery.refetch()
}

async function onDrawerSaved() {
  await Promise.all([treeQuery.refetch(), areasQuery.refetch(), positionsQuery.refetch()])
  const id = selectedNode.value?.id
  if (id && tree.value.length) {
    const find = (nodes: HierarchyNode[]): HierarchyNode | null => {
      for (const n of nodes) {
        if (n.id === id) return n
        const found = find(n.children)
        if (found) return found
      }
      return null
    }
    const updated = find(tree.value)
    if (updated) selectedNode.value = updated
  }
}
</script>

<style scoped>
.org-chart {
  width: 100%;
}
</style>
