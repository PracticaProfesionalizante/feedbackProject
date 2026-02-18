import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { NODE_ENV } from '../config/constants'

export class AppError extends Error {
  statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}

function getPrismaCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: string }).code === 'string') {
    return (err as Prisma.PrismaClientKnownRequestError).code
  }
  return undefined
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? (err.statusCode || 500) : 500
  const message = err.message || 'Internal Server Error'
  const prismaCode = getPrismaCode(err)

  if (statusCode === 500) {
    console.error('Error 500:', err)
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(prismaCode && { code: prismaCode }),
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  })
}

