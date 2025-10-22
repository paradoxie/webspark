import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ClientInteractions from '@/components/sites/ClientInteractions'
import CommentSection from '@/components/common/CommentSection'
import Breadcrumb from '@/components/common/Breadcrumb'
import { WebsiteScreenshot, UserAvatar } from '@/components/common/SEOOptimizedImage'
import RelatedContent, { InternalLinkRecommendations } from '@/components/common/RelatedContent'
import SocialShare from '@/components/common/SocialShare'
import BacklinkAnalytics from '@/components/common/BacklinkAnalytics'

interface Website {
  id: number
  title: string
  slug: string
  url: string
  shortDescription: string
  description: string
  sourceUrl?: string
  status: string
  featured: boolean
  likeCount: number
  viewCount: number
  createdAt: string
  updatedAt: string
  author: {
    id: number
    name: string
    username: string
    avatar?: string
  }
  tags: Array<{
    id: number
    name: string
    slug: string
    color: string
  }>
  category?: {
    id: number
    name: string
    slug: string
    icon: string
    color: string
  }
  isLiked?: boolean
  isBookmarked?: boolean
}

interface PageProps {
  params: { slug: string }
}

async function getWebsite(slug: string): Promise<Website | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/websites/slug/${slug}`,
      { 
        next: { revalidate: 300 }, // 5分钟缓存
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error('Failed to fetch website')
    }
    
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching website:', error)
    return null
  }
}

// 动态生成meta标签 - SEO关键！
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const website = await getWebsite(params.slug)
  
  if (!website) {
    return {
      title: '作品未找到 - WebSpark.club',
      description: '您访问的作品可能已被删除或不存在'
    }
  }

  const title = `${website.title} - WebSpark.club`
  const description = website.shortDescription.length > 160 
    ? website.shortDescription.substring(0, 157) + '...'
    : website.shortDescription

  return {
    title,
    description,
    keywords: [
      website.title,
      ...website.tags.map(tag => tag.name),
      'web开发',
      '开发者作品',
      'web应用',
      website.author.name
    ].join(', '),
    authors: [{ name: website.author.name }],
    creator: website.author.name,
    publisher: 'WebSpark.club',
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: `https://webspark.club/sites/${website.slug}`,
      title,
      description,
      siteName: 'WebSpark.club',
      images: [
        {
          url: `/api/og/website?slug=${website.slug}`, // 动态OG图片
          width: 1200,
          height: 630,
          alt: website.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og/website?slug=${website.slug}`],
      creator: `@${website.author.username}`,
    },
    robots: {
      index: website.status === 'APPROVED',
      follow: website.status === 'APPROVED',
      googleBot: {
        index: website.status === 'APPROVED',
        follow: website.status === 'APPROVED',
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `https://webspark.club/sites/${website.slug}`,
      amphtml: `https://webspark.club/sites/${website.slug}/amp`,
    },
  }
}

