// AMP iframe预览API endpoint
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('URL parameter is required', { status: 400 })
  }

  // 验证URL格式
  try {
    new URL(url)
  } catch (error) {
    return new NextResponse('Invalid URL format', { status: 400 })
  }

  // 生成iframe预览HTML
  const iframeHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .preview-container {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .preview-icon {
            width: 64px;
            height: 64px;
            background: #3b82f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
          }
          .preview-text {
            color: #64748b;
            margin-bottom: 16px;
          }
          .visit-button {
            display: inline-block;
            padding: 12px 24px;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          .visit-button:hover {
            background: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="preview-container">
          <div class="preview-icon">
            <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
              <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"/>
            </svg>
          </div>
          <p class="preview-text">点击下方按钮访问原网站</p>
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="visit-button">
            访问网站 →
          </a>
        </div>
      </body>
    </html>
  `

  return new NextResponse(iframeHTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}