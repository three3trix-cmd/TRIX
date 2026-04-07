const CACHE_NAME = '3TRIX-chat-v1'
const VAPID_PUBLIC_KEY = 'BI3AUGoFr1k6cBt9zAYrNxLFSqPsncUwqm0viZy5ZORECatIGwCvLbOeDFc6nAdA7TyVFI2zd7Rcr-89Ltwqu94'

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
]

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  )
})

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
    .then(() => self.clients.claim())
  )
})

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  console.log('[SW] Push получен')
  
  let data = {
    title: '3TRIX 💬',
    body: 'Новое сообщение',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: {
      url: '/'
    }
  }
  
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      console.error('[SW] Ошибка парсинга push данных:', e)
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || { url: '/' },
    actions: [
      {
        action: 'open',
        title: 'Открыть чат'
      },
      {
        action: 'close',
        title: 'Закрыть'
      }
    ],
    tag: data.data?.room_id ? `room-${data.data.room_id}` : 'chat-message',
    renotify: true,
    requireInteraction: false,
    silent: false
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Клик по уведомлению', event)
  
  event.notification.close()
  
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // Проверяем, есть ли уже открытое окно
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus()
        }
      }
      // Если нет - открываем новое
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Обработка fetch запросов (кэширование)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Пропускаем Vite файлы в разработке
  if (url.pathname.includes('/@vite/') || 
      url.pathname.includes('/node_modules/') ||
      url.pathname.includes('/src/') ||
      url.pathname.endsWith('.jsx') ||
      url.pathname.endsWith('.tsx') ||
      url.pathname.includes('hot-update')) {
    return
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request)
          .then((response) => {
            if (response.status === 200 && 
                (url.pathname.startsWith('/icons/') || 
                 url.pathname.endsWith('.png') ||
                 url.pathname.endsWith('.jpg') ||
                 url.pathname.endsWith('.svg'))) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone)
              })
            }
            return response
          })
      })
  )
})