export const MEMBER_COLORS = ['#E08A5B', '#2E6BFF', '#16A97A', '#B563D6', '#FF4D8D']

export const CATEGORIES = ['냉장', '냉동', '실온', '기타']

export const CAT_EMOJI = { 냉장: '🥬', 냉동: '🧊', 실온: '🥫', 기타: '🧺' }

// 이름 키워드 → 음식 이모지 자동 매칭 (앞에 있는 항목이 우선)
const FOOD_EMOJI = [
  ['계란', '🥚'], ['달걀', '🥚'], ['우유', '🥛'], ['치즈', '🧀'], ['요거트', '🥣'], ['요구르트', '🥣'],
  ['버터', '🧈'], ['식빵', '🍞'], ['빵', '🍞'], ['쌀', '🍚'], ['밥', '🍚'], ['라면', '🍜'],
  ['국수', '🍜'], ['파스타', '🍜'], ['만두', '🥟'], ['떡', '🍡'],
  ['소고기', '🥩'], ['돼지', '🥩'], ['삼겹', '🥩'], ['고기', '🥩'], ['햄', '🌭'], ['소시지', '🌭'],
  ['닭', '🍗'], ['치킨', '🍗'], ['고등어', '🐟'], ['갈치', '🐟'], ['연어', '🐟'], ['생선', '🐟'],
  ['참치', '🥫'], ['새우', '🦐'], ['오징어', '🦑'],
  ['사과', '🍎'], ['바나나', '🍌'], ['딸기', '🍓'], ['포도', '🍇'], ['수박', '🍉'], ['귤', '🍊'],
  ['오렌지', '🍊'], ['레몬', '🍋'], ['복숭아', '🍑'], ['키위', '🥝'], ['블루베리', '🫐'],
  ['토마토', '🍅'], ['감자', '🥔'], ['고구마', '🍠'], ['당근', '🥕'], ['오이', '🥒'],
  ['양파', '🧅'], ['마늘', '🧄'], ['버섯', '🍄'], ['옥수수', '🌽'], ['브로콜리', '🥦'],
  ['가지', '🍆'], ['아보카도', '🥑'], ['고추', '🌶️'], ['김치', '🌶️'],
  ['상추', '🥬'], ['배추', '🥬'], ['시금치', '🥬'], ['깻잎', '🥬'], ['양배추', '🥬'], ['나물', '🥬'],
  ['두부', '🍲'], ['국', '🍲'], ['김', '🍙'],
  ['생수', '💧'], ['물', '💧'], ['주스', '🧃'], ['음료', '🧃'], ['콜라', '🥤'], ['사이다', '🥤'],
  ['맥주', '🍺'], ['소주', '🍶'], ['와인', '🍷'], ['커피', '☕'],
  ['아이스크림', '🍦'], ['과자', '🍪'], ['초콜릿', '🍫'], ['케이크', '🍰'], ['꿀', '🍯'],
  ['기름', '🧴'], ['참기름', '🧴'], ['소금', '🧂'], ['설탕', '🧂'], ['간장', '🧂'],
  ['된장', '🧂'], ['고추장', '🧂'], ['소스', '🧂'], ['양념', '🧂']
]

export function guessEmoji(name) {
  if (!name) return null
  for (const [keyword, emoji] of FOOD_EMOJI) {
    if (name.includes(keyword)) return emoji
  }
  return null
}

// 표시용: 직접 고른 이모지 > 이름으로 추측 > 카테고리 기본
export function itemEmoji(item) {
  return item.emoji || guessEmoji(item.name) || CAT_EMOJI[item.category] || '🧺'
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
