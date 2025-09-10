import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

async function getTag(slug: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tags/${slug}`,
      { headers: { 'Content-Type': 'application/json' } }
    )
    
    if (!response.ok) return null
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching tag for OG:', error)
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

    const tag = await getTag(slug)

    if (!tag) {
      return new Response('Tag not found', { status: 404 })
    }

    const tagColor = tag.color || '#6366f1'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            position: 'relative',
          }}
        >
          {/* 背景装饰 */}
          <div
            style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: `${tagColor}20`,
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
              background: `${tagColor}15`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '80%',
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: `${tagColor}10`,
            }}
          />

          {/* 顶部品牌条 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '30px 50px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: 45,
                  height: 45,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                W
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>WebSpark.club</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>技术标签</div>
              </div>
            </div>
            
            <div
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                background: `${tagColor}15`,
                border: `2px solid ${tagColor}40`,
                fontSize: 14,
                color: tagColor,
                fontWeight: '600',
              }}
            >
              #{tag.slug}
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
            {/* 标签图标 */}
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${tagColor} 0%, ${tagColor}CC 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 32,
                fontWeight: 'bold',
                marginBottom: 30,
                boxShadow: `0 15px 35px ${tagColor}40`,
              }}
            >
              {tag.name.charAt(0).toUpperCase()}
            </div>

            {/* 标签名称 */}
            <div
              style={{
                fontSize: 52,
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: 20,
              }}
            >
              {tag.name}
            </div>

            {/* 标签描述 */}
            {tag.description && (
              <div
                style={{
                  fontSize: 22,
                  color: '#64748b',
                  marginBottom: 35,
                  maxWidth: '70%',
                  lineHeight: 1.4,
                }}
              >
                {tag.description}
              </div>
            )}

            {/* 统计和信息 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 25,
                padding: '18px 35px',
                background: 'rgba(255,255,255,0.9)',
                borderRadius: 18,
                border: `2px solid ${tagColor}20`,
                fontSize: 16,
                color: '#475569',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 20 }}>🏷️</span>
                <span>标签：{tag.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 20 }}>🔍</span>
                <span>探索相关作品</span>
              </div>
            </div>

            {/* 技术特色标识 */}
            <div
              style={{
                marginTop: 25,
                padding: '10px 20px',
                borderRadius: 25,
                background: `linear-gradient(90deg, ${tagColor}15 0%, ${tagColor}25 100%)`,
                border: `1px solid ${tagColor}30`,
                fontSize: 14,
                color: tagColor,
                fontWeight: '600',
              }}
            >
              技术标签 • 相关作品等你发现
            </div>
          </div>

          {/* 底部信息 */}
          <div
            style={{
              position: 'absolute',
              bottom: 25,
              left: 50,
              right: 50,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              color: '#94a3b8',
            }}
          >
            <span>webspark.club/tags/{tag.slug}</span>
            <span>开发者作品展示平台</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`Failed to generate tag OG image: ${e.message}`)
    return new Response(`Failed to generate image`, {
      status: 500,
    })
  }
}