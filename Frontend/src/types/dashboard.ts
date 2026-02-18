import type { Feedback } from '../types/feedback'

/**
 * Estadísticas del dashboard (recibidos, enviados, notificaciones).
 */
export type DashboardStats = {
  totalReceived?: number
  totalSent?: number
  unreadNotifications?: number
}

/**
 * Respuesta típica del endpoint de estadísticas.
 * Soporta tanto { data: ... } como directo (lo normalizamos en service).
 */
export type DashboardStatsResponse =
  | DashboardStats
  | {
      data: DashboardStats
    }

/**
 * Lista de feedbacks recientes.
 * Por simplicidad reutilizamos Feedback (puede incluir fromUser/toUser si el backend los manda).
 * Si el backend devuelve un formato "compacto", lo tipamos aparte abajo.
 */
export type RecentFeedbacksResponse =
  | Feedback[]
  | {
      data: Feedback[]
    }

/**
 * (Opcional) Tipo compacto si preferís NO reutilizar Feedback.
 * Útil si tu endpoint /feedbacks/recent devuelve menos campos.
 */
export type RecentFeedbackItem = Pick<
  Feedback,
  'id' | 'content' | 'createdAt' | 'fromUserId' | 'toUserId'
> & {
  fromUser?: Feedback['fromUser']
  toUser?: Feedback['toUser']
}

export type RecentFeedbacksCompactResponse =
  | RecentFeedbackItem[]
  | {
      data: RecentFeedbackItem[]
    }