import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/common/Breadcrumb'
import SocialShare from '@/components/common/SocialShare'

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  publishedAt: string
  readTime: number
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
    bio?: string
  }
}

interface PageProps {
  params: { slug: string }
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/blog/posts/${slug}`, {
      next: { revalidate: 300 }
    })
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error('Failed to fetch blog post')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

async function getRelatedPosts(postId: number, tags: string[]): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/blog/posts/related?postId=${postId}&tags=${tags.join(',')}&limit=3`, {
      next: { revalidate: 1800 }
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching related posts:', error)
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getBlogPost(params.slug)
  
  if (!post) {
    return {
      title: '文章未找到 - WebSpark.club技术博客',
      description: '您访问的技术文章可能已被删除或不存在'
    }
  }

  const title = `${post.title} - WebSpark.club技术博客`
  const description = post.excerpt.length > 160 
    ? post.excerpt.substring(0, 157) + '...'
    : post.excerpt

  return {
    title,
    description,
    keywords: [
      post.title,
      ...post.tags.map(tag => tag.name),
      post.category.name,
      '技术博客',
      'Web开发',
      post.author.name
    ].join(', '),
    authors: [{ name: post.author.name }],
    creator: post.author.name,
    publisher: 'WebSpark.club',
    openGraph: {
      type: 'article',
      locale: 'zh_CN',
      url: `https://webspark.club/blog/${post.slug}`,
      title,
      description,
      siteName: 'WebSpark.club',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags.map(tag => tag.name),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: `@${post.author.username}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `https://webspark.club/blog/${post.slug}`,
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getBlogPost(params.slug)
  
  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(post.id, post.tags.map(t => t.name))

  const breadcrumbItems = [
    { name: '首页', url: '/' },
    { name: '技术博客', url: '/blog' },
    { name: post.category.name, url: `/blog/categories/${post.category.slug}` },
    { name: post.title, url: `/blog/${post.slug}` },
  ]

  // 博客文章结构化数据
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: `https://webspark.club/api/og/blog?slug=${post.slug}`,
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: `https://webspark.club/users/${post.author.username}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'WebSpark.club',
      url: 'https://webspark.club',
    },
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://webspark.club/blog/${post.slug}`,
    },
    keywords: post.tags.map(tag => tag.name).join(', '),
    wordCount: post.content.length,
    timeRequired: `PT${post.readTime}M`,
    articleSection: post.category.name,
    inLanguage: 'zh-CN',
  }

  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 面包屑导航 */}
          <div className="mb-8">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* 文章主体 */}
          <article className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* 文章头部 */}
            <header className="p-8 border-b border-slate-200">
              <div className="flex items-center space-x-2 mb-4">
                <Link href={`/blog/categories/${post.category.slug}`}>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full hover:bg-blue-200 transition-colors">
                    {post.category.name}
                  </span>
                </Link>
                <span className="text-slate-500 text-sm">•</span>
                <span className="text-slate-500 text-sm">{post.readTime} 分钟阅读</span>
                <span className="text-slate-500 text-sm">•</span>
                <span className="text-slate-500 text-sm">{post.viewCount} 次阅读</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                {post.title}
              </h1>
              
              <p className="text-xl text-slate-600 mb-6 leading-relaxed">
                {post.excerpt}
              </p>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/blog/tags/${tag.slug}`}
                    className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>

              {/* 作者信息 */}
              <div className="flex items-center space-x-4">
                <Link href={`/users/${post.author.username}`}>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    {post.author.avatar ? (
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <span className="text-blue-600 font-medium">
                        {post.author.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </Link>
                <div>
                  <Link href={`/users/${post.author.username}`}>
                    <p className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
                      {post.author.name}
                    </p>
                  </Link>
                  <p className="text-sm text-slate-500">
                    发布于 {new Date(post.publishedAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </header>

            {/* 文章内容 */}
            <div className="p-8">
              <div 
                className="prose prose-lg max-w-none prose-slate prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-white"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

            {/* 社交分享 */}
            <div className="px-8 pb-8">
              <SocialShare
                url={`https://webspark.club/blog/${post.slug}`}
                title={`${post.title} - WebSpark.club技术博客`}
                description={post.excerpt}
                via="WebSparkClub"
              />
            </div>
          </article>

          {/* 相关文章推荐 */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">📖 相关文章</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <article key={relatedPost.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <Link href={`/blog/${relatedPost.slug}`} className="block">
                      <div className="p-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                            {relatedPost.category.name}
                          </span>
                          <span className="text-slate-500 text-xs">{relatedPost.readTime}分钟</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                          {relatedPost.title}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-3 mb-4">
                          {relatedPost.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{relatedPost.author.name}</span>
                          <span>{new Date(relatedPost.publishedAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* 返回博客首页 */}
          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ← 返回技术博客首页
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}