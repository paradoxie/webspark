'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const errorMessages: { [key: string]: string } = {
  Configuration: '服务器配置错误',
  AccessDenied: '访问被拒绝',
  Verification: '验证失败',
  Default: '发生了未知错误',
  OAuthSignin: 'OAuth登录过程中出现错误',
  OAuthCallback: 'OAuth回调失败',
  OAuthCreateAccount: '创建OAuth账户失败',
  EmailCreateAccount: '创建邮箱账户失败',
  Callback: '回调过程中出现错误',
  OAuthAccountNotLinked: '该邮箱已被其他登录方式使用',
  EmailSignin: '邮箱登录失败',
  CredentialsSignin: '登录凭证无效',
  SessionRequired: '需要登录才能访问此页面',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string>('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setErrorCode(errorParam);
      setError(errorMessages[errorParam] || errorMessages.Default);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400 to-pink-600 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-orange-400 to-red-500 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* 主卡片 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-fade-in-up">
          {/* 顶部装饰 - 错误色调 */}
          <div className="h-2 bg-gradient-to-r from-red-600 via-pink-600 to-red-800"></div>
          
          <div className="p-8 space-y-8">
            {/* 错误图标和标题 */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-red-600 to-pink-600 rounded-2xl opacity-20 animate-pulse"></div>
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  登录失败
                </h1>
                <p className="text-slate-600 mt-2">
                  很抱歉，登录过程中出现了问题
                </p>
              </div>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-800 text-sm font-medium">错误详情</h3>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                    {errorCode && (
                      <p className="text-red-600 text-xs mt-2">错误代码: {errorCode}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="space-y-4">
              <Link
                href="/auth/signin"
                className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-3"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>重新尝试登录</span>
                </div>
              </Link>

              <Link
                href="/"
                className="w-full glass-card text-slate-700 font-semibold py-4 px-6 rounded-2xl hover:bg-white/60 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m0 0h3m0 0h3m0 0a1 1 0 001-1V10M9 21h6" />
                </svg>
                <span>返回首页</span>
              </Link>
            </div>

            {/* 帮助信息 */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
                <span>💡</span>
                <span>可能的解决方案</span>
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>检查网络连接是否正常</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>确保允许第三方登录</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>清除浏览器缓存后重试</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>如果问题持续，请联系技术支持</span>
                </li>
              </ul>
            </div>

            {/* 联系方式 */}
            <div className="text-center space-y-2">
              <p className="text-sm text-slate-500">
                需要帮助？
              </p>
              <Link 
                href="/contact" 
                className="text-blue-600 hover:text-blue-700 underline underline-offset-2 text-sm font-medium"
              >
                联系技术支持
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 