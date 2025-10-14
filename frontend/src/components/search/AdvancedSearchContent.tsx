'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AdvancedSearch from './AdvancedSearch';
import WebsiteCard from '../common/WebsiteCard';
import Pagination from '../common/Pagination';
import toast from 'react-hot-toast';

interface SearchFilters {
  query: string;
  category: string;
  tags: string[];
  author: string;
  dateRange: string;
  sortBy: string;
  featured: boolean | null;
  hasSource: boolean | null;
  isHiring: boolean | null;
  minLikes: number;
  minViews: number;
}

interface Website {
  id: number;
  title: string;
  slug: string;
  url: string;
  shortDescription: string;
  description: string;
  sourceUrl?: string;
  screenshots: string[];
  likeCount: number;
  viewCount: number;
  featured: boolean;
  isHiring: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    username: string;
    name: string;
    avatar?: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
    color?: string;
  }>;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

interface SearchResponse {
  data: Website[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
    searchParams: SearchFilters;
  };
}

interface AdvancedSearchContentProps {
  initialQuery: string;
  initialType: string;
}

export default function AdvancedSearchContent({ initialQuery, initialType }: AdvancedSearchContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    pageCount: 0,
    total: 0
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // 初始化搜索
  useEffect(() => {
    if (initialQuery || searchParams.toString()) {
      const filters = parseUrlParams();
      performSearch(filters);
    }
  }, [initialQuery, searchParams]);

  // 获取搜索历史
  useEffect(() => {
    if (session) {
      fetchSearchHistory();
    }
  }, [session]);

  const fetchSearchHistory = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/search-history/history?limit=10`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const queries = data.data.map((item: any) => item.query);
        setSearchHistory(queries);
      }
    } catch (error) {
      console.error('Failed to fetch search history:', error);
    }
  };

  const saveSearchHistory = async (query: string, resultCount: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/search-history/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({ query, resultCount })
      });
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  const parseUrlParams = (): SearchFilters => {
    return {
      query: searchParams.get('q') || initialQuery || '',
      category: searchParams.get('category') || '',
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
      author: searchParams.get('author') || '',
      dateRange: searchParams.get('dateRange') || 'all',
      sortBy: searchParams.get('sort') || 'newest',
      featured: searchParams.get('featured') === 'true' ? true : searchParams.get('featured') === 'false' ? false : null,
      hasSource: searchParams.get('hasSource') === 'true' ? true : searchParams.get('hasSource') === 'false' ? false : null,
      isHiring: searchParams.get('isHiring') === 'true' ? true : searchParams.get('isHiring') === 'false' ? false : null,
      minLikes: parseInt(searchParams.get('minLikes') || '0'),
      minViews: parseInt(searchParams.get('minViews') || '0'),
    };
  };

  const performSearch = async (filters: SearchFilters, page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // 添加搜索参数
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== '' && value !== 0 && (Array.isArray(value) ? value.length > 0 : true)) {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else if (typeof value === 'boolean') {
            params.set(key, value.toString());
          } else {
            params.set(key, value.toString());
          }
        }
      });
      
      params.set('page', page.toString());
      params.set('pageSize', '12');

      const response = await fetch(`/api/search/advanced?${params.toString()}`);
      if (response.ok) {
        const data: SearchResponse = await response.json();
        setWebsites(data.data);
        setPagination(data.meta.pagination);
        setHasSearched(true);
        
        // 保存搜索历史（仅在用户登录且有搜索查询时）
        if (session && filters.query && page === 1) {
          saveSearchHistory(filters.query, data.meta.pagination.total);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || '搜索失败，请重试');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('搜索出错，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: SearchFilters) => {
    performSearch(filters, 1);
  };

  const handlePageChange = (page: number) => {
    const filters = parseUrlParams();
    performSearch(filters, page);
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLike = async (websiteId: number) => {
    try {
      const response = await fetch(`/api/websites/${websiteId}/like`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.action === 'like' ? '点赞成功！' : '已取消点赞');
        
        // 更新本地状态
        setWebsites(prev => 
          prev.map(site => 
            site.id === websiteId 
              ? { 
                  ...site, 
                  isLiked: result.action === 'like', 
                  likeCount: result.likeCount || site.likeCount + (result.action === 'like' ? 1 : -1)
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
    try {
      const response = await fetch(`/api/websites/${websiteId}/bookmark`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.action === 'bookmark' ? '收藏成功！' : '已取消收藏');
        
        // 更新本地状态
        setWebsites(prev => 
          prev.map(site => 
            site.id === websiteId 
              ? { 
                  ...site, 
                  isBookmarked: result.action === 'bookmark'
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


  return (
    <div className="space-y-8">
      {/* 搜索组件 */}
      <AdvancedSearch onSearch={handleSearch} loading={loading} />

      {/* 搜索结果 */}
      {hasSearched && (
        <div>
          {/* 结果统计 */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-slate-600">
              {loading ? (
                <span>搜索中...</span>
              ) : (
                <span>
                  找到 <strong className="text-slate-900">{pagination.total}</strong> 个结果
                  {pagination.total > 0 && (
                    <span className="text-sm ml-2">
                      第 {(pagination.page - 1) * pagination.pageSize + 1}-{Math.min(pagination.page * pagination.pageSize, pagination.total)} 个
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* 搜索结果列表 */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-slate-100 rounded-full w-16"></div>
                      <div className="h-6 bg-slate-100 rounded-full w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : websites.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {websites.map((website) => (
                  <WebsiteCard
                    key={website.id}
                    website={website}
                    showActions={true}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                  />
                ))}
              </div>
              
              {/* 分页 */}
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pageCount}
                onPageChange={handlePageChange}
                showInfo={true}
                total={pagination.total}
                pageSize={pagination.pageSize}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">未找到相关结果</h3>
              <p className="text-slate-600 mb-4">
                尝试调整搜索条件或使用不同的关键词
              </p>
              <div className="text-sm text-slate-500">
                <p>建议：</p>
                <ul className="mt-2 space-y-1">
                  <li>• 检查拼写是否正确</li>
                  <li>• 尝试使用更通用的关键词</li>
                  <li>• 减少筛选条件</li>
                  <li>• 浏览热门标签获取灵感</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 初始状态 - 未搜索时显示 */}
      {!hasSearched && !loading && (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">开始搜索</h3>
          <p className="text-slate-600">
            输入关键词或使用高级筛选功能来发现优秀的开发者作品
          </p>
        </div>
      )}
    </div>
  );
}