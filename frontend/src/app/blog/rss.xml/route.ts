// RSS Feed for Blog Posts
import { NextResponse } from 'next/server'

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  publishedAt: string
  author: {
    name: string
    username: string
  }
  category: {
    name: string
  }
  tags: Array<{
    name: string
  }>
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/blog/posts?pageSize=50&sort=publishedAt:desc`, {
      next: { revalidate: 3600 }
    })
    if (!response.ok) throw new Error('Failed to fetch blog posts')
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

export async function GET() {
  const posts = await getBlogPosts()
  
  const rssItems = posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt}]]></description>
      <link>https://webspark.club/blog/${post.slug}</link>
      <guid>https://webspark.club/blog/${post.slug}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <author>noreply@webspark.club (${post.author.name})</author>
      <category>${post.category.name}</category>
      ${post.tags.map(tag => `<category>${tag.name}</category>`).join('')}
    </item>
  `).join('')

  const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>WebSpark.club 技术博客</title>
    <description>深入的Web开发技术文章、教程和最佳实践，帮助开发者提升技术能力</description>
    <link>https://webspark.club/blog</link>
    <atom:link href="https://webspark.club/blog/rss.xml" rel="self" type="application/rss+xml" />
    <language>zh-cn</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>WebSpark.club</generator>
    <webMaster>admin@webspark.club (WebSpark.club)</webMaster>
    <managingEditor>admin@webspark.club (WebSpark.club)</managingEditor>
    <copyright>Copyright ${new Date().getFullYear()} WebSpark.club</copyright>
    <image>
      <url>https://webspark.club/favicon.ico</url>
      <title>WebSpark.club 技术博客</title>
      <link>https://webspark.club/blog</link>
    </image>
    ${rssItems}
  </channel>
</rss>`

  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}