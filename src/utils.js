export const MEMBER_COLORS = ['#E08A5B', '#2E6BFF', '#16A97A', '#B563D6', '#FF4D8D']

export const CATEGORIES = ['냉장', '냉동', '실온', '기타']

export const CAT_EMOJI = { 냉장: '🥬', 냉동: '🧊', 실온: '🥫', 기타: '🧺' }

// 음식 종류 (보관 위치와 별개의 분류)
export const KINDS = ['채소', '과일', '고기·생선', '유제품·계란', '밥·면·빵', '음료', '양념·소스', '간식', '기타']

export const KIND_EMOJI = {
  '채소': '🥬', '과일': '🍎', '고기·생선': '🥩', '유제품·계란': '🥚', '밥·면·빵': '🍚',
  '음료': '🧃', '양념·소스': '🧂', '간식': '🍪', '기타': '🧺'
}

// 이름 키워드 → [이모지, 종류] 자동 매칭 (앞에 있는 항목이 우선)
const FOOD_TABLE = [
  ['계란', '🥚', '유제품·계란'], ['달걀', '🥚', '유제품·계란'], ['우유', '🥛', '유제품·계란'],
  ['치즈', '🧀', '유제품·계란'], ['요거트', '🥣', '유제품·계란'], ['요구르트', '🥣', '유제품·계란'],
  ['버터', '🧈', '유제품·계란'],
  ['식빵', '🍞', '밥·면·빵'], ['빵', '🍞', '밥·면·빵'], ['쌀', '🍚', '밥·면·빵'], ['밥', '🍚', '밥·면·빵'],
  ['라면', '🍜', '밥·면·빵'], ['국수', '🍜', '밥·면·빵'], ['파스타', '🍜', '밥·면·빵'],
  ['만두', '🥟', '밥·면·빵'], ['떡', '🍡', '밥·면·빵'],
  ['소고기', '🥩', '고기·생선'], ['돼지', '🥩', '고기·생선'], ['삼겹', '🥩', '고기·생선'],
  ['고기', '🥩', '고기·생선'], ['햄', '🌭', '고기·생선'], ['소시지', '🌭', '고기·생선'],
  ['닭', '🍗', '고기·생선'], ['치킨', '🍗', '고기·생선'], ['고등어', '🐟', '고기·생선'],
  ['갈치', '🐟', '고기·생선'], ['연어', '🐟', '고기·생선'], ['생선', '🐟', '고기·생선'],
  ['참치', '🥫', '고기·생선'], ['새우', '🦐', '고기·생선'], ['오징어', '🦑', '고기·생선'],
  ['사과', '🍎', '과일'], ['바나나', '🍌', '과일'], ['딸기', '🍓', '과일'], ['포도', '🍇', '과일'],
  ['수박', '🍉', '과일'], ['귤', '🍊', '과일'], ['오렌지', '🍊', '과일'], ['레몬', '🍋', '과일'],
  ['복숭아', '🍑', '과일'], ['키위', '🥝', '과일'], ['블루베리', '🫐', '과일'], ['아보카도', '🥑', '과일'],
  ['토마토', '🍅', '채소'], ['감자', '🥔', '채소'], ['고구마', '🍠', '채소'], ['당근', '🥕', '채소'],
  ['오이', '🥒', '채소'], ['양파', '🧅', '채소'], ['마늘', '🧄', '채소'], ['버섯', '🍄', '채소'],
  ['옥수수', '🌽', '채소'], ['브로콜리', '🥦', '채소'], ['가지', '🍆', '채소'],
  ['고추장', '🧂', '양념·소스'], ['고추', '🌶️', '채소'], ['김치', '🌶️', '채소'],
  ['상추', '🥬', '채소'], ['배추', '🥬', '채소'], ['시금치', '🥬', '채소'], ['깻잎', '🥬', '채소'],
  ['양배추', '🥬', '채소'], ['나물', '🥬', '채소'], ['파', '🥬', '채소'], ['두부', '🍲', '채소'],
  ['김', '🍙', '기타'],
  ['생수', '💧', '음료'], ['물', '💧', '음료'], ['주스', '🧃', '음료'], ['음료', '🧃', '음료'],
  ['콜라', '🥤', '음료'], ['사이다', '🥤', '음료'], ['맥주', '🍺', '음료'], ['소주', '🍶', '음료'],
  ['와인', '🍷', '음료'], ['커피', '☕', '음료'],
  ['아이스크림', '🍦', '간식'], ['과자', '🍪', '간식'], ['초콜릿', '🍫', '간식'], ['케이크', '🍰', '간식'],
  ['꿀', '🍯', '양념·소스'], ['기름', '🧴', '양념·소스'], ['참기름', '🧴', '양념·소스'],
  ['소금', '🧂', '양념·소스'], ['설탕', '🧂', '양념·소스'], ['간장', '🧂', '양념·소스'],
  ['된장', '🧂', '양념·소스'], ['소스', '🧂', '양념·소스'], ['양념', '🧂', '양념·소스']
]

