import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import CategoryWebsitesList from '@/components/categories/CategoryWebsitesList'

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}

interface Website {
  id: number;
  title: string;
  slug: string;
  url: string;
  shortDescription: string;
  likeCount: number;
  viewCount: number;
  score: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  author: {
    id: number;
    username: string;
    name: string;
    avatar: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
    color?: string;
  }>;
}

interface CategoryData {
  data: Website[]
  category: Category
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

interface PageProps {
  params: { slug: string }
}

// 获取分类数据
async function getCategoryData(slug: string): Promise<CategoryData | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/categories/${slug}/websites?page=1&pageSize=12`,
      { 
        next: { revalidate: 1800 }, // 30分钟缓存
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error('Failed to fetch category data')
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching category data:', error)
    return null
  }
}

// 生成动态元数据
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const categoryData = await getCategoryData(params.slug)
  
  if (!categoryData) {
    return {
      title: '分类未找到 - WebSpark.club',
      description: '您访问的分类可能已被删除或不存在'
    }
  }

  const { category, meta } = categoryData
  const title = `${category.name} - 分类作品 - WebSpark.club`
  const description = `${category.description}。探索${category.name}分类下的${meta.pagination.total}个优秀Web开发作品，发现创新的应用和解决方案。`

  return {
    title,
    description,
    keywords: [
      category.name,
      '分类作品',
      'web开发',
      '开发者项目',
      '创意应用'
    ].join(', '),
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: `https://webspark.club/categories/${category.slug}`,
      title,
      description,
      siteName: 'WebSpark.club',
      images: [
        {
          url: `/api/og/category?slug=${category.slug}`,
          width: 1200,
          height: 630,
          alt: category.name,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og/category?slug=${category.slug}`],
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
      canonical: `https://webspark.club/categories/${category.slug}`,
    },
  }
}

// 生成静态路径
export async function generateStaticParams() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/categories`,
      { next: { revalidate: 3600 } }
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }
    
    const data = await response.json()
    return data.data.map((category: Category) => ({
      slug: category.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

// 服务端渲染分类页面
export default async function CategoryPage({ params }: PageProps) {
  const categoryData = await getCategoryData(params.slug)
  
  if (!categoryData) {
    notFound()
  }

  const { data: initialWebsites, category, meta } = categoryData

  // 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description,
    url: `https://webspark.club/categories/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: meta.pagination.total,
      itemListElement: initialWebsites.map((website, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: website.title,
          description: website.shortDescription,
          url: `https://webspark.club/sites/${website.slug}`,
          author: {
            '@type': 'Person',
            name: website.author.name,
          },
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
              <li>
                <Link href="/categories" className="text-blue-600 hover:text-blue-700">
                  分类
                </Link>
              </li>
              <li className="text-slate-500">/</li>
              <li className="text-slate-500" aria-current="page">
                {category.name}
              </li>
            </ol>
          </nav>

          {/* 分类头部 */}
          <header className="text-center mb-12">
            <div 
              className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center text-4xl shadow-xl"
              style={{ 
                backgroundColor: category.color + '20', 
                border: `3px solid ${category.color}30`
              }}
            >
              <span role="img" aria-label={category.name}>
                {category.icon}
              </span>
            </div>

            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              {category.name}
            </h1>
            
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
              {category.description}
            </p>

            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white shadow-md">
              <span className="text-sm font-medium text-slate-600">
                共 {meta.pagination.total} 个作品
              </span>
            </div>
          </header>

          {/* 作品列表 - 使用客户端组件处理交互 */}
          <main>
            <CategoryWebsitesList 
              initialWebsites={initialWebsites}
              category={category}
              meta={meta}
            />
          </main>
        </div>
      </div>
    </>
  )
} 