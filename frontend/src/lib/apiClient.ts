import { toast } from 'react-hot-toast';

// API错误类
export class ApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, code: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// 错误消息映射
const errorMessages: Record<string, string> = {
  'NETWORK_ERROR': '网络连接失败，请检查您的网络',
  'AUTH_REQUIRED': '请先登录',
  'PERMISSION_DENIED': '您没有权限执行此操作',
  'VALIDATION_ERROR': '输入信息有误，请检查后重试',
  'NOT_FOUND': '找不到请求的内容',
  'SERVER_ERROR': '服务器出错了，请稍后再试',
  'RATE_LIMIT': '操作过于频繁，请稍后再试',
  'SESSION_EXPIRED': '登录已过期，请重新登录',
  'WEBSITE_NOT_FOUND': '作品不存在或已被删除',
  'USER_NOT_FOUND': '用户不存在',
  'ALREADY_EXISTS': '已存在相同的内容',
  'INVALID_CREDENTIALS': '用户名或密码错误',
  'ACCOUNT_DEACTIVATED': '账号已被停用',
  'INSUFFICIENT_PRIVILEGES': '权限不足',
  'INVALID_TOKEN': '登录信息无效，请重新登录'
};

// API响应类型
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// API客户端配置
interface ApiClientConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  showErrorToast?: boolean;
}

// 默认配置
const defaultConfig: ApiClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  showErrorToast: true
};

// 创建API客户端
export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // 获取友好的错误消息
  private getFriendlyErrorMessage(code?: string, message?: string): string {
    if (code && errorMessages[code]) {
      return errorMessages[code];
    }
    return message || '操作失败，请重试';
  }

  // 处理响应
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let data: any;
    try {
      data = isJson ? await response.json() : await response.text();
    } catch (error) {
      throw new ApiError(
        '响应解析失败',
        'PARSE_ERROR',
        response.status
      );
    }

    if (!response.ok) {
      const errorCode = data?.code || this.getErrorCodeFromStatus(response.status);
      const errorMessage = this.getFriendlyErrorMessage(errorCode, data?.error || data?.message);
      
      if (this.config.showErrorToast) {
        toast.error(errorMessage);
      }

      throw new ApiError(
        errorMessage,
        errorCode,
        response.status,
        data
      );
    }

    return data;
  }

  // 根据HTTP状态码获取错误代码
  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case 401:
        return 'AUTH_REQUIRED';
      case 403:
        return 'PERMISSION_DENIED';
      case 404:
        return 'NOT_FOUND';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'RATE_LIMIT';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'SERVER_ERROR';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  // 构建请求选项
  private buildRequestOptions(options: RequestInit = {}): RequestInit {
    const headers = new Headers(options.headers);
    
    // 添加默认headers
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    // 合并配置中的headers
    if (this.config.headers) {
      Object.entries(this.config.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    return {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout!)
    };
  }

  // GET请求
  async get<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const url = `${this.config.baseURL}${endpoint}`;
      const response = await fetch(url, this.buildRequestOptions({
        ...options,
        method: 'GET'
      }));
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      const networkError = new ApiError(
        '网络连接失败，请检查您的网络',
        'NETWORK_ERROR',
        0
      );
      
      if (this.config.showErrorToast) {
        toast.error(networkError.message);
      }
      
      throw networkError;
    }
  }

  // POST请求
  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const url = `${this.config.baseURL}${endpoint}`;
      const body = data instanceof FormData ? data : JSON.stringify(data);
      
      const response = await fetch(url, this.buildRequestOptions({
        ...options,
        method: 'POST',
        body
      }));
      
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      const networkError = new ApiError(
        '网络连接失败，请检查您的网络',
        'NETWORK_ERROR',
        0
      );
      
      if (this.config.showErrorToast) {
        toast.error(networkError.message);
      }
      
      throw networkError;
    }
  }

  // PUT请求
  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const url = `${this.config.baseURL}${endpoint}`;
      const body = data instanceof FormData ? data : JSON.stringify(data);
      
      const response = await fetch(url, this.buildRequestOptions({
        ...options,
        method: 'PUT',
        body
      }));
      
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      const networkError = new ApiError(
        '网络连接失败，请检查您的网络',
        'NETWORK_ERROR',
        0
      );
      
      if (this.config.showErrorToast) {
        toast.error(networkError.message);
      }
      
      throw networkError;
    }
  }

  // DELETE请求
  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const url = `${this.config.baseURL}${endpoint}`;
      const response = await fetch(url, this.buildRequestOptions({
        ...options,
        method: 'DELETE'
      }));
      
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      const networkError = new ApiError(
        '网络连接失败，请检查您的网络',
        'NETWORK_ERROR',
        0
      );
      
      if (this.config.showErrorToast) {
        toast.error(networkError.message);
      }
      
      throw networkError;
    }
  }

  // 设置认证token
  setAuthToken(token: string | null) {
    if (token) {
      this.config.headers = {
        ...this.config.headers,
        'Authorization': `Bearer ${token}`
      };
    } else {
      delete this.config.headers?.['Authorization'];
    }
  }
}

// 创建默认实例
const apiClient = new ApiClient();

// 导出便捷方法
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  setAuthToken: apiClient.setAuthToken.bind(apiClient)
};

// 创建认证的API客户端
export function createAuthenticatedClient(token: string): ApiClient {
  return new ApiClient({
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}
