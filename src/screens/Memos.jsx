import { useEffect, useRef, useState } from 'react'
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import BottomSheet from '../components/BottomSheet'
import SwipeToDelete from '../components/SwipeToDelete'
import { MEMO_COLORS, relativeTime } from '../utils'

export default function Memos({ memos, fabTick }) {
  const { user, profile, familyId, members } = useAuth()
  const [writing, setWriting] = useState(false)
  const [text, setText] = useState('')
  const [color, setColor] = useState('yellow')
  const [actionMemo, setActionMemo] = useState(null) // 길게 누른 메모
  const pressTimer = useRef(null)
  const lastTick = useRef(fabTick)

  // 중앙 FAB → 새 메모
  useEffect(() => {
    if (fabTick !== lastTick.current) {
      lastTick.current = fabTick
      setWriting(true)
    }
  }, [fabTick])

  const memosCol = collection(db, 'families', familyId, 'memos')

  async function addMemo() {
    if (!text.trim()) return
    await addDoc(memosCol, {
      text: text.trim(),
      color,
      author: user.uid,
      authorName: profile?.name || '',
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

  // 길게 누르기 → 시트에서 삭제를 고른 것 자체가 의도적이므로 바로 삭제
  function removeMemo(memo) {
    deleteDoc(doc(memosCol, memo.id))
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
    <div className="px-5 pt-5 pb-4 max-w-lg mx-auto min-h-full">
      <h1 className="text-[25px] font-extrabold tracking-tight mb-1">메모 📝</h1>
      <p className="text-[13.5px] font-semibold text-muted mb-5">공유하고 싶은 것, 같이 기억할 것들</p>

      {(memos || []).length === 0 && (
        <p className="text-center text-[14.5px] font-semibold text-muted py-16">
          아직 메모가 없어요.<br />부탁할 것, 기억할 것을 ＋ 버튼으로 붙여 보세요! 🧲
        </p>
      )}

      <div className="flex gap-3 items-start">
        {cols.map((col, ci) => (
          <div key={ci} className="flex-1 flex flex-col gap-3 min-w-0">
            {col.map((m) => {
              const card = (
                <div
                  className="rounded-card shadow-soft px-4 pt-5 pb-3 relative select-none press text-[#4A4238]"
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
                    style={{ background: members[m.author]?.color || '#E08A5B' }}
                  />
                  {m.pinned && <span className="absolute top-1.5 right-2 text-[14px]">📌</span>}
                  <p className="text-[14.5px] font-semibold whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                  <p className="text-[11.5px] font-semibold opacity-50 mt-2">
                    {members[m.author]?.name || ''} · {relativeTime(m.createdAt)}
                  </p>
                </div>
              )
              // 내가 쓴 메모만 밀어서 삭제 가능
              return m.author === user.uid ? (
                <SwipeToDelete key={m.id} onDelete={() => deleteDoc(doc(memosCol, m.id))}>
                  {card}
                </SwipeToDelete>
              ) : (
                <div key={m.id}>{card}</div>
              )
            })}
          </div>
        ))}
      </div>

      <p className="text-[12px] font-semibold text-muted/70 text-center mt-6">
        길게 누르면 홈에 고정 · 내 메모는 왼쪽으로 밀면 삭제
      </p>

      <BottomSheet open={writing} onClose={() => setWriting(false)} title="새 메모 붙이기 🧲">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="메모를 적어 주세요"
          className="w-full rounded-btn px-4 py-3.5 text-[15px] font-semibold border-[1.5px] border-line resize-none outline-none text-[#4A4238]"
          style={{ background: MEMO_COLORS[color] }}
        />
        <div className="flex gap-3 my-4 justify-center">
          {Object.entries(MEMO_COLORS).map(([key, hex]) => (
            <button
              key={key}
              onClick={() => setColor(key)}
              className={`w-11 h-11 rounded-full press border-2 ${color === key ? 'border-accent scale-110' : 'border-line'}`}
              style={{ background: hex }}
              aria-label={key}
            />
          ))}
        </div>
        <button
          onClick={addMemo}
          disabled={!text.trim()}
          className="w-full py-4 rounded-2xl text-[15.5px] font-extrabold text-white bg-accent press disabled:opacity-40"
          style={{ boxShadow: '0 8px 20px rgb(var(--ff-accent) / .4)' }}
        >
          붙이기
        </button>
      </BottomSheet>

      <BottomSheet open={!!actionMemo} onClose={() => setActionMemo(null)} title="메모 관리">
        {actionMemo && (
          <div className="flex flex-col gap-2">
            <button onClick={() => togglePin(actionMemo)} className="bg-alt rounded-btn py-4 text-[15px] font-extrabold press">
              {actionMemo.pinned ? '📌 고정 해제' : '📌 홈에 고정'}
            </button>
            {actionMemo.author === user.uid && (
              <button onClick={() => removeMemo(actionMemo)} className="rounded-btn py-4 text-[15px] font-extrabold text-white bg-danger press">
                🗑 삭제
              </button>
            )}
            <button onClick={() => setActionMemo(null)} className="text-[13.5px] font-bold text-muted py-2">닫기</button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
