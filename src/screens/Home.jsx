import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { greeting, toDateStr, MEMO_COLORS, occursOn, eventExtraLabel, isIOS, isStandalone, storage } from '../utils'
import InstallGuide from '../components/InstallGuide'

const LAST_SEEN_KEY = 'fridge:lastSeenAt'
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export default function Home({ items, events, memos, onGoTab, onOpenSettings }) {
  const { user, profile, members } = useAuth()
  const [news, setNews] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const newsComputed = useRef(false)

  // 가장 가까운 일정 5개 (오늘부터 30일 안에서, 일정당 첫 등장일 기준)
  const upcoming = useMemo(() => {
    const list = []
    const seen = new Set()
    const base = new Date()
    for (let d = 0; d <= 30 && list.length < 5; d++) {
      const dt = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d)
      const ds = toDateStr(dt)
      const dayLabel = d === 0 ? '오늘' : d === 1 ? '내일' : `${dt.getMonth() + 1}/${dt.getDate()} ${DAY_NAMES[dt.getDay()]}`
      const dayEvents = (events || [])
        .filter((e) => !seen.has(e.id) && occursOn(e, ds))
        .sort((a, b) => ((a.time || '') < (b.time || '') ? -1 : 1))
      for (const ev of dayEvents) {
        if (list.length >= 5) break
        seen.add(ev.id)
        list.push({ ev, dayLabel })
      }
    }
    return list
  }, [events])

  const stat = useMemo(() => ({
    total: (items || []).length,
    low: (items || []).filter((i) => i.status === 'low').length,
    out: (items || []).filter((i) => i.status === 'out').length,
    shop: (items || []).filter((i) => i.status !== 'stocked').length
  }), [items])
  const pinnedMemos = useMemo(() => (memos || []).filter((m) => m.pinned), [memos])

  // 마지막 접속 이후 새 소식 (다른 가족이 만든 변경)
  useEffect(() => {
    if (newsComputed.current || !items || !events || !memos || !user) return
    newsComputed.current = true
    const lastSeen = Number(storage.get(LAST_SEEN_KEY) || 0)
    const isNew = (ts, by) => ts && by !== user.uid && ts.toMillis() > lastSeen
    const result = {
      items: items.filter((i) => isNew(i.updatedAt, i.updatedBy)).length,
      events: events.filter((e) => isNew(e.createdAt, e.owner)).length,
      memos: memos.filter((m) => isNew(m.createdAt, m.author)).length
    }
    if (lastSeen > 0 && (result.items || result.events || result.memos)) setNews(result)
    storage.set(LAST_SEEN_KEY, String(Date.now()))
  }, [items, events, memos, user])

  const showInstallBanner = isIOS() && !isStandalone()

  return (
    <div className="px-5 pt-5 pb-4 max-w-lg mx-auto">
      <header className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[13.5px] font-semibold text-muted">
            안녕하세요, {profile?.name || ''}님 👋 {greeting()}
          </p>
          <h1 className="text-[25px] font-extrabold tracking-tight">식구들 🧊</h1>
        </div>
        <button
          onClick={onOpenSettings}
          aria-label="설정"
          className="w-11 h-11 rounded-full bg-accent-soft border border-line grid place-items-center text-[22px] press shrink-0"
        >
          🧑
        </button>
      </header>

      <button
        onClick={() => onGoTab('fridge')}
        className="w-full text-left rounded-hero p-[22px] text-white shadow-card press"
        style={{ background: 'linear-gradient(140deg, rgb(var(--ff-accent)) 0%, rgb(var(--ff-accent-deep)) 100%)' }}
      >
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[12.5px] font-bold opacity-85 tracking-wide">우리 집 냉장고 현황</p>
            <p className="text-[35px] font-extrabold tracking-tight mt-1">
              {stat.total}<span className="text-[17px] font-semibold opacity-70"> 개 재고</span>
            </p>
          </div>
          <div className="w-[62px] h-[62px] rounded-full bg-white/20 grid place-items-center text-[26px]">🧊</div>
        </div>
        <div className="flex gap-2.5 mt-4">
          {[
            [stat.low, '곧 떨어짐'],
            [stat.out, '떨어짐'],
            [stat.shop, '살 것']
          ].map(([n, label]) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-[14px] bg-white/[.18] text-[11.5px] font-semibold">
              <b className="text-[16px]">{n}</b>
              <span className="opacity-80">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-[11.5px] font-semibold opacity-75 text-center mt-3">누르면 냉장고로 이동 →</p>
      </button>

      {showInstallBanner && (
        <button
          onClick={() => setShowInstall(true)}
          className="w-full mt-4 bg-accent-soft rounded-card px-4 py-3 text-left text-[13.5px] font-bold press"
        >
          📲 홈 화면에 추가하면 앱처럼 쓰고 알림도 받을 수 있어요 →
        </button>
      )}

      {news && (
        <div className="mt-4 bg-card border border-line rounded-card shadow-card px-4 py-3">
          <p className="text-[14.5px] font-extrabold">🔔 그동안 새 소식</p>
          <p className="text-[13px] font-semibold text-muted mt-0.5">
            {[
              news.items > 0 && `식재료 변경 ${news.items}건`,
              news.events > 0 && `새 일정 ${news.events}개`,
              news.memos > 0 && `새 메모 ${news.memos}개`
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      <section className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[16px] font-extrabold">다가오는 일정</h2>
          <button onClick={() => onGoTab('calendar')} className="text-[13px] font-bold text-accent press">전체보기</button>
        </div>
        <div className="flex flex-col gap-2.5">
          {upcoming.length === 0 && (
            <div className="bg-card rounded-card border border-line shadow-card px-4 py-4 text-center text-[14px] font-semibold text-muted">
              한 달 안에 잡힌 일정이 없어요 🍵
            </div>
          )}
          {upcoming.map(({ ev, dayLabel }) => {
            const owner = members[ev.owner]
            return (
              <button
                key={ev.id}
                onClick={() => onGoTab('calendar')}
                className="flex items-center gap-3 bg-card rounded-card border border-line shadow-card px-3.5 py-3 press text-left w-full"
              >
                <span
                  className="text-[11.5px] font-extrabold text-white px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0"
                  style={{ background: owner?.color || 'rgb(var(--ff-accent))' }}
                >
                  {dayLabel}{ev.time ? ` ${ev.time}` : ''}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] font-bold truncate">{ev.title}</p>
                  <p className="text-[12px] font-semibold text-muted">
                    {owner?.name || '가족'}
                    {eventExtraLabel(ev) ? ` · ${eventExtraLabel(ev)}` : ''}
                    {ev.memo ? ` · ${ev.memo}` : ''}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {pinnedMemos.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[16px] font-extrabold mb-3">고정 메모 📌</h2>
          <div className="flex flex-col gap-2.5">
            {pinnedMemos.map((m) => (
              <div
                key={m.id}
                className="rounded-card shadow-soft px-4 py-3.5 relative"
                style={{ background: MEMO_COLORS[m.color] || MEMO_COLORS.yellow }}
              >
                <span
                  className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border border-white/70 shadow"
                  style={{ background: members[m.author]?.color || '#E08A5B' }}
                />
                <p className="text-[14.5px] font-semibold text-[#4A4238] whitespace-pre-wrap pt-2">{m.text}</p>
                <p className="text-[12px] font-semibold text-[#4A4238]/50 mt-1">{members[m.author]?.name || ''}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <InstallGuide open={showInstall} onClose={() => setShowInstall(false)} />
    </div>
  )
}
