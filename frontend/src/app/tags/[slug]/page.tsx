'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';

interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  websiteCount: number;
}

interface Website {
  id: number;
  title: string;
  slug: string;
  url: string;
  shortDescription: string;
  screenshot?: string;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  author: {
    id: number;
    username: string;
    avatar?: string;
  };
  tags: Tag[];
}

interface PageProps {
  params: {
    slug: string;
  };
}

export default function TagDetailPage({ params }: PageProps) {
  const [tag, setTag] = useState<Tag | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular');

  useEffect(() => {
    // 这里应该从API获取标签和作品数据
    // 暂时使用模拟数据
    setTimeout(() => {
      const mockTag: Tag = {
        id: 1,
        name: 'React',
        slug: 'react',
        description: '使用React构建的现代化Web应用，包括单页应用、多页应用和服务端渲染应用等。',
        color: '#61DAFB',
        websiteCount: 45,
      };

      const mockWebsites: Website[] = [
        {
          id: 1,
          title: '个人作品集网站',
          slug: 'portfolio-website',
          url: 'https://example.com',
          shortDescription: '使用React和TypeScript构建的响应式个人作品集网站',
          screenshot: 'https://via.placeholder.com/400x300',
          likeCount: 24,
          viewCount: 156,
          createdAt: '2024-01-15T10:00:00Z',
          author: {
            id: 1,
            username: 'john_doe',
            avatar: 'https://via.placeholder.com/40x40',
          },
          tags: [mockTag],
        },
        {
          id: 2,
          title: 'React组件库',
          slug: 'react-component-library',
          url: 'https://example2.com',
          shortDescription: '一套完整的React UI组件库，包含常用的界面组件',
          likeCount: 18,
          viewCount: 89,
          createdAt: '2024-01-14T15:30:00Z',
          author: {
            id: 2,
            username: 'jane_smith',
            avatar: 'https://via.placeholder.com/40x40',
          },
          tags: [mockTag],
        },
      ];

      if (params.slug === 'react') {
        setTag(mockTag);
        setWebsites(mockWebsites);
      } else {
        setTag(null);
      }
      
      setLoading(false);
    }, 1000);
  }, [params.slug]);

  const loadMore = () => {
    // 模拟加载更多
    setPage(prev => prev + 1);
    // 这里应该调用API加载更多数据
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tag) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 面包屑导航 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-slate-500 hover:text-slate-700">
                  首页
                </Link>
              </li>
              <li className="flex items-center">
                <svg
                  className="h-5 w-5 text-slate-400 mx-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <Link href="/tags" className="text-slate-500 hover:text-slate-700">
                  标签
                </Link>
              </li>
              <li className="flex items-center">
                <svg
                  className="h-5 w-5 text-slate-400 mx-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-slate-900 font-medium">{tag.name}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标签信息头部 */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                style={{ backgroundColor: tag.color || '#6B7280' }}
              >
                {tag.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {tag.name}
                </h1>
                {tag.description && (
                  <p className="text-slate-600 text-lg">
                    {tag.description}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">
                {tag.websiteCount}
              </div>
              <div className="text-sm text-slate-600">个作品</div>
            </div>
          </div>
        </div>

        {/* 筛选和排序 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <span className="text-slate-700 font-medium">排序方式：</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popular' | 'recent')}
              className="border border-slate-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="popular">热门优先</option>
              <option value="recent">最新优先</option>
            </select>
          </div>
          
          <div className="text-sm text-slate-600">
            共 {websites.length} 个作品
          </div>
        </div>

        {/* 作品网格 */}
        {websites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {websites.map((website) => (
              <div key={website.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* 作品截图 */}
                <div className="aspect-video bg-slate-100">
                  {website.screenshot ? (
                    <img
                      src={website.screenshot}
                      alt={website.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="w-12 h-12 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 作品信息 */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-1">
                    <Link 
                      href={`/sites/${website.slug}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {website.title}
                    </Link>
                  </h3>
                  
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {website.shortDescription}
                  </p>

                  {/* 作者信息 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src={website.author.avatar || '/default-avatar.png'}
                        alt={website.author.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-slate-700">
                        {website.author.username}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {website.likeCount}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {website.viewCount}
                      </span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="mt-4 flex space-x-2">
                    <Link
                      href={`/sites/${website.slug}`}
                      className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      查看详情
                    </Link>
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-slate-100 text-slate-700 text-center py-2 px-4 rounded-md hover:bg-slate-200 transition-colors text-sm font-medium"
                    >
                      访问网站
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
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
              暂无作品
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              这个标签下还没有作品，快来提交第一个吧！
            </p>
            <div className="mt-6">
              <Link
                href="/submit"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                提交作品
              </Link>
            </div>
          </div>
        )}

        {/* 加载更多按钮 */}
        {hasMore && websites.length > 0 && (
          <div className="text-center">
            <button
              onClick={loadMore}
              className="inline-flex items-center px-6 py-3 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors font-medium"
            >
              加载更多作品
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 