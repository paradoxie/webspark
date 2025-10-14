'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface MobileOptimizationProps {
  onRefresh?: () => Promise<void>;
  enablePullToRefresh?: boolean;
  enableSwipeGestures?: boolean;
  children: React.ReactNode;
}

export default function MobileOptimization({
  onRefresh,
  enablePullToRefresh = true,
  enableSwipeGestures = true,
  children
}: MobileOptimizationProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const lastScrollY = useRef(0);
  const rafId = useRef<number>();

  useEffect(() => {
    // 检测移动设备
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 防止缩放
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 滚动监听 - 显示/隐藏FAB
    const handleScroll = () => {
      if (rafId.current) return;
      
      rafId.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        setShowFAB(currentScrollY > 200 && currentScrollY > lastScrollY.current);
        lastScrollY.current = currentScrollY;
        rafId.current = undefined;
      });
    };

    if (isMobile) {
      document.addEventListener('touchstart', preventZoom, { passive: false });
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      document.removeEventListener('touchstart', preventZoom);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [isMobile]);

  // 下拉刷新逻辑
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enablePullToRefresh || !onRefresh) return;
    
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }, [enablePullToRefresh, onRefresh]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enablePullToRefresh || !onRefresh || isRefreshing) return;

    const touchY = e.touches[0].clientY;
    const touchX = e.touches[0].clientX;
    const deltaY = touchY - touchStartY.current;
    const deltaX = Math.abs(touchX - touchStartX.current);

    // 检查是否在页面顶部且是垂直滑动
    if (window.scrollY === 0 && deltaY > 0 && deltaX < 30) {
      e.preventDefault();
      
      const distance = Math.min(deltaY * 0.5, 120);
      setPullDistance(distance);
      
      // 添加触觉反馈
      if (distance > 80 && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  }, [enablePullToRefresh, onRefresh, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!enablePullToRefresh || !onRefresh || isRefreshing) return;

    if (pullDistance > 80) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    touchStartY.current = 0;
  }, [enablePullToRefresh, onRefresh, isRefreshing, pullDistance]);

  // 滑动手势处理
  const handleSwipeGesture = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (!enableSwipeGestures) return;

    // 自定义滑动逻辑
    const event = new CustomEvent('swipeGesture', { 
      detail: { direction } 
    });
    window.dispatchEvent(event);
  }, [enableSwipeGestures]);

  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    if (!enableSwipeGestures) return;
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, [enableSwipeGestures]);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (!enableSwipeGestures) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    const minSwipeDistance = 50;
    const maxSwipeTime = 300;

    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      if (deltaX > 0) {
        handleSwipeGesture('right');
      } else {
        handleSwipeGesture('left');
      }
    } else {
      // 垂直滑动
      if (deltaY > 0) {
        handleSwipeGesture('down');
      } else {
        handleSwipeGesture('up');
      }
    }
  }, [enableSwipeGestures, handleSwipeGesture]);

  // 快速操作按钮
  const FloatingActionButton = () => {
    if (!isMobile || !showFAB) return null;

    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center"
          aria-label="回到顶部"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
          </svg>
        </button>
      </div>
    );
  };

  // 下拉刷新指示器
  const PullToRefreshIndicator = () => {
    if (!isMobile || (!pullDistance && !isRefreshing)) return null;

    const progress = Math.min(pullDistance / 80, 1);
    const shouldTrigger = pullDistance > 80;

    return (
      <div 
        className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 transition-transform duration-200"
        style={{ 
          transform: `translateY(${Math.max(pullDistance - 80, 0)}px)`,
          opacity: Math.max(progress, 0.3)
        }}
      >
        <div className="flex flex-col items-center justify-center py-4">
          <div className={`transition-transform duration-200 ${isRefreshing ? 'animate-spin' : ''}`}>
            {isRefreshing ? (
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
              </svg>
            ) : (
              <svg 
                className={`w-6 h-6 transition-colors duration-200 ${shouldTrigger ? 'text-green-600' : 'text-gray-400'}`} 
                fill="currentColor" 
                viewBox="0 0 24 24"
                style={{ transform: `rotate(${progress * 180}deg)` }}
              >
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
            )}
          </div>
          <span className={`text-sm mt-2 transition-colors duration-200 ${
            isRefreshing ? 'text-blue-600' : shouldTrigger ? 'text-green-600' : 'text-gray-500'
          }`}>
            {isRefreshing ? '正在刷新...' : shouldTrigger ? '释放以刷新' : '下拉刷新'}
          </span>
        </div>
      </div>
    );
  };

  // 触摸反馈
  const TouchFeedback = () => {
    const [touchPoints, setTouchPoints] = useState<Array<{
      id: number;
      x: number;
      y: number;
      timestamp: number;
    }>>([]);

    useEffect(() => {
      if (!isMobile) return;

      const handleTouchStart = (e: TouchEvent) => {
        const touches = Array.from(e.touches).map((touch, index) => ({
          id: Date.now() + index,
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        }));
        
        setTouchPoints(prev => [...prev, ...touches]);

        // 清理旧的触摸点
        setTimeout(() => {
          setTouchPoints(prev => prev.filter(point => 
            Date.now() - point.timestamp < 300
          ));
        }, 300);
      };

      document.addEventListener('touchstart', handleTouchStart, { passive: true });

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
      };
    }, [isMobile]);

    if (!isMobile) return null;

    return (
      <div className="fixed inset-0 pointer-events-none z-30">
        {touchPoints.map(point => (
          <div
            key={point.id}
            className="absolute w-10 h-10 bg-blue-400 rounded-full opacity-30 animate-ping"
            style={{
              left: point.x - 20,
              top: point.y - 20,
              animationDuration: '300ms'
            }}
          />
        ))}
      </div>
    );
  };

  // Safe Area 适配
  const SafeAreaWrapper = ({ children }: { children: React.ReactNode }) => {
    if (!isMobile) return <>{children}</>;

    return (
      <div 
        className="min-h-screen"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
      >
        {children}
      </div>
    );
  };

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <SafeAreaWrapper>
      <div
        ref={containerRef}
        className="relative"
        onTouchStart={enablePullToRefresh ? handleTouchStart : enableSwipeGestures ? handleSwipeStart : undefined}
        onTouchMove={enablePullToRefresh ? handleTouchMove : undefined}
        onTouchEnd={enablePullToRefresh ? handleTouchEnd : enableSwipeGestures ? handleSwipeEnd : undefined}
      >
        <PullToRefreshIndicator />
        {children}
        <FloatingActionButton />
        <TouchFeedback />
      </div>
    </SafeAreaWrapper>
  );
}

// 移动端工具函数
export const MobileUtils = {
  // 检测移动设备
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // 检测iOS设备
  isIOS: () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  // 检测Android设备
  isAndroid: () => {
    return /Android/.test(navigator.userAgent);
  },

  // 获取设备像素比
  getDevicePixelRatio: () => {
    return window.devicePixelRatio || 1;
  },

  // 获取屏幕尺寸
  getScreenSize: () => {
    return {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight
    };
  },

  // 获取视口尺寸
  getViewportSize: () => {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  },

  // 触觉反馈
  vibrate: (duration: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  },

  // 防止页面滚动
  preventScroll: () => {
    document.body.style.overflow = 'hidden';
  },

  // 恢复页面滚动
  enableScroll: () => {
    document.body.style.overflow = '';
  },

  // 获取触摸事件的位置
  getTouchPosition: (e: TouchEvent) => {
    const touch = e.touches[0] || e.changedTouches[0];
    return {
      x: touch.clientX,
      y: touch.clientY
    };
  },

  // 计算两点距离
  getDistance: (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // 设置视口元标签
  setViewportMeta: () => {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }
};