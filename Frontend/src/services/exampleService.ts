import apiClient from './api'
import type { ApiResponse } from '../types'

// Ejemplo de servicio para hacer llamadas a la API
export const exampleService = {
  // Ejemplo de GET
  async getData(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/example')
    return response.data
  },

  // Ejemplo de POST
  async createData(data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/example', data)
    return response.data
  },

  // Ejemplo de PUT
  async updateData(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`/example/${id}`, data)
    return response.data
  },

  // Ejemplo de DELETE
  async deleteData(id: string): Promise<void> {
    await apiClient.delete(`/example/${id}`)
  },
}

