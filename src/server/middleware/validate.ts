import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request body against the provided Zod schema
      schema.parse(req.body);
      next(); // If validation passes, proceed to the next middleware/route handler
    } catch (error) {
      // If validation fails, return a 400 Bad Request with validation errors
      res.status(400).json({
        error: 'Validation failed',
        details: error instanceof Error ? error.message : 'Unknown validation error'
      });
    }
  };
}
