// 链接预览API
import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface LinkPreview {
  title: string
  description: string
  image?: string
  favicon?: string
  siteName?: string
  url: string
  type: string
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const preview = await generateLinkPreview(url)
    
    return NextResponse.json(preview)
  } catch (error) {
    console.error('Link preview error:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' }, 
      { status: 500 }
    )
  }
}

async function generateLinkPreview(url: string): Promise<LinkPreview> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebSpark-LinkPreview/1.0; +https://webspark.club)'
      },
      signal: AbortSignal.timeout(10000) // 10秒超时
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    
    // 提取基础信息
    const preview: LinkPreview = {
      title: extractTitle($),
      description: extractDescription($),
      image: extractImage($, url),
      favicon: extractFavicon($, url),
      siteName: extractSiteName($),
      url: url,
      type: extractType($)
    }

    return preview
  } catch (error) {
    console.error('Preview generation failed:', error)
    
    // 返回基础信息作为fallback
    const urlObj = new URL(url)
    return {
      title: urlObj.hostname,
      description: '无法获取网站描述',
      url: url,
      type: 'website'
    }
  }
}

function extractTitle($: cheerio.CheerioAPI): string {
  // 按优先级提取标题
  const titleSources = [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'title',
    'h1',
    'meta[name="title"]'
  ]

  for (const selector of titleSources) {
    const content = $(selector).attr('content') || $(selector).text()
    if (content && content.trim()) {
      return content.trim().substring(0, 100)
    }
  }

  return '无标题'
}

function extractDescription($: cheerio.CheerioAPI): string {
  // 按优先级提取描述
  const descSources = [
    'meta[property="og:description"]',
    'meta[name="twitter:description"]',
    'meta[name="description"]',
    'meta[name="summary"]'
  ]

  for (const selector of descSources) {
    const content = $(selector).attr('content')
    if (content && content.trim()) {
      return content.trim().substring(0, 200)
    }
  }

  // 尝试从页面内容提取
  const firstParagraph = $('p').first().text().trim()
  if (firstParagraph) {
    return firstParagraph.substring(0, 200)
  }

  return '无描述信息'
}

function extractImage($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
  // 按优先级提取图片
  const imageSources = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[name="image"]',
    'link[rel="image_src"]'
  ]

  for (const selector of imageSources) {
    const imageUrl = $(selector).attr('content') || $(selector).attr('href')
    if (imageUrl) {
      return resolveUrl(imageUrl, baseUrl)
    }
  }

  // 尝试获取页面中的第一张图片
  const firstImg = $('img').first().attr('src')
  if (firstImg) {
    return resolveUrl(firstImg, baseUrl)
  }

  return undefined
}

function extractFavicon($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
  // 按优先级提取favicon
  const faviconSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="mask-icon"]'
  ]

  for (const selector of faviconSelectors) {
    const faviconUrl = $(selector).attr('href')
    if (faviconUrl) {
      return resolveUrl(faviconUrl, baseUrl)
    }
  }

  // 默认favicon路径
  try {
    const urlObj = new URL(baseUrl)
    return `${urlObj.protocol}//${urlObj.host}/favicon.ico`
  } catch {
    return undefined
  }
}

function extractSiteName($: cheerio.CheerioAPI): string | undefined {
  const siteNameSources = [
    'meta[property="og:site_name"]',
    'meta[name="application-name"]',
    'meta[name="apple-mobile-web-app-title"]'
  ]

  for (const selector of siteNameSources) {
    const siteName = $(selector).attr('content')
    if (siteName && siteName.trim()) {
      return siteName.trim()
    }
  }

  return undefined
}

function extractType($: cheerio.CheerioAPI): string {
  const ogType = $('meta[property="og:type"]').attr('content')
  if (ogType) {
    return ogType
  }

  // 基于内容判断类型
  if ($('article').length > 0) return 'article'
  if ($('video').length > 0) return 'video'
  if ($('[itemtype*="Product"]').length > 0) return 'product'
  
  return 'website'
}

function resolveUrl(url: string, baseUrl: string): string {
  try {
    if (url.startsWith('http')) {
      return url
    }
    
    const base = new URL(baseUrl)
    
    if (url.startsWith('//')) {
      return base.protocol + url
    }
    
    if (url.startsWith('/')) {
      return `${base.protocol}//${base.host}${url}`
    }
    
    // 相对路径
    return new URL(url, baseUrl).href
  } catch {
    return url
  }
}