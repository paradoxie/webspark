// 增强的外链追踪和分析系统
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface ExternalLinkProps {
  websiteId: number
  url: string
  title: string
  linkType: 'main' | 'source' | 'demo'
  className?: string
  children: React.ReactNode
  showAnalytics?: boolean
}

interface LinkSafetyCheck {
  isSafe: boolean
  score: number
  warnings: string[]
  reputation: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous'
  lastChecked: string
}

interface LinkAnalytics {
  totalClicks: number
  uniqueClicks: number
  clickThroughRate: number
  avgTimeOnSite: number
  bounceRate: number
  topReferrers: string[]
  clicksByCountry: Record<string, number>
  clicksByDevice: Record<string, number>
}

// 增强的外链组件
export default function EnhancedExternalLink({
  websiteId,
  url,
  title,
  linkType,
  className = "",
  children,
  showAnalytics = false
}: ExternalLinkProps) {
  const { data: session } = useSession()
  const [safetyCheck, setSafetyCheck] = useState<LinkSafetyCheck | null>(null)
  const [analytics, setAnalytics] = useState<LinkAnalytics | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [linkPreview, setLinkPreview] = useState<any>(null)

  // 安全检查
  useEffect(() => {
    checkLinkSafety()
  }, [url])

  // 获取链接分析数据
  useEffect(() => {
    if (showAnalytics && session) {
      fetchLinkAnalytics()
    }
  }, [websiteId, showAnalytics, session])

  const checkLinkSafety = async () => {
    try {
      const response = await fetch('/api/links/safety-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, websiteId })
      })
      
      if (response.ok) {
        const safetyData = await response.json()
        setSafetyCheck(safetyData)
      }
    } catch (error) {
      console.error('Safety check failed:', error)
      // 默认为安全，避免阻塞用户体验
      setSafetyCheck({
        isSafe: true,
        score: 85,
        warnings: [],
        reputation: 'good',
        lastChecked: new Date().toISOString()
      })
    }
  }

  const fetchLinkAnalytics = async () => {
    try {
      const response = await fetch(`/api/websites/${websiteId}/link-analytics?type=${linkType}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setAnalytics(analyticsData)
      }
    } catch (error) {
      console.error('Failed to fetch link analytics:', error)
    }
  }

  const fetchLinkPreview = async () => {
    try {
      const response = await fetch('/api/links/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      
      if (response.ok) {
        const previewData = await response.json()
        setLinkPreview(previewData)
      }
    } catch (error) {
      console.error('Failed to fetch link preview:', error)
    }
  }

  const trackExternalLink = async () => {
    try {
      // 增强的追踪数据
      const trackingData = {
        websiteId,
        linkType,
        url,
        referrer: document.referrer,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        platform: navigator.platform,
        sessionId: session?.user?.id || 'anonymous',
        // 网络信息（如果可用）
        connection: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt
        } : null
      }

      // 发送追踪数据
      await fetch('/api/websites/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackingData)
      })

      // Google Analytics追踪
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'external_link_click', {
          link_url: url,
          link_type: linkType,
          website_id: websiteId,
          website_title: title
        })
      }
    } catch (error) {
      console.error('Link tracking failed:', error)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    // 安全检查
    if (safetyCheck && !safetyCheck.isSafe) {
      e.preventDefault()
      const confirmNavigation = window.confirm(
        `安全警告：此链接可能存在风险。\n风险评分：${safetyCheck.score}/100\n警告：${safetyCheck.warnings.join(', ')}\n\n是否仍要继续访问？`
      )
      if (!confirmNavigation) return
    }

    // 追踪点击
    trackExternalLink()
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (!linkPreview) {
      fetchLinkPreview()
    }
  }

  const getSafetyIndicator = () => {
    if (!safetyCheck) return null

    const indicators = {
      excellent: { color: 'text-green-600', icon: '🛡️', text: '非常安全' },
      good: { color: 'text-green-500', icon: '✅', text: '安全' },
      fair: { color: 'text-yellow-500', icon: '⚠️', text: '注意' },
      poor: { color: 'text-orange-500', icon: '⚠️', text: '风险' },
      dangerous: { color: 'text-red-600', icon: '🚨', text: '危险' }
    }

    const indicator = indicators[safetyCheck.reputation]
    
    return (
      <span className={`inline-flex items-center text-xs ${indicator.color} ml-2`}>
        <span className="mr-1">{indicator.icon}</span>
        {indicator.text}
      </span>
    )
  }

  const getLinkTypeIcon = () => {
    const icons = {
      main: '🌐',
      source: '📂',
      demo: '🎮'
    }
    return icons[linkType] || '🔗'
  }

  return (
    <div className="relative">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center transition-all duration-200 ${className} ${
          safetyCheck && !safetyCheck.isSafe ? 'border-red-300 bg-red-50' : ''
        }`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        title={`${getLinkTypeIcon()} ${title} - 点击访问`}
      >
        <span className="mr-2">{getLinkTypeIcon()}</span>
        {children}
        {getSafetyIndicator()}
      </a>

      {/* 链接预览悬浮卡片 */}
      {isHovered && linkPreview && (
        <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-white border border-slate-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start space-x-3">
            {linkPreview.favicon && (
              <img 
                src={linkPreview.favicon} 
                alt="网站图标" 
                className="w-6 h-6 rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 truncate">
                {linkPreview.title || title}
              </h4>
              <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                {linkPreview.description}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">
                  {new URL(url).hostname}
                </span>
                {safetyCheck && (
                  <span className="text-xs text-slate-400">
                    安全评分: {safetyCheck.score}/100
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {linkPreview.image && (
            <img 
              src={linkPreview.image} 
              alt="网站预览" 
              className="w-full h-32 object-cover rounded mt-3"
            />
          )}
        </div>
      )}

      {/* 分析数据显示（仅对作者可见） */}
      {showAnalytics && analytics && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <h4 className="font-medium text-slate-900 mb-3">📊 链接分析数据</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-slate-600">总点击</div>
              <div className="font-semibold text-lg">{analytics.totalClicks}</div>
            </div>
            <div>
              <div className="text-slate-600">独立访客</div>
              <div className="font-semibold text-lg">{analytics.uniqueClicks}</div>
            </div>
            <div>
              <div className="text-slate-600">点击率</div>
              <div className="font-semibold text-lg">{analytics.clickThroughRate}%</div>
            </div>
            <div>
              <div className="text-slate-600">跳出率</div>
              <div className="font-semibold text-lg">{analytics.bounceRate}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 外链安全检查API
export async function checkLinkSafety(url: string): Promise<LinkSafetyCheck> {
  try {
    // 基础URL验证
    const urlObj = new URL(url)
    let score = 70 // 基础分数
    const warnings: string[] = []

    // 协议检查
    if (urlObj.protocol === 'https:') {
      score += 15
    } else {
      warnings.push('非HTTPS协议')
      score -= 10
    }

    // 域名检查
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf']
    if (suspiciousTlds.some(tld => urlObj.hostname.endsWith(tld))) {
      warnings.push('可疑域名后缀')
      score -= 20
    }

    // 子域名深度检查
    const subdomains = urlObj.hostname.split('.')
    if (subdomains.length > 4) {
      warnings.push('域名层级过深')
      score -= 10
    }

    // URL长度检查
    if (url.length > 200) {
      warnings.push('URL过长')
      score -= 5
    }

    // 恶意关键词检查
    const maliciousKeywords = ['phishing', 'malware', 'virus', 'hack']
    if (maliciousKeywords.some(keyword => url.toLowerCase().includes(keyword))) {
      warnings.push('包含可疑关键词')
      score -= 30
    }

    // 确定声誉等级
    let reputation: LinkSafetyCheck['reputation']
    if (score >= 90) reputation = 'excellent'
    else if (score >= 75) reputation = 'good'
    else if (score >= 60) reputation = 'fair'
    else if (score >= 40) reputation = 'poor'
    else reputation = 'dangerous'

    return {
      isSafe: score >= 60,
      score: Math.max(0, Math.min(100, score)),
      warnings,
      reputation,
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    return {
      isSafe: false,
      score: 0,
      warnings: ['URL格式无效'],
      reputation: 'dangerous',
      lastChecked: new Date().toISOString()
    }
  }
}

// 链接预览获取
export async function fetchLinkPreview(url: string) {
  try {
    // 这里可以集成第三方服务如 LinkPreview.net 或自建服务
    const response = await fetch(`/api/links/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })

    if (response.ok) {
      return await response.json()
    }
    
    return null
  } catch (error) {
    console.error('Failed to fetch link preview:', error)
    return null
  }
}