import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { getFunctions, httpsCallable } from 'firebase/functions'
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

/**
 * FCM 토큰은 브라우저가 주기적으로 회전시킨다. 설정에서 한 번 켠 뒤로는 아무도
 * 다시 갱신해 주지 않으면, 시간이 지나 저장된 토큰이 조용히 만료되어 알림이
 * 안 오게 된다. 그래서 앱을 열 때마다(권한이 이미 허용된 경우에 한해) 조용히
 * 재등록해 최신 토큰을 Firestore에 유지한다. 권한이 아직 'default'면 여기서는
 * 프롬프트를 띄우지 않는다 — 사용자가 설정에서 직접 켜야 한다.
 */
export async function refreshPushTokenIfGranted(uid) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    if (!(await pushSupported())) return
    await enablePush(uid)
  } catch (e) {
    console.warn('푸시 토큰 갱신 실패', e)
  }
}

/** 진단용 테스트 알림 — 본인 기기로만 발송 */
export async function sendTestNotification() {
  const functions = getFunctions(app, 'asia-northeast3')
  const call = httpsCallable(functions, 'sendTestNotification')
  const res = await call()
  return res.data
}
