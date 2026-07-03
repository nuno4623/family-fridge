import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { app, db } from './firebase'
import { storage } from './utils'

export async function pushSupported() {
  try {
    return (await isSupported()) && 'Notification' in window && 'serviceWorker' in navigator
  } catch {
    return false
  }
}

/**
 * 알림 권한 요청 + FCM 토큰 발급 → users/{uid}.fcmTokens 에 저장.
 * 반환: 'granted' | 'denied' | 'unsupported' | 'error'
 */
export async function enablePush(uid) {
  if (!(await pushSupported())) return 'unsupported'
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'
  try {
    const registration = await navigator.serviceWorker.ready
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FB_VAPID_KEY,
      serviceWorkerRegistration: registration
    })
    if (!token) return 'error'
    storage.set('fridge:fcmToken', token)
    await updateDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) })
    return 'granted'
  } catch (e) {
    console.error('FCM 토큰 발급 실패', e)
    return 'error'
  }
}

export async function disablePush(uid) {
  const token = storage.get('fridge:fcmToken')
  if (token) {
    await updateDoc(doc(db, 'users', uid), { fcmTokens: arrayRemove(token) })
    storage.remove('fridge:fcmToken')
  }
}
