import type { Request } from 'express'
import type { Prisma } from '@prisma/client'
import { prisma } from '../utils/prisma'
import { getClientIp, getUserAgent } from '../utils/requestContext'

export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN'

export type AuditPayload = {
  tableName: string
  recordId: string
  action: AuditActionType
  userId?: string | null
  description?: string | null
  oldData?: Prisma.InputJsonValue
  newData?: Prisma.InputJsonValue
}

/**
 * Registra una acción en la tabla de auditoría.
 * Además de IP se guardan: userAgent, requestMethod, requestPath y opcionalmente description.
 * No lanza errores para no afectar el flujo principal; fallos se loguean.
 */
export async function auditLog(req: Request, payload: AuditPayload): Promise<void> {
  try {
    const userId = payload.userId ?? req.user?.id ?? null
    const ip = getClientIp(req)
    const userAgent = getUserAgent(req)
    const requestMethod = req.method ?? undefined
    const requestPath = req.originalUrl ?? req.path ?? undefined

    type AuditLogDelegate = { create: (args: { data: Record<string, unknown> }) => Promise<unknown> }
    await (prisma as unknown as { auditLog: AuditLogDelegate }).auditLog.create({
      data: {
        tableName: payload.tableName,
        recordId: payload.recordId,
        action: payload.action as 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN',
        userId: userId ?? undefined,
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined,
        requestMethod,
        requestPath,
        description: payload.description ?? undefined,
        oldData: payload.oldData ?? undefined,
        newData: payload.newData ?? undefined,
      },
    })
  } catch (err) {
    // No romper la petición si falla la auditoría
    console.error('[AuditLog] Error registrando auditoría:', err)
  }
}
