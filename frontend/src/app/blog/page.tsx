import { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/common/Breadcrumb'

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  publishedAt: string
  readTime: number
  featured: boolean
  viewCount: number
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
  category: {
    id: number
    name: string
    slug: string
  }
  author: {
    id: number
    name: string
    username: string
    avatar?: string
  }
}

async function getBlogPosts(): Promise<{ posts: BlogPost[], total: number }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/blog/posts?featured=true&pageSize=12`, {
      next: { revalidate: 1800 } // 30分钟缓存
    })
    if (!response.ok) throw new Error('Failed to fetch blog posts')
    const data = await response.json()
    return { posts: data.data || [], total: data.total || 0 }
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return { posts: [], total: 0 }
  }
}

async function getBlogCategories() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/blog/categories`, {
      next: { revalidate: 3600 } // 1小时缓存
    })
    if (!response.ok) throw new Error('Failed to fetch blog categories')
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching blog categories:', error)
    return []
  }
}

export const metadata: Metadata = {
  title: '技术博客 - WebSpark.club开发者知识分享',
  description: '深入的Web开发技术文章、教程和最佳实践，涵盖React、Vue、Node.js、前端性能优化、SEO等开发者关心的热门技术话题。',
  keywords: [
    '技术博客',
    'Web开发',
    '前端教程', 
    'React教程',
    'Vue.js教程',
    'Node.js开发',
    '前端性能优化',
    'SEO优化',
    '开发者社区',
    'WebSpark.club'
  ].join(', '),
  openGraph: {
    title: '技术博客 - WebSpark.club开发者知识分享',
    description: '深入的Web开发技术文章、教程和最佳实践',
    type: 'website',
    url: 'https://webspark.club/blog',
    siteName: 'WebSpark.club',
  },
  twitter: {
    card: 'summary_large_image',
    title: '技术博客 - WebSpark.club开发者知识分享',
    description: '深入的Web开发技术文章、教程和最佳实践',
  },
  alternates: {
    canonical: 'https://webspark.club/blog',
    rss: 'https://webspark.club/blog/rss.xml',
  },
}

export default async function BlogIndexPage() {
  const [{ posts, total }, categories] = await Promise.all([
    getBlogPosts(),
    getBlogCategories()
  ])

  const breadcrumbItems = [
    { name: '首页', url: '/' },
    { name: '技术博客', url: '/blog' },
  ]

  // 博客页面结构化数据
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "WebSpark.club技术博客",
    "description": "深入的Web开发技术文章、教程和最佳实践",
    "url": "https://webspark.club/blog",
    "inLanguage": "zh-CN",
    "publisher": {
      "@type": "Organization",
      "name": "WebSpark.club",
      "url": "https://webspark.club"
    },
    "blogPost": posts.slice(0, 5).map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "url": `https://webspark.club/blog/${post.slug}`,
      "datePublished": post.publishedAt,
      "author": {
        "@type": "Person",
        "name": post.author.name,
        "url": `https://webspark.club/users/${post.author.username}`
      },
      "keywords": post.tags.map(tag => tag.name).join(', ')
    }))
  }

  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 面包屑导航 */}
          <div className="mb-8">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              📚 技术博客
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              深入的Web开发技术文章、教程和最佳实践，帮助开发者提升技术能力和解决实际问题
            </p>
            <div className="mt-6 flex justify-center space-x-4 text-sm text-slate-500">
              <span>📝 {total} 篇文章</span>
              <span>🏷️ {categories.length} 个分类</span>
              <span>👥 活跃社区讨论</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 主要内容区 */}
            <div className="lg:col-span-3">
              {/* 特色文章 */}
              {posts.length > 0 && posts.find(p => p.featured) && (
                <div className="mb-12">
                  <div className="flex items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">⭐ 特色推荐</h2>
                  </div>
                  {(() => {
                    const featuredPost = posts.find(p => p.featured)
                    if (!featuredPost) return null
                    return (
                      <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="p-8">
                          <div className="flex items-center space-x-2 mb-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                              {featuredPost.category.name}
                            </span>
                            <span className="text-slate-500 text-sm">•</span>
                            <span className="text-slate-500 text-sm">{featuredPost.readTime} 分钟阅读</span>
                          </div>
                          <Link href={`/blog/${featuredPost.slug}`}>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 hover:text-blue-600 transition-colors">
                              {featuredPost.title}
                            </h3>
                          </Link>
                          <p className="text-slate-600 mb-6 leading-relaxed">
                            {featuredPost.excerpt}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-sm">
                                  {featuredPost.author.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{featuredPost.author.name}</p>
                                <p className="text-sm text-slate-500">
                                  {new Date(featuredPost.publishedAt).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center text-sm text-slate-500">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {featuredPost.viewCount} 次阅读
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })()}
                </div>
              )}

              {/* 最新文章列表 */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">📰 最新文章</h2>
                  <Link
                    href="/blog/all"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    查看全部 →
                  </Link>
                </div>

                {posts.length > 0 ? (
                  <div className="space-y-6">
                    {posts.filter(p => !p.featured || posts.filter(fp => fp.featured).length === 0).map((post) => (
                      <article key={post.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center space-x-2 mb-3">
                          <Link href={`/blog/categories/${post.category.slug}`}>
                            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full hover:bg-blue-100 hover:text-blue-800 transition-colors">
                              {post.category.name}
                            </span>
                          </Link>
                          <span className="text-slate-500 text-sm">•</span>
                          <span className="text-slate-500 text-sm">{post.readTime} 分钟阅读</span>
                        </div>
                        
                        <Link href={`/blog/${post.slug}`}>
                          <h3 className="text-xl font-semibold text-slate-900 mb-3 hover:text-blue-600 transition-colors">
                            {post.title}
                          </h3>
                        </Link>
                        
                        <p className="text-slate-600 mb-4 leading-relaxed">
                          {post.excerpt}
                        </p>

                        {/* 标签 */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.slice(0, 4).map((tag) => (
                            <Link
                              key={tag.id}
                              href={`/blog/tags/${tag.slug}`}
                              className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded hover:bg-blue-100 hover:text-blue-700 transition-colors"
                            >
                              #{tag.name}
                            </Link>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Link href={`/users/${post.author.username}`}>
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-sm">
                                  {post.author.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </Link>
                            <div>
                              <Link href={`/users/${post.author.username}`}>
                                <p className="font-medium text-slate-900 hover:text-blue-600">{post.author.name}</p>
                              </Link>
                              <p className="text-sm text-slate-500">
                                {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-slate-500">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {post.viewCount}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow-md">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      即将推出技术博客
                    </h3>
                    <p className="text-slate-600">
                      我们正在准备精彩的技术内容，敬请期待！
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 侧边栏 */}
            <div className="lg:col-span-1">
              <div className="space-y-8">
                {/* 分类导航 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    技术分类
                  </h3>
                  <div className="space-y-2">
                    {categories.map((category: any) => (
                      <Link
                        key={category.id}
                        href={`/blog/categories/${category.slug}`}
                        className="block px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                      >
                        {category.name} ({category._count?.posts || 0})
                      </Link>
                    ))}
                  </div>
                </div>

                {/* RSS订阅 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                    订阅更新
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    订阅我们的RSS源，第一时间获取最新技术文章
                  </p>
                  <a
                    href="/blog/rss.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                    RSS 订阅
                  </a>
                </div>

                {/* 写作投稿 */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    ✍️ 成为作者
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    分享你的技术见解，帮助更多开发者成长
                  </p>
                  <Link
                    href="/blog/write"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    开始写作 →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}