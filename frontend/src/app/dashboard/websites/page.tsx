'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Website {
  id: number;
  title: string;
  slug: string;
  url: string;
  shortDescription: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  featured: boolean;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

export default function MyWebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent');

  useEffect(() => {
    // 这里应该从API获取用户的作品数据
    // 暂时使用模拟数据
    setTimeout(() => {
      const mockWebsites: Website[] = [
        {
          id: 1,
          title: '个人作品集网站',
          slug: 'portfolio-website',
          url: 'https://example.com',
          shortDescription: '使用React和TypeScript构建的响应式个人作品集网站，展示我的项目和技能。',
          status: 'APPROVED',
          featured: true,
          likeCount: 24,
          viewCount: 156,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          tags: [
            { id: 1, name: 'React', slug: 'react' },
            { id: 2, name: 'TypeScript', slug: 'typescript' },
          ],
        },
        {
          id: 2,
          title: 'React组件库',
          slug: 'react-component-library',
          url: 'https://example2.com',
          shortDescription: '一套完整的React UI组件库，包含常用的界面组件。',
          status: 'PENDING',
          featured: false,
          likeCount: 8,
          viewCount: 45,
          createdAt: '2024-01-14T15:30:00Z',
          updatedAt: '2024-01-14T15:30:00Z',
          tags: [
            { id: 1, name: 'React', slug: 'react' },
            { id: 3, name: 'UI库', slug: 'ui-library' },
          ],
        },
        {
          id: 3,
          title: '数据可视化仪表板',
          slug: 'data-dashboard',
          url: 'https://example3.com',
          shortDescription: '使用D3.js创建的交互式数据可视化仪表板。',
          status: 'REJECTED',
          featured: false,
          likeCount: 2,
          viewCount: 23,
          createdAt: '2024-01-13T09:15:00Z',
          updatedAt: '2024-01-13T09:15:00Z',
          tags: [
            { id: 4, name: 'D3.js', slug: 'd3js' },
            { id: 5, name: '数据可视化', slug: 'data-visualization' },
          ],
        },
      ];
      
      setWebsites(mockWebsites);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredWebsites = websites.filter(website => 
    filter === 'all' || website.status === filter
  );

  const sortedWebsites = [...filteredWebsites].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'popular':
        return b.likeCount - a.likeCount;
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '已通过';
      case 'PENDING':
        return '待审核';
      case 'REJECTED':
        return '已拒绝';
      default:
        return '未知';
    }
  };

  const handleDelete = (websiteId: number) => {
    if (confirm('确定要删除这个作品吗？此操作不可撤销。')) {
      // 这里应该调用API删除作品
      setWebsites(prev => prev.filter(w => w.id !== websiteId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">我的作品</h1>
            <p className="mt-2 text-slate-600">
              管理您提交的所有作品
            </p>
          </div>
          <Link
            href="/submit"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            提交新作品
          </Link>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-900">{websites.length}</p>
                <p className="text-sm text-slate-600">总作品数</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-900">
                  {websites.filter(w => w.status === 'APPROVED').length}
                </p>
                <p className="text-sm text-slate-600">已通过</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-900">
                  {websites.filter(w => w.status === 'PENDING').length}
                </p>
                <p className="text-sm text-slate-600">待审核</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-900">
                  {websites.reduce((sum, w) => sum + w.likeCount, 0)}
                </p>
                <p className="text-sm text-slate-600">总点赞数</p>
              </div>
            </div>
          </div>
        </div>

        {/* 筛选和排序控件 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-700">筛选：</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-slate-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="all">全部状态</option>
                <option value="APPROVED">已通过</option>
                <option value="PENDING">待审核</option>
                <option value="REJECTED">已拒绝</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-700">排序：</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-slate-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="recent">最新优先</option>
                <option value="popular">热门优先</option>
                <option value="alphabetical">按标题排序</option>
              </select>
            </div>
          </div>
        </div>

        {/* 作品列表 */}
        {sortedWebsites.length > 0 ? (
          <div className="space-y-6">
            {sortedWebsites.map((website) => (
              <div key={website.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        <Link 
                          href={`/sites/${website.slug}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {website.title}
                        </Link>
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(website.status)}`}
                      >
                        {getStatusText(website.status)}
                      </span>
                      {website.featured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          精选
                        </span>
                      )}
                    </div>
                    
                    <p className="text-slate-600 mb-4 line-clamp-2">
                      {website.shortDescription}
                    </p>

                    <div className="flex items-center space-x-6 text-sm text-slate-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {website.likeCount} 点赞
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {website.viewCount} 浏览
                      </span>
                      <span>
                        创建于 {new Date(website.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* 标签 */}
                    {website.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {website.tags.map((tag) => (
                          <Link
                            key={tag.id}
                            href={`/tags/${tag.slug}`}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                          >
                            {tag.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2 ml-6">
                    <Link
                      href={`/sites/${website.slug}`}
                      className="inline-flex items-center px-3 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors text-sm"
                      title="查看详情"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    
                    <Link
                      href={`/dashboard/websites/${website.id}/edit`}
                      className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                      title="编辑"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Link>

                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                      title="访问网站"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>

                    <button
                      onClick={() => handleDelete(website.id)}
                      className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                      title="删除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">
              没有找到作品
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {filter === 'all' ? '您还没有提交任何作品' : '当前筛选条件下没有作品'}
            </p>
            <div className="mt-6">
              <Link
                href="/submit"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                提交第一个作品
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 