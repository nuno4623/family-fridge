import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme, THEMES, FONTS, SIZES } from '../theme'
import { useToast } from '../components/Toast'
import { enablePush, disablePush } from '../notifications'
import { MEMBER_COLORS, storage } from '../utils'

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-[52px] h-8 rounded-full transition-colors relative shrink-0 ${on ? 'bg-accent' : 'bg-line'}`}
      role="switch"
      aria-checked={on}
    >
      <span className={`absolute top-1 w-6 h-6 bg-card rounded-full shadow transition-all ${on ? 'left-[24px]' : 'left-1'}`} />
    </button>
  )
}

function Section({ title, children }) {
  return (
    <section className="bg-card rounded-tile border border-line shadow-card p-4 mb-4">
      <h2 className="text-[13px] font-extrabold text-muted mb-3">{title}</h2>
      {children}
    </section>
  )
}

export default function Settings({ onClose }) {
  const { user, profile, family, logout } = useAuth()
  const { prefs, setPrefs } = useTheme()
  const showToast = useToast()
  const [name, setName] = useState(profile?.name || '')
  const [busy, setBusy] = useState(false)

  const userRef = doc(db, 'users', user.uid)
  const notify = profile?.notify || {}
  const pushEnabled = (profile?.fcmTokens || []).includes(storage.get('fridge:fcmToken'))

  async function saveName() {
    const n = name.trim()
    if (!n || n === profile?.name) return
    await updateDoc(userRef, { name: n })
    showToast('이름을 바꿨어요')
  }

  function setColor(c) {
    updateDoc(userRef, { color: c })
  }

  function toggleNotify(key) {
    updateDoc(userRef, { [`notify.${key}`]: !notify[key] })
  }

  async function togglePush() {
    setBusy(true)
    try {
      if (pushEnabled) {
        await disablePush(user.uid)
        showToast('이 기기의 푸시 알림을 껐어요')
      } else {
        const result = await enablePush(user.uid)
        if (result === 'granted') showToast('푸시 알림을 켰어요 🔔')
        else if (result === 'denied') showToast('브라우저 알림 권한이 거부됐어요')
        else if (result === 'unsupported') showToast('이 브라우저는 푸시를 지원하지 않아요. 홈 화면에 추가 후 시도해 보세요.')
        else showToast('알림 설정에 실패했어요')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-bg z-50 overflow-y-auto">
      <div className="max-w-lg mx-auto px-5 pt-5 pb-10">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-[25px] font-extrabold tracking-tight">설정 ⚙️</h1>
          <button onClick={onClose} className="text-[14.5px] font-extrabold text-accent p-2 press">닫기</button>
        </header>

        <Section title="테마">
          <div className="flex gap-2 flex-wrap">
            {Object.entries(THEMES).map(([key, t]) => {
              const on = prefs.theme === key
              return (
                <button
                  key={key}
                  onClick={() => setPrefs({ theme: key })}
                  className={`flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full border-[1.5px] press ${
                    on ? 'border-accent bg-accent-soft' : 'border-line bg-alt'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ background: t.dot, boxShadow: on ? `0 0 0 3px ${t.dot}33` : 'none' }}
                  />
                  <span className={`text-[13px] font-bold ${on ? '' : 'text-muted'}`}>{t.label}</span>
                </button>
              )
            })}
          </div>
        </Section>

        <Section title="가독성">
          <p className="text-[13.5px] font-bold mb-2">글꼴</p>
          <div className="flex gap-2 mb-4">
            {Object.entries(FONTS).map(([key, f]) => {
              const on = prefs.font === key
              return (
                <button
                  key={key}
                  onClick={() => setPrefs({ font: key })}
                  className={`flex-1 py-2.5 rounded-[13px] text-[13.5px] font-bold press border-[1.5px] ${
                    on ? 'bg-accent text-white border-accent' : 'bg-alt text-muted border-line'
                  }`}
                  style={{ fontFamily: f.stack }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
          <p className="text-[13.5px] font-bold mb-2">글씨 크기</p>
          <div className="flex gap-2">
            {Object.entries(SIZES).map(([key, s]) => {
              const on = prefs.size === key
              return (
                <button
                  key={key}
                  onClick={() => setPrefs({ size: key })}
                  className={`flex-1 py-2.5 rounded-[13px] text-[13.5px] font-bold press border-[1.5px] ${
                    on ? 'bg-accent text-white border-accent' : 'bg-alt text-muted border-line'
                  }`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
          <p className="text-[12px] font-semibold text-muted mt-3">테마·글꼴·크기는 이 기기에만 적용돼요</p>
        </Section>

        <Section title="내 정보">
          <div className="flex gap-2 mb-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 min-w-0 bg-alt border-[1.5px] border-line rounded-btn px-4 py-3 text-[15px] font-semibold outline-none focus:border-accent"
              placeholder="앱에서 쓸 이름"
            />
            <button onClick={saveName} className="rounded-btn px-4 text-[14px] font-extrabold text-white bg-accent press shrink-0">저장</button>
          </div>
          <p className="text-[13.5px] font-bold mb-2">내 색상 (캘린더 · 메모에 표시)</p>
          <div className="flex gap-3">
            {MEMBER_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-11 h-11 rounded-full press border-[3px] ${profile?.color === c ? 'border-ink/40 scale-110' : 'border-transparent'}`}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </Section>

        <Section title="알림">
          <div className="flex items-center justify-between py-3 border-b border-line">
            <div>
              <p className="text-[15px] font-bold">이 기기에서 푸시 받기</p>
              <p className="text-[12px] font-semibold text-muted">아이폰은 홈 화면에 추가한 앱에서만 돼요</p>
            </div>
            <Toggle on={pushEnabled} onChange={busy ? () => {} : togglePush} />
          </div>
          {[
            ['shopping', '🛒 장보기 목록 변경'],
            ['event', '📅 새 일정'],
            ['memo', '📝 새 메모']
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-line last:border-0">
              <p className="text-[15px] font-bold">{label}</p>
              <Toggle on={!!notify[key]} onChange={() => toggleNotify(key)} />
            </div>
          ))}
        </Section>

        <Section title="가족 초대">
          <p className="text-[13.5px] font-semibold text-muted mb-3">가족에게 이 코드를 알려 주세요 (탭하면 복사)</p>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(family?.inviteCode || '')
              showToast('초대코드를 복사했어요')
            }}
            className="w-full bg-accent-soft rounded-btn py-4 text-[26px] font-extrabold tracking-[0.3em] press"
          >
            {family?.inviteCode || '------'}
          </button>
          <button
            onClick={async () => {
              const text = [
                `🧊 우리 가족 앱 '식구들'에 초대해요!`,
                '',
                `1. 링크 열기: ${location.origin}`,
                '2. 구글로 로그인',
                `3. '초대코드 입력' 누르고 → ${family?.inviteCode || ''}`,
                '',
                '장보기 · 일정 · 메모를 같이 써요 😊'
              ].join('\n')
              if (navigator.share) {
                try {
                  await navigator.share({ text })
                } catch {
                  // 공유 시트에서 취소한 경우 — 아무것도 안 함
                }
              } else {
                navigator.clipboard?.writeText(text)
                showToast('초대 메시지를 복사했어요. 카톡에 붙여넣으세요!')
              }
            }}
            className="w-full mt-3 py-4 rounded-btn text-[15.5px] font-extrabold text-white bg-accent press"
            style={{ boxShadow: '0 8px 20px rgb(var(--ff-accent) / .4)' }}
          >
            📤 카톡 등으로 초대장 보내기
          </button>
        </Section>

        <button onClick={logout} className="w-full bg-card border-[1.5px] border-line rounded-btn py-4 text-[14.5px] font-extrabold text-muted press">
          로그아웃
        </button>
      </div>
    </div>
  )
}
