'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误到错误报告服务
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 在生产环境中，这里可以发送错误到Sentry等服务
    if (process.env.NODE_ENV === 'production') {
      // 发送错误报告
      this.reportError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo
    });
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // 这里可以集成Sentry或其他错误追踪服务
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      };

      // 发送到错误收集端点
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      }).catch(err => {
        console.error('Failed to report error:', err);
      });
    } catch (err) {
      console.error('Error in error reporting:', err);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义的fallback，使用它
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // 默认错误UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                哎呀，出错了！
              </h1>
              
              <p className="text-slate-600 mb-8">
                页面遇到了一些问题，我们正在努力修复。请稍后再试或返回首页。
              </p>

              {/* 开发环境显示错误详情 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700">
                    查看错误详情
                  </summary>
                  <div className="mt-2 p-4 bg-slate-100 rounded-md overflow-auto">
                    <p className="text-xs font-mono text-red-600 mb-2">
                      {this.state.error.message}
                    </p>
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </button>
                
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Home className="h-4 w-4 mr-2" />
                  返回首页
                </Link>
              </div>
            </div>

            <p className="mt-6 text-xs text-slate-500">
              错误代码：{Date.now()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
