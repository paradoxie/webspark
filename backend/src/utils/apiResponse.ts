/**
 * 统一的API响应格式工具
 * 确保所有API返回一致的数据结构
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
    timestamp?: string;
    version?: string;
  };
}

export class ApiResponseBuilder {
  /**
   * 成功响应
   */
  static success<T>(data: T, message?: string, meta?: any): ApiResponse<T> {
    return {
      success: true,
      data,
      message: message || 'Success',
      meta: {
        ...meta,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 错误响应
   */
  static error(error: string, code?: string): ApiResponse {
    return {
      success: false,
      error,
      code: code || 'ERROR',
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 分页响应
   */
  static paginated<T>(
    data: T[],
    page: number,
    pageSize: number,
    total: number,
    message?: string
  ): ApiResponse<T[]> {
    const pageCount = Math.ceil(total / pageSize);
    
    return {
      success: true,
      data,
      message: message || 'Success',
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount,
          total
        },
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 创建响应
   */
  static created<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message: message || 'Resource created successfully',
      code: 'CREATED',
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 更新响应
   */
  static updated<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message: message || 'Resource updated successfully',
      code: 'UPDATED',
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 删除响应
   */
  static deleted(message?: string): ApiResponse {
    return {
      success: true,
      message: message || 'Resource deleted successfully',
      code: 'DELETED',
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 无内容响应
   */
  static noContent(): ApiResponse {
    return {
      success: true,
      code: 'NO_CONTENT',
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 验证错误响应
   */
  static validationError(errors: any): ApiResponse {
    return {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      data: errors,
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 未授权响应
   */
  static unauthorized(message?: string): ApiResponse {
    return {
      success: false,
      error: message || 'Unauthorized access',
      code: 'UNAUTHORIZED',
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 禁止访问响应
   */
  static forbidden(message?: string): ApiResponse {
    return {
      success: false,
      error: message || 'Forbidden access',
      code: 'FORBIDDEN',
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 未找到响应
   */
  static notFound(resource?: string): ApiResponse {
    return {
      success: false,
      error: `${resource || 'Resource'} not found`,
      code: 'NOT_FOUND',
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 冲突响应
   */
  static conflict(message?: string): ApiResponse {
    return {
      success: false,
      error: message || 'Resource conflict',
      code: 'CONFLICT',
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 服务器错误响应
   */
  static serverError(message?: string, error?: any): ApiResponse {
    return {
      success: false,
      error: message || 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && error && {
        data: {
          stack: error.stack,
          details: error
        }
      }),
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Express中间件：自动格式化响应
 */
export function formatResponse(req: any, res: any, next: any) {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // 如果已经是标准格式，直接返回
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson.call(this, data);
    }
    
    // 否则包装成标准格式
    const response = ApiResponseBuilder.success(data);
    return originalJson.call(this, response);
  };
  
  next();
}

/**
 * 错误码定义
 */
export const ErrorCodes = {
  // 认证相关
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  
  // 验证相关
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED: 'MISSING_REQUIRED',
  
  // 资源相关
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // 权限相关
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSION: 'INSUFFICIENT_PERMISSION',
  
  // 服务器相关
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // 业务相关
  INVALID_OPERATION: 'INVALID_OPERATION',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED'
};
