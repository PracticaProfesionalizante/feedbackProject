import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { AppError } from './errorHandler'

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      next()
    } catch (error: any) {
      const appError = new AppError('Validation error')
      appError.statusCode = 400
      appError.message = error.errors?.[0]?.message || 'Invalid input'
      next(appError)
    }
  }
}

