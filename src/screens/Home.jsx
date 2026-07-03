import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { formatHeaderDate, greeting, todayStr, tomorrowStr, MEMO_COLORS, isIOS, isStandalone } from '../utils'
import InstallGuide from '../components/InstallGuide'

const LAST_SEEN_KEY = 'fridge:lastSeenAt'

export default function Home({ items, events, memos, onGoTab, onOpenSettings }) {
  const { user, profile, members } = useAuth()
  const [news, setNews] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const newsComputed = useRef(false)

  const today = todayStr()
  const tomorrow = tomorrowStr()

  const todayEvents = useMemo(
    () => (events || []).filter((e) => e.date === today).sort((a, b) => (a.time || '') < (b.time || '') ? -1 : 1),
    [events, today]
  )
  const tomorrowEvents = useMemo(
    () => (events || []).filter((e) => e.date === tomorrow).sort((a, b) => (a.time || '') < (b.time || '') ? -1 : 1),
    [events, tomorrow]
  )
  const outItems = useMemo(
    () => (items || []).filter((i) => i.status === 'out' || i.status === 'low' || i.status === 'buying'),
    [items]
  )
  const pinnedMemos = useMemo(() => (memos || []).filter((m) => m.pinned), [memos])

  // 마지막 접속 이후 새 소식 (다른 가족이 만든 변경)
  useEffect(() => {
    if (newsComputed.current || !items || !events || !memos || !user) return
    newsComputed.current = true
    const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) || 0)
    const isNew = (ts, by) => ts && by !== user.uid && ts.toMillis() > lastSeen
    const result = {
      items: items.filter((i) => isNew(i.updatedAt, i.updatedBy)).length,
      events: events.filter((e) => isNew(e.createdAt, e.owner)).length,
      memos: memos.filter((m) => isNew(m.createdAt, m.author)).length
    }
    if (lastSeen > 0 && (result.items || result.events || result.memos)) setNews(result)
    localStorage.setItem(LAST_SEEN_KEY, String(Date.now()))
  }, [items, events, memos, user])

  const showInstallBanner = isIOS() && !isStandalone()

  function EventCard({ ev, dayLabel }) {
    const owner = members[ev.owner]
    return (
      <div className="flex items-center gap-3 bg-card rounded-card shadow-card px-4 py-3.5">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: owner?.color || '#DDD6F3' }} />
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold truncate">{ev.title}</p>
          <p className="text-[14px] text-ink/50">
            {dayLabel} {ev.time ? `· ${ev.time}` : '· 종일'} · {owner?.name || '가족'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
      <header className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-[24px] font-bold">{formatHeaderDate()}</h1>
          <p className="text-[17px] text-ink/60 mt-0.5">
            {profile?.name ? `${profile.name}님, ` : ''}{greeting()}
          </p>
        </div>
        <button onClick={onOpenSettings} className="text-[24px] p-2 -mr-2 press" aria-label="설정">⚙️</button>
      </header>

      {showInstallBanner && (
        <button
          onClick={() => setShowInstall(true)}
          className="w-full mt-4 bg-lavender/60 rounded-card px-4 py-3.5 text-left text-[15px] font-medium press"
        >
          📲 홈 화면에 추가하면 앱처럼 쓰고 알림도 받을 수 있어요 →
        </button>
      )}

      {news && (
        <div className="mt-4 bg-butter rounded-card shadow-card px-4 py-3.5">
          <p className="text-[16px] font-bold mb-1">🔔 그동안 새 소식</p>
          <p className="text-[15px] text-ink/70">
            {[
              news.items > 0 && `식재료 변경 ${news.items}건`,
              news.events > 0 && `새 일정 ${news.events}개`,
              news.memos > 0 && `새 메모 ${news.memos}개`
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      <section className="mt-6">
        <h2 className="text-[16px] font-bold text-ink/50 mb-2">오늘 · 내일 일정</h2>
        <div className="flex flex-col gap-2">
          {todayEvents.length === 0 && tomorrowEvents.length === 0 && (
            <div className="bg-card rounded-card shadow-card px-4 py-5 text-center text-[16px] text-ink/40">
              일정이 없어요. 느긋한 이틀! 🍵
            </div>
          )}
          {todayEvents.map((ev) => <EventCard key={ev.id} ev={ev} dayLabel="오늘" />)}
          {tomorrowEvents.map((ev) => <EventCard key={ev.id} ev={ev} dayLabel="내일" />)}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-[16px] font-bold text-ink/50 mb-2">장보기</h2>
        {outItems.length > 0 ? (
          <button onClick={() => onGoTab('fridge')} className="w-full bg-peach rounded-card shadow-card px-4 py-4 text-left press">
            <p className="text-[17px] font-bold">🛒 사야 할 것 {outItems.length}개</p>
            <p className="text-[15px] text-ink/70 mt-0.5 truncate">
              {outItems.slice(0, 5).map((i) => i.name).join(', ')}{outItems.length > 5 ? ' 외' : ''}
            </p>
          </button>
        ) : (
          <div className="bg-mint/50 rounded-card px-4 py-4 text-[16px] text-ink/60">
            ✅ 지금은 살 게 없어요
          </div>
        )}
      </section>

      {pinnedMemos.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[16px] font-bold text-ink/50 mb-2">고정 메모</h2>
          <div className="flex flex-col gap-2">
            {pinnedMemos.map((m) => (
              <div
                key={m.id}
                className="rounded-card shadow-card px-4 py-3.5 relative"
                style={{ background: MEMO_COLORS[m.color] || MEMO_COLORS.yellow }}
              >
                <span
                  className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border border-white/70 shadow"
                  style={{ background: members[m.author]?.color || '#F9CFD6' }}
                />
                <p className="text-[16px] whitespace-pre-wrap pt-2">📌 {m.text}</p>
                <p className="text-[13px] text-ink/50 mt-1">{members[m.author]?.name || ''}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <InstallGuide open={showInstall} onClose={() => setShowInstall(false)} />
    </div>
  )
}
