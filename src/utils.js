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
