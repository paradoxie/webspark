// PWA注册和移动端优化工具
'use client'

import { useEffect } from 'react'

export default function PWAManager() {
  useEffect(() => {
    // 注册Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
          
          // 检查更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 新版本可用，提示用户刷新
                  showUpdateNotification()
                }
              })
            }
          })
        })
        .catch((error) => {
          console.log('SW registration failed: ', error)
        })
    }

    // 安装PWA提示
    let deferredPrompt: any = null
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e
      
      // 延迟显示安装提示，在用户浏览一段时间后显示
      setTimeout(() => {
        showInstallPrompt()
      }, 10000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 检测是否已安装PWA
    const handleAppInstalled = () => {
      console.log('PWA was installed')
      hideInstallPrompt()
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const showUpdateNotification = () => {
    if (!document.getElementById('update-notification')) {
      const notification = document.createElement('div')
      notification.id = 'update-notification'
      notification.className = 'fixed top-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm'
      notification.innerHTML = `
        <div class="flex items-center space-x-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <div class="flex-1">
            <p class="font-medium">新版本可用</p>
            <p class="text-sm opacity-90">刷新页面获取最新功能</p>
          </div>
          <button onclick="window.location.reload()" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50">
            刷新
          </button>
        </div>
      `
      document.body.appendChild(notification)

      // 10秒后自动隐藏
      setTimeout(() => {
        notification.remove()
      }, 10000)
    }
  }

  const showInstallPrompt = () => {
    // 检查是否在移动设备上且未安装PWA
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone
    
    if (isMobile && !isStandalone && !localStorage.getItem('install-prompt-dismissed')) {
      const prompt = document.createElement('div')
      prompt.id = 'install-prompt'
      prompt.className = 'fixed bottom-4 left-4 right-4 z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-4'
      prompt.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
          </div>
          <div class="flex-1">
            <p class="font-medium text-slate-900">安装WebSpark.club</p>
            <p class="text-sm text-slate-600">添加到主屏幕，获得更好的体验</p>
          </div>
          <div class="flex space-x-2">
            <button id="install-dismiss" class="px-3 py-1 text-sm text-slate-600 hover:text-slate-800">
              取消
            </button>
            <button id="install-app" class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
              安装
            </button>
          </div>
        </div>
      `
      document.body.appendChild(prompt)

      // 处理安装按钮点击
      document.getElementById('install-app')?.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt()
          const { outcome } = await deferredPrompt.userChoice
          console.log(`User response to the install prompt: ${outcome}`)
          deferredPrompt = null
        }
        prompt.remove()
      })

      // 处理取消按钮点击
      document.getElementById('install-dismiss')?.addEventListener('click', () => {
        localStorage.setItem('install-prompt-dismissed', 'true')
        prompt.remove()
      })
    }
  }

  const hideInstallPrompt = () => {
    const prompt = document.getElementById('install-prompt')
    if (prompt) {
      prompt.remove()
    }
  }

  return null
}

// 移动端性能监控
export function MobilePerformanceMonitor() {
  useEffect(() => {
    // 监控Core Web Vitals
    if ('web-vital' in window) {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = window['web-vital' as any]
      
      getCLS((metric: any) => {
        console.log('CLS:', metric)
        sendAnalytics('CLS', metric.value, metric.rating)
      })
      
      getFID((metric: any) => {
        console.log('FID:', metric)
        sendAnalytics('FID', metric.value, metric.rating)
      })
      
      getFCP((metric: any) => {
        console.log('FCP:', metric)
        sendAnalytics('FCP', metric.value, metric.rating)
      })
      
      getLCP((metric: any) => {
        console.log('LCP:', metric)
        sendAnalytics('LCP', metric.value, metric.rating)
      })
      
      getTTFB((metric: any) => {
        console.log('TTFB:', metric)
        sendAnalytics('TTFB', metric.value, metric.rating)
      })
    }

    // 监控网络状态
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    if (connection) {
      const updateConnectionStatus = () => {
        sendAnalytics('connection', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        })
      }
      
      connection.addEventListener('change', updateConnectionStatus)
      updateConnectionStatus() // 初始状态
      
      return () => {
        connection.removeEventListener('change', updateConnectionStatus)
      }
    }
  }, [])

  const sendAnalytics = (name: string, value: any, rating?: string) => {
    // 发送性能数据到分析服务
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: value,
        metric_rating: rating,
        device_type: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      })
    }
  }

  return null
}