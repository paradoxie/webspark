'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface Website {
  id: number;
  title: string;
  slug: string;
  url: string;
  shortDescription: string;
  likeCount: number;
  viewCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
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

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  websiteCount: number;
  websites: Website[];
}

interface CategoryWebsitesProps {
  searchQuery?: string;
}

export default function CategoryWebsites({ searchQuery = '' }: CategoryWebsitesProps) {
  const { data: session } = useSession();
  const [topCategories, setTopCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/categories/top/3');
        
        if (!response.ok) {
          throw new Error('Failed to fetch top categories');
        }

        const data = await response.json();
        setTopCategories(data.data);
      } catch (err) {
        console.error('Error fetching top categories:', err);
        setError('加载分类作品失败');
      } finally {
        setLoading(false);
      }
    };

    fetchTopCategories();
  }, []);

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
        
        setTopCategories(prevCategories => 
          prevCategories.map(category => ({
            ...category,
            websites: category.websites.map(site => 
              site.id === websiteId 
                ? { 
                    ...site, 
                    isLiked: result.data.action === 'like', 
                    likeCount: result.data.likeCount || site.likeCount + (result.data.action === 'like' ? 1 : -1)
                  }
                : site
            )
          }))
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
        
        setTopCategories(prevCategories => 
          prevCategories.map(category => ({
            ...category,
            websites: category.websites.map(site => 
              site.id === websiteId 
                ? { 
                    ...site, 
                    isBookmarked: result.data.action === 'bookmark'
                  }
                : site
            )
          }))
        );
      } else {
        throw new Error('API请求失败');
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      toast.error('收藏失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">热门分类作品</h2>
          <p className="text-lg text-slate-600">探索各类别中最受欢迎的作品</p>
        </div>
        <div className="space-y-16">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded-md w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="bg-white rounded-xl shadow-md p-6">
                    <div className="h-8 bg-slate-200 rounded-md w-3/4 mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded-md w-full mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded-md w-5/6 mb-6"></div>
                    <div className="flex gap-2 mb-6">
                      <div className="h-6 bg-slate-100 rounded-full w-16"></div>
                      <div className="h-6 bg-slate-100 rounded-full w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || topCategories.length === 0) {
    return null;
  }

  // 过滤作品
  const filteredCategories = topCategories.map(category => {
    if (!searchQuery) return category;
    
    const filteredWebsites = category.websites.filter(website => 
      website.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      website.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      website.tags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (website.category && website.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      website.author.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return {
      ...category,
      websites: filteredWebsites
    };
  }).filter(category => category.websites.length > 0);
  
  if (searchQuery && filteredCategories.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">未找到相关作品</h3>
        <p className="text-slate-600 mb-8">尝试使用其他关键词搜索</p>
      </div>
    );
  }

  return (
    <div className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">热门分类作品</h2>
        <p className="text-lg text-slate-600">探索各类别中最受欢迎的作品</p>
      </div>

      <div className="space-y-16">
        {filteredCategories.map((category) => (
          <div key={category.id} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <span 
                  className="text-2xl mr-3"
                  style={{ color: category.color }}
                >
                  {category.icon}
                </span>
                <h3 className="text-2xl font-bold text-slate-900">
                  {category.name}
                </h3>
                <span className="ml-3 text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  {category.websiteCount} 个作品
                </span>
              </div>
              <Link
                href={`/categories/${category.slug}`}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                查看全部
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {category.websites.map((website, index) => (
                index < 4 ? (
                  <Link
                    key={website.id}
                    href={`/sites/${website.slug}`}
                    className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                  >
                    <div className="p-5">
                      {/* 标题和描述 */}
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {website.title}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                          {website.shortDescription}
                        </p>
                      </div>
                      
                      {/* 标签 */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {website.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            style={tag.color ? { backgroundColor: tag.color + '20', color: tag.color } : {}}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {website.tags.length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            +{website.tags.length - 2}
                          </span>
                        )}
                      </div>
                      
                      {/* 底部区域：作者和操作 */}
                      <div className="flex items-center justify-between">
                        {/* 作者信息 */}
                        <Link
                          href={`/users/${website.author.username}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center space-x-2"
                        >
                          <Image
                            src={website.author.avatar || 'https://i.pravatar.cc/150'}
                            alt={website.author.name}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                          <span className="text-xs text-slate-500">
                            {website.author.name}
                          </span>
                        </Link>
                        
                        {/* 操作按钮 */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleLike(website.id);
                            }}
                            className={`p-1.5 rounded-md transition-colors ${
                              website.isLiked 
                                ? 'text-red-600 bg-red-50' 
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <svg className="w-4 h-4" fill={website.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleBookmark(website.id);
                            }}
                            className={`p-1.5 rounded-md transition-colors ${
                              website.isBookmarked 
                                ? 'text-yellow-600 bg-yellow-50' 
                                : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                          >
                            <svg className="w-4 h-4" fill={website.isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : index === 4 ? (
                  <Link
                    key={`more-${category.id}`}
                    href={`/categories/${category.slug}`}
                    className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 flex items-center justify-center hover:border-blue-300 transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                  >
                    <div className="p-6 text-center">
                      <div className="text-3xl text-slate-400 mb-2 group-hover:text-blue-500 transition-colors">
                        +{category.websiteCount - 4}
                      </div>
                      <p className="text-slate-600 group-hover:text-blue-600 font-medium transition-colors">
                        查看更多
                      </p>
                    </div>
                  </Link>
                ) : null
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}