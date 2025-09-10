'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const [authInfo, setAuthInfo] = useState<any>(null);

  const testGitHubLogin = async () => {
    try {
      console.log('Testing GitHub login...');
      const result = await signIn('github', { 
        redirect: false,
        callbackUrl: '/test-auth'
      });
      console.log('GitHub login result:', result);
      setAuthInfo(result);
    } catch (error) {
      console.error('GitHub login error:', error);
      setAuthInfo({ error: error });
    }
  };

  const testCredentialsLogin = async () => {
    try {
      console.log('Testing credentials login...');
      const result = await signIn('credentials', {
        username: 'admin',
        password: 'admin',
        redirect: false,
        callbackUrl: '/test-auth'
      });
      console.log('Credentials login result:', result);
      setAuthInfo(result);
    } catch (error) {
      console.error('Credentials login error:', error);
      setAuthInfo({ error: error });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">NextAuth 测试页面</h1>
        
        {/* 会话状态 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">会话状态</h2>
          <p><strong>状态:</strong> {status}</p>
          {session ? (
            <div className="mt-4 space-y-2">
              <p><strong>用户ID:</strong> {session.user?.id}</p>
              <p><strong>姓名:</strong> {session.user?.name}</p>
              <p><strong>邮箱:</strong> {session.user?.email}</p>
              <p><strong>头像:</strong> {session.user?.image}</p>
              <p><strong>GitHub ID:</strong> {(session.user as any)?.githubId}</p>
              <p><strong>提供者:</strong> {(session.user as any)?.provider}</p>
              <p><strong>测试Token:</strong> {(session as any)?.testToken ? '已生成' : '未生成'}</p>
              <button
                onClick={() => signOut()}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                退出登录
              </button>
            </div>
          ) : (
            <p className="mt-4 text-gray-600">未登录</p>
          )}
        </div>

        {/* 测试按钮 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">登录测试</h2>
          <div className="space-x-4">
            <button
              onClick={testGitHubLogin}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
            >
              测试 GitHub 登录
            </button>
            <button
              onClick={testCredentialsLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              测试凭证登录
            </button>
          </div>
        </div>

        {/* 认证信息 */}
        {authInfo && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">认证结果</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(authInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* 环境变量检查 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">环境变量检查</h2>
          <div className="space-y-2 text-sm">
            <p><strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL || '未设置'}</p>
            <p><strong>GITHUB_CLIENT_ID:</strong> {process.env.GITHUB_CLIENT_ID ? '已设置' : '未设置'}</p>
            <p><strong>GITHUB_CLIENT_SECRET:</strong> {process.env.GITHUB_CLIENT_SECRET ? '已设置' : '未设置'}</p>
            <p><strong>NEXTAUTH_SECRET:</strong> {process.env.NEXTAUTH_SECRET ? '已设置' : '未设置'}</p>
          </div>
        </div>

        {/* API 测试 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">API 端点测试</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Providers:</strong> <a href="/api/auth/providers" target="_blank" className="text-blue-600 hover:underline">/api/auth/providers</a></p>
            <p><strong>Session:</strong> <a href="/api/auth/session" target="_blank" className="text-blue-600 hover:underline">/api/auth/session</a></p>
            <p><strong>CSRF:</strong> <a href="/api/auth/csrf" target="_blank" className="text-blue-600 hover:underline">/api/auth/csrf</a></p>
          </div>
        </div>
      </div>
    </div>
  );
} 