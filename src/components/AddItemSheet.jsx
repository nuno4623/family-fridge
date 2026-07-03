import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import BottomSheet from './BottomSheet'
import { CATEGORIES, CAT_EMOJI } from '../utils'

// 디자인 핸드오프의 "식재료 추가" 시트 — 이름 + 종류 칩
export default function AddItemSheet({ open, onClose, initialStatus = 'stocked' }) {
  const { user, familyId } = useAuth()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('냉장')
  const [memo, setMemo] = useState('')

  async function commit() {
    const n = name.trim()
    if (!n) { onClose(); return }
    await addDoc(collection(db, 'families', familyId, 'items'), {
      name: n,
      category,
      status: initialStatus,
      memo: memo.trim(),
      checkedInCart: false,
      updatedBy: user.uid,
      updatedAt: serverTimestamp()
    })
    setName('')
    setMemo('')
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="식재료 추가 🧺">
      <div className="text-[12.5px] font-bold text-muted mb-2">이름</div>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        placeholder="예: 우유, 계란, 사과"
        className="w-full border-[1.5px] border-line rounded-btn px-4 py-3 text-[15px] font-semibold bg-alt outline-none focus:border-accent"
      />
      <div className="text-[12.5px] font-bold text-muted mb-2 mt-4">종류</div>
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
