import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

// 카카오톡·인스타그램 등 인앱 브라우저에서는 구글 로그인이 차단됨
function inAppBrowser() {
  return /KAKAOTALK|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent)
}

function isKakao() {
  return /KAKAOTALK/i.test(navigator.userAgent)
}

export default function Login() {
  const { login } = useAuth()
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  function openExternal() {
    // 카카오톡 인앱 브라우저 → 기본 브라우저로 탈출
    location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href)
  }

  async function handleLogin() {
    setBusy(true)
    setError(null)
    try {
      await login()
    } catch (e) {
      setError('로그인에 실패했어요. 다시 시도해 주세요.')
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 bg-bg">
      <div
        className="w-[92px] h-[92px] rounded-[28px] grid place-items-center text-[44px] mb-5 shadow-card"
        style={{ background: 'linear-gradient(140deg, rgb(var(--ff-accent)) 0%, rgb(var(--ff-accent-deep)) 100%)' }}
      >
        🧊
      </div>
      <h1 className="text-[28px] font-extrabold tracking-tight mb-2">식구들</h1>
      <p className="text-[15px] font-semibold text-muted mb-10 text-center">
        한솥밥 먹는 우리 가족의<br />일정 · 냉장고 · 메모
      </p>

      {inAppBrowser() && (
        <div className="w-full max-w-xs mb-6 bg-warn/15 border border-warn/40 rounded-card p-4">
          <p className="text-[14px] font-bold leading-relaxed mb-3">
            ⚠️ 카카오톡 안에서 열면 <b>구글 로그인이 안 돼요.</b><br />
            브라우저로 열어 주세요!
          </p>
          {isKakao() ? (
            <button
              onClick={openExternal}
              className="w-full py-3.5 rounded-btn text-[15px] font-extrabold text-white bg-accent press"
            >
              기본 브라우저로 열기
            </button>
          ) : (
            <p className="text-[13px] font-semibold text-muted">
              오른쪽 위 ⋮ 메뉴 → <b>"다른 브라우저로 열기"</b>를 눌러 주세요
            </p>
          )}
        </div>
      )}
      <button
        onClick={handleLogin}
        disabled={busy}
        className="w-full max-w-xs bg-card border-[1.5px] border-line rounded-2xl py-4 text-[15.5px] font-extrabold shadow-card press flex items-center justify-center gap-3"
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.2-2.7-.4-4z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C40.9 35.6 44 30.3 44 24c0-1.3-.2-2.7-.4-4z"/>
        </svg>
        구글로 시작하기
      </button>
      {error && <p className="mt-4 text-[14px] font-semibold text-danger">{error}</p>}
    </div>
  )
}
