export type Role = 'LEADER' | 'EMPLOYEE'

export type FeedbackStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
export type FeedbackType = 'RECOGNITION' | 'IMPROVEMENT' | 'GENERAL'

export type FeedbackUser = {
  id: string
  name: string
  email: string
  role?: Role
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
  fromUser?: FeedbackUser
  toUser?: FeedbackUser

  actions?: FeedbackAction[]
}

export type Comment = {
  id: string
  content: string
  userId: string
  createdAt: string
  updatedAt?: string
  user?: FeedbackUser
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

export type FeedbacksResponse =
  | Feedback[]
  | {
      items: Feedback[]
      total: number
      page?: number
      limit?: number
    }

export type CreateFeedbackDto = {
  toUserId: string
  type: FeedbackType
  content: string
  // actions?: CreateFeedbackActionDto[] // ✅ nuevo
  actions?: { text: string }[]
}

export type UpdateFeedbackDto = {
  type?: FeedbackType
  content?: string
  status?: FeedbackStatus
}
export type FeedbackAction = {
  id: string
  feedbackId?: string // opcional en modo "draft" antes de guardar
  text: string
  done: boolean
  createdAt?: string
  updatedAt?: string
}

export type CreateFeedbackActionDto = {
  text: string
}

export type UpdateFeedbackActionDto = {
  text?: string
  done?: boolean
}