export type Role = 'LEADER' | 'EMPLOYEE'

/** Un puesto del usuario (viene del backend en fromUser/toUser) */
export type UserOrgPositionItem = {
  position?: { name: string; area?: { name: string } }
}

export type FeedbackUser = {
  id: string
  name: string
  email: string
  role?: Role
  /** Puestos y áreas del organigrama (opcional) */
  orgPositions?: UserOrgPositionItem[]
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
  content: string
  createdAt: string
  updatedAt: string

  /** Para mostrar "Editado" estilo WhatsApp */
  contentEditedAt?: string | null

  /** Checklist */
  actions?: FeedbackAction[]

  comments?: Comment[]

  fromUser?: FeedbackUser
  toUser?: FeedbackUser
}

export type FeedbackFilters = {
  type?: 'received' | 'sent'
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  /** Filtrar por usuario contraparte (quien envía en recibidos, quien recibe en enviados) */
  userId?: string
  sortBy?: 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

/** Usuario contraparte para el selector (id, name, email, opcional puesto/área) */
export type FeedbackCounterpart = {
  id: string
  name: string
  email: string
  orgPositions?: UserOrgPositionItem[]
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
  content: string
  actions?: FeedbackActionInput[]
}

export type UpdateFeedbackDto = {
  content?: string
  actions?: FeedbackActionInput[]
}