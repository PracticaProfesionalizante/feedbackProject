import type { Request } from 'express'

/**
 * Obtiene la IP del cliente desde la request.
 * Considera X-Forwarded-For (proxy/load balancer) y req.socket.remoteAddress.
 */
export function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0]
    return first?.trim() ?? null
  }
  return req.socket?.remoteAddress ?? req.ip ?? null
}

/**
 * Obtiene el User-Agent del cliente (navegador, app, etc.).
 */
export function getUserAgent(req: Request): string | null {
  const ua = req.headers['user-agent']
  return ua ?? null
}
