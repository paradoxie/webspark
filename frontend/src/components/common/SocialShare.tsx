'use client'

import { useState } from 'react'

interface SocialShareProps {
  url: string
  title: string
  description: string
  image?: string
  via?: string
  className?: string
}

// 社交分享链接生成器
const generateShareLinks = (url: string, title: string, description: string, image?: string, via?: string) => {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description)
  const encodedImage = image ? encodeURIComponent(image) : ''

  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=${via || 'WebSparkClub'}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    weibo: `https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}&content=utf-8&pic=${encodedImage}`,
    qzone: `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
    wechat: encodedUrl, // 微信需要特殊处理
    copyLink: url
  }
}

export default function SocialShare({ 
  url, 
  title, 
  description, 
  image, 
  via,
  className = ""
}: SocialShareProps) {
  const [showMore, setShowMore] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareLinks = generateShareLinks(url, title, description, image, via)

  // 复制链接功能
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      
      // 埋点统计
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'share', {
          method: 'copy_link',
          content_type: 'website',
          content_id: url
        })
      }
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  // 社交分享点击处理
  const handleShare = (platform: string, shareUrl: string) => {
    if (platform === 'wechat') {
      // 微信分享特殊处理 - 显示二维码
      alert('请复制链接到微信分享')
      copyToClipboard()
      return
    }

    // 打开分享窗口
    const width = platform === 'linkedin' ? 600 : 550
    const height = platform === 'linkedin' ? 570 : 420
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2

    window.open(
      shareUrl,
      'share',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    )

    // 埋点统计
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: platform,
        content_type: 'website',
        content_id: url
      })
    }
  }

  const primaryPlatforms = [
    { key: 'twitter', name: 'Twitter', icon: '🐦', color: 'hover:bg-blue-50 hover:text-blue-600' },
    { key: 'facebook', name: 'Facebook', icon: '📘', color: 'hover:bg-blue-50 hover:text-blue-700' },
    { key: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'hover:bg-blue-50 hover:text-blue-800' },
    { key: 'weibo', name: '微博', icon: '🔴', color: 'hover:bg-red-50 hover:text-red-600' }
  ]

  const morePlatforms = [
    { key: 'qzone', name: 'QQ空间', icon: '🟡', color: 'hover:bg-yellow-50 hover:text-yellow-600' },
    { key: 'wechat', name: '微信', icon: '💚', color: 'hover:bg-green-50 hover:text-green-600' }
  ]

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* 标题 */}
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        分享这个项目
      </h3>

      {/* 主要分享平台 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {primaryPlatforms.map((platform) => (
          <button
            key={platform.key}
            onClick={() => handleShare(platform.key, shareLinks[platform.key as keyof typeof shareLinks])}
            className={`flex items-center justify-center px-4 py-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-all ${platform.color}`}
          >
            <span className="text-lg mr-2">{platform.icon}</span>
            {platform.name}
          </button>
        ))}
      </div>

      {/* 更多平台 */}
      {showMore && (
        <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-in">
          {morePlatforms.map((platform) => (
            <button
              key={platform.key}
              onClick={() => handleShare(platform.key, shareLinks[platform.key as keyof typeof shareLinks])}
              className={`flex items-center justify-center px-4 py-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-all ${platform.color}`}
            >
              <span className="text-lg mr-2">{platform.icon}</span>
              {platform.name}
            </button>
          ))}
        </div>
      )}

      {/* 更多选项和复制链接 */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          onClick={() => setShowMore(!showMore)}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          {showMore ? '收起选项' : '更多选项'} {showMore ? '↑' : '↓'}
        </button>

        <button
          onClick={copyToClipboard}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
            copied 
              ? 'bg-green-100 text-green-800' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <svg className={`w-4 h-4 mr-2 ${copied ? 'text-green-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {copied ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            )}
          </svg>
          {copied ? '已复制!' : '复制链接'}
        </button>
      </div>

      {/* SEO优化的结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ShareAction",
            "target": url,
            "name": title,
            "description": description
          })
        }}
      />
    </div>
  )
}

// 简化版分享按钮组件
export function ShareButton({ 
  url, 
  title, 
  description, 
  className = "" 
}: Omit<SocialShareProps, 'image' | 'via'>) {
  const [showSharePanel, setShowSharePanel] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowSharePanel(!showSharePanel)}
        className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        分享
      </button>

      {showSharePanel && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <SocialShare
            url={url}
            title={title}
            description={description}
            className="w-80 shadow-lg"
          />
        </div>
      )}

      {/* 点击外部关闭面板 */}
      {showSharePanel && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSharePanel(false)}
        />
      )}
    </div>
  )
}