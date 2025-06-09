'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

interface SearchFilters {
  query: string;
  tags: string[];
  author: string;
  dateRange: string;
  likeRange: [number, number];
  viewRange: [number, number];
  sortBy: string;
  featured: boolean;
}

interface Website {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  url: string;
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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams?.get('q') || '',
    tags: searchParams?.get('tags')?.split(',').filter(Boolean) || [],
    author: searchParams?.get('author') || '',
    dateRange: searchParams?.get('date') || 'all',
    likeRange: [0, 1000],
    viewRange: [0, 50000],
    sortBy: searchParams?.get('sort') || 'relevance',
    featured: searchParams?.get('featured') === 'true'
  });

  const [results, setResults] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const availableTags = [
    { id: 1, name: 'React', slug: 'react', color: 'blue' },
    { id: 2, name: 'Vue.js', slug: 'vue', color: 'green' },
    { id: 3, name: 'Next.js', slug: 'nextjs', color: 'black' },
    { id: 4, name: 'TypeScript', slug: 'typescript', color: 'blue' },
    { id: 5, name: 'Tailwind CSS', slug: 'tailwind', color: 'cyan' },
    { id: 6, name: 'Node.js', slug: 'nodejs', color: 'green' },
    { id: 7, name: 'AI/ML', slug: 'ai', color: 'purple' },
    { id: 8, name: 'E-commerce', slug: 'ecommerce', color: 'orange' },
    { id: 9, name: 'Portfolio', slug: 'portfolio', color: 'pink' },
    { id: 10, name: 'Dashboard', slug: 'dashboard', color: 'indigo' }
  ];

  useEffect(() => {
    if (filters.query || filters.tags.length > 0 || filters.author) {
      performSearch();
    }
  }, [filters]);

  const performSearch = async () => {
    setIsLoading(true);
    
    // 模拟API搜索延迟
    await new Promise(resolve => setTimeout(resolve, 1200));

    // 模拟搜索结果
    const mockResults: Website[] = [
      {
        id: 1,
        title: 'React Dashboard Pro - 高级数据可视化平台',
        slug: 'react-dashboard-pro',
        shortDescription: '现代化的管理仪表板，使用React 18和TypeScript构建，支持深色模式和响应式设计。包含丰富的图表组件和实时数据更新功能。',
        url: 'https://react-dashboard.demo.com',
        screenshot: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
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
        title: 'AI 智能聊天助手 - GPT-4驱动',
        slug: 'ai-chat-assistant',
        shortDescription: '基于GPT-4的智能对话系统，支持多语言和上下文理解，界面简洁优美。集成了语音识别和文本转语音功能。',
        url: 'https://ai-chat.demo.com',
        screenshot: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
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
      }
    ];

    // 模拟基于搜索条件筛选
    let filteredResults = mockResults;

    if (filters.query) {
      filteredResults = filteredResults.filter(site =>
        site.title.toLowerCase().includes(filters.query.toLowerCase()) ||
        site.shortDescription.toLowerCase().includes(filters.query.toLowerCase())
      );
    }

    if (filters.tags.length > 0) {
      filteredResults = filteredResults.filter(site =>
        site.tags.some(tag => filters.tags.includes(tag.slug))
      );
    }

    if (filters.author) {
      filteredResults = filteredResults.filter(site =>
        site.author.username.toLowerCase().includes(filters.author.toLowerCase())
      );
    }

    if (filters.featured) {
      filteredResults = filteredResults.filter(site => site.featured);
    }

    setResults(filteredResults);
    setIsLoading(false);
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleTag = (tagSlug: string) => {
    updateFilter('tags', 
      filters.tags.includes(tagSlug)
        ? filters.tags.filter(t => t !== tagSlug)
        : [...filters.tags, tagSlug]
    );
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      tags: [],
      author: '',
      dateRange: 'all',
      likeRange: [0, 1000],
      viewRange: [0, 50000],
      sortBy: 'relevance',
      featured: false
    });
    setResults([]);
  };

  const exportResults = () => {
    const searchQuery = new URLSearchParams({
      q: filters.query,
      tags: filters.tags.join(','),
      author: filters.author,
      date: filters.dateRange,
      sort: filters.sortBy,
      featured: filters.featured.toString()
    }).toString();

    router.push(`/sites?${searchQuery}`);
  };

  const getTagStyle = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      pink: 'bg-pink-50 text-pink-700 border-pink-200',
      cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      black: 'bg-gray-50 text-gray-700 border-gray-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* 页面头部 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              🔍 高级搜索
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              使用高级筛选条件精确查找你需要的作品，支持多维度组合搜索
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 搜索筛选面板 */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg sticky top-8 space-y-6">
              
              {/* 基础搜索 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
                  <span>🔍</span>
                  <span>基础搜索</span>
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      关键词搜索
                    </label>
                    <input
                      type="text"
                      value={filters.query}
                      onChange={(e) => updateFilter('query', e.target.value)}
                      placeholder="搜索标题、描述..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      作者搜索
                    </label>
                    <input
                      type="text"
                      value={filters.author}
                      onChange={(e) => updateFilter('author', e.target.value)}
                      placeholder="搜索作者用户名..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* 标签筛选 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
                  <span>🏷️</span>
                  <span>技术标签</span>
                </h3>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <label key={tag.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors duration-200">
                      <input
                        type="checkbox"
                        checked={filters.tags.includes(tag.slug)}
                        onChange={() => toggleTag(tag.slug)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <span className={`flex-1 px-3 py-1 rounded-lg text-sm font-medium border ${getTagStyle(tag.color)}`}>
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 高级筛选 */}
              <div className="space-y-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between text-lg font-semibold text-slate-800 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200"
                >
                  <span className="flex items-center space-x-2">
                    <span>⚡</span>
                    <span>高级筛选</span>
                  </span>
                  <svg 
                    className={`w-5 h-5 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showAdvanced && (
                  <div className="space-y-4 animate-fade-in-up">
                    {/* 时间范围 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        发布时间
                      </label>
                      <select
                        value={filters.dateRange}
                        onChange={(e) => updateFilter('dateRange', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      >
                        <option value="all">全部时间</option>
                        <option value="today">今天</option>
                        <option value="week">本周</option>
                        <option value="month">本月</option>
                        <option value="year">今年</option>
                      </select>
                    </div>

                    {/* 排序方式 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        排序方式
                      </label>
                      <select
                        value={filters.sortBy}
                        onChange={(e) => updateFilter('sortBy', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      >
                        <option value="relevance">相关度</option>
                        <option value="latest">最新发布</option>
                        <option value="popular">最受欢迎</option>
                        <option value="views">浏览最多</option>
                      </select>
                    </div>

                    {/* 特色作品 */}
                    <div>
                      <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                        <input
                          type="checkbox"
                          checked={filters.featured}
                          onChange={(e) => updateFilter('featured', e.target.checked)}
                          className="w-4 h-4 text-yellow-600 border-yellow-300 rounded focus:ring-yellow-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-yellow-800">仅显示精选作品</span>
                          <p className="text-xs text-yellow-600">由编辑团队精心挑选的优质项目</p>
                        </div>
                        <span className="text-lg">⭐</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <button
                  onClick={clearAllFilters}
                  className="w-full px-4 py-3 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition-colors duration-200"
                >
                  清空所有筛选
                </button>
                
                {results.length > 0 && (
                  <button
                    onClick={exportResults}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                  >
                    在作品页查看 ({results.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 搜索结果 */}
          <div className="lg:col-span-3">
            {/* 搜索状态指示 */}
            <div className="mb-6">
              {filters.query || filters.tags.length > 0 || filters.author ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                          <span className="text-slate-600">正在搜索...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-slate-600">
                            找到 <span className="font-semibold text-slate-800">{results.length}</span> 个匹配结果
                          </span>
                        </>
                      )}
                    </div>
                    
                    {/* 当前筛选条件 */}
                    <div className="flex flex-wrap items-center gap-2">
                      {filters.query && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          "{filters.query}"
                        </span>
                      )}
                      {filters.tags.slice(0, 2).map(tagSlug => {
                        const tag = availableTags.find(t => t.slug === tagSlug);
                        return tag ? (
                          <span key={tagSlug} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                            {tag.name}
                          </span>
                        ) : null;
                      })}
                      {filters.tags.length > 2 && (
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                          +{filters.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="space-y-4">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">开始你的搜索之旅</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      使用左侧的搜索工具，输入关键词或选择标签来发现感兴趣的作品
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 搜索结果列表 */}
            {!isLoading && results.length > 0 && (
              <div className="space-y-6">
                {results.map((website, index) => (
                  <div 
                    key={website.id}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* 作品截图 */}
                      <div className="md:w-64 md:flex-shrink-0">
                        <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl overflow-hidden">
                          {website.screenshot ? (
                            <img
                              src={website.screenshot}
                              alt={website.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 作品信息 */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-xl font-bold text-slate-800 hover:text-blue-600 transition-colors duration-300">
                                <Link href={`/sites/${website.slug}`}>
                                  {website.title}
                                </Link>
                              </h3>
                              {website.featured && (
                                <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-xs font-bold rounded-full">
                                  ⭐ 精选
                                </span>
                              )}
                            </div>
                            
                            <p className="text-slate-600 leading-relaxed">
                              {website.shortDescription}
                            </p>
                          </div>
                        </div>

                        {/* 作者和统计信息 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img
                              src={website.author.avatar}
                              alt={website.author.username}
                              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                            />
                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                {website.author.username}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(website.createdAt).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-slate-500">
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
                        </div>

                        {/* 标签和操作 */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="flex flex-wrap gap-2">
                            {website.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag.id}
                                className={`px-3 py-1 rounded-lg text-sm font-medium border transition-all duration-300 hover:scale-105 ${getTagStyle(tag.color || 'blue')}`}
                              >
                                {tag.name}
                              </span>
                            ))}
                            {website.tags.length > 3 && (
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
                                +{website.tags.length - 3}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-3">
                            <a
                              href={website.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors duration-200"
                            >
                              访问网站
                            </a>
                            <Link
                              href={`/sites/${website.slug}`}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                            >
                              查看详情
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 无结果状态 */}
            {!isLoading && (filters.query || filters.tags.length > 0 || filters.author) && results.length === 0 && (
              <div className="text-center py-20">
                <div className="space-y-4">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">没有找到匹配的作品</h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    尝试调整搜索条件，使用不同的关键词或选择其他标签
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                  >
                    清空筛选条件
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 