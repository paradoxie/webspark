import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { UserAvatar } from '@/components/common/SEOOptimizedImage'
import Breadcrumb from '@/components/common/Breadcrumb'

interface User {
  id: number
  username: string
  name: string
  avatar?: string
  bio?: string
  website?: string
  github?: string
  twitter?: string
  email?: string
  location?: string
  createdAt: string
  _count: {
    websites: number
    likes: number
  }
}

interface Website {
  id: number
  title: string
  slug: string
  shortDescription: string
  url: string
  likeCount: number
  viewCount: number
  createdAt: string
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
  category?: {
    id: number
    name: string
    slug: string
  }
}

interface PageProps {
  params: { username: string }
}

async function getUser(username: string): Promise<User | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/${username}`, {
      next: { revalidate: 3600 } // 缓存1小时
    })
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Failed to fetch user: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

async function getUserWebsites(username: string): Promise<Website[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/${username}/websites?status=APPROVED&pageSize=20`, {
      next: { revalidate: 1800 } // 缓存30分钟
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching user websites:', error)
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getUser(params.username)
  
  if (!user) {
    return {
      title: '用户未找到 - WebSpark.club',
      description: '该用户不存在或已被删除',
      robots: { index: false, follow: true }
    }
  }

  const title = `${user.name} (@${user.username}) - WebSpark.club开发者`
  const description = user.bio || `${user.name}在WebSpark.club上的开发者作品集，已发布${user._count.websites}个项目，获得${user._count.likes}个赞。`
  
  return {
    title,
    description,
    keywords: [
      user.name,
      user.username,
      'web开发者',
      '开发者作品集',
      '项目展示',
      'WebSpark.club'
    ].join(', '),
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `https://webspark.club/users/${user.username}`,
      images: user.avatar ? [{
        url: user.avatar,
        width: 400,
        height: 400,
        alt: `${user.name}的头像`
      }] : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: user.avatar ? [user.avatar] : [],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `https://webspark.club/users/${user.username}`,
    },
  }
}

export default async function UserProfilePage({ params }: PageProps) {
  const [user, websites] = await Promise.all([
    getUser(params.username),
    getUserWebsites(params.username)
  ])

  if (!user) {
    notFound()
  }

  // 面包屑导航数据
  const breadcrumbItems = [
    { name: '首页', url: '/' },
    { name: '开发者', url: '/users' },
    { name: user.name, url: `/users/${user.username}` },
  ]

  // 用户Profile结构化数据
  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": user.name,
    "alternateName": user.username,
    "description": user.bio || `${user.name}是WebSpark.club的活跃开发者`,
    "url": `https://webspark.club/users/${user.username}`,
    "image": user.avatar,
    "sameAs": [
      user.website,
      user.github ? `https://github.com/${user.github}` : null,
      user.twitter ? `https://twitter.com/${user.twitter}` : null,
    ].filter(Boolean),
    "worksFor": {
      "@type": "Organization",
      "name": "WebSpark.club",
      "url": "https://webspark.club"
    },
    "memberOf": {
      "@type": "Organization", 
      "name": "WebSpark.club开发者社区",
      "url": "https://webspark.club"
    },
    "knowsAbout": websites.flatMap(w => w.tags.map(t => t.name)).slice(0, 10),
    "mainEntityOfPage": {
      "@type": "ProfilePage",
      "url": `https://webspark.club/users/${user.username}`
    }
  }

  return (
    <>
      {/* 用户Profile结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 面包屑导航 */}
          <div className="mb-8">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* 用户资料卡片 */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* 头像 */}
              <div className="flex-shrink-0">
                <UserAvatar
                  src={user.avatar || 'https://i.pravatar.cc/200'}
                  user={{ name: user.name }}
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-white shadow-lg"
                  priority={true}
                />
              </div>

              {/* 基本信息 */}
              <div className="flex-1 min-w-0">
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    {user.name}
                  </h1>
                  <p className="text-xl text-slate-600 mb-3">
                    @{user.username}
                  </p>
                  {user.bio && (
                    <p className="text-slate-700 leading-relaxed mb-4">
                      {user.bio}
                    </p>
                  )}
                </div>

                {/* 统计信息 */}
                <div className="flex flex-wrap gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {user._count.websites}
                    </div>
                    <div className="text-sm text-slate-600">发布作品</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">
                      {user._count.likes}
                    </div>
                    <div className="text-sm text-slate-600">获得点赞</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {new Date(user.createdAt).getFullYear()}
                    </div>
                    <div className="text-sm text-slate-600">加入年份</div>
                  </div>
                </div>

                {/* 社交链接 */}
                <div className="flex flex-wrap gap-4">
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                      个人网站
                    </a>
                  )}
                  {user.github && (
                    <a
                      href={`https://github.com/${user.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 用户作品展示 */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                发布的作品 ({websites.length})
              </h2>
              {websites.length > 0 && (
                <Link
                  href={`/sites?author=${user.username}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  查看全部 →
                </Link>
              )}
            </div>

            {websites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {websites.map((website) => (
                  <article key={website.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                    <Link href={`/sites/${website.slug}`} className="block">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                          {website.title}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                          {website.shortDescription}
                        </p>

                        {/* 标签 */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {website.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>

                        {/* 统计信息 */}
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {website.likeCount}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {website.viewCount}
                            </span>
                          </div>
                          <time className="text-xs">
                            {new Date(website.createdAt).toLocaleDateString('zh-CN')}
                          </time>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  暂无作品
                </h3>
                <p className="text-slate-600">
                  {user.name} 还没有发布任何作品
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 