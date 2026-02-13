import { API_BASE_URL } from '@/config/constants'
import { useAuthStore } from '@/stores/authStore'
import type { AccessRole, RoleFormValues } from '@/types/roles'

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
  return (raw?.data ?? raw?.role ?? raw?.roles ?? raw) as T
}

export const roleService = {
  async getRoles(): Promise<AccessRole[]> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/roles`, {
      headers: {
        ...auth.getAuthHeader(),
      },
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<any>(res)
    const data = unwrap<{ roles?: AccessRole[]; items?: AccessRole[] } | AccessRole[]>(raw)
    if (Array.isArray(data)) return data as AccessRole[]
    if (Array.isArray((data as any).roles)) return (data as any).roles
    if (Array.isArray((data as any).items)) return (data as any).items
    if (Array.isArray(raw)) return raw as AccessRole[]
    return []
  },

  async createRole(values: RoleFormValues): Promise<AccessRole> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader(),
      },
      body: JSON.stringify(values),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<any>(res)
    return unwrap<AccessRole>(raw)
  },

  async updateRole(id: string, values: RoleFormValues): Promise<AccessRole> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/roles/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader(),
      },
      body: JSON.stringify(values),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<any>(res)
    return unwrap<AccessRole>(raw)
  },

  async deleteRole(id: string): Promise<void> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/roles/${id}`, {
      method: 'DELETE',
      headers: {
        ...auth.getAuthHeader(),
      },
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
  },
}
