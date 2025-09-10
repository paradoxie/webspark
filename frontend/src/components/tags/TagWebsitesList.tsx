'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Tag {
  id: number
  name: string
  slug: string
  description?: string
  color?: string
  websiteCount: number
}

interface Website {
  id: number
  title: string
  slug: string
  url: string
  shortDescription: string
  screenshot?: string
  likeCount: number
  viewCount: number
  createdAt: string
  author: {
    id: number
    username: string
    name: string
    avatar?: string
  }
  tags: Tag[]
}

interface Meta {
  pagination: {
    page: number
    pageSize: number
    pageCount: number
    total: number
  }
}

interface TagWebsitesListProps {
  tag: Tag
  initialWebsites: Website[]
  initialMeta: Meta
}

export default function TagWebsitesList({ 
  tag, 
  initialWebsites, 
  initialMeta 
}: TagWebsitesListProps) {
  const [websites, setWebsites] = useState<Website[]>(initialWebsites)
  const [meta, setMeta] = useState(initialMeta)
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular')
  const [page, setPage] = useState(1)
  const hasMore = page < meta.pagination.pageCount

  const handleSortChange = async (newSortBy: 'popular' | 'recent') => {
    if (newSortBy === sortBy || loading) return

    setSortBy(newSortBy)
    setLoading(true)

    try {
      const sortParam = newSortBy === 'popular' ? 'score' : 'createdAt'
      const response = await fetch(
        `/api/websites?tag=${tag.slug}&sort=${sortParam}&page=1&pageSize=12`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch websites')
      }

      const data = await response.json()
      setWebsites(data.data || [])
      setMeta(data.meta || { pagination: { page: 1, pageSize: 12, pageCount: 1, total: 0 } })
      setPage(1)
    } catch (error) {
      console.error('Error fetching websites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const sortParam = sortBy === 'popular' ? 'score' : 'createdAt'
      const response = await fetch(
        `/api/websites?tag=${tag.slug}&sort=${sortParam}&page=${page + 1}&pageSize=12`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch more websites')
      }

      const data = await response.json()
      setWebsites(prev => [...prev, ...data.data])
      setMeta(data.meta)
      setPage(page + 1)
    } catch (error) {
      console.error('Error loading more websites:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* 筛选和排序 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <span className="text-slate-700 font-medium">排序方式：</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as 'popular' | 'recent')}
            disabled={loading}
            className="border border-slate-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="popular">热门优先</option>
            <option value="recent">最新优先</option>
          </select>
          {loading && (
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
        </div>
        
        <div className="text-sm text-slate-600">
          共 {meta.pagination.total} 个作品
        </div>
      </div>

      {/* 作品网格 */}
      {websites.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {websites.map((website) => (
              <article key={website.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                {/* 作品截图 */}
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  {website.screenshot ? (
                    <Image
                      src={website.screenshot}
                      alt={website.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="w-12 h-12 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
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
                  {/* 悬浮链接 */}
                  <Link 
                    href={`/sites/${website.slug}`}
                    className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center"
                  >
                    <div className="opacity-0 hover:opacity-100 transition-opacity duration-300 bg-white rounded-full p-2">
                      <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </Link>
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
                  
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {website.shortDescription}
                  </p>

                  {/* 作者信息 */}
                  <div className="flex items-center justify-between mb-4">
                    <Link
                      href={`/users/${website.author.username}`}
                      className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                    >
                      <Image
                        src={website.author.avatar || 'https://i.pravatar.cc/150'}
                        alt={website.author.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <span className="text-sm text-slate-700 font-medium">
                        {website.author.name}
                      </span>
                    </Link>
                    
                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill={false ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
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
                      onClick={() => {
                        // 增加浏览量
                        fetch(`/api/websites/${website.id}/view`, { method: 'POST' }).catch(() => {})
                      }}
                    >
                      访问网站
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* 加载更多按钮 */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    加载中...
                  </span>
                ) : (
                  '加载更多作品'
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div 
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl text-white font-bold"
            style={{ backgroundColor: tag.color || '#6B7280' }}
          >
            <span className="select-none">
              {tag.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">暂无作品</h2>
          <p className="text-slate-600 text-lg mb-8">
            这个标签下还没有作品，快来提交第一个吧！
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all duration-300 transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            提交作品
          </Link>
        </div>
      )}
    </>
  )
}