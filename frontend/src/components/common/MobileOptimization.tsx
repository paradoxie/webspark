// 移动端性能和用户体验优化组件
'use client'

import { useEffect, useState } from 'react'

interface MobileOptimizationProps {
  children: React.ReactNode
}

// 检测设备类型
function useDeviceDetection() {
  const [device, setDevice] = useState<{
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
    orientation: 'portrait' | 'landscape'
    screenSize: 'sm' | 'md' | 'lg' | 'xl'
  }>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape',
    screenSize: 'lg'
  })

  useEffect(() => {
    function detectDevice() {
      const width = window.innerWidth
      const height = window.innerHeight
      const userAgent = navigator.userAgent.toLowerCase()
      
      const isMobile = width <= 768 || /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      const isTablet = width > 768 && width <= 1024
      const isDesktop = width > 1024
      
      const orientation = height > width ? 'portrait' : 'landscape'
      
      let screenSize: 'sm' | 'md' | 'lg' | 'xl' = 'lg'
      if (width <= 640) screenSize = 'sm'
      else if (width <= 768) screenSize = 'md'
      else if (width <= 1024) screenSize = 'lg'
      else screenSize = 'xl'

      setDevice({
        isMobile,
        isTablet,
        isDesktop,
        orientation,
        screenSize
      })
    }

    detectDevice()
    window.addEventListener('resize', detectDevice)
    window.addEventListener('orientationchange', detectDevice)

    return () => {
      window.removeEventListener('resize', detectDevice)
      window.removeEventListener('orientationchange', detectDevice)
    }
  }, [])

  return device
}

// 移动端友好的触摸交互
function useTouchInteractions() {
  useEffect(() => {
    // 禁用双击缩放（保留捏合缩放）
    let lastTouchEnd = 0
    document.addEventListener('touchend', function (event) {
      const now = (new Date()).getTime()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }, false)

    // 改善滚动性能
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }, { passive: false })

    // 阻止默认的拖拽行为
    document.addEventListener('touchmove', function(e) {
      if (e.scale !== 1) {
        e.preventDefault()
      }
    }, { passive: false })
  }, [])
}

// 移动端性能监控
function useMobilePerformance() {
  const [metrics, setMetrics] = useState<{
    connectionType: string
    effectiveType: string
    downlink: number
    rtt: number
  } | null>(null)

  useEffect(() => {
    // 检测网络状态
    if ('connection' in navigator) {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      
      if (connection) {
        setMetrics({
          connectionType: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0
        })

        const updateConnection = () => {
          setMetrics({
            connectionType: connection.type || 'unknown',
            effectiveType: connection.effectiveType || 'unknown',
            downlink: connection.downlink || 0,
            rtt: connection.rtt || 0
          })
        }

        connection.addEventListener('change', updateConnection)
        return () => connection.removeEventListener('change', updateConnection)
      }
    }
  }, [])

  return metrics
}

