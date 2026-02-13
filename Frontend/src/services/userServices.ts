import api from './api' // tu axios instance

export type UserProfile = {
  id: string
  email: string
  name: string
  role: 'LEADER' | 'EMPLOYEE'
  createdAt: string
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

  // lo dejamos listo para más adelante
  patchProfile: async (payload: { name?: string; email?: string; password?: string }) => {
    const { data } = await api.patch('/users/profile', payload)
    return data
  },
}
