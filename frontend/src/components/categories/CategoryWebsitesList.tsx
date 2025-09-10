'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface Website {
  id: number
  title: string
  slug: string
  url: string
  shortDescription: string
  likeCount: number
  viewCount: number
  score: number
  isLiked: boolean
  isBookmarked: boolean
  createdAt: string
  author: {
    id: number
    username: string
    name: string
    avatar: string
  }
  tags: Array<{
    id: number
    name: string
    slug: string
    color?: string
  }>
}

interface Category {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  color: string
}

interface Meta {
  pagination: {
    page: number
    pageSize: number
    pageCount: number
    total: number
  }
}

interface CategoryWebsitesListProps {
  initialWebsites: Website[]
  category: Category
  meta: Meta
}

export default function CategoryWebsitesList({ 
  initialWebsites, 
  category, 
  meta: initialMeta 
}: CategoryWebsitesListProps) {
  const { data: session } = useSession()
  const [websites, setWebsites] = useState<Website[]>(initialWebsites)
  const [meta, setMeta] = useState(initialMeta)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const hasMore = page < meta.pagination.pageCount

  const handleLoadMore = async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/categories/${category.slug}/websites?page=${page + 1}&pageSize=12`
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
      toast.error('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (websiteId: number) => {
    if (!session) {
      window.location.href = '/auth/signin'
      return
    }

    try {
      const response = await fetch(`/api/websites/${websiteId}/like`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.data.action === 'like' ? '点赞成功！' : '已取消点赞')
        
        setWebsites(prev => prev.map(site => 
          site.id === websiteId 
            ? { 
                ...site, 
                isLiked: result.data.action === 'like', 
                likeCount: result.data.likeCount || site.likeCount + (result.data.action === 'like' ? 1 : -1)
              }
            : site
        ))
      } else {
        throw new Error('点赞失败')
      }
    } catch (err) {
      console.error('Failed to toggle like:', err)
      toast.error('点赞失败，请重试')
    }
  }

  const handleBookmark = async (websiteId: number) => {
    if (!session) {
      window.location.href = '/auth/signin'
      return
    }

    try {
      const response = await fetch(`/api/websites/${websiteId}/bookmark`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.data.action === 'bookmark' ? '收藏成功！' : '已取消收藏')
        
        setWebsites(prev => prev.map(site => 
          site.id === websiteId 
            ? { 
                ...site, 
                isBookmarked: result.data.action === 'bookmark'
              }
            : site
        ))
      } else {
        throw new Error('收藏失败')
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
      toast.error('收藏失败，请重试')
    }
  }

  if (websites.length === 0) {
    return (
      <div className="text-center py-16">
        <div 
          className="w-32 h-32 mx-auto mb-6 rounded-3xl flex items-center justify-center text-5xl shadow-xl"
          style={{ 
            backgroundColor: category.color + '10', 
            border: `3px solid ${category.color}20`
          }}
        >
          <span role="img" aria-label={category.name}>
            {category.icon}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">暂无作品</h2>
        <p className="text-slate-600 text-lg mb-8">
          这个分类下还没有任何作品，快来成为第一个贡献者吧！
        </p>
        <Link
          href="/submit"
          className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 font-semibold transition-all duration-300 transform hover:scale-105"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          提交作品
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {websites.map((website) => (
          <article key={website.id} className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
            <Link href={`/sites/${website.slug}`}>
              <div className="p-6">
                {/* 标题和描述 */}
                <header className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {website.title}
                  </h3>
                  <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                    {website.shortDescription}
                  </p>
                </header>
                
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
              </div>
            </Link>
            
            {/* 作者信息 */}
            <div className="px-6">
              <Link
                href={`/users/${website.author.username}`}
                className="flex items-center space-x-3 mb-4 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                onClick={(e) => e.stopPropagation()}
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
            </div>
            
            {/* 统计和操作 */}
            <footer className="px-6 pb-4">
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {website.viewCount}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill={website.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {website.likeCount}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleLike(website.id)
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      website.isLiked 
                        ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                        : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                    title={website.isLiked ? '取消点赞' : '点赞'}
                  >
                    <svg className="w-5 h-5" fill={website.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleBookmark(website.id)
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      website.isBookmarked 
                        ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                        : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-50'
                    }`}
                    title={website.isBookmarked ? '取消收藏' : '收藏'}
                  >
                    <svg className="w-5 h-5" fill={website.isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
              </div>
            </footer>
          </article>
        ))}
      </div>

      {/* 加载更多 */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                加载中...
              </span>
            ) : (
              '加载更多'
            )}
          </button>
        </div>
      )}
    </>
  )
}