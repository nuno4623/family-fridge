import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { enablePush, disablePush } from '../notifications'
import { MEMBER_COLORS, storage } from '../utils'

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-[52px] h-8 rounded-full transition-colors relative shrink-0 ${on ? 'bg-mint' : 'bg-ink/15'}`}
      role="switch"
      aria-checked={on}
    >
      <span className={`absolute top-1 w-6 h-6 bg-card rounded-full shadow transition-all ${on ? 'left-[24px]' : 'left-1'}`} />
    </button>
  )
}

export default function Settings({ onClose }) {
  const { user, profile, family, logout } = useAuth()
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
      <div className="max-w-lg mx-auto px-5 pt-6 pb-10">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-[24px] font-bold">⚙️ 설정</h1>
          <button onClick={onClose} className="text-[17px] font-bold text-ink/60 p-2 press">닫기</button>
        </header>

        <section className="bg-card rounded-card shadow-card p-4 mb-4">
          <h2 className="text-[15px] font-bold text-ink/50 mb-3">내 정보</h2>
          <div className="flex gap-2 mb-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 min-w-0 bg-bg border border-ink/15 rounded-btn px-4 py-3 text-[17px]"
              placeholder="앱에서 쓸 이름"
            />
            <button onClick={saveName} className="bg-peach rounded-btn px-4 text-[15px] font-bold press shrink-0">저장</button>
          </div>
          <p className="text-[15px] text-ink/60 mb-2">내 색상 (캘린더 · 메모에 표시)</p>
          <div className="flex gap-3">
            {MEMBER_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-11 h-11 rounded-full press border-2 ${profile?.color === c ? 'border-ink/60 scale-110' : 'border-transparent'}`}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </section>

        <section className="bg-card rounded-card shadow-card p-4 mb-4">
          <h2 className="text-[15px] font-bold text-ink/50 mb-1">알림</h2>
          <div className="flex items-center justify-between py-3 border-b border-ink/5">
            <div>
              <p className="text-[17px] font-medium">이 기기에서 푸시 받기</p>
              <p className="text-[13px] text-ink/45">아이폰은 홈 화면에 추가한 앱에서만 돼요</p>
            </div>
            <Toggle on={pushEnabled} onChange={busy ? () => {} : togglePush} />
          </div>
          {[
            ['shopping', '🛒 장보기 목록 변경'],
            ['event', '📅 새 일정'],
            ['memo', '📝 새 메모']
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-ink/5 last:border-0">
              <p className="text-[17px] font-medium">{label}</p>
              <Toggle on={!!notify[key]} onChange={() => toggleNotify(key)} />
            </div>
          ))}
        </section>

        <section className="bg-card rounded-card shadow-card p-4 mb-4">
          <h2 className="text-[15px] font-bold text-ink/50 mb-2">가족 초대</h2>
          <p className="text-[15px] text-ink/60 mb-3">가족에게 이 코드를 알려 주세요</p>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(family?.inviteCode || '')
              showToast('초대코드를 복사했어요')
            }}
            className="w-full bg-butter rounded-btn py-4 text-[26px] font-bold tracking-[0.3em] press"
          >
            {family?.inviteCode || '------'}
          </button>
        </section>

        <button onClick={logout} className="w-full bg-card border border-ink/15 rounded-btn py-4 text-[16px] font-bold text-ink/60 shadow-card press">
          로그아웃
        </button>
      </div>
    </div>
  )
}
