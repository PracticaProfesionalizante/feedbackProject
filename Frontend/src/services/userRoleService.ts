import { API_BASE_URL } from '@/config/constants'
import { useAuthStore } from '@/stores/authStore'
import type { AccessRole, SetUserRolesDto, UserRoleAssignmentsResponse } from '@/types/roles'

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

function unwrap<T>(raw: any): T {
  return (raw?.data ?? raw?.roles ?? raw?.assignments ?? raw) as T
}

export const userRoleService = {
  async getUserRoles(userId: string): Promise<{ roleIds: string[]; roles: AccessRole[] }> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/roles/users/${userId}`, {
      headers: {
        ...auth.getAuthHeader(),
      },
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<any>(res)
    // Backend devuelve { user, assignments } con assignments[] de { roleId, role }
    const assignments = Array.isArray(raw?.assignments) ? raw.assignments : []
    const roles = assignments.map((a: { role?: AccessRole }) => a.role).filter(Boolean) as AccessRole[]
    const roleIds = assignments.map((a: { roleId: string }) => a.roleId).filter(Boolean)
    return { roleIds, roles }
  },

  async setUserRoles(userId: string, roleIds: string[]): Promise<void> {
    const auth = useAuthStore()
    const dto: SetUserRolesDto = { roleIds }
    const res = await fetch(`${API_BASE}/roles/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader(),
      },
      body: JSON.stringify(dto),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
  },
}
