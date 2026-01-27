import { useAuthStore } from '../stores/authStore'
import type { Feedback } from '../types/feedback'
import type { DashboardStatsResponse } from '../types/dashboard'
import { API_BASE_URL } from '../config/constants'

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
    const data = unwrap<any>(raw)
    
    // El backend devuelve { feedbacksByStatus: { pending, inProgress, completed }, ... }
    // Necesitamos mapearlo al formato esperado por el frontend
    if (data?.feedbacksByStatus) {
      return {
        pending: data.feedbacksByStatus.pending ?? 0,
        inProgress: data.feedbacksByStatus.inProgress ?? 0,
        completed: data.feedbacksByStatus.completed ?? 0,
      }
    }
    
    // Si ya viene en el formato correcto, devolverlo tal cual
    return data as DashboardStatsResponse
  },

  async getRecent(): Promise<{ items: Feedback[] }> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE}/feedbacks/recent`, {
      headers: { ...auth.getAuthHeader() }
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<any>(res)
    const data = unwrap<any>(raw)
    // Asegurar que siempre devolvemos { items: [...] }
    if (Array.isArray(data?.items)) return { items: data.items }
    if (Array.isArray(data)) return { items: data }
    return { items: [] }
  }
}
