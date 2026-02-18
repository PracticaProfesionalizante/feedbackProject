import api from './api' // tu axios instance

export type UserProfile = {
  id: string
  email: string
  name: string
  birthdate?: string | null
  country?: string | null
  createdAt: string
  assignedRoles?: Array<{ role: { id: string; name: string; description?: string | null } }>
  stats: {
    feedbacksGiven: number
    feedbacksReceived: number
    comments: number
  }
  teamInfo: {
    employeesCount: number
    leadersCount: number
  }
}

export const UserService = {
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await api.get('/users/profile')
    const user = data.user ?? data

    // Normalizamos stats y teamInfo en caso de que el backend no los envíe
    const stats = user.stats ?? {
      feedbacksGiven: 0,
      feedbacksReceived: 0,
      comments: 0
    }
    const teamInfo = user.teamInfo ?? {
      employeesCount: 0,
      leadersCount: 0
    }

    return { ...user, stats, teamInfo }
  },

  patchProfile: async (payload: {
    name?: string
    email?: string
    birthdate?: string | null
    country?: string | null
  }) => {
    const { data } = await api.patch('/users/profile', payload)
    return data
  },
}
