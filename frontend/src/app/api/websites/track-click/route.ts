// 外链分析追踪API
import { NextRequest, NextResponse } from 'next/server'

interface ClickTrackingData {
  websiteId: number
  linkType: 'main' | 'source' | 'demo'
  url: string
  referrer: string
  timestamp: number
  userAgent: string
  screenResolution: string
  language: string
  platform: string
  sessionId: string
  connection?: {
    effectiveType: string
    downlink: number
    rtt: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const trackingData: ClickTrackingData = await request.json()
    
    // 验证必需字段
    if (!trackingData.websiteId || !trackingData.url) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // 处理点击追踪
    await processClickTracking(trackingData)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Click tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track click' }, 
      { status: 500 }
    )
  }
}

async function processClickTracking(data: ClickTrackingData) {
  try {
    // 1. 增加网站浏览量
    await incrementWebsiteViews(data.websiteId)
    
    // 2. 记录详细的点击数据
    await logClickData(data)
    
    // 3. 更新用户行为统计
    await updateUserBehaviorStats(data)
    
    // 4. 地理位置分析（基于IP）
    await analyzeGeographicData(data)
    
    // 5. 设备和浏览器分析
    await analyzeDeviceData(data)
    
  } catch (error) {
    console.error('Click tracking processing failed:', error)
  }
}

async function incrementWebsiteViews(websiteId: number) {
  try {
    // 这里应该连接到真实的数据库
    console.log(`Incrementing views for website ${websiteId}`)
    
    // 示例数据库更新
    // await db.website.update({
    //   where: { id: websiteId },
    //   data: { viewCount: { increment: 1 } }
    // })
    
  } catch (error) {
    console.error('Failed to increment views:', error)
  }
}

async function logClickData(data: ClickTrackingData) {
  try {
    const clickRecord = {
      websiteId: data.websiteId,
      linkType: data.linkType,
      targetUrl: data.url,
      referrer: data.referrer,
      userAgent: data.userAgent,
      timestamp: new Date(data.timestamp),
      sessionId: data.sessionId,
      screenResolution: data.screenResolution,
      language: data.language,
      platform: data.platform,
      connectionInfo: data.connection ? {
        effectiveType: data.connection.effectiveType,
        downlink: data.connection.downlink,
        rtt: data.connection.rtt
      } : null
    }
    
    console.log('Logging click data:', clickRecord)
    
    // 存储到数据库
    // await db.clickLog.create({ data: clickRecord })
    
  } catch (error) {
    console.error('Failed to log click data:', error)
  }
}

async function updateUserBehaviorStats(data: ClickTrackingData) {
  try {
    // 更新网站的用户行为统计
    const behaviorUpdate = {
      websiteId: data.websiteId,
      linkType: data.linkType,
      clickTimestamp: new Date(data.timestamp),
      // 其他行为分析数据
    }
    
    console.log('Updating behavior stats:', behaviorUpdate)
    
    // 实际的统计更新逻辑
    // await updateWebsiteBehaviorMetrics(behaviorUpdate)
    
  } catch (error) {
    console.error('Failed to update behavior stats:', error)
  }
}

async function analyzeGeographicData(data: ClickTrackingData) {
  try {
    // 基于IP地址的地理位置分析
    // 这里可以集成IP地理位置服务
    
    const geoData = {
      websiteId: data.websiteId,
      timestamp: new Date(data.timestamp),
      // ip: extractIPFromRequest(),
      // country: await getCountryFromIP(ip),
      // region: await getRegionFromIP(ip),
      // city: await getCityFromIP(ip)
    }
    
    console.log('Geographic analysis:', geoData)
    
  } catch (error) {
    console.error('Geographic analysis failed:', error)
  }
}

async function analyzeDeviceData(data: ClickTrackingData) {
  try {
    // 解析User Agent字符串
    const deviceInfo = parseUserAgent(data.userAgent)
    
    const deviceAnalysis = {
      websiteId: data.websiteId,
      timestamp: new Date(data.timestamp),
      browser: deviceInfo.browser,
      browserVersion: deviceInfo.browserVersion,
      os: deviceInfo.os,
      osVersion: deviceInfo.osVersion,
      deviceType: deviceInfo.deviceType,
      screenResolution: data.screenResolution,
      language: data.language,
      platform: data.platform
    }
    
    console.log('Device analysis:', deviceAnalysis)
    
    // 存储设备分析数据
    // await db.deviceAnalysis.create({ data: deviceAnalysis })
    
  } catch (error) {
    console.error('Device analysis failed:', error)
  }
}

