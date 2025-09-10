// 外链价值评估和报告组件
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface BacklinkValue {
  totalValue: number
  breakdown: {
    directLink: number
    socialSharing: number
    seoValue: number
    brandMention: number
  }
  traffic: {
    totalClicks: number
    uniqueVisitors: number
    referralTraffic: number
  }
  seoMetrics: {
    domainAuthority: number
    pageAuthority: number
    trustScore: number
    relevanceScore: number
  }
}

interface BacklinkAnalyticsProps {
  websiteId: number
  websiteTitle: string
  authorId: number
  className?: string
}

export default function BacklinkAnalytics({
  websiteId,
  websiteTitle,
  authorId,
  className = ""
}: BacklinkAnalyticsProps) {
  const { data: session } = useSession()
  const [backlinkValue, setBacklinkValue] = useState<BacklinkValue | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetailed, setShowDetailed] = useState(false)

  // 检查是否为项目作者
  const isAuthor = session?.user?.id === authorId.toString()

  useEffect(() => {
    if (isAuthor) {
      fetchBacklinkValue()
    }
  }, [websiteId, isAuthor])

  const fetchBacklinkValue = async () => {
    try {
      const response = await fetch(`/api/websites/${websiteId}/backlink-value`)
      if (response.ok) {
        const data = await response.json()
        setBacklinkValue(data)
      }
    } catch (error) {
      console.error('Failed to fetch backlink value:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthor || loading) {
    return null
  }

  if (!backlinkValue) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center py-4">
          <p className="text-slate-600">外链价值数据暂不可用</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-md p-6 ${className}`}>
      {/* 标题和价值总览 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <span className="mr-2">💎</span>
            外链价值报告
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            您的项目在WebSpark.club获得的SEO价值
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            ${backlinkValue.totalValue.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">估算市场价值</div>
        </div>
      </div>

      {/* 价值分解 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-white rounded-lg">
          <div className="text-lg font-semibold text-green-600">
            ${backlinkValue.breakdown.directLink}
          </div>
          <div className="text-xs text-slate-600">直接外链</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <div className="text-lg font-semibold text-blue-600">
            ${backlinkValue.breakdown.socialSharing}
          </div>
          <div className="text-xs text-slate-600">社交传播</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <div className="text-lg font-semibold text-purple-600">
            ${backlinkValue.breakdown.seoValue}
          </div>
          <div className="text-xs text-slate-600">SEO效果</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <div className="text-lg font-semibold text-orange-600">
            ${backlinkValue.breakdown.brandMention}
          </div>
          <div className="text-xs text-slate-600">品牌提及</div>
        </div>
      </div>

      {/* 流量数据 */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h4 className="font-medium text-slate-900 mb-3 flex items-center">
          <span className="mr-2">📊</span>
          流量统计
        </h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-semibold text-blue-600 text-lg">
              {backlinkValue.traffic.totalClicks.toLocaleString()}
            </div>
            <div className="text-slate-600">总点击量</div>
          </div>
          <div>
            <div className="font-semibold text-green-600 text-lg">
              {backlinkValue.traffic.uniqueVisitors.toLocaleString()}
            </div>
            <div className="text-slate-600">独立访客</div>
          </div>
          <div>
            <div className="font-semibold text-purple-600 text-lg">
              {backlinkValue.traffic.referralTraffic.toLocaleString()}
            </div>
            <div className="text-slate-600">引荐流量</div>
          </div>
        </div>
      </div>

      {/* SEO指标 */}
      {showDetailed && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-medium text-slate-900 mb-3 flex items-center">
            <span className="mr-2">🔍</span>
            SEO评分
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">域名权威度</span>
              <div className="flex items-center">
                <div className="w-20 h-2 bg-slate-200 rounded-full mr-2">
                  <div 
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${backlinkValue.seoMetrics.domainAuthority}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{backlinkValue.seoMetrics.domainAuthority}/100</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">页面权威度</span>
              <div className="flex items-center">
                <div className="w-20 h-2 bg-slate-200 rounded-full mr-2">
                  <div 
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${backlinkValue.seoMetrics.pageAuthority}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{backlinkValue.seoMetrics.pageAuthority}/100</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">信任评分</span>
              <div className="flex items-center">
                <div className="w-20 h-2 bg-slate-200 rounded-full mr-2">
                  <div 
                    className="h-2 bg-purple-500 rounded-full"
                    style={{ width: `${backlinkValue.seoMetrics.trustScore}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{backlinkValue.seoMetrics.trustScore}/100</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">相关性评分</span>
              <div className="flex items-center">
                <div className="w-20 h-2 bg-slate-200 rounded-full mr-2">
                  <div 
                    className="h-2 bg-orange-500 rounded-full"
                    style={{ width: `${backlinkValue.seoMetrics.relevanceScore}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{backlinkValue.seoMetrics.relevanceScore}/100</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowDetailed(!showDetailed)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showDetailed ? '收起详情' : '查看详情'} 
          {showDetailed ? ' ↑' : ' ↓'}
        </button>
        <div className="flex space-x-2">
          <button
            onClick={fetchBacklinkValue}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            刷新数据
          </button>
          <button
            onClick={() => window.open('/api/reports/backlink-value.pdf', '_blank')}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            下载报告
          </button>
        </div>
      </div>

      {/* 价值说明 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <span className="font-medium">💡 提示：</span>
          这个价值评估基于您的项目在WebSpark.club获得的外链、流量和SEO效果。
          市场价值基于同类外链的行业标准定价计算。
        </p>
      </div>
    </div>
  )
}

// 外链价值计算API
export async function calculateBacklinkValue(websiteId: number): Promise<BacklinkValue> {
  try {
    // 获取网站数据
    const website = await getWebsiteData(websiteId)
    const analytics = await getLinkAnalyticsData(websiteId)
    
    // 计算各项价值
    const directLinkValue = calculateDirectLinkValue(website, analytics)
    const socialSharingValue = calculateSocialSharingValue(analytics)
    const seoValue = calculateSEOValue(website, analytics)
    const brandMentionValue = calculateBrandMentionValue(website)
    
    const totalValue = directLinkValue + socialSharingValue + seoValue + brandMentionValue
    
    return {
      totalValue: Math.round(totalValue),
      breakdown: {
        directLink: Math.round(directLinkValue),
        socialSharing: Math.round(socialSharingValue),
        seoValue: Math.round(seoValue),
        brandMention: Math.round(brandMentionValue)
      },
      traffic: {
        totalClicks: analytics.totalClicks || 0,
        uniqueVisitors: analytics.uniqueVisitors || 0,
        referralTraffic: analytics.referralTraffic || 0
      },
      seoMetrics: {
        domainAuthority: 75, // WebSpark.club的DA评分
        pageAuthority: calculatePageAuthority(website, analytics),
        trustScore: 85, // 基于网站安全性和内容质量
        relevanceScore: calculateRelevanceScore(website)
      }
    }
  } catch (error) {
    console.error('Failed to calculate backlink value:', error)
    throw error
  }
}

function calculateDirectLinkValue(website: any, analytics: any): number {
  const baseValue = 300 // 基础外链价值
  const clickMultiplier = Math.min(analytics.totalClicks / 100, 5) // 点击量倍数
  const qualityMultiplier = (website.likeCount / 10 + 1) // 质量倍数
  
  return baseValue * (1 + clickMultiplier) * qualityMultiplier
}

function calculateSocialSharingValue(analytics: any): number {
  const baseValue = 150
  const shareMultiplier = Math.min(analytics.socialShares / 50, 3)
  
  return baseValue * (1 + shareMultiplier)
}

function calculateSEOValue(website: any, analytics: any): number {
  const baseValue = 400
  const contentQuality = Math.min(website.description.length / 100, 2)
  const engagementScore = Math.min(analytics.avgTimeOnSite / 60, 3)
  
  return baseValue * (1 + contentQuality) * (1 + engagementScore)
}

function calculateBrandMentionValue(website: any): number {
  const baseValue = 200
  const authorReputation = Math.min(website.author.totalProjects / 5, 2)
  
  return baseValue * (1 + authorReputation)
}

function calculatePageAuthority(website: any, analytics: any): number {
  const base = 45
  const clickBonus = Math.min(analytics.totalClicks / 100 * 5, 15)
  const qualityBonus = Math.min(website.likeCount / 5 * 3, 20)
  
  return Math.min(100, base + clickBonus + qualityBonus)
}

function calculateRelevanceScore(website: any): number {
  const base = 80 // 高相关性基础分
  const tagRelevance = Math.min(website.tags.length * 2, 15)
  
  return Math.min(100, base + tagRelevance)
}

async function getWebsiteData(websiteId: number) {
  // 这里应该从数据库获取网站数据
  return {
    id: websiteId,
    title: "示例项目",
    description: "这是一个示例项目描述",
    likeCount: 25,
    viewCount: 150,
    tags: [{ name: "React" }, { name: "TypeScript" }],
    author: {
      id: 1,
      name: "开发者",
      totalProjects: 5
    }
  }
}

async function getLinkAnalyticsData(websiteId: number) {
  // 这里应该从分析数据库获取
  return {
    totalClicks: 245,
    uniqueVisitors: 180,
    referralTraffic: 156,
    socialShares: 12,
    avgTimeOnSite: 125
  }
}