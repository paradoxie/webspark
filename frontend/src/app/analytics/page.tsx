'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import UserAnalytics from '@/components/analytics/UserAnalytics';

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  // 检查用户是否为管理员 - 从用户角色属性判断而非硬编码ID
  const isAdmin = (session.user as any)?.role === 'ADMIN' || (session.user as any)?.role === 'MODERATOR';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAdmin ? (
          <AnalyticsDashboard />
        ) : (
          <UserAnalytics />
        )}
      </div>
    </div>
  );
}