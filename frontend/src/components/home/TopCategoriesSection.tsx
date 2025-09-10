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
  isLiked?: boolean
  isBookmarked?: boolean
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
  category?: {
    id: number
    name: string
    slug: string
    icon: string
    color: string
  }
}

interface Category {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  color: string
  websiteCount: number
  websites: Website[]
}

interface TopCategoriesSectionProps {
  initialCategories: Category[]
}

export default function TopCategoriesSection({ initialCategories }: TopCategoriesSectionProps) {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<Category[]>(initialCategories)

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
        
        setCategories(prevCategories => 
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
        )
      } else {
        throw new Error('API请求失败')
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
        
        setCategories(prevCategories => 
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
        )
      } else {
        throw new Error('API请求失败')
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
      toast.error('收藏失败，请重试')
    }
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🚀</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">即将上线</h2>
        <p className="text-slate-600">精彩的开发者作品正在路上...</p>
      </div>
    )
  }

  return (
    <div className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">热门分类作品</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          探索各类别中最受欢迎的作品，发现优秀的开发创意和技术实现
        </p>
      </div>

      <div className="space-y-16">
        {categories.map((category) => (
          <section key={category.id} className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <span 
                  className="text-3xl mr-4"
                  style={{ color: category.color }}
                >
                  {category.icon}
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {category.name}
                  </h3>
                  <p className="text-slate-600 mt-1">{category.description}</p>
                </div>
                <span className="ml-4 text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {category.websiteCount} 个作品
                </span>
              </div>
              <Link
                href={`/categories/${category.slug}`}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center group"
              >
                查看全部
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {category.websites.map((website, index) => (
                index < 4 ? (
                  <article
                    key={website.id}
                    className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                  >
                    <Link href={`/sites/${website.slug}`}>
                      <div className="p-6">
                        {/* 标题和描述 */}
                        <header className="mb-4">
                          <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {website.title}
                          </h4>
                          <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                            {website.shortDescription}
                          </p>
                        </header>
                        
                        {/* 标签 */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {website.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              style={tag.color ? { backgroundColor: tag.color + '20', color: tag.color } : {}}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {website.tags.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                              +{website.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    
                    {/* 底部区域：作者和操作 */}
                    <footer className="px-6 pb-4 flex items-center justify-between">
                      {/* 作者信息 */}
                      <Link
                        href={`/users/${website.author.username}`}
                        className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Image
                          src={website.author.avatar || 'https://i.pravatar.cc/150'}
                          alt={website.author.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        <span className="text-xs text-slate-500 font-medium">
                          {website.author.name}
                        </span>
                      </Link>
                      
                      {/* 操作按钮 */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleLike(website.id)
                          }}
                          className={`p-2 rounded-md transition-colors ${
                            website.isLiked 
                              ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={website.isLiked ? '取消点赞' : '点赞'}
                        >
                          <svg className="w-4 h-4" fill={website.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleBookmark(website.id)
                          }}
                          className={`p-2 rounded-md transition-colors ${
                            website.isBookmarked 
                              ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                              : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-50'
                          }`}
                          title={website.isBookmarked ? '取消收藏' : '收藏'}
                        >
                          <svg className="w-4 h-4" fill={website.isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                        
                        <span className="flex items-center text-xs text-slate-400 ml-2">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {website.likeCount}
                        </span>
                      </div>
                    </footer>
                  </article>
                ) : index === 4 ? (
                  <Link
                    key={`more-${category.id}`}
                    href={`/categories/${category.slug}`}
                    className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center hover:border-blue-300 hover:from-blue-50 hover:to-blue-100 transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                  >
                    <div className="p-8 text-center">
                      <div className="text-4xl text-slate-400 mb-3 group-hover:text-blue-500 transition-colors">
                        +{category.websiteCount - 4}
                      </div>
                      <p className="text-slate-600 group-hover:text-blue-600 font-medium transition-colors">
                        查看更多作品
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        探索{category.name}分类
                      </p>
                    </div>
                  </Link>
                ) : null
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* CTA区域 */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white mt-16">
        <h3 className="text-2xl font-bold mb-4">展示你的创意作品</h3>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          加入WebSpark.club社区，与全球开发者分享你的项目，获得认可和反馈
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/submit"
            className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-bold"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            提交作品
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-bold"
          >
            了解更多
          </Link>
        </div>
      </section>
    </div>
  )
}