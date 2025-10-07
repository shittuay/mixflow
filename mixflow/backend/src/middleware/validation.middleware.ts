import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class ValidationMiddleware {
  static validateBody<T extends object>(dtoClass: new () => T) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const dto = plainToClass(dtoClass, req.body);
        const errors = await validate(dto);

        if (errors.length > 0) {
          const errorMessages = this.formatValidationErrors(errors);
          res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errorMessages,
          });
          return;
        }

        req.body = dto;
        next();
      } catch (error) {
        res.status(500).json({
          error: 'Validation processing failed',
          code: 'VALIDATION_PROCESSING_ERROR',
        });
      }
    };
  }

  static validateQuery<T extends object>(dtoClass: new () => T) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const dto = plainToClass(dtoClass, req.query);
        const errors = await validate(dto);

        if (errors.length > 0) {
          const errorMessages = this.formatValidationErrors(errors);
          res.status(400).json({
            error: 'Query validation failed',
            code: 'QUERY_VALIDATION_ERROR',
            details: errorMessages,
          });
          return;
        }

        req.query = dto as any;
        next();
      } catch (error) {
        res.status(500).json({
          error: 'Query validation processing failed',
          code: 'QUERY_VALIDATION_PROCESSING_ERROR',
        });
      }
    };
  }

  private static formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    errors.forEach((error) => {
      if (error.constraints) {
        formattedErrors[error.property] = Object.values(error.constraints);
      }
    });

    return formattedErrors;
  }
}