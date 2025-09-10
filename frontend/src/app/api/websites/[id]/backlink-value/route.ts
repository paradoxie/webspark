// 外链价值评估API
import { NextRequest, NextResponse } from 'next/server'

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
  lastUpdated: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const websiteId = parseInt(params.id)
    
    if (isNaN(websiteId)) {
      return NextResponse.json(
        { error: 'Invalid website ID' }, 
        { status: 400 }
      )
    }

    const backlinkValue = await calculateBacklinkValue(websiteId)
    
    return NextResponse.json(backlinkValue)
  } catch (error) {
    console.error('Backlink value calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate backlink value' }, 
      { status: 500 }
    )
  }
}

async function calculateBacklinkValue(websiteId: number): Promise<BacklinkValue> {
  try {
    // 1. 获取网站基础数据
    const website = await getWebsiteData(websiteId)
    if (!website) {
      throw new Error('Website not found')
    }

    // 2. 获取分析数据
    const analytics = await getLinkAnalyticsData(websiteId)
    
    // 3. 计算各项价值
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
        domainAuthority: 78, // WebSpark.club的预估DA
        pageAuthority: calculatePageAuthority(website, analytics),
        trustScore: calculateTrustScore(website, analytics),
        relevanceScore: calculateRelevanceScore(website)
      },
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Failed to calculate backlink value:', error)
    throw error
  }
}

// 计算直接外链价值
function calculateDirectLinkValue(website: any, analytics: any): number {
  const baseValue = 350 // 基础DoFollow外链价值
  
  // 点击量系数 (0-5倍)
  const clickMultiplier = Math.min(analytics.totalClicks / 50, 5)
  
  // 质量系数：基于点赞数和描述质量
  const qualityScore = (
    Math.min(website.likeCount / 5, 10) + // 点赞质量
    Math.min(website.description?.length / 50, 5) + // 描述质量
    (website.tags?.length || 0) * 0.5 // 标签完整性
  )
  const qualityMultiplier = 1 + (qualityScore / 10)
  
  // 时间系数：新项目获得bonus
  const daysSinceCreation = (Date.now() - new Date(website.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  const timeMultiplier = daysSinceCreation < 30 ? 1.2 : 1.0 // 新项目20% bonus
  
  return baseValue * (1 + clickMultiplier) * qualityMultiplier * timeMultiplier
}

// 计算社交分享价值
function calculateSocialSharingValue(analytics: any): number {
  const baseValue = 180 // 社交媒体曝光基础价值
  
  // 分享倍数
  const shareMultiplier = Math.min((analytics.socialShares || 0) / 20, 3)
  
  // 平台覆盖bonus（WebSpark支持多平台分享）
  const platformBonus = 1.5 // Twitter, Facebook, LinkedIn, 微信, 微博等
  
  return baseValue * (1 + shareMultiplier) * platformBonus
}

// 计算SEO价值
function calculateSEOValue(website: any, analytics: any): number {
  const baseValue = 450 // 结构化数据和SEO优化价值
  
  // 内容质量系数
  const contentQuality = Math.min((website.description?.length || 0) / 100, 2)
  
  // 用户参与度系数
  const avgTimeOnSite = analytics.avgTimeOnSite || 60
  const engagementScore = Math.min(avgTimeOnSite / 60, 3)
  
  // 技术栈相关性bonus
  const techStackBonus = (website.tags?.length || 0) > 2 ? 1.3 : 1.0
  
  // 搜索引擎索引bonus（所有页面都有完整meta和结构化数据）
  const seoOptimizationBonus = 1.4
  
  return baseValue * (1 + contentQuality) * (1 + engagementScore) * techStackBonus * seoOptimizationBonus
}

// 计算品牌提及价值
function calculateBrandMentionValue(website: any): number {
  const baseValue = 220 // 品牌提及基础价值
  
  // 作者信誉系数
  const authorReputation = Math.min((website.author?.totalProjects || 1) / 3, 2)
  
  // 项目成熟度系数
  const projectMaturity = Math.min(website.viewCount / 100, 2)
  
  // 技术社区权威性bonus
  const communityAuthorityBonus = 1.6 // WebSpark作为技术社区的权威性
  
  return baseValue * (1 + authorReputation) * (1 + projectMaturity) * communityAuthorityBonus
}

// 计算页面权威度
function calculatePageAuthority(website: any, analytics: any): number {
  const base = 48 // 基础PA分数
  
  // 流量bonus
  const trafficBonus = Math.min((analytics.totalClicks || 0) / 100 * 8, 25)
  
  // 质量bonus
  const qualityBonus = Math.min((website.likeCount || 0) / 3 * 5, 15)
  
  // 内容完整性bonus
  const contentBonus = Math.min((website.description?.length || 0) / 200 * 10, 12)
  
  return Math.min(100, base + trafficBonus + qualityBonus + contentBonus)
}

// 计算信任评分
function calculateTrustScore(website: any, analytics: any): number {
  const base = 82 // WebSpark.club的高信任度基础分
  
  // 用户行为信任度
  const behaviorTrust = Math.min((analytics.avgTimeOnSite || 60) / 30, 5)
  
  // 社区验证bonus（通过审核的项目）
  const verificationBonus = website.status === 'APPROVED' ? 8 : 0
  
  // 作者历史record
  const authorTrustBonus = Math.min((website.author?.totalProjects || 1), 5)
  
  return Math.min(100, base + behaviorTrust + verificationBonus + authorTrustBonus)
}

// 计算相关性评分
function calculateRelevanceScore(website: any): number {
  const base = 85 // 技术社区高相关性基础分
  
  // 技术栈标签相关性
  const tagRelevance = Math.min((website.tags?.length || 0) * 3, 12)
  
  // 分类相关性
  const categoryRelevance = website.category ? 3 : 0
  
  return Math.min(100, base + tagRelevance + categoryRelevance)
}

// 获取网站数据（模拟）
async function getWebsiteData(websiteId: number) {
  try {
    // 实际实现中应该从数据库查询
    // const website = await db.website.findUnique({
    //   where: { id: websiteId },
    //   include: { author: true, tags: true, category: true }
    // })
    
    // 模拟数据
    return {
      id: websiteId,
      title: "优秀的React项目",
      description: "这是一个使用React和TypeScript构建的现代化Web应用，具有响应式设计、状态管理、API集成等特性。项目采用了最新的开发实践和工程化配置。",
      likeCount: 28,
      viewCount: 186,
      status: 'APPROVED',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15天前
      tags: [
        { name: "React" },
        { name: "TypeScript" },
        { name: "Redux" },
        { name: "Tailwind CSS" }
      ],
      category: { name: "前端框架" },
      author: {
        id: 1,
        name: "技术专家",
        totalProjects: 8
      }
    }
  } catch (error) {
    console.error('Failed to get website data:', error)
    return null
  }
}

// 获取分析数据（模拟）
async function getLinkAnalyticsData(websiteId: number) {
  try {
    // 实际实现中应该从分析数据库查询
    // const analytics = await getAnalyticsFromDB(websiteId)
    
    // 模拟数据
    return {
      totalClicks: 298,
      uniqueVisitors: 234,
      referralTraffic: 198,
      socialShares: 15,
      avgTimeOnSite: 145, // 秒
      bounceRate: 0.35
    }
  } catch (error) {
    console.error('Failed to get analytics data:', error)
    return {
      totalClicks: 0,
      uniqueVisitors: 0,
      referralTraffic: 0,
      socialShares: 0,
      avgTimeOnSite: 60
    }
  }
}