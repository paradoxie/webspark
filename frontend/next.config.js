/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default-value',
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // SEO和性能优化配置
  experimental: {
    // optimizeCss: true, // 暂时禁用，避免critters依赖问题
    scrollRestoration: true,
    optimizeServerReact: true,
  },
  // 启用压缩
  compress: true,
  // 移除Next.js标识
  poweredByHeader: false,
  // 启用SWC minifier
  swcMinify: true,
  // 编译器优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 生成站点地图
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/u/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      }
    ],
    domains: [
      'avatars.githubusercontent.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'picsum.photos'
    ],
    // 图片优化
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 图片加载优化
    loader: 'default',
    // 最小缓存时间（秒）
    minimumCacheTTL: 31536000, // 1年
  },
  // 重定向规则
  async redirects() {
    return [
      {
        source: '/site/:slug',
        destination: '/sites/:slug',
        permanent: true,
      },
    ]
  },
  // 性能和安全Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // 内容安全策略 (CSP)
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              img-src 'self' data: https: blob: https://avatars.githubusercontent.com https://images.unsplash.com https://via.placeholder.com https://picsum.photos;
              font-src 'self' https://fonts.gstatic.com;
              connect-src 'self' https: wss:;
              media-src 'self' https:;
              object-src 'none';
              child-src 'self' https:;
              worker-src 'self' blob:;
              frame-ancestors 'none';
              base-uri 'self';
              form-action 'self' https:;
              upgrade-insecure-requests;
            `.replace(/\s{2,}/g, ' ').trim(),
          },
          // 基础安全头部
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()',
          },
          // 严格传输安全 (HSTS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // 防止点击劫持
          {
            key: 'X-Frame-Options', 
            value: 'SAMEORIGIN',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      // 删除有问题的图片和字体资源缓存配置
    ]
  },
}

module.exports = nextConfig 