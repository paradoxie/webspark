// PWA Service Worker for Mobile Optimization
const CACHE_NAME = 'webspark-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png'
]

// 预缓存关键资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      })
      .then(() => self.clients.claim())
  )
})

// 网络请求拦截 - 缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return
  }

  // 不同资源类型的缓存策略
  if (request.destination === 'image') {
    // 图片：缓存优先策略
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response
          }
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone()
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone)
                  })
              }
              return response
            })
        })
        .catch(() => {
          // 返回默认图片占位符
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f1f5f9"/><text x="200" y="150" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="16">图片加载失败</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          )
        })
    )
  } else if (request.destination === 'document') {
    // HTML页面：网络优先，缓存后备
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone)
              })
          }
          return response
        })
        .catch(() => {
          return caches.match(request)
            .then((response) => {
              if (response) {
                return response
              }
              // 返回离线页面
              return caches.match('/')
            })
        })
    )
  } else if (request.destination === 'script' || request.destination === 'style') {
    // JS/CSS：缓存优先
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone()
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone)
                  })
              }
              return response
            })
        })
    )
  }
})

// 推送通知支持
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/apple-touch-icon.png',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1
      },
      actions: [
        {
          action: 'explore',
          title: '查看详情',
          icon: '/apple-touch-icon.png'
        },
        {
          action: 'close',
          title: '关闭',
          icon: '/favicon.ico'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 执行后台同步任务
      syncData()
    )
  }
})

async function syncData() {
  try {
    // 同步用户数据、提交的表单等
    const pendingData = await getPendingData()
    
    for (const data of pendingData) {
      await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
    }
    
    await clearPendingData()
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

async function getPendingData() {
  // 从IndexedDB获取待同步数据
  return []
}

async function clearPendingData() {
  // 清除已同步的数据
}