// 生成静态路径 - 预构建所有作品页面
export async function generateStaticParams() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/websites?status=APPROVED&pageSize=1000`,
      { next: { revalidate: 3600 } }
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch websites')
    }
    
    const data = await response.json()
    return data.data.map((website: Website) => ({
      slug: website.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

// 服务端渲染页面组件
export default async function WebsiteDetailPage({ params }: PageProps) {
  const website = await getWebsite(params.slug)
  
  if (!website || website.status !== 'APPROVED') {
    notFound()
  }

  // 面包屑导航数据
  const breadcrumbItems = [
    { name: '首页', url: '/' },
    { name: '作品', url: '/sites' },
    ...(website.category ? [{ name: website.category.name, url: `/categories/${website.category.slug}` }] : []),
    { name: website.title, url: `/sites/${website.slug}` },
  ]

  // 结构化数据 - SEO关键！
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: website.title,
    description: website.shortDescription,
    applicationCategory: 'WebApplication',
    operatingSystem: 'Web',
    url: website.url,
    author: {
      '@type': 'Person',
      name: website.author.name,
      url: `https://webspark.club/users/${website.author.username}`,
    },
    creator: {
      '@type': 'Person',
      name: website.author.name,
    },
    datePublished: website.createdAt,
    dateModified: website.updatedAt,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Math.min(5, Math.max(1, website.likeCount / 10 + 3)),
      ratingCount: Math.max(1, website.likeCount),
      bestRating: 5,
      worstRating: 1,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    keywords: website.tags.map(tag => tag.name).join(', '),
    screenshot: `/api/og/website?slug=${website.slug}`,
  }

  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* AMP页面链接 */}
      <link rel="amphtml" href={`https://webspark.club/sites/${website.slug}/amp`} />
      
      <div className="min-h-screen bg-slate-50">
        {/* 面包屑导航 - SEO优化 */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* 主要内容 */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧：网站预览 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* 网站预览区域 */}
                <div className="bg-gray-100 p-8 text-center">
                  <div className="bg-white rounded-lg shadow-lg p-4 inline-block">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">网站预览</p>
                    <a
                      href={website.url}
                      target="_blank"
                      rel={website.likeCount >= 50 || website.featured ? 'noopener' : website.likeCount >= 10 ? 'noopener ugc' : 'noopener nofollow ugc'}
                      onClick={() => {
                        // 简单的点击统计
                        fetch(`/api/websites/${website.id}/track-click`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ linkType: 'main' })
                        }).catch(() => {});
                      }}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
                    >
                      访问网站 →
                    </a>
                  </div>
                </div>

                {/* 客户端交互组件 */}
                <ClientInteractions 
                  websiteId={website.id}
                  initialLikeCount={website.likeCount}
                  initialIsLiked={website.isLiked || false}
                  initialIsBookmarked={website.isBookmarked || false}
                  viewCount={website.viewCount}
                  sourceUrl={website.sourceUrl}
                />
              </div>
            </div>

            {/* 右侧：网站信息 */}
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">{website.title}</h1>
                <p className="text-slate-600 mb-6">{website.shortDescription}</p>

                {/* 标签 */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {website.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${tag.slug}`}
                      className="inline-block px-3 py-1 text-sm font-medium rounded-full transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>

                {/* SEO价值标签 */}
                {(website.likeCount >= 50 || website.featured) && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">🚀</span>
                      <span className="text-sm font-medium text-green-800">
                        此作品传递SEO权重 (DoFollow)
                      </span>
                    </div>
                  </div>
                )}

                {/* 作者信息 */}
                <div className="flex items-center space-x-3 pb-6 border-b border-slate-200">
                  <Link href={`/users/${website.author.username}`}>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {website.author.avatar ? (
                        <Image
                          src={website.author.avatar}
                          alt={website.author.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <span className="text-blue-600 font-medium">
                          {website.author.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div>
                    <Link href={`/users/${website.author.username}`}>
                      <p className="font-medium text-slate-900 hover:text-blue-600">
                        {website.author.name}
                      </p>
                    </Link>
                    <p className="text-sm text-slate-500">@{website.author.username}</p>
                  </div>
                </div>

                {/* AMP 版本链接 */}
                <div className="pt-4">
                  <Link
                    href={`/sites/${website.slug}/amp`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ⚡ 查看 AMP 版本（极速加载）
                  </Link>
                </div>

                {/* 提交时间 */}
                <div className="pt-6">
                  <p className="text-sm text-slate-500">
                    发布于 <time dateTime={website.createdAt}>
                      {new Date(website.createdAt).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </p>
                </div>
              </div>

              {/* 详细描述 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">详细描述</h2>
                <div className="prose prose-sm max-w-none text-slate-600">
                  {website.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* 社交分享SEO优化 */}
              <SocialShare
                url={`https://webspark.club/sites/${website.slug}`}
                title={`${website.title} - 开发者作品 | WebSpark.club`}
                description={website.shortDescription}
                image={`https://webspark.club/api/og/website?slug=${website.slug}`}
                via="WebSparkClub"
              />

              {/* 外链价值分析（仅作者可见） */}
              <BacklinkAnalytics
                websiteId={website.id}
                websiteTitle={website.title}
                authorId={website.author.id}
                className="mt-6"
              />
            </div>
          </div>

          {/* 相关作品推荐和内链优化 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
            <div className="lg:col-span-2">
              <RelatedContent
                currentWebsiteId={website.id}
                tags={website.tags.map(tag => tag.name)}
                category={website.category?.name}
              />
            </div>
            <div className="lg:col-span-1">
              <InternalLinkRecommendations
                tags={website.tags.map(tag => tag.name)}
                category={website.category?.name}
              />
            </div>
          </div>

          {/* 评论区 - 客户端组件 */}
          <section className="mt-8">
            <CommentSection websiteId={website.id} />
          </section>
        </main>
      </div>
    </>
  )
}