'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Website {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  url: string;
  screenshot?: string;
  status: 'APPROVED';
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

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
  count: number;
}

export default function SitesPage() {
  const searchParams = useSearchParams();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams?.get('tags')?.split(',').filter(Boolean) || []
  );
  const [sortBy, setSortBy] = useState(searchParams?.get('sort') || 'latest');
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams?.get('page') || '1', 10)
  );
  const [totalPages, setTotalPages] = useState(1);

  // 模拟数据
  useEffect(() => {
    loadData();
  }, [searchQuery, selectedTags, sortBy, currentPage]);

  const loadData = async () => {
    setIsLoading(true);
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800));

    // 模拟标签数据
    setTags([
      { id: 1, name: 'React', slug: 'react', color: 'blue', count: 156 },
      { id: 2, name: 'Vue.js', slug: 'vue', color: 'green', count: 89 },
      { id: 3, name: 'Next.js', slug: 'nextjs', color: 'black', count: 134 },
      { id: 4, name: 'TypeScript', slug: 'typescript', color: 'blue', count: 203 },
      { id: 5, name: 'Tailwind CSS', slug: 'tailwind', color: 'cyan', count: 178 },
      { id: 6, name: 'Node.js', slug: 'nodejs', color: 'green', count: 167 },
      { id: 7, name: 'AI/ML', slug: 'ai', color: 'purple', count: 45 },
      { id: 8, name: 'E-commerce', slug: 'ecommerce', color: 'orange', count: 67 },
      { id: 9, name: 'Portfolio', slug: 'portfolio', color: 'pink', count: 234 },
      { id: 10, name: 'Dashboard', slug: 'dashboard', color: 'indigo', count: 98 }
    ]);

    // 模拟作品数据
    const mockWebsites: Website[] = [
      {
        id: 1,
        title: 'React Dashboard Pro',
        slug: 'react-dashboard-pro',
        shortDescription: '现代化的管理仪表板，使用React 18和TypeScript构建，支持深色模式和响应式设计',
        url: 'https://react-dashboard.demo.com',
        screenshot: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        status: 'APPROVED',
        likeCount: 342,
        viewCount: 8764,
        featured: true,
        createdAt: '2024-01-20',
        author: {
          id: 1,
          username: 'alexdev',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
        },
        tags: [
          { id: 1, name: 'React', slug: 'react', color: 'blue' },
          { id: 4, name: 'TypeScript', slug: 'typescript', color: 'blue' },
          { id: 10, name: 'Dashboard', slug: 'dashboard', color: 'indigo' }
        ]
      },
      {
        id: 2,
        title: 'AI 聊天助手',
        slug: 'ai-chat-assistant',
        shortDescription: '基于GPT-4的智能对话系统，支持多语言和上下文理解，界面简洁优美',
        url: 'https://ai-chat.demo.com',
        screenshot: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        status: 'APPROVED',
        likeCount: 567,
        viewCount: 12453,
        featured: false,
        createdAt: '2024-01-18',
        author: {
          id: 2,
          username: 'sarah_ai',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100'
        },
        tags: [
          { id: 7, name: 'AI/ML', slug: 'ai', color: 'purple' },
          { id: 1, name: 'React', slug: 'react', color: 'blue' },
          { id: 3, name: 'Next.js', slug: 'nextjs', color: 'black' }
        ]
      },
      {
        id: 3,
        title: 'Vue商城系统',
        slug: 'vue-ecommerce',
        shortDescription: '功能完整的电商平台，包含商品管理、购物车、支付集成和用户系统',
        url: 'https://vue-shop.demo.com',
        screenshot: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
        status: 'APPROVED',
        likeCount: 234,
        viewCount: 5678,
        featured: false,
        createdAt: '2024-01-15',
        author: {
          id: 3,
          username: 'mike_vue',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
        },
        tags: [
          { id: 2, name: 'Vue.js', slug: 'vue', color: 'green' },
          { id: 8, name: 'E-commerce', slug: 'ecommerce', color: 'orange' },
          { id: 6, name: 'Node.js', slug: 'nodejs', color: 'green' }
        ]
      },
      {
        id: 4,
        title: '设计师作品集',
        slug: 'designer-portfolio',
        shortDescription: '精美的个人作品集网站，展示创意设计和用户体验作品，动画效果流畅',
        url: 'https://portfolio.demo.com',
        screenshot: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400',
        status: 'APPROVED',
        likeCount: 189,
        viewCount: 3456,
        featured: true,
        createdAt: '2024-01-12',
        author: {
          id: 4,
          username: 'emma_design',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100'
        },
        tags: [
          { id: 9, name: 'Portfolio', slug: 'portfolio', color: 'pink' },
          { id: 3, name: 'Next.js', slug: 'nextjs', color: 'black' },
          { id: 5, name: 'Tailwind CSS', slug: 'tailwind', color: 'cyan' }
        ]
      }
    ];

    // 根据筛选条件过滤数据
    let filteredWebsites = mockWebsites;

    if (searchQuery) {
      filteredWebsites = filteredWebsites.filter(site =>
        site.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.author.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedTags.length > 0) {
      filteredWebsites = filteredWebsites.filter(site =>
        site.tags.some(tag => selectedTags.includes(tag.slug))
      );
    }

    // 排序
    switch (sortBy) {
      case 'popular':
        filteredWebsites.sort((a, b) => b.likeCount - a.likeCount);
        break;
      case 'views':
        filteredWebsites.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'latest':
      default:
        filteredWebsites.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    setWebsites(filteredWebsites);
    setTotalPages(Math.ceil(filteredWebsites.length / 12)); // 假设每页12个
    setIsLoading(false);
  };

  const handleTagToggle = (tagSlug: string) => {
    setSelectedTags(prev => 
      prev.includes(tagSlug)
        ? prev.filter(t => t !== tagSlug)
        : [...prev, tagSlug]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSortBy('latest');
    setCurrentPage(1);
  };

  const getTagStyle = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
      pink: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
      cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
      black: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
    };
    
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* 页面头部 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              发现优秀作品 ✨
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              探索来自全球开发者的创意项目，从前沿技术到设计美学，每一个作品都值得欣赏
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-slate-500">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>{websites.length} 个作品</span>
              </span>
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>{tags.length} 个技术标签</span>
              </span>
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>每日更新</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索和筛选区域 */}
        <div className="mb-8 space-y-6">
          {/* 搜索栏 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 搜索输入框 */}
              <div className="flex-1 relative">
                <svg 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索作品标题、描述或作者..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                />
              </div>

              {/* 排序选择 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-600">排序：</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                >
                  <option value="latest">最新发布</option>
                  <option value="popular">最受欢迎</option>
                  <option value="views">浏览最多</option>
                </select>
              </div>

              {/* 清空筛选 */}
              {(searchQuery || selectedTags.length > 0 || sortBy !== 'latest') && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition-colors duration-200"
                >
                  清空筛选
                </button>
              )}
            </div>

            {/* 当前筛选条件显示 */}
            {(searchQuery || selectedTags.length > 0) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-600">当前筛选：</span>
                {searchQuery && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-2">
                    <span>搜索: "{searchQuery}"</span>
                    <button onClick={() => setSearchQuery('')} className="text-blue-600 hover:text-blue-800">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {selectedTags.map(tagSlug => {
                  const tag = tags.find(t => t.slug === tagSlug);
                  return tag ? (
                    <span key={tagSlug} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center space-x-2">
                      <span>{tag.name}</span>
                      <button onClick={() => handleTagToggle(tagSlug)} className="text-purple-600 hover:text-purple-800">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* 标签筛选 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">🏷️ 技术标签</h3>
              <span className="text-sm text-slate-500">
                已选择 {selectedTags.length} 个标签
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.slug)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-300 transform hover:scale-105 ${
                    selectedTags.includes(tag.slug)
                      ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg'
                      : ''
                  } ${getTagStyle(tag.color)}`}
                >
                  <span className="flex items-center space-x-2">
                    <span>{tag.name}</span>
                    <span className="text-xs opacity-60">({tag.count})</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-600">正在加载精彩作品...</p>
            </div>
          </div>
        )}

        {/* 作品网格 */}
        {!isLoading && (
          <>
            {websites.length > 0 ? (
              <>
                {/* 结果统计 */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-slate-600">
                    找到 <span className="font-semibold text-slate-800">{websites.length}</span> 个作品
                    {searchQuery && ` 关于 "${searchQuery}"`}
                    {selectedTags.length > 0 && ` 使用了 ${selectedTags.length} 个标签`}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <span>第 {currentPage} 页</span>
                    <span>·</span>
                    <span>共 {totalPages} 页</span>
                  </div>
                </div>

                {/* 作品卡片网格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {websites.map((website, index) => (
                    <div 
                      key={website.id}
                      className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* 作品截图 */}
                      <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 relative overflow-hidden">
                        {website.screenshot ? (
                          <img
                            src={website.screenshot}
                            alt={website.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        
                        {/* 特色标识 */}
                        {website.featured && (
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-xs font-bold rounded-full shadow-lg">
                              ⭐ 精选
                            </span>
                          </div>
                        )}

                        {/* 悬浮操作按钮 */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
                          <a
                            href={website.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors duration-200"
                            title="访问网站"
                          >
                            <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <button
                            className="block p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors duration-200"
                            title="收藏作品"
                          >
                            <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* 作品信息 */}
                      <div className="p-6 space-y-4">
                        <h3 className="text-xl font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors duration-300">
                          <Link href={`/sites/${website.slug}`}>
                            {website.title}
                          </Link>
                        </h3>

                        <p className="text-slate-600 line-clamp-2 leading-relaxed">
                          {website.shortDescription}
                        </p>

                        {/* 作者信息 */}
                        <div className="flex items-center space-x-3">
                          <img
                            src={website.author.avatar}
                            alt={website.author.username}
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">
                              {website.author.username}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate(website.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* 统计信息 */}
                        <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-100">
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{website.likeCount}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{website.viewCount}</span>
                          </span>
                        </div>

                        {/* 标签 */}
                        <div className="flex flex-wrap gap-2">
                          {website.tags.slice(0, 3).map((tag) => (
                            <Link
                              key={tag.id}
                              href={`/sites?tags=${tag.slug}`}
                              className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all duration-300 hover:scale-105 ${getTagStyle(tag.color || 'blue')}`}
                            >
                              {tag.name}
                            </Link>
                          ))}
                          {website.tags.length > 3 && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                              +{website.tags.length - 3}
                            </span>
                          )}
                        </div>

                        {/* 查看详情按钮 */}
                        <Link
                          href={`/sites/${website.slug}`}
                          className="block w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl text-center hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                        >
                          查看详情
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        上一页
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* 空状态 */
              <div className="text-center py-20">
                <div className="space-y-4">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">没有找到匹配的作品</h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    尝试调整搜索条件或浏览其他分类，也许您能发现更多有趣的项目
                  </p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                  >
                    清空筛选条件
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 