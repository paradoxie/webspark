import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

async function getCategory(slug: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/categories/${slug}/websites?page=1&pageSize=1`,
      { headers: { 'Content-Type': 'application/json' } }
    )
    
    if (!response.ok) return null
    const data = await response.json()
    return data.category
  } catch (error) {
    console.error('Error fetching category for OG:', error)
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

    const category = await getCategory(slug)

    if (!category) {
      return new Response('Category not found', { status: 404 })
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: `linear-gradient(135deg, ${category.color}20 0%, ${category.color}10 100%)`,
            position: 'relative',
          }}
        >
          {/* 背景装饰 */}
          <div
            style={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: `${category.color}15`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -150,
              left: -150,
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: `${category.color}10`,
            }}
          />

          {/* 顶部品牌条 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '40px 60px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 15,
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                W
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: '#1e293b' }}>WebSpark.club</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>分类作品</div>
              </div>
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
              padding: '80px 60px',
              textAlign: 'center',
            }}
          >
            {/* 分类图标 */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 30,
                background: `linear-gradient(135deg, ${category.color} 0%, ${category.color}CC 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 60,
                marginBottom: 40,
                boxShadow: `0 20px 40px ${category.color}40`,
              }}
            >
              {category.icon}
            </div>

            {/* 分类名称 */}
            <div
              style={{
                fontSize: 56,
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: 20,
              }}
            >
              {category.name}
            </div>

            {/* 分类描述 */}
            <div
              style={{
                fontSize: 24,
                color: '#64748b',
                marginBottom: 40,
                maxWidth: '70%',
                lineHeight: 1.4,
              }}
            >
              {category.description}
            </div>

            {/* 统计信息 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 30,
                padding: '20px 40px',
                background: 'rgba(255,255,255,0.8)',
                borderRadius: 20,
                border: `2px solid ${category.color}30`,
                fontSize: 18,
                color: '#475569',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>📂</span>
                <span>分类：{category.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>🎨</span>
                <span>精选作品等你发现</span>
              </div>
            </div>
          </div>

          {/* 底部标签 */}
          <div
            style={{
              position: 'absolute',
              bottom: 30,
              right: 60,
              fontSize: 14,
              color: '#94a3b8',
              opacity: 0.8,
            }}
          >
            webspark.club/{category.slug}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`Failed to generate category OG image: ${e.message}`)
    return new Response(`Failed to generate image`, {
      status: 500,
    })
  }
}