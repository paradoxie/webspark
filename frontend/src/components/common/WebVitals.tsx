'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { useEffect } from 'react'

// Web Vitals 监控组件
export default function WebVitals() {
  useReportWebVitals((metric) => {
    // 在生产环境中发送到分析服务
    if (process.env.NODE_ENV === 'production') {
      // 可以发送到 Google Analytics, Vercel Analytics 等
      console.log('Web Vital:', metric)
      
      // 示例：发送到 Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        ;(window as any).gtag('event', metric.name, {
          custom_map: { metric_id: 'custom_metric' },
          custom_metric: metric.value,
          event_category: 'Web Vitals',
          event_label: metric.id,
          non_interaction: true,
        })
      }

      // 示例：发送到 Vercel Analytics
      if (typeof window !== 'undefined' && (window as any).va) {
        ;(window as any).va('track', 'Web Vitals', {
          name: metric.name,
          value: metric.value,
          id: metric.id,
        })
      }

      // 性能阈值警告（开发时）
      const thresholds = {
        CLS: 0.1, // Cumulative Layout Shift
        FID: 100, // First Input Delay (ms)
        FCP: 1800, // First Contentful Paint (ms)
        LCP: 2500, // Largest Contentful Paint (ms)
        TTFB: 800, // Time to First Byte (ms)
        INP: 200, // Interaction to Next Paint (ms)
      }

      const threshold = thresholds[metric.name as keyof typeof thresholds]
      if (threshold && metric.value > threshold) {
        console.warn(`⚠️ ${metric.name} 超过推荐阈值:`, {
          metric: metric.name,
          value: metric.value,
          threshold,
          rating: metric.rating,
          delta: metric.delta,
        })
      }
    }
  })

  // 预加载关键资源
  useEffect(() => {
    // 预连接到重要的第三方域名
    const preconnectDomains = [
      'https://avatars.githubusercontent.com',
      'https://images.unsplash.com',
    ]

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = domain
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })

    // 预加载关键CSS（如果有）
    const criticalCss: string[] = [
      // 添加关键CSS文件路径
    ]

    criticalCss.forEach(cssPath => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = cssPath
      link.as = 'style'
      link.onload = () => {
        link.rel = 'stylesheet'
      }
      document.head.appendChild(link)
    })

    // 预加载重要图片
    const criticalImages: string[] = [
      // 添加首屏关键图片
    ]

    criticalImages.forEach(imageSrc => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = imageSrc
      link.as = 'image'
      document.head.appendChild(link)
    })

    // 监听长任务（Long Tasks）
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.duration > 50) {
              console.warn('⚠️ Long Task detected:', {
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
              })
            }
          })
        })
        
        longTaskObserver.observe({ entryTypes: ['longtask'] })

        return () => {
          longTaskObserver.disconnect()
        }
      } catch (e) {
        console.log('Long Task Observer not supported')
      }
    }
  }, [])

  return null // 这个组件不渲染任何UI
}

// 性能提示组件（开发环境）
export function PerformanceHints() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // 检查是否使用了优化的Image组件
      const imgs = document.querySelectorAll('img:not([data-nimg])')
      if (imgs.length > 0) {
        console.warn('🖼️ 发现未优化的图片标签，建议使用 Next.js Image 组件:', imgs)
      }

      // 检查是否有未使用的CSS
      setTimeout(() => {
        const unusedCss: string[] = []
        for (let i = 0; i < document.styleSheets.length; i++) {
          try {
            const sheet = document.styleSheets[i]
            if (sheet.cssRules) {
              for (let j = 0; j < sheet.cssRules.length; j++) {
                const rule = sheet.cssRules[j] as CSSStyleRule
                if (rule.selectorText && !document.querySelector(rule.selectorText)) {
                  unusedCss.push(rule.selectorText)
                }
              }
            }
          } catch (e) {
            // 跨域CSS无法检查
          }
        }
        
        if (unusedCss.length > 0) {
          console.info('📝 检测到可能未使用的CSS规则:', unusedCss.slice(0, 10))
        }
      }, 2000)
    }
  }, [])

  return null
}