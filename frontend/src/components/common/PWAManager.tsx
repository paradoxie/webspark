'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAManagerProps {
  children?: React.ReactNode;
  onInstallPrompt?: (canInstall: boolean) => void;
  onInstallSuccess?: () => void;
  onUpdateAvailable?: () => void;
  onNetworkChange?: (isOnline: boolean) => void;
}

// 内置Toast通知系统（避免外部依赖）
const showToast = (message: string, type: 'success' | 'info' | 'warn' | 'error' = 'info') => {
  // 检查是否已有toast容器
  let toastContainer = document.getElementById('pwa-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'pwa-toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const colors = {
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warn: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  toast.className = `${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg mb-2 transform transition-all duration-300 translate-x-full`;
  toast.style.pointerEvents = 'auto';
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // 动画显示
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);

  // 自动隐藏
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
};

export default function PWAManager({ 
  children, 
  onInstallPrompt,
  onInstallSuccess,
  onUpdateAvailable,
  onNetworkChange
}: PWAManagerProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 使用ref避免内存泄漏
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const isComponentMounted = useRef(true);

  // 清理定时器
  const clearTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
  }, []);

  // 安全的状态更新
  const safeSetState = useCallback((setter: () => void) => {
    if (isComponentMounted.current) {
      setter();
    }
  }, []);

  useEffect(() => {
    isComponentMounted.current = true;

    // 检查是否已安装
    const checkIfInstalled = () => {
      try {
        const isStandalone = (window.navigator as any).standalone || 
          window.matchMedia('(display-mode: standalone)').matches;
        
        safeSetState(() => {
          setIsInstalled(isStandalone);
          onInstallPrompt?.(false);
        });
      } catch (error) {
        console.warn('Failed to check PWA installation status:', error);
      }
    };

    // 监听安装提示事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      
      safeSetState(() => {
        setInstallPrompt(e as BeforeInstallPromptEvent);
        setIsInstallable(true);
        onInstallPrompt?.(true);
      });
      
      // 延迟显示安装横幅（避免过度打扰用户）
      const timeout = setTimeout(() => {
        if (isComponentMounted.current && shouldShowInstallBanner()) {
          safeSetState(() => setShowInstallBanner(true));
        }
      }, 10000); // 10秒后显示
      
      timeoutRefs.current.push(timeout);
    };

    // 监听应用安装事件
    const handleAppInstalled = () => {
      safeSetState(() => {
        setIsInstalled(true);
        setIsInstallable(false);
        setShowInstallBanner(false);
        setInstallPrompt(null);
      });
      
      showToast('WebSpark 已成功安装到您的设备！', 'success');
      onInstallSuccess?.();
    };

    // 监听网络状态变化
    const handleOnlineStatus = () => {
      const online = navigator.onLine;
      
      safeSetState(() => {
        setIsOnline(online);
      });

      if (online) {
        showToast('网络连接已恢复', 'success');
      } else {
        showToast('您现在处于离线状态，部分功能可能受限', 'warn');
      }
      
      onNetworkChange?.(online);
    };

    // Service Worker 更新检测
    const handleServiceWorkerUpdate = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          safeSetState(() => setUpdateAvailable(true));
          showToast('应用已更新，请刷新页面以获取最新版本', 'info');
          onUpdateAvailable?.();
        });

        // 检查现有的Service Worker更新
        navigator.serviceWorker.ready.then(registration => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  safeSetState(() => setUpdateAvailable(true));
                  showToast('新版本已准备就绪', 'info');
                  onUpdateAvailable?.();
                }
              });
            }
          });
        }).catch(error => {
          console.warn('Service Worker not ready:', error);
        });
      }
    };

    // 初始化
    try {
      checkIfInstalled();
      setIsOnline(navigator.onLine);
      handleServiceWorkerUpdate();
    } catch (error) {
      console.error('PWA initialization error:', error);
    }

    // 添加事件监听器
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // 清理函数
    return () => {
      isComponentMounted.current = false;
      clearTimeouts();
      
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [safeSetState, clearTimeouts, onInstallPrompt, onInstallSuccess, onUpdateAvailable, onNetworkChange]);

  // 手动触发安装
  const handleInstallClick = async () => {
    if (!installPrompt || isLoading) return;

    setIsLoading(true);

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
        showToast('正在安装 WebSpark...', 'info');
      } else {
        showToast('安装已取消', 'info');
      }
      
      setInstallPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Install failed:', error);
      showToast('安装失败，请稍后重试', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 关闭安装横幅
  const dismissInstallBanner = useCallback(() => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  // 检查是否应该显示安装横幅
  const shouldShowInstallBanner = useCallback(() => {
    try {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const weekInMs = 7 * 24 * 60 * 60 * 1000;
        return Date.now() - dismissedTime > weekInMs; // 一周后再次显示
      }
      return true;
    } catch (error) {
      console.warn('Failed to check install banner status:', error);
      return true;
    }
  }, []);

  // 刷新应用以获取更新
  const handleRefreshForUpdate = useCallback(() => {
    try {
      window.location.reload();
    } catch (error) {
      console.error('Failed to refresh for update:', error);
      showToast('刷新失败，请手动刷新页面', 'error');
    }
  }, []);

  // 安装横幅组件
  const InstallBanner = () => {
    if (!showInstallBanner || !isInstallable || isInstalled || !shouldShowInstallBanner()) {
      return null;
    }

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 shadow-lg z-50 transform transition-transform duration-300">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">安装 WebSpark</h3>
              <p className="text-blue-100 text-sm">
                安装到您的设备以获得更好的体验！离线浏览、快速启动等功能等您体验。
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstallClick}
              disabled={isLoading}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                  </svg>
                  <span>安装中...</span>
                </>
              ) : (
                <span>安装</span>
              )}
            </button>
            <button
              onClick={dismissInstallBanner}
              className="text-blue-200 hover:text-white p-2 transition-colors"
              aria-label="关闭"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 离线状态指示器
  const OfflineIndicator = () => {
    if (isOnline) return null;

    return (
      <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.64 7c-.45-.34-4.93-4-11.64-4-1.5 0-2.89.19-4.15.48L18.18 13.8 23.64 7zm-6.6 8.22L3.27 1.44 2 2.72l2.05 2.06C1.91 5.76.59 6.82.36 7l11.63 14.49.01.01.01-.01L17.4 14.74l3.9 3.89 1.26-1.27-4.51-4.51z"/>
        </svg>
        <span className="text-sm font-medium">离线模式</span>
      </div>
    );
  };

  // 更新提示
  const UpdateNotification = () => {
    if (!updateAvailable) return null;

    return (
      <div className="fixed top-20 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold mb-1">应用更新可用</h4>
            <p className="text-green-100 text-sm mb-3">
              新版本已准备就绪，包含性能改进和新功能。
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleRefreshForUpdate}
                className="bg-white text-green-600 px-3 py-1 rounded text-sm font-medium hover:bg-green-50 transition-colors"
              >
                立即更新
              </button>
              <button
                onClick={() => setUpdateAvailable(false)}
                className="text-green-200 hover:text-white px-3 py-1 rounded text-sm transition-colors"
              >
                稍后
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 添加iOS Safari特殊提示
  const IOSInstallPrompt = () => {
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);

    useEffect(() => {
      try {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isInStandaloneMode = (window.navigator as any).standalone;
        const isInstallPromptDismissed = localStorage.getItem('ios-install-dismissed');

        if (isIOS && !isInStandaloneMode && !isInstallPromptDismissed && !isInstalled) {
          // 延迟显示iOS安装提示
          const timer = setTimeout(() => {
            if (isComponentMounted.current) {
              setShowIOSPrompt(true);
            }
          }, 15000); // 15秒后显示

          timeoutRefs.current.push(timer);
        }
      } catch (error) {
        console.warn('Failed to check iOS install status:', error);
      }
    }, [isInstalled]);

    const dismissIOSPrompt = useCallback(() => {
      setShowIOSPrompt(false);
      try {
        localStorage.setItem('ios-install-dismissed', 'true');
      } catch (error) {
        console.warn('Failed to save iOS install dismissal:', error);
      }
    }, []);

    if (!showIOSPrompt) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
        <div className="bg-white w-full rounded-t-2xl p-6 max-h-96 overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">安装 WebSpark</h3>
            <button
              onClick={dismissIOSPrompt}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="关闭"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          
          <div className="space-y-4 text-gray-700">
            <p>在 iPhone/iPad 上安装 WebSpark 应用：</p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <p>点击底部的分享按钮 <span className="inline-flex w-4 h-4 mx-1">📤</span></p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <p>选择"添加到主屏幕"</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <p>点击"添加"完成安装</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {children}
      <InstallBanner />
      <OfflineIndicator />
      <UpdateNotification />
      <IOSInstallPrompt />
    </>
  );
}

