'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

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
  bookmarkedAt: string;
  author: {
    id: number;
    username: string;
    avatar?: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
    color?: string;
  }>;
}

export default function BookmarksPage() {
  const [bookmarkedWebsites, setBookmarkedWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent');

  useEffect(() => {
    // 这里应该从API获取用户收藏的作品数据
    // 暂时使用模拟数据
    setTimeout(() => {
      const mockBookmarks: Website[] = [
        {
          id: 1,
          title: '精美的个人作品集',
          slug: 'beautiful-portfolio',
          url: 'https://example.com',
          shortDescription: '一个设计精美的个人作品集网站，展示了出色的UI/UX设计技能。',
          screenshot: 'https://via.placeholder.com/400x300',
          likeCount: 45,
          viewCount: 234,
          createdAt: '2024-01-10T14:30:00Z',
          bookmarkedAt: '2024-01-15T16:45:00Z',
          author: {
            id: 2,
            username: 'designer_jane',
            avatar: 'https://via.placeholder.com/40x40',
          },
          tags: [
            { id: 1, name: 'React', slug: 'react', color: '#61DAFB' },
            { id: 2, name: '设计', slug: 'design', color: '#FF6B6B' },
            { id: 3, name: '作品集', slug: 'portfolio', color: '#4ECDC4' },
          ],
        },
        {
          id: 2,
          title: 'AI工具集合',
          slug: 'ai-tools-collection',
          url: 'https://example2.com',
          shortDescription: '收集了各种有用的AI工具和服务，为开发者和设计师提供便利。',
          likeCount: 32,
          viewCount: 187,
          createdAt: '2024-01-08T09:20:00Z',
          bookmarkedAt: '2024-01-14T11:30:00Z',
          author: {
            id: 3,
            username: 'ai_enthusiast',
            avatar: 'https://via.placeholder.com/40x40',
          },
          tags: [
            { id: 4, name: 'AI', slug: 'ai', color: '#9B59B6' },
            { id: 5, name: '工具', slug: 'tools', color: '#F39C12' },
          ],
        },
        {
          id: 3,
          title: '开源组件库',
          slug: 'open-source-components',
          url: 'https://example3.com',
          shortDescription: '一套开源的React组件库，包含丰富的UI组件和完整的文档。',
          likeCount: 28,
          viewCount: 156,
          createdAt: '2024-01-05T16:45:00Z',
          bookmarkedAt: '2024-01-13T09:15:00Z',
          author: {
            id: 4,
            username: 'open_source_dev',
            avatar: 'https://via.placeholder.com/40x40',
          },
          tags: [
            { id: 1, name: 'React', slug: 'react', color: '#61DAFB' },
            { id: 6, name: '开源', slug: 'open-source', color: '#27AE60' },
            { id: 7, name: '组件库', slug: 'component-library', color: '#3498DB' },
          ],
        },
      ];
      
      setBookmarkedWebsites(mockBookmarks);
      setLoading(false);
    }, 1000);
  }, []);

  const sortedWebsites = [...bookmarkedWebsites].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime();
      case 'popular':
        return b.likeCount - a.likeCount;
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const handleRemoveBookmark = (websiteId: number) => {
    if (confirm('确定要从收藏中移除这个作品吗？')) {
      // 这里应该调用API移除收藏
      setBookmarkedWebsites(prev => prev.filter(w => w.id !== websiteId));
    }
  };

  const getTagStyle = (color?: string) => {
    if (color) {
      return {
        backgroundColor: `${color}20`,
        borderColor: color,
        color: color,
      };
    }
    return {};
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
            <h1 className="text-3xl font-bold text-slate-900">我的收藏</h1>
            <p className="mt-2 text-slate-600">
              您收藏的所有精彩作品
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600">
              共 {bookmarkedWebsites.length} 个收藏
            </span>
          </div>
        </div>

        {/* 排序控件 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-700">排序方式：</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-slate-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="recent">最近收藏</option>
                <option value="popular">热门优先</option>
                <option value="alphabetical">按标题排序</option>
              </select>
            </div>
            
            <div className="text-sm text-slate-500">
              最后更新：{bookmarkedWebsites.length > 0 ? new Date(Math.max(...bookmarkedWebsites.map(w => new Date(w.bookmarkedAt).getTime()))).toLocaleDateString() : '无'}
            </div>
          </div>
        </div>

        {/* 收藏列表 */}
        {sortedWebsites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedWebsites.map((website) => (
              <div key={website.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
                {/* 作品截图 */}
                <div className="aspect-video bg-slate-100 relative">
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
                  
                  {/* 收藏移除按钮 */}
                  <button
                    onClick={() => handleRemoveBookmark(website.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                    title="移除收藏"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </button>
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
                  <div className="flex items-center justify-between mb-4">
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
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {website.likeCount}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {website.viewCount}
                      </span>
                    </div>
                  </div>

                  {/* 标签 */}
                  {website.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {website.tags.slice(0, 3).map((tag) => (
                        <Link
                          key={tag.id}
                          href={`/tags/${tag.slug}`}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border transition-colors"
                          style={getTagStyle(tag.color)}
                        >
                          {tag.name}
                        </Link>
                      ))}
                      {website.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          +{website.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 收藏时间 */}
                  <div className="text-xs text-slate-500 mb-4">
                    收藏于 {new Date(website.bookmarkedAt).toLocaleDateString()}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex space-x-2">
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
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-slate-900">
              还没有收藏任何作品
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              发现精彩作品时，点击收藏按钮将它们保存到这里
            </p>
            <div className="mt-8">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                发现作品
              </Link>
            </div>
          </div>
        )}

        {/* 统计信息 */}
        {sortedWebsites.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">收藏统计</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {sortedWebsites.length}
                </div>
                <div className="text-sm text-slate-600">总收藏数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {sortedWebsites.reduce((sum, w) => sum + w.likeCount, 0)}
                </div>
                <div className="text-sm text-slate-600">总点赞数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(sortedWebsites.flatMap(w => w.tags.map(t => t.id))).size}
                </div>
                <div className="text-sm text-slate-600">涉及标签</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {new Set(sortedWebsites.map(w => w.author.id)).size}
                </div>
                <div className="text-sm text-slate-600">关注作者</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 