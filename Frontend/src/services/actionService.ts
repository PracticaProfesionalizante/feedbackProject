import { useAuthStore } from '@/stores/authStore'
import { API_BASE_URL } from '@/config/constants'
import type {
  FeedbackAction,
  UpdateFeedbackActionDto,
  CreateFeedbackActionDto
} from '../types/feedback'

const API_BASE = API_BASE_URL

/**
 * ✅ Config de endpoints.
 * Si el backend cambia rutas, tocás SOLO esto.
 */
const ACTION_ENDPOINTS = {
  createForFeedback: (feedbackId: string) => `${API_BASE}/feedbacks/${feedbackId}/actions`,
  update: (actionId: string) => `${API_BASE}/actions/${actionId}`,
  remove: (actionId: string) => `${API_BASE}/actions/${actionId}`
}

/**
 * ✅ Modo stub (para avanzar sin backend listo)
 * .env => VITE_ACTIONS_STUB=true
 */
const USE_STUB = import.meta.env.VITE_ACTIONS_STUB === 'true'

function getAuthHeaders(): Record<string, string> {
  const auth = useAuthStore()
  return {
    ...auth.getAuthHeader()
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const data = await res.json()
      return data.message || data.error || `Error HTTP ${res.status}`
    }
    const text = await res.text()
    return text || `Error HTTP ${res.status}`
  } catch {
    return `Error HTTP ${res.status}`
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

// Normaliza: { data: ... } o directo ...
function unwrap<T>(raw: any): T {
  return (raw?.data ?? raw) as T
}

export const actionService = {
  /**
   * POST /feedbacks/:id/actions
   * Body: { text }
   */
  async create(feedbackId: string, dto: CreateFeedbackActionDto): Promise<FeedbackAction> {
    if (USE_STUB) {
      return {
        id: crypto.randomUUID(),
        feedbackId,
        text: dto.text,
        done: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    const res = await fetch(ACTION_ENDPOINTS.createForFeedback(feedbackId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(dto)
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))

    const raw = await parseJson<any>(res)
    return unwrap<FeedbackAction>(raw)
  },

  /**
   * PATCH /actions/:actionId
   * Body: { done?, text? }
   */
  async update(actionId: string, dto: UpdateFeedbackActionDto): Promise<FeedbackAction> {
    if (USE_STUB) {
      return {
        id: actionId,
        text: dto.text ?? '(sin cambios)',
        done: dto.done ?? false,
        updatedAt: new Date().toISOString()
      } as FeedbackAction
    }

    const res = await fetch(ACTION_ENDPOINTS.update(actionId), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(dto)
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))

    const raw = await parseJson<any>(res)
    return unwrap<FeedbackAction>(raw)
  },

  /**
   * DELETE /actions/:actionId
   */
  async remove(actionId: string): Promise<void> {
    if (USE_STUB) return

    const res = await fetch(ACTION_ENDPOINTS.remove(actionId), {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders()
      }
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))
  }
}