function parseUserAgent(userAgent: string) {
  // 简化的User Agent解析
  // 实际项目中建议使用专业的UA解析库如 ua-parser-js
  
  const deviceInfo = {
    browser: 'Unknown',
    browserVersion: 'Unknown',
    os: 'Unknown',
    osVersion: 'Unknown',
    deviceType: 'desktop'
  }

  // 浏览器检测
  if (userAgent.includes('Chrome')) {
    deviceInfo.browser = 'Chrome'
    const match = userAgent.match(/Chrome\/(\d+)/)
    if (match) deviceInfo.browserVersion = match[1]
  } else if (userAgent.includes('Firefox')) {
    deviceInfo.browser = 'Firefox'
    const match = userAgent.match(/Firefox\/(\d+)/)
    if (match) deviceInfo.browserVersion = match[1]
  } else if (userAgent.includes('Safari')) {
    deviceInfo.browser = 'Safari'
    const match = userAgent.match(/Version\/(\d+)/)
    if (match) deviceInfo.browserVersion = match[1]
  }

  // 操作系统检测
  if (userAgent.includes('Windows')) {
    deviceInfo.os = 'Windows'
    if (userAgent.includes('Windows NT 10')) deviceInfo.osVersion = '10'
    else if (userAgent.includes('Windows NT 6.3')) deviceInfo.osVersion = '8.1'
  } else if (userAgent.includes('Mac')) {
    deviceInfo.os = 'macOS'
    const match = userAgent.match(/Mac OS X (\d+_\d+)/)
    if (match) deviceInfo.osVersion = match[1].replace('_', '.')
  } else if (userAgent.includes('Linux')) {
    deviceInfo.os = 'Linux'
  }

  // 设备类型检测
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
    deviceInfo.deviceType = 'mobile'
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    deviceInfo.deviceType = 'tablet'
  }

  return deviceInfo
}

// 获取网站外链分析数据的API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const websiteId = searchParams.get('websiteId')
    const linkType = searchParams.get('type')
    
    if (!websiteId) {
      return NextResponse.json(
        { error: 'Website ID is required' }, 
        { status: 400 }
      )
    }

    const analytics = await getLinkAnalytics(
      parseInt(websiteId), 
      linkType as 'main' | 'source' | 'demo'
    )
    
    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' }, 
      { status: 500 }
    )
  }
}

async function getLinkAnalytics(websiteId: number, linkType?: string) {
  try {
    // 模拟分析数据，实际应从数据库查询
    const mockAnalytics = {
      totalClicks: Math.floor(Math.random() * 1000) + 100,
      uniqueClicks: Math.floor(Math.random() * 800) + 80,
      clickThroughRate: Math.round((Math.random() * 5 + 2) * 100) / 100,
      avgTimeOnSite: Math.floor(Math.random() * 300) + 60,
      bounceRate: Math.round((Math.random() * 30 + 20) * 100) / 100,
      topReferrers: [
        'webspark.club',
        'google.com',
        'github.com',
        'twitter.com'
      ],
      clicksByCountry: {
        'CN': Math.floor(Math.random() * 500) + 100,
        'US': Math.floor(Math.random() * 200) + 50,
        'JP': Math.floor(Math.random() * 100) + 20,
        'DE': Math.floor(Math.random() * 80) + 15
      },
      clicksByDevice: {
        'desktop': Math.floor(Math.random() * 400) + 200,
        'mobile': Math.floor(Math.random() * 300) + 150,
        'tablet': Math.floor(Math.random() * 100) + 30
      }
    }
    
    // 实际查询逻辑
    // const analytics = await db.clickLog.groupBy({
    //   by: ['linkType'],
    //   where: {
    //     websiteId: websiteId,
    //     ...(linkType && { linkType })
    //   },
    //   _count: true,
    //   orderBy: { _count: { desc: true } }
    // })
    
    return mockAnalytics
  } catch (error) {
    console.error('Failed to get link analytics:', error)
    return null
  }
}