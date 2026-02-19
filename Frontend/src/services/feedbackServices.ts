import { useAuthStore } from '../stores/authStore'
import { API_BASE_URL } from '../config/constants'
import type {
  CreateFeedbackDto,
  Feedback,
  FeedbackFilters,
  FeedbacksResponse,
  UpdateFeedbackDto,
  FeedbackCounterpart
} from '../types/feedback'

const API_BASE = API_BASE_URL

function buildUrl(path: string) {
  // evita // o falta de /
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

function buildQuery(filters?: FeedbackFilters) {
  const params = new URLSearchParams()
  if (!filters) return ''

  const keys = Object.keys(filters) as Array<keyof FeedbackFilters>
  keys.forEach((key) => {
    const value = filters[key]
    if (value === undefined || value === null || value === '') return
    const stringValue = typeof value === 'string' ? value : String(value)
    params.set(key as string, stringValue)
  })
  if (!params.has('page')) params.set('page', '1')
  if (!params.has('limit')) params.set('limit', '10')
  if (!params.has('type')) params.set('type', 'received')

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
    throw new Error(`Respuesta inválida (no JSON). ${text.slice(0, 120)}`)
  }
  return res.json() as Promise<T>
}

// Normaliza: { data: ... } o directo ...
function unwrap<T>(raw: any): T {
  return (raw?.data ?? raw) as T
}

// Normaliza arrays que pueden venir como:
// - { feedbacks: [...] }
// - { items: [...] }
// - [...] directo
function unwrapArray<T>(raw: any): T[] {
  const data = unwrap<any>(raw)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.feedbacks)) return data.feedbacks
  if (Array.isArray(data?.items)) return data.items
  return []
}

export const feedbackService = {
  /** Lista de usuarios con los que tengo feedbacks (para filtro por usuario) */
  async getCounterparts(): Promise<FeedbackCounterpart[]> {
    const auth = useAuthStore()
    const res = await fetch(buildUrl('/feedbacks/counterparts'), {
      headers: { ...auth.getAuthHeader() }
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res))
    const raw = await parseJson<any>(res)
    const data = Array.isArray(raw) ? raw : raw?.data ?? raw?.items ?? []
    return data as FeedbackCounterpart[]
  },

  async getFeedbacks(filters: FeedbackFilters = {}): Promise<FeedbacksResponse> {
    const auth = useAuthStore()
    const qs = buildQuery(filters)

    const res = await fetch(buildUrl(`/feedbacks${qs}`), {
      headers: {
        ...auth.getAuthHeader()
      }
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))

    const raw = await parseJson<any>(res)
    const data = unwrap<any>(raw)

    // esperado: { items, pagination }
    // pero toleramos que venga otra forma.
    return (data?.items ? data : data) as FeedbacksResponse
  },

  async getFeedback(id: string): Promise<Feedback> {
    const auth = useAuthStore()

    const res = await fetch(buildUrl(`/feedbacks/${id}`), {
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

    const res = await fetch(buildUrl(`/feedbacks/recent?limit=${limit}`), {
      headers: {
        ...auth.getAuthHeader()
      }
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))

    const raw = await parseJson<any>(res)
    return unwrapArray<Feedback>(raw)
  },

  async createFeedback(dto: CreateFeedbackDto): Promise<Feedback> {
    const auth = useAuthStore()

    const res = await fetch(buildUrl('/feedbacks'), {
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

    const res = await fetch(buildUrl(`/feedbacks/${id}`), {
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

    const res = await fetch(buildUrl(`/feedbacks/${id}`), {
      method: 'DELETE',
      headers: {
        ...auth.getAuthHeader()
      }
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))
  },

  /**
   * ✅ Toggle de checklist (autor o receptor)
   * Endpoint: PATCH /api/feedbacks/:id/actions/:actionId
   *
   * - Si pasás `done`, intenta setear a ese valor.
   * - Si NO pasás `done`, el backend lo togglea.
   */
  async toggleAction(feedbackId: string, actionId: string, done?: boolean) {
    const auth = useAuthStore()

    const res = await fetch(buildUrl(`/feedbacks/${feedbackId}/actions/${actionId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader()
      },
      // si done es undefined, mandamos {} para no romper JSON.parse en backend
      body: JSON.stringify(done === undefined ? {} : { done })
    })

    if (!res.ok) throw new Error(await parseErrorMessage(res))

    const raw = await parseJson<any>(res)
    const data = unwrap<any>(raw)

    // tolera: { item }, o objeto directo
    return (data?.item ?? data) as { id: string; text: string; done: boolean; updatedAt?: string }
  }
}