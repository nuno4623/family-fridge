const { onDocumentWritten, onDocumentCreated } = require('firebase-functions/v2/firestore')
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()
const db = getFirestore()

// Urgency: high — 배터리 절약 모드 등에서 지연 없이 즉시 전달되도록 요청
const WEBPUSH_OPTS = {
  headers: { Urgency: 'high' },
  notification: { icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' },
  fcmOptions: { link: '/' }
}

// sendEachForMulticast 결과에서 무효 토큰을 각 사용자 문서에서 제거
async function cleanupTokens(targets, responses) {
  const cleanup = []
  responses.forEach((r, i) => {
    const code = r.error && r.error.code
    if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-argument') {
      const { uid, token } = targets[i]
      cleanup.push(db.doc(`users/${uid}`).update({ fcmTokens: FieldValue.arrayRemove(token) }))
    }
  })
  await Promise.allSettled(cleanup)
}

/**
 * 가족 멤버 중 actor를 제외하고 notify[kind]가 켜진 사람들에게 푸시 발송.
 * 무효 토큰은 사용자 문서에서 정리한다.
 */
async function notifyFamily(familyId, actorUid, kind, title, body) {
  const familySnap = await db.doc(`families/${familyId}`).get()
  if (!familySnap.exists) return
  const members = (familySnap.data().members || []).filter((uid) => uid !== actorUid)
  if (members.length === 0) return

  const userSnaps = await Promise.all(members.map((uid) => db.doc(`users/${uid}`).get()))
  const targets = [] // { uid, token }
  for (const snap of userSnaps) {
    if (!snap.exists) continue
    const data = snap.data()
    if (data.notify && data.notify[kind] === false) continue
    for (const token of data.fcmTokens || []) targets.push({ uid: snap.id, token })
  }
  if (targets.length === 0) return

  const res = await getMessaging().sendEachForMulticast({
    tokens: targets.map((t) => t.token),
    notification: { title, body },
    webpush: WEBPUSH_OPTS
  })

  await cleanupTokens(targets, res.responses)
}

async function actorName(uid) {
  if (!uid) return '가족'
  const snap = await db.doc(`users/${uid}`).get()
  return (snap.exists && snap.data().name) || '가족'
}

// 1) 식재료가 '떨어짐'으로 바뀌면 알림
exports.onItemWrite = onDocumentWritten('families/{familyId}/items/{itemId}', async (event) => {
  const before = event.data.before.exists ? event.data.before.data() : null
  const after = event.data.after.exists ? event.data.after.data() : null
  if (!after) return
  if (after.status !== 'out' || (before && before.status === 'out')) return

  const name = after.updatedByName || await actorName(after.updatedBy)
  await notifyFamily(
    event.params.familyId,
    after.updatedBy,
    'shopping',
    '🛒 식구들',
    `${name}님이 '${after.name}' 떨어짐 표시했어요`
  )
})

// 2) 새 일정 알림
exports.onEventCreate = onDocumentCreated('families/{familyId}/events/{eventId}', async (event) => {
  const data = event.data.data()
  const name = data.ownerName || await actorName(data.owner)
  const [, m, d] = (data.date || '').split('-').map(Number)
  const when = m && d ? `${m}월 ${d}일${data.time ? ' ' + data.time : ''}` : ''
  await notifyFamily(
    event.params.familyId,
    data.owner,
    'event',
    '📅 새 일정',
    `${name}: ${data.title}${when ? ` (${when})` : ''}`
  )
})

// 3) 새 메모 알림
exports.onMemoCreate = onDocumentCreated('families/{familyId}/memos/{memoId}', async (event) => {
  const data = event.data.data()
  const name = data.authorName || await actorName(data.author)
  const preview = (data.text || '').slice(0, 30)
  await notifyFamily(
    event.params.familyId,
    data.author,
    'memo',
    '📝 새 메모',
    `${name}님: ${preview}${data.text && data.text.length > 30 ? '…' : ''}`
  )
})

// 진단용: 본인 기기로만 즉시 테스트 알림 발송 (설정 화면의 "테스트 알림 보내기" 버튼)
// region: Firestore 트리거 함수들이 서울(asia-northeast3)에 배포되므로 맞춰준다
exports.sendTestNotification = onCall({ region: 'asia-northeast3' }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', '로그인이 필요해요')

  const userSnap = await db.doc(`users/${uid}`).get()
  const tokens = (userSnap.exists && userSnap.data().fcmTokens) || []
  if (tokens.length === 0) {
    return { sent: 0, failed: 0, message: '등록된 기기가 없어요. 먼저 "이 기기에서 푸시 받기"를 켜주세요.' }
  }

  const res = await getMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: '🔔 테스트 알림',
      body: `지금 도착했으면 정상이에요! (${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' })})`
    },
    webpush: WEBPUSH_OPTS
  })

  await cleanupTokens(tokens.map((token) => ({ uid, token })), res.responses)
  return { sent: res.successCount, failed: res.failureCount }
})
