import { API_BASE_URL } from '@/config/constants'
import { useAuthStore } from '@/stores/authStore'
import type { Comment } from '@/types/feedback'

export type CreateCommentDto = {
  feedbackId: string
  content: string
}

async function parseError(res: Response): Promise<string> {
  try {
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const data = await res.json()
      return data.message || data.error || 'Error en la solicitud'
    }
    return (await res.text()) || 'Error en la solicitud'
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

export const commentService = {
  async createComment(dto: CreateCommentDto): Promise<Comment> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeader()
      },
      body: JSON.stringify(dto)
    })

    if (!res.ok) throw new Error(await parseError(res))
    return parseJson<Comment>(res)
  },

  async deleteComment(commentId: string): Promise<void> {
    const auth = useAuthStore()
    const res = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        ...auth.getAuthHeader()
      }
    })

    if (!res.ok) throw new Error(await parseError(res))
  }
}
