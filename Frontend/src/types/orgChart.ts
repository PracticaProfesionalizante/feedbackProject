export type OrgArea = {
  id: string
  name: string
  positions: OrgPosition[]
}

export type OrgPosition = {
  id: string
  name: string
  areaId: string
  _count?: { userLinks: number }
}

export type UserPositionAssignment = {
  position: {
    id: string
    name: string
    area: { id: string; name: string }
  }
}

export type OrgChartUser = {
  id: string
  name: string
  email: string
  role?: 'LEADER' | 'EMPLOYEE'
}

/** Usuario asignado a un puesto (para mostrar en el árbol) */
export type AssignedUser = {
  id: string
  name: string
  email: string
}

/** Nodo del árbol = PUESTO con área, usuarios asignados (0, 1 o varios) e hijos (puestos) */
export type HierarchyNode = {
  id: string
  name: string
  area: { id: string; name: string }
  parentPositionId?: string | null
  assignedUsers: AssignedUser[]
  children: HierarchyNode[]
}
