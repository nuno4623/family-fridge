import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import BottomSheet from './BottomSheet'
import { CATEGORIES, CAT_EMOJI, KINDS, KIND_EMOJI, guessEmoji, guessKind } from '../utils'

const EMOJI_OPTIONS = ['🥚', '🥛', '🥬', '🍎', '🥩', '🍗', '🐟', '🍜', '🥫', '🧂']

// 디자인 핸드오프의 "식재료 추가" 시트 — 이름 + 종류 칩 + 이모지
export default function AddItemSheet({ open, onClose, initialStatus = 'stocked' }) {
  const { user, familyId } = useAuth()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('냉장')
  const [memo, setMemo] = useState('')
  const [pickedEmoji, setPickedEmoji] = useState(null) // null = 이름 보고 자동
  const [pickedKind, setPickedKind] = useState(null) // null = 이름 보고 자동

  const autoEmoji = guessEmoji(name) || CAT_EMOJI[category]
  const currentEmoji = pickedEmoji || autoEmoji
  const currentKind = pickedKind || guessKind(name) || '기타'

  async function commit() {
    const n = name.trim()
    if (!n) { onClose(); return }
    await addDoc(collection(db, 'families', familyId, 'items'), {
      name: n,
      category,
      kind: currentKind,
      status: initialStatus,
      memo: memo.trim(),
      emoji: pickedEmoji, // null이면 표시할 때 이름으로 자동 매칭
      checkedInCart: false,
      updatedBy: user.uid,
      updatedAt: serverTimestamp()
    })
    setName('')
    setMemo('')
    setPickedEmoji(null)
    setPickedKind(null)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="식재료 추가 🧺">
      <div className="text-[12.5px] font-bold text-muted mb-2">이름</div>
      <div className="flex items-center gap-2">
        <span className="w-12 h-12 rounded-[13px] bg-alt grid place-items-center text-[26px] shrink-0" aria-hidden>
          {currentEmoji}
        </span>
        <input
          autoFocus
          value={name}
          onChange={(e) => { setName(e.target.value); setPickedEmoji(null); setPickedKind(null) }}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          placeholder="예: 우유, 계란, 사과"
          className="flex-1 min-w-0 border-[1.5px] border-line rounded-btn px-4 py-3 text-[15px] font-semibold bg-alt outline-none focus:border-accent"
        />
      </div>
      <div className="text-[12.5px] font-bold text-muted mb-2 mt-4">
        아이콘 <span className="font-semibold">— 이름 쓰면 자동으로 맞춰져요. 직접 골라도 OK</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {EMOJI_OPTIONS.map((e) => (
          <button
            key={e}
            onClick={() => setPickedEmoji(pickedEmoji === e ? null : e)}
            className={`w-[46px] h-[46px] rounded-[13px] text-[22px] press border-[1.5px] ${
              pickedEmoji === e ? 'border-accent bg-accent-soft' : 'border-line bg-alt'
            }`}
            aria-label={e}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="text-[12.5px] font-bold text-muted mb-2 mt-4">보관 위치</div>
      <div className="flex gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`flex-1 py-2.5 rounded-[13px] text-[13.5px] font-bold press border-[1.5px] ${
              category === c ? 'bg-accent text-white border-accent' : 'bg-alt text-ink border-line'
            }`}
          >
            {CAT_EMOJI[c]} {c}
          </button>
        ))}
      </div>
      <div className="text-[12.5px] font-bold text-muted mb-2 mt-4">
        종류 <span className="font-semibold">— 이름 쓰면 자동으로 맞춰져요</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={() => setPickedKind(k)}
            className={`px-3 py-2 rounded-full text-[12.5px] font-bold press border-[1.5px] ${
              currentKind === k ? 'bg-accent text-white border-accent' : 'bg-alt text-muted border-line'
            }`}
          >
            {KIND_EMOJI[k]} {k}
          </button>
        ))}
      </div>
      <div className="text-[12.5px] font-bold text-muted mb-2 mt-4">메모 (선택)</div>
      <input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="예: 30구짜리로"
        className="w-full border-[1.5px] border-line rounded-btn px-4 py-3 text-[15px] font-semibold bg-alt outline-none focus:border-accent"
      />
      <button
        onClick={commit}
        disabled={!name.trim()}
        className="w-full mt-6 py-4 rounded-2xl text-[15.5px] font-extrabold text-white bg-accent press disabled:opacity-40"
        style={{ boxShadow: '0 8px 20px rgb(var(--ff-accent) / .4)' }}
      >
        냉장고에 넣기
      </button>
    </BottomSheet>
  )
}
