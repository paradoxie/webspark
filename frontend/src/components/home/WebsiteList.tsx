'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import SectionHeader from '@/components/common/SectionHeader';
import WebsiteGrid from '@/components/common/WebsiteGrid';
import LoadingGrid from '@/components/common/LoadingGrid';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/ui/Button';
import { useWebsiteActions } from '@/hooks/useWebsiteActions';

interface Website {
  id: number;
  title: string;
  slug: string;
  url: string;
  shortDescription: string;
  likeCount: number;
  viewCount: number;
  score: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  author: {
    id: number;
    username: string;
    name: string;
    avatar: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
    color?: string;
  }>;
  category?: {
    id: number;
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
}

export default function WebsiteList() {
  const { data: session } = useSession();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { handleLike, handleBookmark } = useWebsiteActions({ websites, setWebsites });

  useEffect(() => {
    fetchWebsites(1, true);
  }, []);

  const fetchWebsites = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/websites?page=${pageNum}&pageSize=12`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch websites');
      }

      const data = await response.json();
      
      if (reset) {
        setWebsites(data.data);
      } else {
        setWebsites(prev => [...prev, ...data.data]);
      }
      
      setHasMore(pageNum < data.meta.pagination.pageCount);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching websites:', err);
      setError('加载作品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchWebsites(page + 1, false);
    }
  };

  const handleLike = async (websiteId: number) => {
    if (!session) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      const response = await fetch(`/api/websites/${websiteId}/like`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.data.action === 'like' ? '点赞成功！' : '已取消点赞');
        setWebsites(prev => 
          prev.map(site => 
            site.id === websiteId 
              ? { 
                  ...site, 
                  isLiked: result.data.action === 'like', 
                  likeCount: result.data.likeCount || site.likeCount + (result.data.action === 'like' ? 1 : -1)
                }
              : site
          )
        );
      } else {
        throw new Error('API请求失败');
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      toast.error('点赞失败，请重试');
    }
  };

  const handleBookmark = async (websiteId: number) => {
    if (!session) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      const response = await fetch(`/api/websites/${websiteId}/bookmark`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.data.action === 'bookmark' ? '收藏成功！' : '已取消收藏');
        setWebsites(prev => 
          prev.map(site => 
            site.id === websiteId 
              ? { 
                  ...site, 
                  isBookmarked: result.data.action === 'bookmark'
                }
              : site
          )
        );
      } else {
        throw new Error('API请求失败');
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      toast.error('收藏失败，请重试');
    }
  };

  // 过滤网站
  const filteredWebsites = searchQuery
    ? websites.filter(website => 
        website.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        website.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        website.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        website.tags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (website.category && website.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : websites;

  return (
    <div>
      {/* 搜索区域 */}
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          最新作品
        </h2>
        <p className="text-lg text-slate-600 mb-8">
          发现来自全球开发者的优秀作品
        </p>
        
        {/* 搜索框 */}
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="搜索作品、标签或作者..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-600 text-2xl mb-2">⚠️</div>
            <div className="text-red-800 font-medium mb-2">加载失败</div>
            <div className="text-red-600 text-sm mb-4">{error}</div>
            <button
              onClick={() => fetchWebsites(1, true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* 作品网格 */}
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredWebsites.map((website) => (
            <Link
              key={website.id}
              href={`/sites/${website.slug}`}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
            >
              <div className="p-6">
                {/* 分类标签 (如果存在) */}
                {website.category && (
                  <div 
                    className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium mb-3"
                    style={{ 
                      backgroundColor: website.category.color + '20', 
                      color: website.category.color 
                    }}
                  >
                    <span className="mr-1">{website.category.icon}</span>
                    {website.category.name}
                  </div>
                )}
                
                {/* 标题和描述 */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {website.title}
                  </h3>
                  <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                    {website.shortDescription}
                  </p>
                </div>
                
                {/* 标签 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {website.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      style={tag.color ? { backgroundColor: tag.color + '20', color: tag.color } : {}}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {website.tags.length > 3 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      +{website.tags.length - 3}
                    </span>
                  )}
                </div>
                
                {/* 作者信息 */}
                <Link
                  href={`/users/${website.author.username}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center space-x-3 mb-4 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Image
                    src={website.author.avatar || 'https://i.pravatar.cc/150'}
                    alt={website.author.name}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-slate-200"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{website.author.name}</p>
                    <p className="text-xs text-slate-500">@{website.author.username}</p>
                  </div>
                </Link>
                
                {/* 统计和操作 */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {website.viewCount}
                    </span>
                    <span>{website.likeCount} 点赞</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLike(website.id);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        website.isLiked 
                          ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                          : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <svg className="w-5 h-5" fill={website.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleBookmark(website.id);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        website.isBookmarked 
                          ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                          : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-50'
                      }`}
                    >
                      <svg className="w-5 h-5" fill={website.isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 加载更多 */}
      {!error && hasMore && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300 transform hover:scale-105"
          >
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}

      {/* 无数据时的提示 */}
      {!error && !loading && filteredWebsites.length === 0 && (
        <div className="text-center py-16">
          <div className="text-slate-400 text-8xl mb-6">🌟</div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">暂无作品</h3>
          <p className="text-slate-600 mb-8 text-lg">成为第一个分享作品的开发者吧！</p>
          {session ? (
            <Link
              href="/submit"
              className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 font-semibold transition-all duration-300 transform hover:scale-105"
            >
              提交作品
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 font-semibold transition-all duration-300 transform hover:scale-105"
            >
              登录后提交作品
            </Link>
          )}
        </div>
      )}
    </div>
  );
} 