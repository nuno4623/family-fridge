export const MEMBER_COLORS = ['#F9CFD6', '#CFE5F4', '#CDEBDD', '#DDD6F3', '#FFF3C4']

export const CATEGORIES = ['냉장', '냉동', '실온', '기타']

export const MEMO_COLORS = {
  pink: '#F9CFD6',
  yellow: '#FFF3C4',
  mint: '#CDEBDD',
  lavender: '#DDD6F3'
}

export const STATUS = {
  stocked: { label: '충분', color: '#CDEBDD', next: 'low' },
  low: { label: '곧 떨어짐', color: '#FFF3C4', next: 'out' },
  out: { label: '떨어짐', color: '#F9CFD6', next: 'stocked' },
  buying: { label: '장바구니', color: '#FFD9C8', next: 'stocked' }
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr() {
  return toDateStr(new Date())
}

export function tomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toDateStr(d)
}

export function formatHeaderDate(d = new Date()) {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAY_NAMES[d.getDay()]}요일`
}

export function formatShortDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${m}월 ${d}일 (${DAY_NAMES[date.getDay()]})`
}

export function relativeTime(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Date.now() - date.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}일 전`
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

export function makeInviteCode() {
  // 헷갈리는 문자(0/O, 1/I) 제외
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  const arr = new Uint32Array(6)
  crypto.getRandomValues(arr)
  for (let i = 0; i < 6; i++) code += chars[arr[i] % chars.length]
  return code
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 5) return '늦은 밤이에요 🌙'
  if (h < 11) return '좋은 아침이에요 ☀️'
  if (h < 14) return '점심은 드셨어요? 🍚'
  if (h < 18) return '좋은 오후예요 🌤'
  return '오늘 하루도 수고했어요 🌆'
}

// 사생활 보호 모드 등 localStorage가 막힌 환경에서도 죽지 않게
export const storage = {
  get(key) { try { return localStorage.getItem(key) } catch { return null } },
  set(key, value) { try { localStorage.setItem(key, value) } catch { /* ignore */ } },
  remove(key) { try { localStorage.removeItem(key) } catch { /* ignore */ } }
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}
