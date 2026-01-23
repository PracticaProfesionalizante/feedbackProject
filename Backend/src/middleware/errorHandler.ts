import { Request, Response, NextFunction } from 'express'
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

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? (err.statusCode || 500) : 500
  const message = err.message || 'Internal Server Error'

  console.error('Error:', err)

  res.status(statusCode).json({
    success: false,
    message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  })
}

