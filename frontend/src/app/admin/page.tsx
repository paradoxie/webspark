'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Website {
  id: number;
  title: string;
  url: string;
  shortDescription: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  featured: boolean;
  author: {
    id: number;
    username: string;
    email: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    websites: number;
  };
}

interface Report {
  id: number;
  reason: string;
  details: string | null;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  website: {
    id: number;
    title: string;
    url: string;
  };
  reporter: {
    id: number;
    username: string;
    email: string;
  } | null;
}

interface Stats {
  users: { total: number };
  websites: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  reports: {
    total: number;
    open: number;
  };
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'websites' | 'users' | 'reports'>('dashboard');
  const [websites, setWebsites] = useState<Website[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 批量操作相关状态
  const [selectedWebsites, setSelectedWebsites] = useState<Set<number>>(new Set());
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // 检查用户是否为管理员
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // 这里应该检查用户是否有管理员权限
    // 暂时假设第一个用户为管理员
    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 暂时使用测试token进行管理员认证
      const headers = {
        'Authorization': `Bearer test-admin-token`,
        'Content-Type': 'application/json',
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const [statsRes, websitesRes, usersRes, reportsRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/stats`, { headers }),
        fetch(`${apiUrl}/api/admin/websites?status=PENDING`, { headers }),
        fetch(`${apiUrl}/api/admin/users`, { headers }),
        fetch(`${apiUrl}/api/admin/reports?status=OPEN`, { headers }),
      ]);

      if (!statsRes.ok || !websitesRes.ok || !usersRes.ok || !reportsRes.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const [statsData, websitesData, usersData, reportsData] = await Promise.all([
        statsRes.json(),
        websitesRes.json(),
        usersRes.json(),
        reportsRes.json(),
      ]);

      setStats(statsData.data);
      setWebsites(websitesData.data);
      setUsers(usersData.data);
      setReports(reportsData.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      setError('获取数据失败，请检查您的管理员权限');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (websiteId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/websites/${websiteId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer test-admin-token`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve website');
      }

      // 刷新数据
      fetchData();
      alert('作品已通过审核');
    } catch (error) {
      console.error('Failed to approve website:', error);
      alert('操作失败，请重试');
    }
  };

