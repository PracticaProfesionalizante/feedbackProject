export type Role = 'LEADER' | 'EMPLOYEE'

export type FeedbackStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
export type FeedbackType = 'RECOGNITION' | 'IMPROVEMENT' | 'GENERAL'

export type FeedbackUser = {
  id: string
  name: string
  email: string
  role?: Role
}

/** ✅ NUEVO: Acción tipo checklist */
export type FeedbackAction = {
  id: string
  text: string
  done: boolean
  createdAt?: string
  updatedAt?: string
}

/** ✅ NUEVO: DTO para enviar acciones */
export type FeedbackActionInput = {
  /** si existe, sirve para mapear en UI; backend puede ignorarlo al recrear acciones */
  id?: string
  text: string
  /** opcional: solo para UI; backend puede ignorarlo */
  done?: boolean
}

export type Comment = {
  id: string
  content: string
  userId: string
  createdAt: string
  updatedAt?: string
  user?: FeedbackUser
}

export type Feedback = {
  id: string
  fromUserId: string
  toUserId: string
  type: FeedbackType
  content: string
  status: FeedbackStatus
  createdAt: string
  updatedAt: string

  /** ✅ NUEVO: para mostrar "Editado" estilo WhatsApp */
  contentEditedAt?: string | null

  /** ✅ NUEVO: checklist */
  actions?: FeedbackAction[]

  comments?: Comment[]

  // relaciones
  fromUser?: FeedbackUser
  toUser?: FeedbackUser
}

export type FeedbackFilters = {
  /** Tab: received | sent (backend type) */
  type?: 'received' | 'sent'
  /** Filtro por tipo de feedback (backend feedbackType) */
  feedbackType?: FeedbackType
  status?: FeedbackStatus
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

/**
 * ✅ Compatibilidad:
 * - algunos endpoints devuelven array directo
 * - tu backend de list devuelve: { items, pagination }
 * - versiones viejas podrían devolver { items, total, page, limit }
 */
export type FeedbacksResponse =
  | Feedback[]
  | {
      items: Feedback[]
      pagination?: {
        page: number
        limit: number
        total: number
        pages: number
      }
      // compat legacy
      total?: number
      page?: number
      limit?: number
    }

export type CreateFeedbackDto = {
  toUserId: string
  type: FeedbackType
  content: string

  /** ✅ NUEVO: acciones al crear */
  actions?: FeedbackActionInput[]
}

export type UpdateFeedbackDto = {
  type?: FeedbackType
  content?: string
  status?: FeedbackStatus

  /** ✅ NUEVO: acciones al editar (solo autor) */
  actions?: FeedbackActionInput[]
}