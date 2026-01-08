import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

// 👇 ¡IMPORTANTE! Debe decir "export const"
export const validate = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validamos envolviendo en body/query/params para coincidir con tu validator
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};