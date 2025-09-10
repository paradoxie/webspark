import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontSize: 48,
            fontWeight: 'bold',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
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
              background: 'rgba(255,255,255,0.1)',
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
              background: 'rgba(255,255,255,0.1)',
            }}
          />
          
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 40,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 30,
                fontSize: 40,
                fontWeight: 'bold',
              }}
            >
              W
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 56, marginBottom: -10 }}>WebSpark.club</div>
              <div style={{ fontSize: 24, opacity: 0.8 }}>开发者创意社区</div>
            </div>
          </div>

          {/* 主标题 */}
          <div
            style={{
              fontSize: 36,
              textAlign: 'center',
              marginBottom: 20,
              maxWidth: 800,
            }}
          >
            发现优秀的开发者作品
          </div>

          {/* 副标题 */}
          <div
            style={{
              fontSize: 24,
              opacity: 0.9,
              textAlign: 'center',
              maxWidth: 600,
            }}
          >
            汇聚全球开发者的精彩项目，探索创新的web应用、工具和解决方案
          </div>

          {/* 底部信息 */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              fontSize: 16,
              opacity: 0.7,
            }}
          >
            webspark.club - 开发者作品展示与交流平台
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`Failed to generate home OG image: ${e.message}`)
    return new Response(`Failed to generate image`, {
      status: 500,
    })
  }
}