// 导出PWA状态检查工具 - 增强版本
export const PWAUtils = {
  isInstalled: (): boolean => {
    try {
      return (window.navigator as any).standalone || 
        window.matchMedia('(display-mode: standalone)').matches;
    } catch (error) {
      console.warn('Failed to check PWA installation status:', error);
      return false;
    }
  },
  
  isOnline: (): boolean => {
    try {
      return navigator.onLine;
    } catch (error) {
      console.warn('Failed to check online status:', error);
      return true; // 默认假设在线
    }
  },
  
  canInstall: (): boolean => {
    return !PWAUtils.isInstalled() && PWAUtils.isPWASupported();
  },

  // 检查是否支持PWA功能
  isPWASupported: (): boolean => {
    try {
      return 'serviceWorker' in navigator && 
        ('BeforeInstallPromptEvent' in window || 'beforeinstallprompt' in window);
    } catch (error) {
      console.warn('Failed to check PWA support:', error);
      return false;
    }
  },

  // 获取设备信息
  getDeviceInfo: () => {
    try {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isMobile = isIOS || isAndroid || /Mobile/.test(userAgent);
      
      return {
        isIOS,
        isAndroid,
        isMobile,
        isDesktop: !isMobile,
        userAgent: userAgent.substring(0, 200) // 限制长度
      };
    } catch (error) {
      console.warn('Failed to get device info:', error);
      return {
        isIOS: false,
        isAndroid: false,
        isMobile: false,
        isDesktop: true,
        userAgent: 'Unknown'
      };
    }
  },

  // 获取网络信息
  getNetworkInfo: () => {
    try {
      const connection = (navigator as any).connection || 
        (navigator as any).mozConnection || 
        (navigator as any).webkitConnection;
      
      if (connection) {
        return {
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false
        };
      }
      
      return {
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false
      };
    } catch (error) {
      console.warn('Failed to get network info:', error);
      return {
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false
      };
    }
  },

  // 注册Service Worker
  registerServiceWorker: async (swPath: string = '/sw.js'): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register(swPath);
      console.log('Service Worker registered:', registration);
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  },

  // 清理PWA相关的本地存储
  clearPWAData: () => {
    try {
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('ios-install-dismissed');
      return true;
    } catch (error) {
      console.warn('Failed to clear PWA data:', error);
      return false;
    }
  }
};