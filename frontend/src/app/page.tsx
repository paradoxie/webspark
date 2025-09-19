import { Metadata } from 'next'
import Link from 'next/link'
import SearchForm from '@/components/home/SearchForm'
import TopCategoriesSection from '@/components/home/TopCategoriesSection'

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

// 获取热门分类数据
async function getTopCategories(): Promise<Category[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/categories/top/3`,
      {
        next: { revalidate: 1800 }, // 30分钟缓存
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch top categories')
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching top categories:', error)
    return []
  }
}

// 获取公共统计数据
async function getPublicStats() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/stats/public`,
      {
        next: { revalidate: 3600 }, // 1小时缓存
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch public stats')
    }

    const data = await response.json()
    return data.data || { totalUsers: 0, totalWebsites: 0, totalCategories: 0 }
  } catch (error) {
    console.error('Error fetching public stats:', error)
    return { totalUsers: 0, totalWebsites: 0, totalCategories: 0 }
  }
}

// SEO元数据
export const metadata: Metadata = {
  title: 'WebSpark.club - 开发者作品展示与交流平台',
  description: '探索优秀的web开发作品，发现创新的应用和工具。WebSpark.club汇聚了来自全球开发者的精彩项目，涵盖前端框架、后端API、全栈应用、设计工具等多个领域。',
  keywords: [
    'web开发',
    '开发者作品',
    '项目展示',
    '编程作品',
    'React',
    'Vue',
    'Next.js',
    '前端开发',
    '后端开发',
    '全栈开发',
    '开源项目',
    '创意应用'
  ].join(', '),
  authors: [{ name: 'WebSpark.club' }],
  creator: 'WebSpark.club',
  publisher: 'WebSpark.club',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://webspark.club',
    title: 'WebSpark.club - 开发者作品展示与交流平台',
    description: '探索优秀的web开发作品，发现创新的应用和工具。汇聚全球开发者的精彩项目，涵盖前端、后端、全栈等多个领域。',
    siteName: 'WebSpark.club',
    images: [
      {
        url: '/api/og/home',
        width: 1200,
        height: 630,
        alt: 'WebSpark.club - 开发者作品展示平台',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebSpark.club - 开发者作品展示与交流平台',
    description: '探索优秀的web开发作品，发现创新的应用和工具。汇聚全球开发者的精彩项目。',
    images: ['/api/og/home'],
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
    canonical: 'https://webspark.club',
  },
}

// 服务端渲染首页
export default async function HomePage() {
  const [topCategories, publicStats] = await Promise.all([
    getTopCategories(),
    getPublicStats()
  ])

  // 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'WebSpark.club',
    description: '开发者作品展示与交流平台',
    url: 'https://webspark.club',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://webspark.club/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'WebSpark.club',
      url: 'https://webspark.club',
    },
  }

  const websiteCount = topCategories.reduce((total, cat) => total + cat.websiteCount, 0)

  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen bg-slate-50">
        {/* Hero区域 - 包含搜索 */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                发现优秀的
                <span className="text-yellow-300">开发者作品</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
                汇聚全球开发者的精彩项目，探索创新的web应用、工具和解决方案
              </p>
              
              {/* 统计数据 */}
              <div className="flex justify-center items-center space-x-8 mb-12 text-blue-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{websiteCount}+</div>
                  <div className="text-sm">精选作品</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{topCategories.length}</div>
                  <div className="text-sm">热门分类</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{publicStats.totalUsers}+</div>
                  <div className="text-sm">开发者</div>
                </div>
              </div>

              {/* 搜索表单 */}
              <SearchForm />
            </div>
          </div>
        </section>

        {/* 快速导航 */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/sites"
                className="inline-flex items-center px-6 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                浏览所有作品
              </Link>
              
              <Link
                href="/categories"
                className="inline-flex items-center px-6 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                探索分类
              </Link>
              
              <Link
                href="/submit"
                className="inline-flex items-center px-6 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                提交作品
              </Link>
            </div>
          </div>
        </section>

        {/* 热门分类作品 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <TopCategoriesSection initialCategories={topCategories} />
        </main>
      </div>
    </>
  )
} 