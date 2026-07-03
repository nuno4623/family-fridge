// 데모 모드용 Firebase 모듈 목(mock).
// vite.demo.config.mjs 의 alias가 firebase/{app,auth,firestore,messaging}를
// 전부 이 파일로 바꿔치기해서, 실제 앱 코드를 그대로 인메모리 데이터로 돌린다.

// ---------- Timestamp ----------
const ts = (ms) => ({
  toMillis: () => ms,
  toDate: () => new Date(ms),
  seconds: Math.floor(ms / 1000)
})
export const serverTimestamp = () => ts(Date.now())

const now = Date.now()
const hoursAgo = (h) => ts(now - h * 3600_000)
const daysFromNow = (d) => {
  const date = new Date()
  date.setDate(date.getDate() + d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// ---------- 인메모리 스토어 ----------
const cols = new Map() // colPath -> Map(id -> data)
const colOf = (path) => {
  if (!cols.has(path)) cols.set(path, new Map())
  return cols.get(path)
}

let idCounter = 0
const genId = () => `demo${++idCounter}`

// 샘플 가족: 지선(본인) · 준호(남편) · 어머님
const U1 = 'u-jiseon', U2 = 'u-junho', U3 = 'u-mother'
const FAM = 'fam-demo'

function seed(path, entries) {
  const col = colOf(path)
  for (const [id, data] of entries) col.set(id, data)
}

seed('users', [
  [U1, { name: '지선', color: '#E08A5B', familyId: FAM, fcmTokens: [], notify: { shopping: true, event: true, memo: true } }],
  [U2, { name: '준호', color: '#2E6BFF', familyId: FAM, fcmTokens: [], notify: { shopping: true, event: true, memo: true } }],
  [U3, { name: '어머님', color: '#16A97A', familyId: FAM, fcmTokens: [], notify: { shopping: true, event: false, memo: true } }]
])

seed('families', [
  [FAM, { name: '우리집', inviteCode: 'K7M2QX', members: [U1, U2, U3], createdAt: hoursAgo(24 * 30) }]
])

seed(`families/${FAM}/items`, [
  ['i1', { name: '계란', category: '냉장', status: 'out', memo: '30구짜리로', checkedInCart: false, updatedBy: U2, updatedAt: hoursAgo(2) }],
  ['i2', { name: '우유', category: '냉장', status: 'low', memo: '', checkedInCart: false, updatedBy: U3, updatedAt: hoursAgo(5) }],
  ['i3', { name: '두부', category: '냉장', status: 'buying', memo: '', checkedInCart: false, updatedBy: U1, updatedAt: hoursAgo(1) }],
  ['i4', { name: '김치', category: '냉장', status: 'stocked', memo: '', checkedInCart: false, updatedBy: U3, updatedAt: hoursAgo(48) }],
  ['i5', { name: '애호박', category: '냉장', status: 'stocked', memo: '', checkedInCart: false, updatedBy: U1, updatedAt: hoursAgo(20) }],
  ['i6', { name: '만두', category: '냉동', status: 'stocked', memo: '', checkedInCart: false, updatedBy: U2, updatedAt: hoursAgo(72) }],
  ['i7', { name: '국거리 소고기', category: '냉동', status: 'low', memo: '', checkedInCart: false, updatedBy: U3, updatedAt: hoursAgo(8) }],
  ['i8', { name: '라면', category: '실온', status: 'stocked', memo: '', checkedInCart: false, updatedBy: U2, updatedAt: hoursAgo(100) }],
  ['i9', { name: '쌀', category: '실온', status: 'low', memo: '10kg', checkedInCart: false, updatedBy: U1, updatedAt: hoursAgo(30) }],
  ['i10', { name: '참기름', category: '실온', status: 'buying', memo: '작은 병', checkedInCart: true, updatedBy: U3, updatedAt: hoursAgo(3) }]
])

seed(`families/${FAM}/events`, [
  ['e1', { title: '병원 예약', date: daysFromNow(0), time: '14:00', owner: U3, memo: '내과', createdAt: hoursAgo(30) }],
  ['e2', { title: '마트 같이 가기', date: daysFromNow(1), time: '10:30', owner: U1, memo: '', createdAt: hoursAgo(10) }],
  ['e3', { title: '아파트 소독', date: daysFromNow(3), time: null, owner: U2, memo: '오전 중 방문', createdAt: hoursAgo(50) }],
  ['e4', { title: '김장', date: daysFromNow(9), time: null, owner: U3, memo: '배추 20포기', createdAt: hoursAgo(70) }],
  ['e5', { title: '친구 모임', date: daysFromNow(5), time: '19:00', owner: U2, memo: '', createdAt: hoursAgo(15) }]
])

seed(`families/${FAM}/memos`, [
  ['m1', { text: '분리수거는 목요일 아침! 🗑', color: 'yellow', author: U1, pinned: true, createdAt: hoursAgo(72) }],
  ['m2', { text: '고등어 손질해서 냉동칸에 넣어뒀다', color: 'pink', author: U3, pinned: false, createdAt: hoursAgo(6) }],
  ['m3', { text: '주말에 다 같이 장보러 가요~', color: 'mint', author: U1, pinned: false, createdAt: hoursAgo(26) }],
  ['m4', { text: '정수기 필터 교체 예약함 (금요일 오후)', color: 'lavender', author: U2, pinned: false, createdAt: hoursAgo(40) }]
])

// ---------- 참조 & 쿼리 ----------
export const getFirestore = () => ({ __mock: true })

export function collection(_db, ...segs) {
  return { __type: 'col', path: segs.join('/') }
}

export function doc(refOrDb, ...segs) {
  if (refOrDb && refOrDb.__type === 'col') {
    const id = segs[0] || genId()
    return { __type: 'doc', colPath: refOrDb.path, id }
  }
  const parts = segs
  const id = parts[parts.length - 1]
  return { __type: 'doc', colPath: parts.slice(0, -1).join('/'), id }
}

export const query = (colRef, ...clauses) => ({ __type: 'query', path: colRef.path, clauses })
export const where = (field, op, value) => ({ kind: 'where', field, op, value })
export const orderBy = (field, dir = 'asc') => ({ kind: 'order', field, dir })

export const arrayUnion = (...values) => ({ __op: 'arrayUnion', values })
export const arrayRemove = (...values) => ({ __op: 'arrayRemove', values })

const cmp = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : v)

function runQuery(path, clauses = []) {
  let docs = [...colOf(path).entries()]
  for (const c of clauses) {
    if (c.kind === 'where' && c.op === '==') docs = docs.filter(([, d]) => d[c.field] === c.value)
  }
  const order = clauses.find((c) => c.kind === 'order')
  if (order) {
    docs.sort((a, b) => {
      const av = cmp(a[1][order.field]), bv = cmp(b[1][order.field])
      const r = av < bv ? -1 : av > bv ? 1 : 0
      return order.dir === 'desc' ? -r : r
    })
  }
  return docs
}

// ---------- 리스너 ----------
const colListeners = new Map() // colPath -> Set(listener)
const docListeners = new Map() // docPath -> Set(cb)

function makeColSnapshot(listener) {
  const docs = runQuery(listener.path, listener.clauses)
  const prev = listener.prev
  const changes = []
  for (const [id, data] of docs) {
    const doc = { id, data: () => data, metadata: { hasPendingWrites: false } }
    if (!prev.has(id)) changes.push({ type: 'added', doc })
    else if (prev.get(id) !== data) changes.push({ type: 'modified', doc })
  }
  for (const [id, data] of prev) {
    if (!docs.some(([did]) => did === id)) {
      changes.push({ type: 'removed', doc: { id, data: () => data, metadata: { hasPendingWrites: false } } })
    }
  }
  listener.prev = new Map(docs)
  return {
    forEach: (fn) => docs.forEach(([id, data]) => fn({ id, data: () => data })),
    docChanges: () => changes
  }
}

export function onSnapshot(target, cb) {
  if (target.__type === 'doc') {
    const path = `${target.colPath}/${target.id}`
    if (!docListeners.has(path)) docListeners.set(path, new Set())
    docListeners.get(path).add(cb)
    emitDoc(target, cb)
    return () => docListeners.get(path)?.delete(cb)
  }
  const listener = { path: target.path, clauses: target.clauses || [], cb, prev: new Map() }
  if (!colListeners.has(listener.path)) colListeners.set(listener.path, new Set())
  colListeners.get(listener.path).add(listener)
  cb(makeColSnapshot(listener))
  return () => colListeners.get(listener.path)?.delete(listener)
}

function emitDoc(docRef, cb) {
  const data = colOf(docRef.colPath).get(docRef.id)
  cb({ exists: () => data !== undefined, id: docRef.id, data: () => data })
}

function notify(colPath, docId) {
  for (const listener of colListeners.get(colPath) || []) {
    listener.cb(makeColSnapshot(listener))
  }
  if (docId) {
    for (const cb of docListeners.get(`${colPath}/${docId}`) || []) {
      cb({
        exists: () => colOf(colPath).get(docId) !== undefined,
        id: docId,
        data: () => colOf(colPath).get(docId)
      })
    }
  }
}

// ---------- 쓰기 ----------
function applyPatch(data, patch) {
  const next = { ...data }
  for (const [key, raw] of Object.entries(patch)) {
    let value = raw
    if (raw && raw.__op === 'arrayUnion') {
      const cur = key.includes('.') ? [] : next[key] || []
      value = [...new Set([...cur, ...raw.values])]
    } else if (raw && raw.__op === 'arrayRemove') {
      value = (next[key] || []).filter((v) => !raw.values.includes(v))
    }
    if (key.includes('.')) {
      const [a, b] = key.split('.')
      next[a] = { ...(next[a] || {}), [b]: value }
    } else {
      next[key] = value
    }
  }
  return next
}

export async function addDoc(colRef, data) {
  const id = genId()
  colOf(colRef.path).set(id, { ...data })
  notify(colRef.path, id)
  return { id }
}

export async function setDoc(docRef, data) {
  colOf(docRef.colPath).set(docRef.id, { ...data })
  notify(docRef.colPath, docRef.id)
}

export async function updateDoc(docRef, patch) {
  const col = colOf(docRef.colPath)
  const cur = col.get(docRef.id)
  if (cur === undefined) throw new Error('not-found')
  col.set(docRef.id, applyPatch(cur, patch))
  notify(docRef.colPath, docRef.id)
}

export async function deleteDoc(docRef) {
  colOf(docRef.colPath).delete(docRef.id)
  notify(docRef.colPath, docRef.id)
}

export async function getDoc(docRef) {
  const data = colOf(docRef.colPath).get(docRef.id)
  return { exists: () => data !== undefined, id: docRef.id, data: () => data }
}

export function writeBatch() {
  const ops = []
  return {
    update: (ref, patch) => ops.push(() => updateDoc(ref, patch)),
    set: (ref, data) => ops.push(() => setDoc(ref, data)),
    delete: (ref) => ops.push(() => deleteDoc(ref)),
    commit: async () => { for (const op of ops) await op() }
  }
}

// ---------- app / auth / messaging ----------
export const initializeApp = () => ({ __mock: true })

const MOCK_USER = { uid: U1, displayName: '지선', email: 'demo@example.com' }
let currentUser = MOCK_USER
const authListeners = new Set()

export const getAuth = () => ({ __mock: true })
export class GoogleAuthProvider {}

export function onAuthStateChanged(_auth, cb) {
  authListeners.add(cb)
  queueMicrotask(() => cb(currentUser))
  return () => authListeners.delete(cb)
}

export async function signInWithPopup() {
  currentUser = MOCK_USER
  authListeners.forEach((cb) => cb(currentUser))
}
export const signInWithRedirect = signInWithPopup

export async function signOut() {
  currentUser = null
  authListeners.forEach((cb) => cb(null))
}

export const getMessaging = () => ({ __mock: true })
export const getToken = async () => null
export const isSupported = async () => false
