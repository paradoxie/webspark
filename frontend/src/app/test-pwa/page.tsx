'use client';

import { useState, useEffect } from 'react';
import PWAManager, { PWAUtils } from '@/components/common/PWAManager';
import MobileOptimization, { MobileUtils } from '@/components/common/MobileOptimization';

export default function PWATestPage() {
  const [pwaStatus, setPwaStatus] = useState({
    isInstalled: false,
    isOnline: true,
    canInstall: false,
    isPWASupported: false,
    deviceInfo: null as any,
    networkInfo: null as any
  });

  const [testResults, setTestResults] = useState({
    serviceWorker: '未测试',
    caching: '未测试',
    offline: '未测试',
    install: '未测试',
    notifications: '未测试',
    mobileFeatures: '未测试'
  });

  useEffect(() => {
    // 初始化PWA状态检查
    const updatePWAStatus = () => {
      setPwaStatus({
        isInstalled: PWAUtils.isInstalled(),
        isOnline: PWAUtils.isOnline(),
        canInstall: PWAUtils.canInstall(),
        isPWASupported: PWAUtils.isPWASupported(),
        deviceInfo: PWAUtils.getDeviceInfo(),
        networkInfo: PWAUtils.getNetworkInfo()
      });
    };

    updatePWAStatus();

    // 监听网络状态变化
    const handleOnlineStatus = () => updatePWAStatus();
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // 测试Service Worker
  const testServiceWorker = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        setTestResults(prev => ({
          ...prev,
          serviceWorker: registration ? '✅ 已注册' : '❌ 未注册'
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          serviceWorker: '❌ 不支持'
        }));
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        serviceWorker: `❌ 错误: ${error}`
      }));
    }
  };

  // 测试缓存功能
  const testCaching = async () => {
    try {
      const response = await fetch('/api/stats/public', { 
        cache: 'force-cache' 
      });
      const data = await response.json();
      setTestResults(prev => ({
        ...prev,
        caching: data ? '✅ 缓存正常' : '❌ 缓存失败'
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        caching: `❌ 错误: ${error}`
      }));
    }
  };

  // 测试离线功能
  const testOffline = () => {
    if (navigator.onLine) {
      setTestResults(prev => ({
        ...prev,
        offline: '⚠️ 在线状态，无法测试离线功能'
      }));
    } else {
      setTestResults(prev => ({
        ...prev,
        offline: '✅ 离线状态检测正常'
      }));
    }
  };

  // 测试安装功能
  const testInstall = () => {
    if (PWAUtils.isInstalled()) {
      setTestResults(prev => ({
        ...prev,
        install: '✅ 已安装为PWA'
      }));
    } else if (PWAUtils.canInstall()) {
      setTestResults(prev => ({
        ...prev,
        install: '⚠️ 可安装但未安装'
      }));
    } else {
      setTestResults(prev => ({
        ...prev,
        install: '❌ 不支持安装'
      }));
    }
  };

  // 测试通知功能
  const testNotifications = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification('WebSpark PWA测试', {
            body: '通知功能测试成功！',
            icon: '/icon-192x192.png'
          });
          setTestResults(prev => ({
            ...prev,
            notifications: '✅ 通知功能正常'
          }));
        } else {
          setTestResults(prev => ({
            ...prev,
            notifications: '❌ 通知权限被拒绝'
          }));
        }
      } else {
        setTestResults(prev => ({
          ...prev,
          notifications: '❌ 不支持通知'
        }));
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        notifications: `❌ 错误: ${error}`
      }));
    }
  };

  // 测试移动端功能
  const testMobileFeatures = () => {
    const isMobile = MobileUtils.isMobile();
    const hasVibration = MobileUtils.vibrate ? '支持' : '不支持';
    const hasTouch = 'ontouchstart' in window ? '支持' : '不支持';
    
    setTestResults(prev => ({
      ...prev,
      mobileFeatures: `✅ 移动设备:${isMobile ? '是' : '否'} | 震动:${hasVibration} | 触摸:${hasTouch}`
    }));
  };

  // 运行所有测试
  const runAllTests = async () => {
    await testServiceWorker();
    await testCaching();
    testOffline();
    testInstall();
    await testNotifications();
    testMobileFeatures();
  };

  return (
    <PWAManager
      onInstallPrompt={(canInstall) => console.log('安装提示:', canInstall)}
      onInstallSuccess={() => console.log('安装成功')}
      onUpdateAvailable={() => console.log('更新可用')}
      onNetworkChange={(isOnline) => console.log('网络状态:', isOnline)}
    >
      <MobileOptimization>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                🧪 PWA 功能测试中心
              </h1>

              {/* PWA状态面板 */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h2 className="text-xl font-semibold text-blue-900 mb-4">📊 PWA 状态</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>已安装:</span>
                      <span className={pwaStatus.isInstalled ? 'text-green-600' : 'text-red-600'}>
                        {pwaStatus.isInstalled ? '✅ 是' : '❌ 否'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>在线状态:</span>
                      <span className={pwaStatus.isOnline ? 'text-green-600' : 'text-red-600'}>
                        {pwaStatus.isOnline ? '🟢 在线' : '🔴 离线'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>可安装:</span>
                      <span className={pwaStatus.canInstall ? 'text-green-600' : 'text-gray-600'}>
                        {pwaStatus.canInstall ? '✅ 是' : '➖ 否'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>PWA支持:</span>
                      <span className={pwaStatus.isPWASupported ? 'text-green-600' : 'text-red-600'}>
                        {pwaStatus.isPWASupported ? '✅ 支持' : '❌ 不支持'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h2 className="text-xl font-semibold text-green-900 mb-4">📱 设备信息</h2>
                  {pwaStatus.deviceInfo && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>设备类型:</span>
                        <span>
                          {pwaStatus.deviceInfo.isMobile ? '📱 移动' : 
                           pwaStatus.deviceInfo.isDesktop ? '💻 桌面' : '❓ 未知'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>操作系统:</span>
                        <span>
                          {pwaStatus.deviceInfo.isIOS ? '🍎 iOS' : 
                           pwaStatus.deviceInfo.isAndroid ? '🤖 Android' : '💻 其他'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>网络类型:</span>
                        <span>{pwaStatus.networkInfo?.effectiveType || '未知'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>省流量模式:</span>
                        <span className={pwaStatus.networkInfo?.saveData ? 'text-orange-600' : 'text-green-600'}>
                          {pwaStatus.networkInfo?.saveData ? '🔋 开启' : '💪 关闭'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 测试控制面板 */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🧪 功能测试</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <button
                    onClick={testServiceWorker}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    测试 SW
                  </button>
                  <button
                    onClick={testCaching}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    测试缓存
                  </button>
                  <button
                    onClick={testOffline}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                  >
                    测试离线
                  </button>
                  <button
                    onClick={testInstall}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    测试安装
                  </button>
                  <button
                    onClick={testNotifications}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    测试通知
                  </button>
                  <button
                    onClick={testMobileFeatures}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    测试移动
                  </button>
                  <button
                    onClick={runAllTests}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors text-sm col-span-2"
                  >
                    🚀 运行全部测试
                  </button>
                </div>

                {/* 测试结果 */}
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">📋 测试结果</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Service Worker:</span>
                      <span>{testResults.serviceWorker}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>缓存功能:</span>
                      <span>{testResults.caching}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>离线检测:</span>
                      <span>{testResults.offline}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>安装状态:</span>
                      <span>{testResults.install}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>通知功能:</span>
                      <span>{testResults.notifications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>移动功能:</span>
                      <span>{testResults.mobileFeatures}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PWA工具 */}
              <div className="bg-yellow-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-yellow-900 mb-4">🛠️ PWA 工具</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => PWAUtils.clearPWAData()}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    清理PWA数据
                  </button>
                  <button
                    onClick={() => PWAUtils.registerServiceWorker()}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    重新注册SW
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    刷新页面
                  </button>
                  <button
                    onClick={() => {
                      if (MobileUtils.vibrate) {
                        MobileUtils.vibrate(200);
                      }
                    }}
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    测试震动
                  </button>
                </div>
              </div>

              {/* 使用说明 */}
              <div className="mt-8 bg-blue-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">📖 使用说明</h2>
                <div className="text-sm text-blue-800 space-y-2">
                  <p><strong>1. PWA安装测试:</strong> 在支持的浏览器中，应该会显示安装横幅或可以通过浏览器菜单安装。</p>
                  <p><strong>2. 离线功能测试:</strong> 断开网络连接后，应用应该仍能正常访问缓存的页面。</p>
                  <p><strong>3. 移动端测试:</strong> 在移动设备上测试下拉刷新、滑动手势等功能。</p>
                  <p><strong>4. 通知测试:</strong> 点击通知测试按钮，应该会弹出权限请求和测试通知。</p>
                  <p><strong>5. Service Worker:</strong> 检查浏览器开发者工具中的Application标签页。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MobileOptimization>
    </PWAManager>
  );
} 