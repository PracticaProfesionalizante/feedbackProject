import { API_BASE_URL } from '@/config/constants'
import { useAuthStore } from '@/stores/authStore'
import type { OrgArea, OrgChartUser, UserPositionAssignment, HierarchyNode, AssignedUser } from '@/types/orgChart'

const API_BASE = API_BASE_URL

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const data = await res.json()
      return data.message || data.error || 'Error en la solicitud'
    }
    const text = await res.text()
    return text || 'Error en la solicitud'
  } catch {
    return 'Error en la solicitud'
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    const text = await res.text()
    throw new Error(`Respuesta inválida (no JSON). ${text.slice(0, 80)}`)
  }
  return res.json() as Promise<T>
}

export const orgChartService = {
  async getAreasWithPositions(): Promise<OrgArea[]> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/org-chart/areas`, {
      headers: { ...auth.getAuthHeader() },
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<{ areas: OrgArea[] }>(res)
    return raw.areas ?? []
  },

  async getUserPositions(userId: string): Promise<UserPositionAssignment[]> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/org-chart/users/${userId}/positions`, {
      headers: { ...auth.getAuthHeader() },
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<{ assignments?: UserPositionAssignment[] }>(res)
    return raw.assignments ?? []
  },

  /**
   * Construye el mapa positionId -> usuarios asignados.
   * Usa team/employees + getUserPositions por cada empleado (sin cambios en backend).
   */
  async buildPositionUsersMap(): Promise<Map<string, OrgChartUser[]>> {
    const employees = await this.getTeamEmployees()
    const map = new Map<string, OrgChartUser[]>()
    for (const emp of employees) {
      const assignments = await this.getUserPositions(emp.id)
      for (const a of assignments) {
        const posId = a.position.id
        const list = map.get(posId) ?? []
        if (!list.some((u) => u.id === emp.id)) {
          list.push(emp)
          map.set(posId, list)
        }
      }
    }
    return map
  },

  async replaceUserPositions(userId: string, positionIds: string[]): Promise<UserPositionAssignment[]> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/org-chart/users/${userId}/positions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader(),
      },
      body: JSON.stringify({ positionIds }),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<{ assignments?: UserPositionAssignment[] }>(res)
    return raw.assignments ?? []
  },

  async getTeamEmployees(): Promise<OrgChartUser[]> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/team/employees`, {
      headers: { ...auth.getAuthHeader() },
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<{ employees?: OrgChartUser[] }>(res)
    return raw.employees ?? []
  },

  /** Lista de usuarios para asignar a puestos (admin). Búsqueda opcional. */
  async getUsersForAssignment(search?: string): Promise<AssignedUser[]> {
    const auth = useAuthStore()
    const url = new URL(`${API_BASE}/org-chart/users`)
    if (search?.trim()) url.searchParams.set('search', search.trim())
    const res = await fetch(url.toString(), { headers: { ...auth.getAuthHeader() } })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<{ users?: AssignedUser[] }>(res)
    return raw.users ?? []
  },

  /** Lista todos los puestos (para selects en el drawer). */
  async getPositions(): Promise<Array<{ id: string; name: string; area: { id: string; name: string }; parent?: { id: string; name: string } }>> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/org-chart/positions`, { headers: { ...auth.getAuthHeader() } })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<{ positions?: Array<{ id: string; name: string; area: { id: string; name: string }; parent?: { id: string; name: string } }> }>(res)
    return raw.positions ?? []
  },

  /** Actualizar puesto (nombre, área, a quién rinde cuentas). */
  async updatePosition(
    positionId: string,
    data: { name?: string; areaId?: string; parentPositionId?: string | null }
  ): Promise<void> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/org-chart/positions/${positionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth.getAuthHeader() },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
  },

  /** Árbol de puestos con jerarquía (parent) y usuarios asignados por puesto */
  async getHierarchyTree(): Promise<HierarchyNode[]> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/org-chart/hierarchy`, {
      headers: { ...auth.getAuthHeader() },
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<{ tree?: HierarchyNode[] }>(res)
    return raw.tree ?? []
  },
}
