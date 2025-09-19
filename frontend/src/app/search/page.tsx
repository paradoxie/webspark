import { Metadata } from 'next'
import { Suspense } from 'react'
import AdvancedSearchContent from '@/components/search/AdvancedSearchContent'
import Breadcrumb from '@/components/common/Breadcrumb'

interface PageProps {
  searchParams: { q?: string; type?: string }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = searchParams.q || ''
  const type = searchParams.type || 'all'
  
  const title = query 
    ? `搜索"${query}" - WebSpark.club`
    : '搜索作品 - WebSpark.club'
    
  const description = query
    ? `搜索关于"${query}"的开发者作品、项目和创意应用。在WebSpark.club发现与${query}相关的优秀web开发项目。`
    : '在WebSpark.club搜索优秀的开发者作品。通过关键词、技术标签、分类等方式找到你感兴趣的web开发项目和创意应用。'

  return {
    title,
    description,
    keywords: query ? [query, '搜索', 'web开发', '开发者作品', '项目搜索'].join(', ') : '搜索,web开发,开发者作品,项目搜索,技术栈,创意应用',
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://webspark.club/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      noarchive: query ? true : false, // 有搜索查询时不归档
    },
    alternates: {
      canonical: `https://webspark.club/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
    },
  }
}

export default function SearchPage({ searchParams }: PageProps) {
  const query = searchParams.q || ''
  const type = searchParams.type || 'all'

  // 面包屑导航数据
  const breadcrumbItems = [
    { name: '首页', url: '/' },
    { name: query ? `搜索：${query}` : '搜索作品', url: `/search${query ? `?q=${encodeURIComponent(query)}` : ''}` },
  ]

  // 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: query ? `搜索结果: ${query}` : '搜索页面',
    description: '在WebSpark.club搜索开发者作品和项目',
    url: `https://webspark.club/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://webspark.club/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 面包屑导航 */}
          <div className="mb-8">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* 页面标题 */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {query ? `搜索："${query}"` : '搜索作品'}
            </h1>
            <p className="text-slate-600">
              {query 
                ? `为您找到与"${query}"相关的开发者作品和项目`
                : '通过关键词、技术标签、分类等方式找到你感兴趣的web开发项目'
              }
            </p>
          </header>

          {/* 搜索内容组件 */}
          <Suspense fallback={<SearchFallback />}>
            <AdvancedSearchContent initialQuery={query} initialType={type} />
          </Suspense>
        </div>
      </div>
    </>
  )
}

// 搜索页面加载占位符
function SearchFallback() {
  return (
    <div className="space-y-8">
      {/* 搜索框骨架 */}
      <div className="animate-pulse">
        <div className="h-12 bg-slate-200 rounded-lg w-full max-w-2xl"></div>
      </div>

      {/* 筛选器骨架 */}
      <div className="flex gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-200 rounded-lg w-24"></div>
        ))}
      </div>

      {/* 结果骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-slate-100 rounded-full w-16"></div>
                <div className="h-6 bg-slate-100 rounded-full w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}