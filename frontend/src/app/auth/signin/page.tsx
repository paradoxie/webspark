'use client';

import { signIn, getSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  useEffect(() => {
    // 检查用户是否已经登录
    getSession().then((session) => {
      if (session) {
        router.push(callbackUrl);
      }
    });

    // 检查是否有错误参数
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'OAuthSignin':
          setError('OAuth登录过程中出现错误，请重试');
          break;
        case 'OAuthCallback':
          setError('OAuth回调失败，请重试');
          break;
        case 'OAuthCreateAccount':
          setError('创建账户失败，请重试');
          break;
        case 'EmailCreateAccount':
          setError('邮箱账户创建失败，请重试');
          break;
        case 'Callback':
          setError('回调过程中出现错误，请重试');
          break;
        case 'OAuthAccountNotLinked':
          setError('该邮箱已被其他登录方式使用，请尝试其他方式登录');
          break;
        case 'EmailSignin':
          setError('邮箱登录失败，请检查邮箱地址');
          break;
        case 'CredentialsSignin':
          setError('登录凭证无效，请重试');
          break;
        case 'SessionRequired':
          setError('需要登录才能访问此页面');
          break;
        default:
          setError('登录过程中出现未知错误，请重试');
      }
    }
  }, [searchParams, router, callbackUrl]);

  const handleGitHubSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 直接重定向，不使用redirect: false
      await signIn('github', {
        callbackUrl,
      });
      
      // 注意：由于使用了直接重定向，下面的代码不会执行
      // 这里保留是为了处理可能的错误情况
    } catch (err) {
      setError('登录过程中出现错误，请重试');
      console.error('Sign in error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-pink-400 to-red-500 rounded-full opacity-5 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* 主卡片 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-fade-in-up">
          {/* 顶部装饰 */}
          <div className="h-2 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800"></div>
          
          <div className="p-8 space-y-8">
            {/* Logo 和标题 */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <span className="text-white font-bold text-2xl">W</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl opacity-20 animate-pulse"></div>
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  欢迎回来
                </h1>
                <p className="text-slate-600 mt-2">
                  登录 WebSpark.club 开发者社区
                </p>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-shake">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 登录按钮 */}
            <div className="space-y-4">
              <button
                onClick={handleGitHubSignIn}
                disabled={isLoading}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative flex items-center justify-center space-x-3">
                  {isLoading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>登录中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.024-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                      </svg>
                      <span>使用 GitHub 账户登录</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </div>
              </button>

              {/* 分割线 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500 font-medium">或者</span>
                </div>
              </div>

              {/* 其他登录方式（预留） */}
              <div className="text-center">
                <p className="text-sm text-slate-500">
                  更多登录方式即将推出
                </p>
              </div>
            </div>

            {/* 功能说明 */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
                <span>✨</span>
                <span>加入我们你可以</span>
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>提交和展示你的Web作品</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>收藏喜欢的项目和灵感</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>与其他开发者交流互动</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>获得社区反馈和建议</span>
                </li>
              </ul>
            </div>

            {/* 底部链接 */}
            <div className="text-center space-y-4">
              <div className="flex justify-center space-x-6 text-sm">
                <Link 
                  href="/terms" 
                  className="text-slate-500 hover:text-blue-600 transition-colors duration-200"
                >
                  服务条款
                </Link>
                <Link 
                  href="/privacy" 
                  className="text-slate-500 hover:text-blue-600 transition-colors duration-200"
                >
                  隐私政策
                </Link>
              </div>
              
              <div className="text-xs text-slate-400">
                <p>使用 GitHub 登录即表示你同意我们的服务条款和隐私政策</p>
              </div>
            </div>
          </div>
        </div>

        {/* 返回首页 */}
        <div className="text-center mt-8">
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>返回首页</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

 