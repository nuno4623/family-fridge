/* eslint-disable no-undef */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// FCM 백그라운드 메시지 → 시스템 알림
try {
  const app = initializeApp({
    apiKey: import.meta.env.VITE_FB_API_KEY,
    authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FB_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FB_MSG_SENDER_ID,
    appId: import.meta.env.VITE_FB_APP_ID
  })
  const messaging = getMessaging(app)
  onBackgroundMessage(messaging, (payload) => {
    const title = payload.notification?.title || payload.data?.title || '우리집 냉장고'
    const body = payload.notification?.body || payload.data?.body || ''
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: payload.data?.url || '/' }
    })
  })
} catch (e) {
  // Firebase 설정이 없으면 푸시 없이 PWA 캐시만 동작
  console.warn('FCM init skipped in SW', e)
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const client = clients.find((c) => 'focus' in c)
      if (client) return client.focus()
      return self.clients.openWindow(event.notification.data?.url || '/')
    })
  )
})
