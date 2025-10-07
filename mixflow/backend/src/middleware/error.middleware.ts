import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode: number;
  code?: string;
  isOperational?: boolean;
}

export class ErrorMiddleware {
  static handle(error: any, req: Request, res: Response, next: NextFunction): void {
    console.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString(),
    });

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = ErrorMiddleware.handlePrismaError(error);
      res.status(prismaError.statusCode).json({
        error: prismaError.message,
        code: prismaError.code,
      });
      return;
    }

    // Handle Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      res.status(400).json({
        error: 'Database validation error',
        code: 'DB_VALIDATION_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
      return;
    }

    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        error: 'File too large',
        code: 'FILE_TOO_LARGE',
        details: 'Maximum file size is 100MB',
      });
      return;
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        error: 'Too many files',
        code: 'TOO_MANY_FILES',
      });
      return;
    }

    // Handle custom app errors
    if (error.statusCode && error.isOperational) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code || 'CUSTOM_ERROR',
      });
      return;
    }

    // Handle unexpected errors
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }

  private static handlePrismaError(error: Prisma.PrismaClientKnownRequestError): { statusCode: number; message: string; code: string } {
    switch (error.code) {
      case 'P2002':
        return {
          statusCode: 409,
          message: 'Resource already exists',
          code: 'DUPLICATE_RESOURCE',
        };
      case 'P2025':
        return {
          statusCode: 404,
          message: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND',
        };
      case 'P2003':
        return {
          statusCode: 400,
          message: 'Invalid foreign key reference',
          code: 'INVALID_FOREIGN_KEY',
        };
      case 'P2011':
        return {
          statusCode: 400,
          message: 'Required field is missing',
          code: 'REQUIRED_FIELD_MISSING',
        };
      default:
        return {
          statusCode: 500,
          message: 'Database error',
          code: 'DATABASE_ERROR',
        };
    }
  }

  static notFound(req: Request, res: Response): void {
    res.status(404).json({
      error: 'Endpoint not found',
      code: 'ENDPOINT_NOT_FOUND',
      available_endpoints: '/api',
    });
  }

  static createError(message: string, statusCode: number = 500, code?: string): AppError {
    const error = new Error(message) as AppError;
    error.statusCode = statusCode;
    error.code = code;
    error.isOperational = true;
    return error;
  }
}