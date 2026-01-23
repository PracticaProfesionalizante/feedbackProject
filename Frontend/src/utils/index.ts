// Utilidades generales

/**
 * Formatea una fecha a formato legible
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Valida si un email es válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Formatea un tiempo relativo (ej: "Hace 2 horas", "Hace 1 día")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Hace unos momentos'
  if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
  
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) return `Hace ${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'}`
  
  // Calcular años primero para evitar el caso de "0 años"
  // Esto previene que fechas de 360-364 días muestren "Hace 0 años"
  const diffYears = Math.floor(diffDays / 365)
  if (diffYears >= 1) {
    return `Hace ${diffYears} ${diffYears === 1 ? 'año' : 'años'}`
  }
  
  // Si no es un año completo, mostrar meses
  // diffDays está entre 28-364 días en este punto
  const diffMonths = Math.floor(diffDays / 30)
  // Manejar el caso de 28-29 días que resultan en 0 meses
  if (diffMonths < 1) {
    // Si es menos de un mes pero >= 4 semanas, mostrar semanas
    return `Hace ${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'}`
  }
  return `Hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`
}

// Agrega más utilidades aquí según necesites

