import { useAuthStore } from '../stores/authStore'
import { API_BASE_URL } from '../config/constants'
import type {
  CreateFeedbackDto,
  Feedback,
  FeedbackFilters,
  FeedbacksResponse,
  FeedbackStatus,
  UpdateFeedbackDto
} from '../types/feedback'

const API_BASE = API_BASE_URL

function buildQuery(filters?: FeedbackFilters) {
  const params = new URLSearchParams()

  if (!filters) return ''

  const keys = Object.keys(filters) as Array<keyof FeedbackFilters>
  keys.forEach((key) => {
    const value = filters[key]
    if (value === undefined || value === null || value === '') return
    // Convertir a string de forma segura
    const stringValue = typeof value === 'string' ? value : String(value)
    params.set(key as string, stringValue)
  })

  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

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

// Normaliza: { data: ... } o directo ...
function unwrap<T>(raw: any): T {
  return (raw?.data ?? raw) as T
}

export const feedbackService = {
  async getFeedbacks(filters: FeedbackFilters = {}): Promise<FeedbacksResponse> {
    const auth = useAuthStore()
    const qs = buildQuery(filters)

    const res = await fetch(`${API_BASE}/feedbacks${qs}`, {
      headers: {
        ...auth.getAuthHeader()
      }
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))

    const raw = await parseJson<any>(res)
    const data = unwrap<any>(raw)

    // tolera: array directo o { items, total }
    return (data.items ? data : data) as FeedbacksResponse
  },

  async getFeedback(id: string): Promise<Feedback> {
    const auth = useAuthStore()

    const res = await fetch(`${API_BASE}/feedbacks/${id}`, {
      headers: {
        ...auth.getAuthHeader()
      }
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))

    const raw = await parseJson<any>(res)
    return unwrap<Feedback>(raw)
  },

  async getRecentFeedbacks(limit: number = 10): Promise<Feedback[]> {
    const auth = useAuthStore()

    const res = await fetch(`${API_BASE}/feedbacks/recent?limit=${limit}`, {
      headers: {
        ...auth.getAuthHeader()
      }
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))

    const raw = await parseJson<any>(res)
    return unwrap<Feedback[]>(raw)
  },

  async createFeedback(dto: CreateFeedbackDto): Promise<Feedback> {
    const auth = useAuthStore()

    const res = await fetch(`${API_BASE}/feedbacks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader()
      },
      body: JSON.stringify(dto)
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))

    const raw = await parseJson<any>(res)
    return unwrap<Feedback>(raw)
  },

  async updateFeedback(id: string, dto: UpdateFeedbackDto): Promise<Feedback> {
    const auth = useAuthStore()

    const res = await fetch(`${API_BASE}/feedbacks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader()
      },
      body: JSON.stringify(dto)
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))

    const raw = await parseJson<any>(res)
    return unwrap<Feedback>(raw)
  },

  async deleteFeedback(id: string): Promise<void> {
    const auth = useAuthStore()

    const res = await fetch(`${API_BASE}/feedbacks/${id}`, {
      method: 'DELETE',
      headers: {
        ...auth.getAuthHeader()
      }
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))
  },

  async updateStatus(id: string, status: FeedbackStatus): Promise<Feedback> {
    // Si tu backend tiene un endpoint específico tipo PATCH /feedbacks/:id/status
    // lo cambiamos acá. Por ahora lo resolvemos con PATCH normal.
    return this.updateFeedback(id, { status })
  },
}
