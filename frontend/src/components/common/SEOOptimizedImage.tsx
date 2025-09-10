'use client'

import Image from 'next/image'
import { useState } from 'react'

interface SEOOptimizedImageProps {
  src: string
  alt?: string
  title?: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  // SEO相关属性
  context?: {
    websiteTitle?: string
    authorName?: string
    category?: string
    tags?: string[]
    description?: string
  }
}

// 智能生成alt属性
function generateSmartAlt(src: string, context?: SEOOptimizedImageProps['context'], customAlt?: string): string {
  if (customAlt && customAlt.trim()) {
    return customAlt
  }

  const { websiteTitle, authorName, category, tags, description } = context || {}
  
  // 基于图片URL推断内容类型
  const isScreenshot = src.includes('screenshot') || src.includes('preview')
  const isAvatar = src.includes('avatar') || src.includes('profile')
  const isIcon = src.includes('icon') || src.includes('logo')
  
  if (isScreenshot && websiteTitle) {
    const tagText = tags && tags.length > 0 ? ` - 使用${tags.slice(0, 2).join('、')}技术` : ''
    const authorText = authorName ? ` by ${authorName}` : ''
    return `${websiteTitle}项目截图${tagText}${authorText}`
  }
  
  if (isAvatar && authorName) {
    return `${authorName}的头像 - WebSpark.club开发者`
  }
  
  if (isIcon && category) {
    return `${category}分类图标 - WebSpark.club`
  }
  
  if (description) {
    return description.length > 100 ? description.substring(0, 100) + '...' : description
  }
  
  // 默认fallback
  return `WebSpark.club - Web开发者作品展示平台图片`
}

// 智能生成title属性  
function generateSmartTitle(alt: string, context?: SEOOptimizedImageProps['context']): string {
  const { websiteTitle, category, tags } = context || {}
  
  if (websiteTitle && tags && tags.length > 0) {
    return `${websiteTitle} | ${tags.join('、')} | WebSpark.club开发者作品`
  }
  
  if (category) {
    return `${category}相关项目 | WebSpark.club`
  }
  
  return alt
}

export default function SEOOptimizedImage({
  src,
  alt: customAlt,
  title: customTitle,
  width = 600,
  height = 400,
  className = "",
  priority = false,
  context,
  ...props
}: SEOOptimizedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // 生成智能alt和title
  const smartAlt = generateSmartAlt(src, context, customAlt)
  const smartTitle = customTitle || generateSmartTitle(smartAlt, context)

  // 处理图片加载错误
  const handleError = () => {
    setImageError(true)
  }

  const handleLoad = () => {
    setIsLoaded(true)
  }

  // 如果图片加载失败，显示占位符
  if (imageError) {
    return (
      <div 
        className={`bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
        role="img"
        aria-label={smartAlt}
        title={smartTitle}
      >
        <div className="text-center p-4">
          <svg className="w-16 h-16 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-slate-500">图片加载失败</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <Image
        src={src}
        alt={smartAlt}
        title={smartTitle}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
        // SEO优化属性
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />
      
      {/* 加载占位符 */}
      {!isLoaded && !imageError && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse flex items-center justify-center"
          aria-hidden="true"
        >
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  )
}

// 导出便捷的预设组件
export function WebsiteScreenshot({ src, website, ...props }: { 
  src: string
  website: {
    title: string
    author: { name: string }
    tags: Array<{ name: string }>
    shortDescription: string
    category?: { name: string }
  }
} & Omit<SEOOptimizedImageProps, 'context'>) {
  return (
    <SEOOptimizedImage
      src={src}
      context={{
        websiteTitle: website.title,
        authorName: website.author.name,
        category: website.category?.name,
        tags: website.tags.map(tag => tag.name),
        description: website.shortDescription
      }}
      {...props}
    />
  )
}

export function UserAvatar({ src, user, ...props }: {
  src: string
  user: { name: string }
} & Omit<SEOOptimizedImageProps, 'context'>) {
  return (
    <SEOOptimizedImage
      src={src}
      context={{
        authorName: user.name
      }}
      {...props}
    />
  )
}

export function CategoryIcon({ src, category, ...props }: {
  src: string
  category: { name: string }
} & Omit<SEOOptimizedImageProps, 'context'>) {
  return (
    <SEOOptimizedImage
      src={src}
      context={{
        category: category.name
      }}
      {...props}
    />
  )
}