import { MetadataRoute } from 'next'

const SITE_URL = 'https://webspark.club'

async function getWebsites() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/websites?status=APPROVED&pageSize=1000`, {
      next: { revalidate: 3600 } // 缓存1小时
    })
    if (!response.ok) {
      console.warn('Failed to fetch websites for sitemap:', response.status)
      return []
    }
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching websites for sitemap:', error)
    return []
  }
}

async function getCategories() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/categories`, {
      next: { revalidate: 3600 }
    })
    if (!response.ok) {
      console.warn('Failed to fetch categories for sitemap:', response.status)
      return []
    }
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error)
    return []
  }
}

async function getTags() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tags`, {
      next: { revalidate: 3600 }
    })
    if (!response.ok) {
      console.warn('Failed to fetch tags for sitemap:', response.status)
      return []
    }
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching tags for sitemap:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [websites, categories, tags] = await Promise.all([
    getWebsites(),
    getCategories(),
    getTags()
  ])

  // 静态页面 - 完整列表
  const staticPages = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/sites`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/tags`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5, // 用户相关页面，优先级较低
    },
  ]

  // 作品详情页 - 最重要的SEO页面
  const websitePages = websites.map((website: any) => ({
    url: `${SITE_URL}/sites/${website.slug}`,
    lastModified: new Date(website.updatedAt || website.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.9, // 高优先级
    images: website.screenshots ? website.screenshots.map((screenshot: string) => ({
      url: screenshot.startsWith('http') ? screenshot : `${SITE_URL}${screenshot}`,
      title: `${website.title} - 项目截图`,
      caption: website.shortDescription
    })) : []
  }))

  // 分类页面
  const categoryPages = categories.map((category: any) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    lastModified: new Date(category.updatedAt || category.createdAt),
    changeFrequency: 'daily' as const,
    priority: 0.8,
    images: category.icon ? [{
      url: category.icon.startsWith('http') ? category.icon : `${SITE_URL}${category.icon}`,
      title: `${category.name} - 分类图标`,
      caption: `${category.name}分类相关的web开发项目`
    }] : []
  }))

  // 标签页面
  const tagPages = tags.map((tag: any) => ({
    url: `${SITE_URL}/tags/${tag.slug}`,
    lastModified: new Date(tag.updatedAt || tag.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const allPages = [
    ...staticPages,
    ...websitePages,
    ...categoryPages,
    ...tagPages,
  ]

  // 限制sitemap大小（搜索引擎建议不超过50000个URL）
  if (allPages.length > 50000) {
    console.warn(`Sitemap contains ${allPages.length} URLs, exceeding recommended limit of 50,000`)
    return allPages.slice(0, 50000)
  }

  console.log(`Generated sitemap with ${allPages.length} URLs: ${websitePages.length} websites, ${categoryPages.length} categories, ${tagPages.length} tags`)
  
  return allPages
}