export function guessEmoji(name) {
  if (!name) return null
  for (const [keyword, emoji] of FOOD_TABLE) {
    if (name.includes(keyword)) return emoji
  }
  return null
}

export function guessKind(name) {
  if (!name) return null
  for (const [keyword, , kind] of FOOD_TABLE) {
    if (name.includes(keyword)) return kind
  }
  return null
}

// 표시용: 직접 고른 값 > 이름으로 추측 > 기본값
export function itemEmoji(item) {
  return item.emoji || guessEmoji(item.name) || CAT_EMOJI[item.category] || '🧺'
}

export function itemKind(item) {
  return item.kind || guessKind(item.name) || '기타'
}

// ---------- 유통기한 자동 계산 ----------
// 품목별 기본 소비기한(일). 보관 위치에 따라 다르면 {냉장,냉동,실온,기타} 객체, 아니면 숫자 하나.
const SHELF_LIFE_BY_NAME = [
  ['두부', 5], ['우유', 9], ['계란', 30], ['달걀', 30], ['요거트', 14], ['요구르트', 14],
  ['치즈', 21], ['버터', 60],
  ['대파', 14], ['파', 14], ['양파', 30], ['마늘', 30], ['감자', 30], ['고구마', 21],
  ['당근', 21], ['오이', 7], ['상추', 7], ['시금치', 5], ['깻잎', 10], ['배추', 14],
  ['양배추', 21], ['토마토', 7], ['브로콜리', 7], ['버섯', 7], ['가지', 7], ['옥수수', 5],
  ['사과', 21], ['바나나', 5], ['딸기', 3], ['포도', 7], ['수박', 7], ['귤', 14],
  ['오렌지', 14], ['레몬', 21], ['복숭아', 5], ['키위', 14], ['블루베리', 7], ['아보카도', 5],
  ['소고기', { 냉장: 3, 냉동: 90, 실온: 1, 기타: 3 }],
  ['돼지', { 냉장: 3, 냉동: 90, 실온: 1, 기타: 3 }],
  ['삼겹', { 냉장: 3, 냉동: 90, 실온: 1, 기타: 3 }],
  ['고기', { 냉장: 3, 냉동: 90, 실온: 1, 기타: 3 }],
  ['닭', { 냉장: 2, 냉동: 180, 실온: 1, 기타: 2 }],
  ['치킨', { 냉장: 2, 냉동: 180, 실온: 1, 기타: 2 }],
  ['햄', 14], ['소시지', 14],
  ['고등어', { 냉장: 2, 냉동: 90, 실온: 1, 기타: 2 }],
  ['갈치', { 냉장: 2, 냉동: 90, 실온: 1, 기타: 2 }],
  ['연어', { 냉장: 2, 냉동: 90, 실온: 1, 기타: 2 }],
  ['생선', { 냉장: 2, 냉동: 90, 실온: 1, 기타: 2 }],
  ['새우', { 냉장: 2, 냉동: 90, 실온: 1, 기타: 2 }],
  ['오징어', { 냉장: 2, 냉동: 90, 실온: 1, 기타: 2 }],
  ['참치', 730], // 통조림
  ['김치', 60],
  ['만두', { 냉장: 3, 냉동: 60, 실온: 1, 기타: 3 }],
  ['라면', 180], ['국수', 180], ['파스타', 365],
  ['식빵', 5], ['빵', 4], ['떡', 5],
  ['쌀', 180],
  ['생수', 365], ['물', 365],
  ['된장', 365], ['고추장', 365], ['간장', 730], ['소금', 1095], ['설탕', 1095],
  ['참기름', 180], ['기름', 365], ['꿀', 730]
]

// 이름으로 못 찾을 때 종류별 기본값 (보관 위치별)
const KIND_SHELF_LIFE_DEFAULT = {
  '채소': { 냉장: 7, 냉동: 90, 실온: 5, 기타: 7 },
  '과일': { 냉장: 7, 냉동: 90, 실온: 4, 기타: 5 },
  '고기·생선': { 냉장: 3, 냉동: 90, 실온: 1, 기타: 3 },
  '유제품·계란': { 냉장: 10, 냉동: 60, 실온: 3, 기타: 7 },
  '밥·면·빵': { 냉장: 5, 냉동: 30, 실온: 3, 기타: 5 },
  '음료': { 냉장: 14, 냉동: 90, 실온: 180, 기타: 60 },
  '양념·소스': { 냉장: 180, 냉동: 365, 실온: 365, 기타: 180 },
  '간식': { 냉장: 30, 냉동: 90, 실온: 60, 기타: 30 },
  '기타': null
}

