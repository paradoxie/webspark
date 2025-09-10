import { Metadata } from 'next'
import Link from 'next/link'

interface Category {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  color: string
  _count: {
    websites: number
  }
}

// 获取所有分类数据
async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/categories`,
      { 
        next: { revalidate: 3600 }, // 1小时缓存
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// SEO元数据
export const metadata: Metadata = {
  title: '作品分类 - WebSpark.club',
  description: '按类别探索不同类型的Web作品，包括前端框架、后端API、全栈应用、设计工具等多个分类。发现你感兴趣的开发者项目和创意应用。',
  keywords: [
    '作品分类',
    'web开发分类',
    '前端项目',
    '后端项目',
    '全栈应用',
    '开源项目',
    '开发工具',
    '设计工具'
  ].join(', '),
  openGraph: {
    title: '作品分类 - WebSpark.club',
    description: '按类别探索不同类型的Web作品，发现你感兴趣的开发者项目和创意应用。',
    type: 'website',
    url: 'https://webspark.club/categories',
  },
  twitter: {
    card: 'summary_large_image',
    title: '作品分类 - WebSpark.club',
    description: '按类别探索不同类型的Web作品，发现你感兴趣的开发者项目和创意应用。',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://webspark.club/categories',
  },
}

// 服务端渲染分类页面
export default async function CategoriesPage() {
  const categories = await getCategories()
  const totalWebsites = categories.reduce((sum, cat) => sum + cat._count.websites, 0)

  // 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '作品分类',
    description: '按类别探索不同类型的Web作品',
    url: 'https://webspark.club/categories',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: categories.length,
      itemListElement: categories.map((category, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CategoryPage',
          name: category.name,
          description: category.description,
          url: `https://webspark.club/categories/${category.slug}`,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                分类
              </li>
            </ol>
          </nav>

          {/* 页面标题 */}
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              浏览分类
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              按类别探索不同类型的Web作品，找到你感兴趣的内容
            </p>
          </header>

          {/* 分类网格 */}
          <main>
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {categories.map((category) => (
                  <article key={category.id}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 block h-full"
                    >
                      <div className="p-8 text-center h-full flex flex-col">
                        {/* 图标 */}
                        <div 
                          className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                          style={{ 
                            backgroundColor: category.color + '20', 
                            border: `2px solid ${category.color}30`
                          }}
                        >
                          <span role="img" aria-label={category.name}>
                            {category.icon}
                          </span>
                        </div>

                        {/* 分类名称 */}
                        <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </h2>

                        {/* 描述 */}
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed flex-grow">
                          {category.description}
                        </p>

                        {/* 作品数量 */}
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                          {category._count.websites} 个作品
                        </div>

                        {/* 悬浮效果 */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"
                          style={{ backgroundColor: category.color }}
                        ></div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-slate-400 text-8xl mb-6">📂</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">暂无分类</h2>
                <p className="text-slate-600 text-lg">
                  分类正在准备中，敬请期待！
                </p>
              </div>
            )}
          </main>

          {/* 统计信息 */}
          {categories.length > 0 && (
            <section className="mt-12 text-center">
              <div className="inline-flex items-center gap-6 bg-white rounded-xl shadow-md px-8 py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{categories.length}</div>
                  <div className="text-sm text-slate-600">个分类</div>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {totalWebsites}
                  </div>
                  <div className="text-sm text-slate-600">个作品</div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
} 