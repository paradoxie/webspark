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
  featured: boolean;
  createdAt: string;
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

const categories = [
  { name: 'React', icon: '⚛️', count: 245, color: 'from-blue-500 to-cyan-500' },
  { name: 'Vue.js', icon: '💚', count: 189, color: 'from-green-500 to-emerald-500' },
  { name: 'AI/ML', icon: '🤖', count: 156, color: 'from-purple-500 to-pink-500' },
  { name: '设计系统', icon: '🎨', count: 134, color: 'from-orange-500 to-red-500' },
  { name: '游戏开发', icon: '🎮', count: 98, color: 'from-indigo-500 to-purple-500' },
  { name: '数据可视化', icon: '📊', count: 87, color: 'from-cyan-500 to-blue-500' },
];

export default function HomePage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [featuredWebsites, setFeaturedWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFeatured, setCurrentFeatured] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 从API获取数据
    const fetchWebsites = async () => {
      try {
        setLoading(true);
        
        // 获取所有网站
        const response = await fetch('http://localhost:1337/api/websites/sorted-list?page=1&pageSize=20');
        const result = await response.json();
        
        if (result && result.data) {
          // 获取精选网站
          const featured = result.data.filter((site: any) => site.featured);
          setFeaturedWebsites(featured.length > 0 ? featured : result.data.slice(0, 3));
          
          // 设置所有网站
          setWebsites(result.data);
        }
      } catch (error) {
        console.error('获取网站数据失败:', error);
        // 如果API调用失败，使用空数组
        setWebsites([]);
        setFeaturedWebsites([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWebsites();
  }, []);

  // 搜索功能
  const filteredWebsites = websites.filter(website => 
    website.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    website.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 自动轮播精选作品
  useEffect(() => {
    if (featuredWebsites.length > 0) {
      const interval = setInterval(() => {
        setCurrentFeatured((prev) => (prev + 1) % featuredWebsites.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredWebsites.length]);

  const getTagStyle = (color?: string) => {
    if (color) {
      return {
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        color: color,
      };
    }
    return {};
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.15s', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-slate-600 font-medium">正在加载精彩作品...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section - 搜索和导航 */}
      <section className="relative overflow-hidden pt-24 pb-16">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-pink-400 to-red-500 rounded-full opacity-5 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              发现精彩的Web创作
            </h1>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              WebSpark.club 是展示和发现优秀网站、应用和创意项目的社区
            </p>
          </div>
          
          {/* 搜索框 */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索项目、技术栈或创作者..."
                className="w-full py-4 px-6 pr-12 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* 分类导航 */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category, index) => (
              <Link
                key={index}
                href={`/tags/${category.name.toLowerCase()}`}
                className="group flex items-center gap-2 py-2 px-4 rounded-full bg-white/70 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md hover:bg-gradient-to-r hover:border-transparent transition-all"
                style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}
              >
                <span className="text-xl">{category.icon}</span>
                <span className="font-medium text-slate-700">{category.name}</span>
                <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
                  {category.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* 精选项目 */}
      {featuredWebsites.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 flex items-center">
              <span className="text-2xl mr-2">✨</span>
              <span>精选推荐</span>
            </h2>
            
            <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-slate-200/50">
              {/* 轮播指示器 */}
              <div className="absolute top-4 right-4 z-10 flex space-x-2">
                {featuredWebsites.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentFeatured === index ? 'bg-blue-600 w-6' : 'bg-slate-300'
                    }`}
                    onClick={() => setCurrentFeatured(index)}
                  ></button>
                ))}
              </div>
              
              {/* 轮播内容 */}
              <div className="flex flex-col md:flex-row">
                {/* 左侧图片 */}
                <div className="md:w-1/2 h-64 md:h-auto relative overflow-hidden">
                  {featuredWebsites[currentFeatured]?.screenshot ? (
                    <img
                      src={featuredWebsites[currentFeatured].screenshot}
                      alt={featuredWebsites[currentFeatured].title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <div className="text-6xl opacity-30">{featuredWebsites[currentFeatured].title.slice(0, 1)}</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:bg-gradient-to-r md:from-black/50 md:to-transparent"></div>
                </div>
                
                {/* 右侧内容 */}
                <div className="md:w-1/2 p-6 md:p-10 flex flex-col">
                  <div className="mb-4">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 mr-3">
                        {featuredWebsites[currentFeatured]?.author?.avatar ? (
                          <img
                            src={featuredWebsites[currentFeatured].author.avatar}
                            alt={featuredWebsites[currentFeatured].author.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold">
                            {featuredWebsites[currentFeatured]?.author?.username?.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{featuredWebsites[currentFeatured]?.author?.username}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(featuredWebsites[currentFeatured]?.createdAt).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{featuredWebsites[currentFeatured]?.title}</h3>
                    <p className="text-slate-600 mb-4">{featuredWebsites[currentFeatured]?.shortDescription}</p>
                    
                    {/* 标签 */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {featuredWebsites[currentFeatured]?.tags?.map((tag) => (
                        <Link
                          href={`/tags/${tag.slug}`}
                          key={tag.id}
                          className="text-xs px-3 py-1 rounded-full border transition-all hover:shadow-sm"
                          style={getTagStyle(tag.color)}
                        >
                          {tag.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span className="text-slate-600">{featuredWebsites[currentFeatured]?.likeCount}</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-slate-600">{featuredWebsites[currentFeatured]?.viewCount}</span>
                      </div>
                    </div>
                    
                    <a
                      href={featuredWebsites[currentFeatured]?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      访问网站
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* 所有项目列表 */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center">
              <span className="text-2xl mr-2">🔥</span>
              <span>热门作品</span>
            </h2>
            
            {searchQuery && (
              <div className="text-slate-600">
                找到 <span className="font-semibold">{filteredWebsites.length}</span> 个匹配结果
              </div>
            )}
          </div>
          
          {filteredWebsites.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">未找到匹配的作品</h3>
              <p className="text-slate-500 mb-6">尝试使用不同的关键词，或者浏览所有作品</p>
              <button
                onClick={() => setSearchQuery('')}
                className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                查看所有作品
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWebsites.map((website) => (
                <Link
                  href={`/sites/${website.slug}`}
                  key={website.id}
                  className="group bg-white/70 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-200/50 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {/* 缩略图 */}
                  <div className="h-48 overflow-hidden relative">
                    {website.screenshot ? (
                      <img
                        src={website.screenshot}
                        alt={website.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <div className="text-6xl opacity-30">{website.title.slice(0, 1)}</div>
                      </div>
                    )}
                    
                    {/* 作者信息 */}
                    <div className="absolute bottom-3 left-3 flex items-center">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border-2 border-white">
                        {website.author?.avatar ? (
                          <img
                            src={website.author.avatar}
                            alt={website.author.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold">
                            {website.author?.username?.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
                        {website.author?.username}
                      </div>
                    </div>
                  </div>
                  
                  {/* 内容 */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {website.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {website.shortDescription}
                    </p>
                    
                    {/* 标签 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {website.tags?.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="text-xs px-2 py-0.5 rounded-full border"
                          style={getTagStyle(tag.color)}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {website.tags?.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          +{website.tags.length - 3}
                        </span>
                      )}
                    </div>
                    
                    {/* 统计 */}
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(website.createdAt).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>{website.likeCount}</span>
                        </div>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          <span>{website.viewCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {/* 加载更多按钮 */}
          {!searchQuery && websites.length > 0 && (
            <div className="text-center mt-12">
              <button className="py-3 px-6 bg-white border border-slate-300 rounded-xl shadow-sm hover:shadow-md transition-all text-slate-700 font-medium">
                加载更多作品
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
} 