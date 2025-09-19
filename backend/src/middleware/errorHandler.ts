import { Request, Response, NextFunction } from 'express';
import { SecurityAuditLogger } from '../utils/securityAudit';

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Prisma错误处理
  if (err.code === 'P2002') {
    error.message = 'Duplicate field value entered';
    error.statusCode = 400;
  }

  if (err.code === 'P2025') {
    error.message = 'Record not found';
    error.statusCode = 404;
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // 记录安全相关错误
  if (statusCode === 401 || statusCode === 403 || statusCode >= 500) {
    SecurityAuditLogger.logFromRequest(
      req,
      statusCode === 401 ? 'AUTH_FAILURE' : statusCode === 403 ? 'SUSPICIOUS_ACTIVITY' : 'SUSPICIOUS_ACTIVITY',
      statusCode >= 500 ? 'HIGH' : 'MEDIUM',
      {
        error: message,
        statusCode,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    ).catch(logError => {
      console.error('Failed to log security event:', logError);
    });
  }

  // 开发环境下输出详细错误
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    code: error.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}; 