// 自适应图片加载
export function ResponsiveImage({ 
  src, 
  alt, 
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
  sizes?: string
}) {
  const device = useDeviceDetection()
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  // 根据设备类型优化图片质量
  const getOptimizedSrc = (originalSrc: string) => {
    if (device.isMobile && device.screenSize === 'sm') {
      // 小屏幕移动设备：低质量，小尺寸
      return `${originalSrc}?w=400&q=60&format=webp`
    } else if (device.isMobile) {
      // 大屏幕移动设备：中等质量
      return `${originalSrc}?w=800&q=75&format=webp`
    } else {
      // 桌面设备：高质量
      return `${originalSrc}?w=1200&q=85&format=webp`
    }
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      
      {error ? (
        <div className="w-full h-48 bg-slate-100 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-slate-500">图片加载失败</p>
          </div>
        </div>
      ) : (
        <img
          src={getOptimizedSrc(src)}
          alt={alt}
          className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} w-full h-auto`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          sizes={sizes}
        />
      )}
    </div>
  )
}

// 移动端友好的卡片组件
export function MobileCard({ 
  children, 
  className = "",
  interactive = true 
}: { 
  children: React.ReactNode
  className?: string 
  interactive?: boolean
}) {
  const device = useDeviceDetection()

  return (
    <div 
      className={`
        bg-white rounded-lg shadow-md overflow-hidden
        ${interactive ? 'hover:shadow-lg active:scale-[0.98]' : ''}
        ${device.isMobile ? 'mx-2 mb-4' : 'mb-6'}
        ${interactive && device.isMobile ? 'touch-manipulation' : ''}
        transition-all duration-200
        ${className}
      `}
      style={{
        // 移动端优化的触摸目标尺寸
        minHeight: device.isMobile ? '44px' : 'auto',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {children}
    </div>
  )
}

// 移动端友好的按钮
export function MobileButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  className = "",
  disabled = false,
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'small' | 'medium' | 'large'
  className?: string
  disabled?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const device = useDeviceDetection()

  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 touch-manipulation
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500 active:bg-slate-300',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-500 active:bg-slate-100'
  }

  const sizeClasses = {
    small: device.isMobile ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-3 py-2 text-sm',
    medium: device.isMobile ? 'px-6 py-3 text-base min-h-[48px]' : 'px-4 py-2 text-base',
    large: device.isMobile ? 'px-8 py-4 text-lg min-h-[52px]' : 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      {...props}
    >
      {children}
    </button>
  )
}

// 移动端性能提示组件
export function MobilePerformanceHints() {
  const device = useDeviceDetection()
  const performance = useMobilePerformance()
  const [showHints, setShowHints] = useState(false)

  useEffect(() => {
    // 仅在慢网络条件下显示性能提示
    if (performance && performance.effectiveType && ['slow-2g', '2g'].includes(performance.effectiveType)) {
      setShowHints(true)
    }
  }, [performance])

  if (!device.isMobile || !showHints) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg">
      <div className="flex items-start space-x-3">
        <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-800">网络较慢</h4>
          <p className="text-xs text-amber-700 mt-1">
            我们已优化了页面以提供更好的体验。某些图片可能需要更长时间加载。
          </p>
        </div>
        <button
          onClick={() => setShowHints(false)}
          className="text-amber-600 hover:text-amber-800 p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// 主优化容器组件
export default function MobileOptimization({ children }: MobileOptimizationProps) {
  const device = useDeviceDetection()
  useTouchInteractions()

  useEffect(() => {
    // 移动端视口优化
    if (device.isMobile) {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover')
      }

      // 添加移动端样式类
      document.body.classList.add('mobile-optimized')
      
      // 优化滚动性能
      document.body.style.overscrollBehavior = 'none'
      document.documentElement.style.WebkitOverflowScrolling = 'touch'
    }

    return () => {
      document.body.classList.remove('mobile-optimized')
    }
  }, [device.isMobile])

  return (
    <>
      {children}
      <MobilePerformanceHints />
      
      {/* 移动端CSS优化 */}
      <style jsx global>{`
        .mobile-optimized {
          /* 改善触摸滚动 */
          -webkit-overflow-scrolling: touch;
          
          /* 防止文本缩放 */
          -webkit-text-size-adjust: 100%;
          
          /* 禁用用户选择（仅在需要时） */
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        .mobile-optimized input,
        .mobile-optimized textarea,
        .mobile-optimized [contenteditable] {
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
        
        /* 移动端点击反馈优化 */
        .touch-manipulation {
          touch-action: manipulation;
        }
        
        /* 改善移动端文本渲染 */
        @media (max-width: 768px) {
          body {
            font-size: 16px; /* 防止iOS缩放 */
            line-height: 1.5;
          }
          
          /* 优化按钮和链接的触摸目标 */
          button, 
          a,
          input[type="button"],
          input[type="submit"] {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* 优化表单输入 */
          input,
          textarea,
          select {
            font-size: 16px; /* 防止iOS缩放 */
          }
        }
        
        /* 适配安全区域（iPhone X等设备） */
        @supports (padding: max(0px)) {
          .safe-area-padding {
            padding-left: max(1rem, env(safe-area-inset-left));
            padding-right: max(1rem, env(safe-area-inset-right));
            padding-bottom: max(1rem, env(safe-area-inset-bottom));
          }
        }
        
        /* 减少动画以优化性能 */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  )
}