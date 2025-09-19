import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AuthProvider from '@/components/providers/AuthProvider'
import { ThemeProvider } from '@/contexts/ThemeContext'
import WebVitals, { PerformanceHints } from '@/components/common/WebVitals'
import MobileOptimization from '@/components/common/MobileOptimization'
import PWAManager, { MobilePerformanceMonitor } from '@/components/common/PWAManager'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <title>WebSpark.club - Web开发者作品展示平台</title>
        <meta name="description" content="为Web开发者社群创建的作品展示、灵感碰撞和交流互动的俱乐部" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="light dark" />
        
        {/* 语言和地区标签 */}
        <meta httpEquiv="Content-Language" content="zh-CN" />
        <meta name="language" content="Chinese" />
        <meta name="geo.region" content="CN" />
        <meta name="geo.country" content="China" />
        <meta name="geo.placename" content="China" />
        <meta name="author" content="WebSpark.club" />
        <meta name="publisher" content="WebSpark.club" />
        <meta name="copyright" content="WebSpark.club" />
        
        {/* 针对中文搜索引擎优化 */}
        <meta name="baidu-site-verification" content="" /> {/* 待填入实际验证码 */}
        <meta name="sogou_site_verification" content="" /> {/* 待填入实际验证码 */}
        <meta name="shenma-site-verification" content="" /> {/* 待填入实际验证码 */}
        
        {/* 主题切换脚本 - 防止闪烁 */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const storageKey = 'webspark-theme';
              
              function getTheme() {
                try {
                  const stored = localStorage.getItem(storageKey);
                  if (stored) return stored;
                } catch (e) {}
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }
              
              function applyTheme(theme) {
                const root = document.documentElement;
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const resolvedTheme = theme === 'system' ? systemTheme : theme;
                
                root.classList.remove('light', 'dark');
                root.classList.add(resolvedTheme);
                
                const metaThemeColor = document.querySelector('meta[name="theme-color"]');
                if (metaThemeColor) {
                  metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#0f172a' : '#3b82f6');
                }
              }
              
              const theme = getTheme();
              applyTheme(theme);
              
              window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                const currentTheme = localStorage.getItem(storageKey) || 'system';
                if (currentTheme === 'system') {
                  applyTheme('system');
                }
              });
            })();
          `
        }} />
        
        {/* 关键CSS内联 - 首屏样式 */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* 关键首屏样式 */
            body {
              margin: 0;
              min-height: 100vh;
              background-color: rgb(248 250 252);
              font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .min-h-screen { min-height: 100vh; }
            .bg-slate-50 { background-color: rgb(248 250 252); }
            .antialiased { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
            /* 布局稳定性 */
            .max-w-7xl { max-width: 80rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            @media (min-width: 640px) {
              .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
            }
            @media (min-width: 1024px) {
              .lg\\:px-8 { padding-left: 2rem; padding-right: 2rem; }
            }
            /* 防止布局偏移 */
            .relative { position: relative; }
          `
        }} />
        
        {/* DNS预解析和预连接 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://avatars.githubusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://via.placeholder.com" />
        <link rel="dns-prefetch" href="https://picsum.photos" />
        
        {/* 字体预加载和优化 */}
        <link 
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          as="style"
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
        <noscript>
          <link 
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
            rel="stylesheet" 
          />
        </noscript>
        
        {/* 关键资源预加载 */}
        <link rel="preload" href="/favicon.ico" as="image" type="image/x-icon" />
        <link rel="preload" href="/apple-touch-icon.png" as="image" type="image/png" />
        
        {/* Favicon 和 PWA */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="robots" content="index, follow" />
        
        {/* PWA相关 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="WebSpark.club" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WebSpark.club" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        
        {/* 性能优化提示 */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        
        {/* RSS Feed */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="WebSpark.club 技术博客 RSS"
          href="https://webspark.club/blog/rss.xml"
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 antialiased">
        <ThemeProvider>
          <MobileOptimization>
            <AuthProvider>
              <Header />
              <main className="relative">
                {children}
              </main>
              <Footer />
              <WebVitals />
              <PerformanceHints />
              <PWAManager />
              <MobilePerformanceMonitor />
            </AuthProvider>
          </MobileOptimization>
        </ThemeProvider>
      </body>
    </html>
  );
} 