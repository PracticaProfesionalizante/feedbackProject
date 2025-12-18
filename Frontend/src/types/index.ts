// Tipos globales de TypeScript

export interface User {
  id: string
  name: string
  email: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

// Agrega más tipos aquí según necesites

