import type { FeedbackUser } from './feedback'

export type Comment = {
  id: string
  feedbackId: string
  userId: string
  user: FeedbackUser
  content: string
  createdAt: string
}
