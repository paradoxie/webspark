'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface RecommendedWebsite {
  id: number
  title: string
  slug: string
  shortDescription: string
  likeCount: number
  viewCount: number
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
  author: {
    id: number
    name: string
    username: string
  }
}

interface RelatedContentProps {
  currentWebsiteId: number
  tags: string[]
  category?: string
  className?: string
}

export default function RelatedContent({ 
  currentWebsiteId, 
  tags, 
  category,
  className = ""
}: RelatedContentProps) {
  const [recommendations, setRecommendations] = useState<RecommendedWebsite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [currentWebsiteId, tags, category])

  const fetchRecommendations = async () => {
    try {
      const queryParams = new URLSearchParams({
        exclude: currentWebsiteId.toString(),
        limit: '6'
      })

      // 基于标签推荐
      if (tags.length > 0) {
        queryParams.append('tags', tags.join(','))
      }

      // 基于分类推荐  
      if (category) {
        queryParams.append('category', category)
      }

      const response = await fetch(`/api/websites/recommendations?${queryParams}`)
      
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-xl font-bold text-slate-900">相关推荐</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse bg-white p-4 rounded-lg shadow-md">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">
          🎯 相关推荐
        </h3>
        <Link
          href="/sites"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          查看更多 →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((website) => (
          <article key={website.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            <Link href={`/sites/${website.slug}`} className="block">
              <div className="p-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                  {website.title}
                </h4>
                <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                  {website.shortDescription}
                </p>

                {/* 标签 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {website.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>

                {/* 作者和统计 */}
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center">
                    <span className="text-slate-700">{website.author.name}</span>
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

      {/* SEO优化的内链 */}
      <div className="mt-8 p-4 bg-slate-50 rounded-lg">
        <h4 className="font-semibold text-slate-900 mb-3">发现更多</h4>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 5).map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
              className="px-3 py-1 bg-white text-slate-700 rounded-full text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              #{tag}
            </Link>
          ))}
          {category && (
            <Link
              href={`/categories/${encodeURIComponent(category.toLowerCase())}`}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              {category} 分类
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// 专门的内链推荐组件
export function InternalLinkRecommendations({ 
  tags, 
  category, 
  className = "" 
}: { 
  tags: string[], 
  category?: string, 
  className?: string 
}) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        探索相关内容
      </h3>
      
      <div className="space-y-4">
        {category && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">同类项目</h4>
            <Link
              href={`/categories/${encodeURIComponent(category.toLowerCase())}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              查看所有{category}项目 →
            </Link>
          </div>
        )}
        
        {tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">相关技术标签</h4>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 6).map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}
                  className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-blue-100 hover:text-blue-700 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">更多发现</h4>
          <div className="space-y-2 text-sm">
            <Link
              href="/sites?sort=popular"
              className="block text-slate-600 hover:text-blue-600 transition-colors"
            >
              🔥 热门项目
            </Link>
            <Link
              href="/sites?sort=recent"
              className="block text-slate-600 hover:text-blue-600 transition-colors"
            >
              ⭐ 最新上线
            </Link>
            <Link
              href="/tags"
              className="block text-slate-600 hover:text-blue-600 transition-colors"
            >
              🏷️ 所有技术标签
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}