import { Metadata } from 'next'
import Link from 'next/link'
import TagsSearchClient from '@/components/tags/TagsSearchClient'

interface Tag {
  id: number
  name: string
  slug: string
  description?: string
  color?: string
  websiteCount: number
}

// 获取所有标签数据
async function getTags(): Promise<Tag[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tags`,
      { 
        next: { revalidate: 3600 }, // 1小时缓存
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch tags')
    }
    
    const data = await response.json()
    
    // 获取每个标签的网站数量
    const tagsWithCount = await Promise.all(
      (data.data || []).map(async (tag: any) => {
        try {
          const websitesResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/websites?tag=${tag.slug}`,
            { next: { revalidate: 3600 } }
          )
          if (websitesResponse.ok) {
            const websitesData = await websitesResponse.json()
            return {
              ...tag,
              websiteCount: websitesData.meta?.pagination?.total || 0
            }
          }
          return { ...tag, websiteCount: 0 }
        } catch (error) {
          return { ...tag, websiteCount: 0 }
        }
      })
    )
    
    return tagsWithCount
  } catch (error) {
    console.error('Error fetching tags:', error)
    return []
  }
}

// SEO元数据
export const metadata: Metadata = {
  title: '作品标签 - WebSpark.club',
  description: '按技术栈、类型和主题浏览作品。探索React、Vue、Next.js、Node.js等热门技术标签，发现优秀的开发者项目和创意应用。',
  keywords: [
    '作品标签',
    '技术标签',
    'React',
    'Vue',
    'Next.js',
    'Node.js',
    'TypeScript',
    'JavaScript',
    '前端开发',
    '后端开发'
  ].join(', '),
  openGraph: {
    title: '作品标签 - WebSpark.club',
    description: '按技术栈、类型和主题浏览作品。探索热门技术标签，发现优秀的开发者项目。',
    type: 'website',
    url: 'https://webspark.club/tags',
  },
  twitter: {
    card: 'summary_large_image',
    title: '作品标签 - WebSpark.club',
    description: '按技术栈、类型和主题浏览作品。探索热门技术标签，发现优秀的开发者项目。',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://webspark.club/tags',
  },
}

// 服务端渲染标签页面
export default async function TagsPage() {
  const tags = await getTags()
  const totalWebsites = tags.reduce((sum, tag) => sum + tag.websiteCount, 0)
  const averageWebsites = tags.length > 0 ? Math.round(totalWebsites / tags.length) : 0
  const hotTags = tags.sort((a, b) => b.websiteCount - a.websiteCount).slice(0, 10)

  // 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '作品标签',
    description: '按技术栈、类型和主题浏览作品',
    url: 'https://webspark.club/tags',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: tags.length,
      itemListElement: tags.map((tag, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: tag.name,
          description: tag.description,
          url: `https://webspark.club/tags/${tag.slug}`,
        },
      })),
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
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/" className="text-blue-600 hover:text-blue-700">
                  首页
                </Link>
              </li>
              <li className="text-slate-500">/</li>
              <li className="text-slate-500" aria-current="page">
                标签
              </li>
            </ol>
          </nav>

          {/* 页面头部 */}
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              分类标签
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              按技术栈、类型和主题浏览作品。点击标签查看相关的所有作品。
            </p>
          </header>

          {/* 统计信息 */}
          <section className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-slate-900">{tags.length}</div>
                <div className="text-sm text-slate-600">总标签数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{totalWebsites}</div>
                <div className="text-sm text-slate-600">总作品数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{averageWebsites}</div>
                <div className="text-sm text-slate-600">平均作品数</div>
              </div>
            </div>
          </section>

          {/* 热门标签部分 */}
          {hotTags.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
                热门标签
              </h2>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {hotTags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${tag.slug}`}
                    className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow border border-slate-200 hover:border-blue-300 group"
                  >
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: tag.color || '#6B7280' }}
                    ></span>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600">
                      {tag.name}
                    </span>
                    <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {tag.websiteCount}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 主要内容 - 标签列表和搜索 */}
          <main>
            <TagsSearchClient initialTags={tags} />
          </main>
        </div>
      </div>
    </>
  )
} 