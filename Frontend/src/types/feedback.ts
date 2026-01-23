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

  // si el backend incluye relaciones:
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
}

export type UpdateFeedbackDto = {
  type?: FeedbackType
  content?: string
}