  const handleReject = async (websiteId: number) => {
    const reason = prompt('请输入拒绝理由（可选）:');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/websites/${websiteId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer test-admin-token`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject website');
      }

      // 刷新数据
      fetchData();
      alert('作品已拒绝');
    } catch (error) {
      console.error('Failed to reject website:', error);
      alert('操作失败，请重试');
    }
  };

  const handleToggleFeatured = async (websiteId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/websites/${websiteId}/toggle-featured`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer test-admin-token`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle featured');
      }

      // 刷新数据
      fetchData();
      alert('精选状态已更新');
    } catch (error) {
      console.error('Failed to toggle featured:', error);
      alert('操作失败，请重试');
    }
  };

  const handleToggleUser = async (userId: number, currentActive: boolean) => {
    if (!confirm(`确定要${currentActive ? '禁用' : '启用'}此用户吗？`)) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer test-admin-token`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle user');
      }

      // 刷新数据
      fetchData();
      alert(`用户已${currentActive ? '禁用' : '启用'}`);
    } catch (error) {
      console.error('Failed to toggle user:', error);
      alert('操作失败，请重试');
    }
  };

  const handleCloseReport = async (reportId: number) => {
    if (!confirm('确定要关闭此举报吗？')) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/reports/${reportId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer test-admin-token`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to close report');
      }

      // 刷新数据
      fetchData();
      alert('举报已关闭');
    } catch (error) {
      console.error('Failed to close report:', error);
      alert('操作失败，请重试');
    }
  };

  // 批量操作函数
  const handleSelectWebsite = (websiteId: number, checked: boolean) => {
    const newSelected = new Set(selectedWebsites);
    if (checked) {
      newSelected.add(websiteId);
    } else {
      newSelected.delete(websiteId);
    }
    setSelectedWebsites(newSelected);
    setSelectAll(newSelected.size === websites.length);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(websites.map(w => w.id));
      setSelectedWebsites(allIds);
    } else {
      setSelectedWebsites(new Set());
    }
    setSelectAll(checked);
  };

  const handleBatchAction = async (action: string, reason?: string) => {
    if (selectedWebsites.size === 0) {
      alert('请先选择要操作的作品');
      return;
    }

    const confirmMessage = {
      approve: '批量通过',
      reject: '批量拒绝',
      feature: '批量设为精选',
      unfeature: '批量取消精选',
      delete: '批量删除'
    }[action] || action;

    if (!confirm(`确定要${confirmMessage}选中的 ${selectedWebsites.size} 个作品吗？`)) {
      return;
    }

    setBatchActionLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/websites/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer test-admin-token`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          websiteIds: Array.from(selectedWebsites),
          reason
        }),
      });

      if (!response.ok) {
        throw new Error('批量操作失败');
      }

      const result = await response.json();
      
      alert(`批量操作完成！成功：${result.summary.successful}，失败：${result.summary.failed}`);
      
      // 清空选择
      setSelectedWebsites(new Set());
      setSelectAll(false);
      
      // 刷新数据
      fetchData();
    } catch (error) {
      console.error('批量操作失败:', error);
      alert('批量操作失败，请重试');
    } finally {
      setBatchActionLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              WebSpark 管理后台
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                欢迎，{session?.user?.name || session?.user?.email}
              </span>
              <button 
                onClick={() => router.push('/')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                返回网站
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 导航标签 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'dashboard', label: '仪表板' },
              { key: 'websites', label: '作品审核' },
              { key: 'users', label: '用户管理' },
              { key: 'reports', label: '举报管理' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === 'dashboard' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl">👥</div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">用户总数</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.users.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl">🌐</div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">作品总数</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.websites.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl">⏳</div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">待审核</h3>
                  <p className="text-3xl font-bold text-yellow-600">{stats.websites.pending}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl">🚨</div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">待处理举报</h3>
                  <p className="text-3xl font-bold text-red-600">{stats.reports.open}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'websites' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                作品管理 ({websites.length})
              </h2>
              
              {/* 批量操作按钮 */}
              {selectedWebsites.size > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBatchAction('approve')}
                    disabled={batchActionLoading}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    批量通过 ({selectedWebsites.size})
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('请输入拒绝理由（可选）:');
                      handleBatchAction('reject', reason || undefined);
                    }}
                    disabled={batchActionLoading}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    批量拒绝 ({selectedWebsites.size})
                  </button>
                  <button
                    onClick={() => handleBatchAction('feature')}
                    disabled={batchActionLoading}
                    className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                  >
                    设为精选 ({selectedWebsites.size})
                  </button>
                </div>
              )}
            </div>
            <div className="p-6">
              {websites.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    暂无作品
                  </h3>
                  <p className="text-gray-500">
                    还没有提交的作品
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          作品信息
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          作者
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          标签
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          提交时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {websites.map((website) => (
                        <tr key={website.id} className={selectedWebsites.has(website.id) ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedWebsites.has(website.id)}
                              onChange={(e) => handleSelectWebsite(website.id, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {website.title}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {website.shortDescription}
                              </div>
                              <div className="text-xs text-blue-600">
                                <a href={website.url} target="_blank" rel="noopener noreferrer">
                                  {website.url}
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {website.author.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {website.author.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {website.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(website.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApprove(website.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                通过
                              </button>
                              <button
                                onClick={() => handleReject(website.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                拒绝
                              </button>
                              <button
                                onClick={() => handleToggleFeatured(website.id)}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                {website.featured ? '取消精选' : '设为精选'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">用户管理</h2>
            </div>
            <div className="p-6">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    暂无用户数据
                  </h3>
                  <p className="text-gray-500">
                    还没有用户注册
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          用户信息
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          作品数量
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          注册时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || user.username}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{user.username}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user._count.websites}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.isActive ? '活跃' : '禁用'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleToggleUser(user.id, user.isActive)}
                              className={`${
                                user.isActive
                                  ? 'text-red-600 hover:text-red-900'
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {user.isActive ? '禁用' : '启用'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">举报管理</h2>
            </div>
            <div className="p-6">
              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🚨</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    暂无待处理举报
                  </h3>
                  <p className="text-gray-500">
                    所有举报都已处理完成
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          被举报作品
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          举报理由
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          举报人
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          举报时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reports.map((report) => (
                        <tr key={report.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {report.website.title}
                              </div>
                              <div className="text-sm text-blue-600">
                                <a href={report.website.url} target="_blank" rel="noopener noreferrer">
                                  {report.website.url}
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {report.reason}
                            </div>
                            {report.details && (
                              <div className="text-sm text-gray-500">
                                {report.details}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {report.reporter ? (
                              <div>
                                <div className="text-sm text-gray-900">
                                  {report.reporter.username}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {report.reporter.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">匿名举报</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleCloseReport(report.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              关闭举报
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 