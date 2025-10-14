import { AlertTriangle, Info, XCircle, AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  type?: 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  details?: string;
  className?: string;
  onClose?: () => void;
}

const typeStyles = {
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-400',
    title: 'text-red-800',
    message: 'text-red-700',
    details: 'text-red-600',
    IconComponent: XCircle
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-400',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
    details: 'text-yellow-600',
    IconComponent: AlertTriangle
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-400',
    title: 'text-blue-800',
    message: 'text-blue-700',
    details: 'text-blue-600',
    IconComponent: Info
  }
};

// 错误代码映射到友好消息
const errorCodeMessages: Record<string, { title: string; message: string }> = {
  'NETWORK_ERROR': {
    title: '网络连接错误',
    message: '无法连接到服务器，请检查您的网络连接后重试。'
  },
  'AUTH_REQUIRED': {
    title: '需要登录',
    message: '请先登录后再进行此操作。'
  },
  'PERMISSION_DENIED': {
    title: '权限不足',
    message: '您没有权限执行此操作。'
  },
  'VALIDATION_ERROR': {
    title: '输入错误',
    message: '请检查您的输入是否正确。'
  },
  'NOT_FOUND': {
    title: '未找到',
    message: '抱歉，我们找不到您请求的内容。'
  },
  'SERVER_ERROR': {
    title: '服务器错误',
    message: '服务器遇到了问题，请稍后再试。'
  },
  'RATE_LIMIT': {
    title: '请求过于频繁',
    message: '您的请求过于频繁，请稍后再试。'
  },
  'FILE_TOO_LARGE': {
    title: '文件过大',
    message: '上传的文件超过了大小限制。'
  },
  'INVALID_FILE_TYPE': {
    title: '文件类型错误',
    message: '不支持的文件类型，请选择其他文件。'
  },
  'SESSION_EXPIRED': {
    title: '会话已过期',
    message: '您的登录会话已过期，请重新登录。'
  }
};

export default function ErrorMessage({
  type = 'error',
  title,
  message,
  details,
  className = '',
  onClose
}: ErrorMessageProps) {
  const style = typeStyles[type];
  const IconComponent = style.IconComponent;

  // 尝试从错误代码获取友好消息
  const friendlyError = errorCodeMessages[message] || errorCodeMessages[details || ''];
  const displayTitle = title || friendlyError?.title || (type === 'error' ? '出错了' : type === 'warning' ? '警告' : '提示');
  const displayMessage = friendlyError?.message || message;

  return (
    <div className={`rounded-lg border p-4 ${style.container} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${style.icon}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${style.title}`}>
            {displayTitle}
          </h3>
          <div className={`mt-2 text-sm ${style.message}`}>
            <p>{displayMessage}</p>
          </div>
          {details && !friendlyError && (
            <div className={`mt-2 text-xs ${style.details}`}>
              <details>
                <summary className="cursor-pointer hover:underline">
                  查看详情
                </summary>
                <p className="mt-1 pl-2 border-l-2 border-current/20">
                  {details}
                </p>
              </details>
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 ${style.title} hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current`}
              >
                <span className="sr-only">关闭</span>
                <XCircle className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 导出错误代码常量，方便其他地方使用
export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  SESSION_EXPIRED: 'SESSION_EXPIRED'
} as const;
