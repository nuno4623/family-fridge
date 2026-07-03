import { useRef, useState } from 'react'
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import BottomSheet from '../components/BottomSheet'
import { MEMO_COLORS, relativeTime } from '../utils'

export default function Memos({ memos }) {
  const { user, familyId, members } = useAuth()
  const [writing, setWriting] = useState(false)
  const [text, setText] = useState('')
  const [color, setColor] = useState('yellow')
  const [actionMemo, setActionMemo] = useState(null) // 길게 누른 메모
  const pressTimer = useRef(null)

  const memosCol = collection(db, 'families', familyId, 'memos')

  async function addMemo() {
    if (!text.trim()) return
    await addDoc(memosCol, {
      text: text.trim(),
      color,
      author: user.uid,
      pinned: false,
      createdAt: serverTimestamp()
    })
    setText('')
    setWriting(false)
  }

  function togglePin(memo) {
    updateDoc(doc(memosCol, memo.id), { pinned: !memo.pinned })
    setActionMemo(null)
  }

  function removeMemo(memo) {
    if (confirm('이 메모를 삭제할까요?')) {
      deleteDoc(doc(memosCol, memo.id))
    }
    setActionMemo(null)
  }

  function startPress(memo) {
    pressTimer.current = setTimeout(() => setActionMemo(memo), 500)
  }
  function endPress() {
    clearTimeout(pressTimer.current)
  }

  // 2열 분배 (masonry 느낌)
  const cols = [[], []]
  const sorted = [...(memos || [])].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
  sorted.forEach((m, i) => cols[i % 2].push(m))

  return (
    <div className="px-5 pt-6 pb-4 max-w-lg mx-auto min-h-full">
      <h1 className="text-[24px] font-bold mb-4">📝 메모</h1>

      {(memos || []).length === 0 && (
        <p className="text-center text-[16px] text-ink/40 py-16">
          냉장고 문이 허전해요.<br />첫 메모를 붙여 보세요! 🧲
        </p>
      )}

      <div className="flex gap-3 items-start">
        {cols.map((col, ci) => (
          <div key={ci} className="flex-1 flex flex-col gap-3 min-w-0">
            {col.map((m) => (
              <div
                key={m.id}
                className="rounded-card shadow-card px-4 pt-5 pb-3 relative select-none press"
                style={{ background: MEMO_COLORS[m.color] || MEMO_COLORS.yellow }}
                onTouchStart={() => startPress(m)}
                onTouchEnd={endPress}
                onTouchMove={endPress}
                onMouseDown={() => startPress(m)}
                onMouseUp={endPress}
                onMouseLeave={endPress}
              >
                <span
                  className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white/80 shadow"
                  style={{ background: members[m.author]?.color || '#F9CFD6' }}
                />
                {m.pinned && <span className="absolute top-1.5 right-2 text-[14px]">📌</span>}
                <p className="text-[16px] whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                <p className="text-[12px] text-ink/45 mt-2">
                  {members[m.author]?.name || ''} · {relativeTime(m.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="text-[13px] text-ink/35 text-center mt-6">메모를 길게 누르면 고정 · 삭제할 수 있어요</p>

      <button
        onClick={() => setWriting(true)}
        className="fixed right-5 bottom-[calc(76px+env(safe-area-inset-bottom))] w-14 h-14 bg-peach rounded-full shadow-lg text-[26px] press z-30"
        aria-label="새 메모"
      >
        ＋
      </button>

      <BottomSheet open={writing} onClose={() => setWriting(false)} title="🧲 새 메모 붙이기">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="메모를 적어 주세요"
          className="w-full rounded-btn px-4 py-3.5 text-[17px] border border-ink/15 resize-none"
          style={{ background: MEMO_COLORS[color] }}
        />
        <div className="flex gap-3 my-4 justify-center">
          {Object.entries(MEMO_COLORS).map(([key, hex]) => (
            <button
              key={key}
              onClick={() => setColor(key)}
              className={`w-11 h-11 rounded-full press border-2 ${color === key ? 'border-ink/60 scale-110' : 'border-transparent'}`}
              style={{ background: hex }}
              aria-label={key}
            />
          ))}
        </div>
        <button onClick={addMemo} disabled={!text.trim()} className="w-full bg-peach rounded-btn py-4 text-[17px] font-bold press disabled:opacity-40">
          붙이기
        </button>
      </BottomSheet>

      <BottomSheet open={!!actionMemo} onClose={() => setActionMemo(null)} title="메모 관리">
        {actionMemo && (
          <div className="flex flex-col gap-2">
            <button onClick={() => togglePin(actionMemo)} className="bg-bg rounded-btn py-4 text-[17px] font-bold press">
              {actionMemo.pinned ? '📌 고정 해제' : '📌 홈에 고정'}
            </button>
            {actionMemo.author === user.uid && (
              <button onClick={() => removeMemo(actionMemo)} className="bg-rose/60 rounded-btn py-4 text-[17px] font-bold press">
                🗑 삭제
              </button>
            )}
            <button onClick={() => setActionMemo(null)} className="text-[15px] text-ink/50 py-2">닫기</button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
