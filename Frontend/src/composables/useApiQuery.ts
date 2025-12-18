import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { ApiResponse } from '../types'

// Ejemplo de composable para usar TanStack Query con llamadas a la API
export function useExampleQuery() {
  return useQuery({
    queryKey: ['example'],
    queryFn: async (): Promise<ApiResponse<any>> => {
      // Aquí harías la llamada a tu servicio
      // const response = await exampleService.getData()
      // return response
      throw new Error('Implementar llamada a la API')
    },
  })
}

export function useExampleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (_data: any): Promise<ApiResponse<any>> => {
      // Aquí harías la llamada a tu servicio
      // const response = await exampleService.createData(_data)
      // return response
      throw new Error('Implementar llamada a la API')
    },
    onSuccess: () => {
      // Invalidar y refetch después de una mutación exitosa
      queryClient.invalidateQueries({ queryKey: ['example'] })
    },
  })
}

