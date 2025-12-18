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
      const message = error.errors?.[0]?.message || 'Invalid input'
      const appError = new AppError(message, 400)
      next(appError)
    }
  }
}

