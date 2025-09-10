'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Website {
  id: number
  title: string
  slug: string
  url: string
  shortDescription: string
  likeCount: number
  viewCount: number
  createdAt: string
  author: {
    id: number
    username: string
    name: string
    avatar?: string
  }
  tags: Array<{
    id: number
    name: string
    slug: string
    color?: string
  }>
  category?: {
    id: number
    name: string
    slug: string
    icon: string
    color: string
  }
}

interface SearchContentProps {
  initialQuery: string
  initialType: string
}

const searchTypes = [
  { value: 'all', label: '全部', icon: '🔍' },
  { value: 'websites', label: '作品', icon: '🎨' },
  { value: 'categories', label: '分类', icon: '📂' },
  { value: 'tags', label: '标签', icon: '🏷️' },
]

const popularSearches = [
  'React', 'Vue', 'Next.js', 'TypeScript', 'JavaScript',
  'Node.js', 'Python', '前端', '后端', '全栈',
  '机器学习', 'AI', '区块链', '游戏开发', 'UI设计'
]

export default function SearchContent({ initialQuery, initialType }: SearchContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [type, setType] = useState(initialType)
  const [results, setResults] = useState<Website[]>([])
  const [loading, setLoading] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // 执行搜索
  const performSearch = async (searchQuery: string, searchType: string, page: number = 1) => {
    if (!searchQuery.trim()) {
      setResults([])
      setTotalResults(0)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType,
        page: page.toString(),
        pageSize: '12'
      })

      const response = await fetch(`/api/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        
        if (page === 1) {
          setResults(data.data || [])
        } else {
          setResults(prev => [...prev, ...(data.data || [])])
        }
        
        setTotalResults(data.meta?.total || 0)
        setHasMore(data.meta?.hasMore || false)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 处理搜索输入
  const handleSearch = (newQuery: string) => {
    if (newQuery !== query) {
      setQuery(newQuery)
      
      // 更新URL
      const params = new URLSearchParams(searchParams)
      if (newQuery) {
        params.set('q', newQuery)
      } else {
        params.delete('q')
      }
      router.push(`/search?${params.toString()}`)
      
      performSearch(newQuery, type)
    }
  }

  // 处理类型筛选
  const handleTypeChange = (newType: string) => {
    setType(newType)
    
    const params = new URLSearchParams(searchParams)
    params.set('type', newType)
    if (query) params.set('q', query)
    router.push(`/search?${params.toString()}`)
    
    if (query) {
      performSearch(query, newType)
    }
  }

  // 加载更多
  const handleLoadMore = () => {
    if (!loading && hasMore && query) {
      performSearch(query, type, currentPage + 1)
    }
  }

  // 处理热门搜索点击
  const handlePopularSearch = (searchTerm: string) => {
    setQuery(searchTerm)
    const params = new URLSearchParams()
    params.set('q', searchTerm)
    params.set('type', type)
    router.push(`/search?${params.toString()}`)
    performSearch(searchTerm, type)
  }

  // 初始化搜索
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, initialType)
    }
  }, [initialQuery, initialType])

  // 推荐的搜索建议
  const searchSuggestions = useMemo(() => {
    if (!query || query.length < 2) return []
    
    return popularSearches
      .filter(term => term.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
  }, [query])

  return (
    <div className="space-y-8">
      {/* 搜索框和筛选器 */}
      <div className="space-y-6">
        {/* 搜索框 */}
        <div className="relative max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(query)
              }
            }}
            placeholder="搜索作品、标签、作者或技术栈..."
            className="w-full px-6 py-4 pl-12 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={() => handleSearch(query)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            搜索
          </button>

          {/* 搜索建议 */}
          {searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
              {searchSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handlePopularSearch(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="flex items-center">
                    <svg className="w-4 h-4 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {suggestion}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 类型筛选器 */}
        <div className="flex gap-2 flex-wrap">
          {searchTypes.map((searchType) => (
            <button
              key={searchType.value}
              onClick={() => handleTypeChange(searchType.value)}
              className={`px-4 py-2 rounded-lg border font-medium transition-all ${
                type === searchType.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <span className="mr-2">{searchType.icon}</span>
              {searchType.label}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索结果 */}
      {query ? (
        <div>
          {/* 结果统计 */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-slate-600">
              {loading && currentPage === 1 ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  搜索中...
                </div>
              ) : (
                `找到 ${totalResults} 个相关结果`
              )}
            </div>
          </div>

          {/* 结果列表 */}
          {results.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((website) => (
                  <article key={website.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                    <Link href={`/sites/${website.slug}`} className="block">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                          {website.title}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                          {website.shortDescription}
                        </p>

                        {/* 标签 */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {website.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              style={tag.color ? { backgroundColor: tag.color + '20', color: tag.color } : {}}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>

                        {/* 作者和统计 */}
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <div className="flex items-center">
                            <Image
                              src={website.author.avatar || 'https://i.pravatar.cc/150'}
                              alt={website.author.name}
                              width={20}
                              height={20}
                              className="rounded-full mr-2"
                            />
                            {website.author.name}
                          </div>
                          <div className="flex items-center space-x-3">
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
                      </div>
                    </Link>
                  </article>
                ))}
              </div>

              {/* 加载更多 */}
              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {loading ? '加载中...' : '加载更多'}
                  </button>
                </div>
              )}
            </div>
          ) : !loading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">未找到相关结果</h3>
              <p className="text-slate-600 mb-6">尝试调整搜索关键词或使用其他筛选条件</p>
              <div className="flex flex-wrap justify-center gap-2">
                {popularSearches.slice(0, 5).map((term) => (
                  <button
                    key={term}
                    onClick={() => handlePopularSearch(term)}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm hover:bg-slate-200 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* 无搜索查询时的热门搜索 */
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">🔥 热门搜索</h2>
            <div className="flex flex-wrap gap-3">
              {popularSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handlePopularSearch(term)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-all font-medium"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">💡 搜索建议</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">按技术栈搜索</h3>
                <div className="flex flex-wrap gap-2">
                  {['React', 'Vue', 'Next.js', 'Node.js', 'Python'].map((tech) => (
                    <button
                      key={tech}
                      onClick={() => handlePopularSearch(tech)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">按项目类型搜索</h3>
                <div className="flex flex-wrap gap-2">
                  {['前端', '后端', '全栈', 'UI设计', '游戏'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handlePopularSearch(type)}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}