// 이름·보관위치로 기본 소비기한(일) 추정. 못 찾으면 null(기한 없음 취급)
export function guessShelfLifeDays(name, category) {
  const cat = category || '기타'
  for (const [keyword, val] of SHELF_LIFE_BY_NAME) {
    if (name && name.includes(keyword)) {
      return typeof val === 'object' ? (val[cat] ?? val['냉장'] ?? null) : val
    }
  }
  const kind = guessKind(name) || '기타'
  const fallback = KIND_SHELF_LIFE_DEFAULT[kind]
  if (!fallback) return null
  return fallback[cat] ?? null
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// 오늘(자정 기준)로부터 남은 일수. 음수면 지남.
export function daysUntil(date) {
  if (!date) return null
  const now = new Date()
  const target = date instanceof Date ? date : new Date(date)
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((b - a) / 86400000)
}

export function expiryLabel(daysLeft) {
  if (daysLeft === null || daysLeft === undefined) return null
  if (daysLeft < 0) return `${Math.abs(daysLeft)}일 지남`
  if (daysLeft === 0) return '오늘까지'
  return `D-${daysLeft}`
}

// 'over' | 'soon' | 'ok'
export function expiryTone(daysLeft) {
  if (daysLeft === null || daysLeft === undefined) return null
  if (daysLeft < 0) return 'over'
  if (daysLeft <= 3) return 'soon'
  return 'ok'
}

// item.expiresAt(Firestore Timestamp) → 남은 일수
export function itemDaysLeft(item) {
  if (!item?.expiresAt) return null
  const d = item.expiresAt.toDate ? item.expiresAt.toDate() : new Date(item.expiresAt)
  return daysUntil(d)
}

export const MEMO_COLORS = {
  pink: '#F9CFD6',
  yellow: '#FFF3C4',
  mint: '#CDEBDD',
  lavender: '#DDD6F3'
}

// color는 테마 CSS 변수를 참조 → 인라인 style background에 그대로 사용 (글자는 흰색)
export const STATUS = {
  stocked: { label: '충분', color: 'rgb(var(--ff-good))', next: 'low' },
  low: { label: '곧 떨어짐', color: 'rgb(var(--ff-warn))', next: 'out' },
  out: { label: '떨어짐', color: 'rgb(var(--ff-danger))', next: 'stocked' },
  buying: { label: '장바구니', color: 'rgb(var(--ff-accent))', next: 'stocked' }
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

// ---------- 일정 반복/기간 ----------
export const REPEATS = [
  ['none', '안 함'], ['daily', '매일'], ['weekly', '매주'], ['monthly', '매달'], ['yearly', '매년']
]

const DAY_NAMES_KO = ['일', '월', '화', '수', '목', '금', '토']

// 이 일정이 해당 날짜(YYYY-MM-DD)에 표시되어야 하는가
export function occursOn(ev, ds) {
  if (!ev?.date || !ds || ds < ev.date) return false
  const repeat = ev.repeat || 'none'
  if (repeat === 'none') {
    return ds <= (ev.endDate || ev.date)
  }
  const [sy, sm, sd] = ev.date.split('-').map(Number)
  const [, m, d] = ds.split('-').map(Number)
  if (repeat === 'daily') return true
  if (repeat === 'weekly') {
    const [y] = ds.split('-').map(Number)
    return new Date(y, m - 1, d).getDay() === new Date(sy, sm - 1, sd).getDay()
  }
  if (repeat === 'monthly') return d === sd
  if (repeat === 'yearly') return d === sd && m === sm
  return false
}

// 일정 카드에 붙일 반복/기간 설명 (없으면 null)
export function eventExtraLabel(ev) {
  const repeat = ev.repeat || 'none'
  if (repeat !== 'none') {
    const [sy, sm, sd] = ev.date.split('-').map(Number)
    if (repeat === 'daily') return '🔁 매일'
    if (repeat === 'weekly') return `🔁 매주 ${DAY_NAMES_KO[new Date(sy, sm - 1, sd).getDay()]}요일`
    if (repeat === 'monthly') return `🔁 매달 ${sd}일`
    if (repeat === 'yearly') return `🔁 매년 ${sm}/${sd}`
  }
  if (ev.endDate && ev.endDate !== ev.date) {
    const [, m, d] = ev.date.split('-').map(Number)
    const [, em, ed] = ev.endDate.split('-').map(Number)
    return `${m}/${d}~${em}/${ed}`
  }
  return null
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
