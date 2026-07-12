import { useState } from 'react'
import {
  doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp, collection
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { makeInviteCode, MEMBER_COLORS } from '../utils'

export default function FamilySetup() {
  const { user, logout } = useAuth()
  const [mode, setMode] = useState(null) // null | 'create' | 'join'
  const [familyName, setFamilyName] = useState('우리집')
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function createFamily() {
    if (!familyName.trim()) return
    setBusy(true)
    setError(null)
    try {
      const inviteCode = makeInviteCode()
      const familyRef = doc(collection(db, 'families'))
      await setDoc(familyRef, {
        name: familyName.trim(),
        inviteCode,
        members: [user.uid],
        createdAt: serverTimestamp()
      })
      await setDoc(doc(db, 'invites', inviteCode), {
        familyId: familyRef.id,
        familyName: familyName.trim()
      })
      await updateDoc(doc(db, 'users', user.uid), {
        familyId: familyRef.id,
        color: MEMBER_COLORS[0]
      })
    } catch (e) {
      console.error(e)
      setError('가족 만들기에 실패했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  async function joinFamily() {
    const c = code.trim().toUpperCase()
    if (c.length !== 6) { setError('6자리 코드를 입력해 주세요.'); return }
    setBusy(true)
    setError(null)
    try {
      const inviteSnap = await getDoc(doc(db, 'invites', c))
      if (!inviteSnap.exists()) {
        setError('초대코드를 찾을 수 없어요. 다시 확인해 주세요.')
        return
      }
      const { familyId } = inviteSnap.data()
      await updateDoc(doc(db, 'families', familyId), {
        members: arrayUnion(user.uid)
      })
      const famSnap = await getDoc(doc(db, 'families', familyId))
      const idx = Math.max(0, (famSnap.data()?.members?.length || 1) - 1)
      await updateDoc(doc(db, 'users', user.uid), {
        familyId,
        color: MEMBER_COLORS[idx % MEMBER_COLORS.length]
      })
    } catch (e) {
      console.error(e)
      setError('참여에 실패했어요. 코드를 다시 확인해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-bg">
      <div className="text-[56px] mb-3">👨‍👩‍👧</div>
      <h1 className="text-[24px] font-extrabold tracking-tight mb-8">가족과 연결하기</h1>

      {mode === null && (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <button
            onClick={() => setMode('join')}
            className="rounded-tile py-5 text-[16px] font-extrabold text-white shadow-card press"
            style={{ background: 'linear-gradient(140deg, rgb(var(--ff-accent)) 0%, rgb(var(--ff-accent-deep)) 100%)' }}
          >
            🔑 초대코드 입력
            <span className="block text-[12px] font-bold opacity-85 mt-0.5">가족에게 코드를 받았다면 여기!</span>
          </button>
          <button onClick={() => setMode('create')} className="bg-card border-[1.5px] border-line rounded-tile py-5 text-[16px] font-extrabold shadow-card press">
            🏡 새 가족 만들기
            <span className="block text-[12px] font-bold text-muted mt-0.5">우리 가족 중 첫 번째라면</span>
          </button>
          <p className="text-[12.5px] font-semibold text-muted text-center leading-relaxed">
            가족 중 <b>한 명만</b> 만들면 돼요.<br />나머지는 초대코드로 참여!
          </p>
          <button onClick={logout} className="mt-2 text-[13.5px] font-bold text-muted underline">로그아웃</button>
        </div>
      )}

      {mode === 'create' && (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <p className="text-[12.5px] font-bold bg-accent-soft rounded-btn px-3 py-2.5 leading-relaxed">
            ⚠️ 가족이 이미 만들어 뒀다면 여기가 아니라 <button onClick={() => { setMode('join'); setError(null) }} className="underline font-extrabold">초대코드 입력</button>으로 가세요!
          </p>
          <label className="text-[13px] font-bold text-muted">
            가족 이름 <span className="font-semibold">— 앱에 표시될 우리 그룹 이름이에요 (아무거나 OK)</span>
          </label>
          <input
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            className="bg-card border-[1.5px] border-line rounded-btn px-4 py-4 text-[16px] font-semibold outline-none focus:border-accent"
            placeholder="우리집"
          />
          <button
            onClick={createFamily}
            disabled={busy}
            className="rounded-2xl py-4 text-[15.5px] font-extrabold text-white bg-accent press disabled:opacity-50"
            style={{ boxShadow: '0 8px 20px rgb(var(--ff-accent) / .4)' }}
          >
            {busy ? '만드는 중…' : '만들기'}
          </button>
          <button onClick={() => { setMode(null); setError(null) }} className="text-[13.5px] font-bold text-muted underline">뒤로</button>
        </div>
      )}

      {mode === 'join' && (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <label className="text-[13px] font-bold text-muted">초대코드 6자리</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="bg-card border-[1.5px] border-line rounded-btn px-4 py-4 text-[24px] font-extrabold tracking-[0.3em] text-center uppercase outline-none focus:border-accent"
            placeholder="ABC123"
            autoCapitalize="characters"
          />
          <button
            onClick={joinFamily}
            disabled={busy}
            className="rounded-2xl py-4 text-[15.5px] font-extrabold text-white bg-accent press disabled:opacity-50"
            style={{ boxShadow: '0 8px 20px rgb(var(--ff-accent) / .4)' }}
          >
            {busy ? '참여하는 중…' : '참여하기'}
          </button>
          <button onClick={() => { setMode(null); setError(null) }} className="text-[13.5px] font-bold text-muted underline">뒤로</button>
        </div>
      )}

      {error && <p className="mt-4 text-[14px] font-semibold text-danger text-center">{error}</p>}
    </div>
  )
}
