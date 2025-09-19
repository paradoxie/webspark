'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  color?: string;
}

interface SearchSuggestion {
  type: 'website' | 'tag' | 'author';
  value: string;
  label: string;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
}

export default function AdvancedSearch({ onSearch, loading = false }: AdvancedSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
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
  });

  useEffect(() => {
    fetchCategories();
    fetchTrendingData();
  }, []);

  useEffect(() => {
    // 防抖搜索建议
    if (filters.query.length >= 2) {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
      
      suggestionTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(filters.query);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [filters.query]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTrendingData = async () => {
    try {
      const response = await fetch('/api/search/trending');
      if (response.ok) {
        const data = await response.json();
        setPopularTags(data.data.tags.slice(0, 10) || []);
      }
    } catch (error) {
      console.error('Failed to fetch trending data:', error);
    }
  };

  const fetchSuggestions = async (query: string) => {
    try {
      const response = await fetch(`/api/search/suggestions?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleSearch = () => {
    onSearch(filters);
    setShowSuggestions(false);
    
    // 更新URL
    const params = new URLSearchParams();
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
    
    router.push(`/search?${params.toString()}`);
  };

  const handleReset = () => {
    const resetFilters: SearchFilters = {
      query: '',
      category: '',
      tags: [],
      author: '',
      dateRange: 'all',
      sortBy: 'newest',
      featured: null,
      hasSource: null,
      isHiring: null,
      minLikes: 0,
      minViews: 0,
    };
    setFilters(resetFilters);
    onSearch(resetFilters);
    router.push('/search');
  };

  const addTag = (tagName: string) => {
    if (!filters.tags.includes(tagName)) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tagName]
      }));
    }
  };

  const removeTag = (tagName: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagName)
    }));
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'tag') {
      addTag(suggestion.value);
    } else if (suggestion.type === 'author') {
      setFilters(prev => ({ ...prev, author: suggestion.value }));
    } else {
      setFilters(prev => ({ ...prev, query: suggestion.value }));
    }
    setShowSuggestions(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* 基础搜索 */}
      <div className="relative">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              placeholder="搜索作品、标签、作者..."
              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            
            {/* 搜索建议 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 z-10 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <span className={`text-xs px-2 py-1 rounded ${
                      suggestion.type === 'tag' ? 'bg-blue-100 text-blue-700' :
                      suggestion.type === 'author' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {suggestion.type === 'tag' ? '标签' : suggestion.type === 'author' ? '作者' : '作品'}
                    </span>
                    <span>{suggestion.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>搜索</span>
          </button>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <span>高级</span>
          </button>
        </div>
      </div>

      {/* 高级搜索选项 */}
      {showAdvanced && (
        <div className="mt-6 space-y-6 pt-6 border-t border-slate-200">
          {/* 分类和排序 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">分类</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部分类</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">排序方式</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">最新发布</option>
                <option value="oldest">最早发布</option>
                <option value="popular">最多点赞</option>
                <option value="views">最多浏览</option>
                <option value="hot">热度排序</option>
              </select>
            </div>
          </div>

          {/* 标签选择 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">标签</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {filters.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {popularTags.filter(tag => !filters.tags.includes(tag.name)).slice(0, 8).map(tag => (
                <button
                  key={tag.name}
                  onClick={() => addTag(tag.name)}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-full hover:border-blue-500 hover:text-blue-600"
                >
                  + {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* 筛选选项 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">时间范围</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部时间</option>
                <option value="day">最近24小时</option>
                <option value="week">最近一周</option>
                <option value="month">最近一月</option>
                <option value="year">最近一年</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">最少点赞数</label>
              <input
                type="number"
                min="0"
                value={filters.minLikes}
                onChange={(e) => setFilters(prev => ({ ...prev, minLikes: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">最少浏览数</label>
              <input
                type="number"
                min="0"
                value={filters.minViews}
                onChange={(e) => setFilters(prev => ({ ...prev, minViews: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* 布尔筛选 */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.featured === true}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  featured: e.target.checked ? true : null 
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">仅精选作品</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hasSource === true}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  hasSource: e.target.checked ? true : null 
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">有源码链接</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isHiring === true}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  isHiring: e.target.checked ? true : null 
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">作者正在求职</span>
            </label>
          </div>

          {/* 作者搜索 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">作者</label>
            <input
              type="text"
              value={filters.author}
              onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
              placeholder="搜索特定作者..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-200">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              重置筛选
            </button>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAdvanced(false)}
                className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
              >
                收起
              </button>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                应用筛选
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}