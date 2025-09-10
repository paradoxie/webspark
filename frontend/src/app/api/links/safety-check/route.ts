// 链接安全检查和预览API
import { NextRequest, NextResponse } from 'next/server'

interface LinkSafetyCheck {
  isSafe: boolean
  score: number
  warnings: string[]
  reputation: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous'
  lastChecked: string
}

// 链接安全检查API
export async function POST(request: NextRequest) {
  try {
    const { url, websiteId } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const safetyCheck = await performSafetyCheck(url)
    
    // 记录安全检查结果
    await logSafetyCheck(websiteId, url, safetyCheck)
    
    return NextResponse.json(safetyCheck)
  } catch (error) {
    console.error('Safety check error:', error)
    return NextResponse.json(
      { error: 'Safety check failed' }, 
      { status: 500 }
    )
  }
}

async function performSafetyCheck(url: string): Promise<LinkSafetyCheck> {
  try {
    const urlObj = new URL(url)
    let score = 70
    const warnings: string[] = []

    // 1. 协议安全检查
    if (urlObj.protocol === 'https:') {
      score += 15
    } else if (urlObj.protocol === 'http:') {
      warnings.push('非HTTPS协议，数据传输可能不安全')
      score -= 10
    } else {
      warnings.push('不支持的协议')
      score -= 30
    }

    // 2. 域名信誉检查
    const domainChecks = await checkDomainReputation(urlObj.hostname)
    score += domainChecks.scoreAdjustment
    warnings.push(...domainChecks.warnings)

    // 3. URL结构分析
    const structureChecks = analyzeUrlStructure(url)
    score += structureChecks.scoreAdjustment
    warnings.push(...structureChecks.warnings)

    // 4. 内容安全检查（基础版）
    const contentChecks = await basicContentCheck(url)
    score += contentChecks.scoreAdjustment
    warnings.push(...contentChecks.warnings)

    // 5. 黑名单检查
    const blacklistCheck = await checkBlacklists(urlObj.hostname)
    if (blacklistCheck.isBlacklisted) {
      score -= 50
      warnings.push('域名在安全黑名单中')
    }

    // 确定最终评级
    score = Math.max(0, Math.min(100, score))
    const reputation = getReputationLevel(score)

    return {
      isSafe: score >= 60,
      score,
      warnings: warnings.filter(w => w.length > 0),
      reputation,
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    return {
      isSafe: false,
      score: 0,
      warnings: ['URL格式无效或无法访问'],
      reputation: 'dangerous',
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkDomainReputation(hostname: string) {
  let scoreAdjustment = 0
  const warnings: string[] = []

  // 知名安全域名加分
  const trustedDomains = [
    'github.com', 'gitlab.com', 'bitbucket.org',
    'vercel.app', 'netlify.app', 'herokuapp.com',
    'github.io', 'gitlab.io',
    'google.com', 'microsoft.com', 'apple.com',
    'mozilla.org', 'w3.org'
  ]

  const isSubdomainOfTrusted = trustedDomains.some(trusted => 
    hostname === trusted || hostname.endsWith('.' + trusted)
  )

  if (isSubdomainOfTrusted) {
    scoreAdjustment += 20
  }

  // 可疑TLD检查
  const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.icu']
  if (suspiciousTlds.some(tld => hostname.endsWith(tld))) {
    warnings.push('使用可疑的免费域名后缀')
    scoreAdjustment -= 15
  }

  // 域名长度检查
  if (hostname.length > 50) {
    warnings.push('域名过长')
    scoreAdjustment -= 5
  }

  // 子域名深度检查
  const parts = hostname.split('.')
  if (parts.length > 4) {
    warnings.push('域名结构复杂，可能存在风险')
    scoreAdjustment -= 10
  }

  // 数字域名检查
  if (/^\d+\.\d+\.\d+\.\d+/.test(hostname)) {
    warnings.push('使用IP地址而非域名')
    scoreAdjustment -= 20
  }

  return { scoreAdjustment, warnings }
}

function analyzeUrlStructure(url: string) {
  let scoreAdjustment = 0
  const warnings: string[] = []

  // URL长度检查
  if (url.length > 200) {
    warnings.push('URL过长，可能存在隐藏参数')
    scoreAdjustment -= 10
  }

  // 可疑参数检查
  const suspiciousParams = ['redirect', 'goto', 'continue', 'return', 'next']
  const urlObj = new URL(url)
  
  for (const param of suspiciousParams) {
    if (urlObj.searchParams.has(param)) {
      warnings.push('包含可能的重定向参数')
      scoreAdjustment -= 15
      break
    }
  }

  // 多重编码检查
  if (url.includes('%25') || (url.match(/%/g) || []).length > 10) {
    warnings.push('URL包含多重编码，可能试图隐藏真实地址')
    scoreAdjustment -= 20
  }

  // 恶意关键词检查
  const maliciousKeywords = [
    'phishing', 'malware', 'virus', 'hack', 'crack',
    'download-free', 'urgent', 'suspended', 'verify-account'
  ]
  
  const urlLower = url.toLowerCase()
  const foundKeywords = maliciousKeywords.filter(keyword => 
    urlLower.includes(keyword)
  )
  
  if (foundKeywords.length > 0) {
    warnings.push(`包含可疑关键词: ${foundKeywords.join(', ')}`)
    scoreAdjustment -= 25
  }

  return { scoreAdjustment, warnings }
}

async function basicContentCheck(url: string) {
  let scoreAdjustment = 0
  const warnings: string[] = []

  try {
    // 基础HTTP头检查
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5秒超时
    })

    if (response.ok) {
      scoreAdjustment += 5

      // 检查安全头
      const securityHeaders = [
        'strict-transport-security',
        'x-frame-options',
        'x-content-type-options',
        'content-security-policy'
      ]

      const presentHeaders = securityHeaders.filter(header => 
        response.headers.has(header)
      )

      if (presentHeaders.length >= 2) {
        scoreAdjustment += 10
      } else if (presentHeaders.length === 0) {
        warnings.push('缺少基本安全头，网站安全性可能较低')
        scoreAdjustment -= 5
      }

      // 检查内容类型
      const contentType = response.headers.get('content-type')
      if (contentType && !contentType.includes('text/html')) {
        warnings.push('非HTML内容，请谨慎访问')
        scoreAdjustment -= 5
      }
    } else {
      warnings.push(`网站响应异常 (${response.status})`)
      scoreAdjustment -= 10
    }
  } catch (error) {
    warnings.push('无法连接到目标网站')
    scoreAdjustment -= 15
  }

  return { scoreAdjustment, warnings }
}

async function checkBlacklists(hostname: string) {
  // 这里可以集成真实的黑名单服务
  // 如 Google Safe Browsing API, VirusTotal API 等
  
  // 简单的本地黑名单检查
  const knownMaliciousDomains = [
    'example-malware.com',
    'phishing-site.net',
    'suspicious-download.org'
  ]

  const isBlacklisted = knownMaliciousDomains.includes(hostname)
  
  return { isBlacklisted }
}

function getReputationLevel(score: number): LinkSafetyCheck['reputation'] {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'fair'
  if (score >= 40) return 'poor'
  return 'dangerous'
}

async function logSafetyCheck(websiteId: number, url: string, result: LinkSafetyCheck) {
  try {
    // 这里可以记录到数据库用于后续分析
    console.log('Safety check logged:', {
      websiteId,
      url,
      score: result.score,
      reputation: result.reputation,
      timestamp: result.lastChecked
    })
  } catch (error) {
    console.error('Failed to log safety check:', error)
  }
}