import { useAuthStore } from '../stores/authStore'
import type { Feedback } from '../types/feedback'
import type { DashboardStatsResponse } from '../types/dashboard'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

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
    throw new Error(`Respuesta inválida (no JSON). ${text.slice(0, 120)}`)
  }
  return res.json() as Promise<T>
}

function unwrap<T>(raw: any): T {
  return (raw?.data ?? raw) as T
}

export const dashboardService = {
  async getStats(): Promise<DashboardStatsResponse> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: { ...auth.getAuthHeader() }
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<any>(res)
    return unwrap<DashboardStatsResponse>(raw)
  },

  async getRecent(): Promise<{ items: Feedback[] }> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/feedbacks/recent`, {
      headers: { ...auth.getAuthHeader() }
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<any>(res)
    return unwrap<{ items: Feedback[] }>(raw)
  }
}