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
      <h1 className="text-[24px] font-bold mb-8">가족과 연결하기</h1>

      {mode === null && (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <button onClick={() => setMode('create')} className="bg-peach rounded-card py-5 text-[18px] font-bold shadow-card press">
            🏡 가족 만들기
          </button>
          <button onClick={() => setMode('join')} className="bg-card border border-ink/15 rounded-card py-5 text-[18px] font-bold shadow-card press">
            🔑 초대코드 입력
          </button>
          <button onClick={logout} className="mt-4 text-[15px] text-ink/50 underline">로그아웃</button>
        </div>
      )}

      {mode === 'create' && (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <label className="text-[16px] font-medium text-ink/70">가족 이름</label>
          <input
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            className="bg-card border border-ink/15 rounded-btn px-4 py-4 text-[18px]"
            placeholder="우리집"
          />
          <button onClick={createFamily} disabled={busy} className="bg-peach rounded-btn py-4 text-[17px] font-bold press disabled:opacity-50">
            {busy ? '만드는 중…' : '만들기'}
          </button>
          <button onClick={() => { setMode(null); setError(null) }} className="text-[15px] text-ink/50 underline">뒤로</button>
        </div>
      )}

      {mode === 'join' && (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <label className="text-[16px] font-medium text-ink/70">초대코드 6자리</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="bg-card border border-ink/15 rounded-btn px-4 py-4 text-[24px] font-bold tracking-[0.3em] text-center uppercase"
            placeholder="ABC123"
            autoCapitalize="characters"
          />
          <button onClick={joinFamily} disabled={busy} className="bg-peach rounded-btn py-4 text-[17px] font-bold press disabled:opacity-50">
            {busy ? '참여하는 중…' : '참여하기'}
          </button>
          <button onClick={() => { setMode(null); setError(null) }} className="text-[15px] text-ink/50 underline">뒤로</button>
        </div>
      )}

      {error && <p className="mt-4 text-[15px] text-red-500 text-center">{error}</p>}
    </div>
  )
}
