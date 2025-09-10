import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

async function getWebsite(slug: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/websites/slug/${slug}`,
      { headers: { 'Content-Type': 'application/json' } }
    )
    
    if (!response.ok) return null
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching website for OG:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return new Response('Missing slug parameter', { status: 400 })
    }

    const website = await getWebsite(slug)

    if (!website) {
      return new Response('Website not found', { status: 404 })
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            position: 'relative',
          }}
        >
          {/* 顶部品牌条 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '40px 60px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 15,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 20,
                fontSize: 32,
                fontWeight: 'bold',
              }}
            >
              W
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>WebSpark.club</div>
              <div style={{ fontSize: 16, opacity: 0.9 }}>开发者创意社区</div>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '60px',
              textAlign: 'center',
            }}
          >
            {/* 项目标题 */}
            <div
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: 30,
                maxWidth: '80%',
                lineHeight: 1.2,
              }}
            >
              {website.title}
            </div>

            {/* 项目描述 */}
            <div
              style={{
                fontSize: 24,
                color: '#64748b',
                marginBottom: 40,
                maxWidth: '70%',
                lineHeight: 1.4,
              }}
            >
              {website.shortDescription.length > 120 
                ? website.shortDescription.substring(0, 120) + '...'
                : website.shortDescription
              }
            </div>

            {/* 作者和统计信息 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 40,
                fontSize: 18,
                color: '#475569',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>👤</span>
                <span>{website.author.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>👁️</span>
                <span>{website.viewCount} 次查看</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>❤️</span>
                <span>{website.likeCount} 个赞</span>
              </div>
            </div>

            {/* 标签 */}
            {website.tags && website.tags.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 15,
                  marginTop: 30,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {website.tags.slice(0, 4).map((tag: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      background: tag.color ? `${tag.color}20` : '#e2e8f0',
                      color: tag.color || '#64748b',
                      fontSize: 16,
                      fontWeight: '500',
                      border: tag.color ? `2px solid ${tag.color}40` : '2px solid #cbd5e1',
                    }}
                  >
                    {tag.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部装饰 */}
          <div
            style={{
              position: 'absolute',
              top: 120,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(102, 126, 234, 0.1)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -100,
              left: -100,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'rgba(118, 75, 162, 0.1)',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`Failed to generate website OG image: ${e.message}`)
    return new Response(`Failed to generate image`, {
      status: 500,
    })
  }
}