import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import TagWebsitesList from '@/components/tags/TagWebsitesList'

interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  websiteCount: number;
}

interface Website {
  id: number;
  title: string;
  slug: string;
  url: string;
  shortDescription: string;
  screenshot?: string;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  author: {
    id: number;
    username: string;
    name: string;
    avatar?: string;
  };
  tags: Tag[];
}

interface TagData {
  tag: Tag
  websites: Website[]
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
  params: {
    slug: string
  }
}

// 获取标签数据
async function getTagData(slug: string): Promise<TagData | null> {
  try {
    // 获取标签信息
    const tagResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tags/${slug}`,
      { 
        next: { revalidate: 1800 }, // 30分钟缓存
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!tagResponse.ok) {
      if (tagResponse.status === 404) return null
      throw new Error('Failed to fetch tag')
    }
    
    const tagData = await tagResponse.json()
    const tag = tagData.data

    // 获取该标签下的网站
    const websitesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/websites?tag=${slug}&sort=score&page=1&pageSize=12`,
      { next: { revalidate: 1800 } }
    )
    
    if (!websitesResponse.ok) {
      throw new Error('Failed to fetch websites')
    }

    const websitesData = await websitesResponse.json()
    
    return {
      tag,
      websites: websitesData.data || [],
      meta: websitesData.meta || { pagination: { page: 1, pageSize: 12, pageCount: 1, total: 0 } }
    }
  } catch (error) {
    console.error('Error fetching tag data:', error)
    return null
  }
}

// 生成动态元数据
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tagData = await getTagData(params.slug)
  
  if (!tagData) {
    return {
      title: '标签未找到 - WebSpark.club',
      description: '您访问的标签可能已被删除或不存在'
    }
  }

  const { tag, meta } = tagData
  const title = `${tag.name} - 标签作品 - WebSpark.club`
  const description = tag.description 
    ? `${tag.description}。探索${tag.name}标签下的${meta.pagination.total}个优秀Web开发作品，发现相关技术的创新应用。`
    : `探索${tag.name}标签下的${meta.pagination.total}个优秀Web开发作品，发现相关技术的创新应用。`

  return {
    title,
    description,
    keywords: [
      tag.name,
      '标签作品',
      'web开发',
      '技术标签',
      '开发者项目'
    ].join(', '),
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: `https://webspark.club/tags/${tag.slug}`,
      title,
      description,
      siteName: 'WebSpark.club',
      images: [
        {
          url: `/api/og/tag?slug=${tag.slug}`,
          width: 1200,
          height: 630,
          alt: tag.name,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og/tag?slug=${tag.slug}`],
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
      canonical: `https://webspark.club/tags/${tag.slug}`,
    },
  }
}

// 生成静态路径
export async function generateStaticParams() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tags`,
      { next: { revalidate: 3600 } }
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch tags')
    }
    
    const data = await response.json()
    return (data.data || []).map((tag: Tag) => ({
      slug: tag.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

// 服务端渲染标签页面
export default async function TagDetailPage({ params }: PageProps) {
  const tagData = await getTagData(params.slug)
  
  if (!tagData) {
    notFound()
  }

  const { tag, websites: initialWebsites, meta: initialMeta } = tagData

  // 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: tag.name,
    description: tag.description,
    url: `https://webspark.club/tags/${tag.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: initialMeta.pagination.total,
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
        {/* 面包屑导航 */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link href="/" className="text-blue-600 hover:text-blue-700">
                    首页
                  </Link>
                </li>
                <li className="text-slate-500">/</li>
                <li>
                  <Link href="/tags" className="text-blue-600 hover:text-blue-700">
                    标签
                  </Link>
                </li>
                <li className="text-slate-500">/</li>
                <li className="text-slate-500" aria-current="page">
                  {tag.name}
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 标签信息头部 */}
          <header className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                  style={{ backgroundColor: tag.color || '#6B7280' }}
                >
                  <span className="select-none">
                    {tag.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    {tag.name}
                  </h1>
                  {tag.description && (
                    <p className="text-slate-600 text-lg">
                      {tag.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">
                  {initialMeta.pagination.total}
                </div>
                <div className="text-sm text-slate-600">个作品</div>
              </div>
            </div>
          </header>

          {/* 作品列表 - 使用客户端组件处理交互 */}
          <main>
            <TagWebsitesList 
              tag={tag}
              initialWebsites={initialWebsites}
              initialMeta={initialMeta}
            />
          </main>
        </div>
      </div>
    </>
  )
} 