import { useMemo, useState } from 'react'
import { collection, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import BottomSheet from '../components/BottomSheet'
import { toDateStr, todayStr, formatShortDate } from '../utils'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export default function Calendar({ events }) {
  const { user, members } = useAuth()
  const { familyId } = useAuth()
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selected, setSelected] = useState(null) // 'YYYY-MM-DD'
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', time: '', memo: '' })
  const today = todayStr()

  const eventsByDate = useMemo(() => {
    const map = {}
    for (const e of events || []) {
      (map[e.date] = map[e.date] || []).push(e)
    }
    for (const k in map) map[k].sort((a, b) => ((a.time || '') < (b.time || '') ? -1 : 1))
    return map
  }, [events])

  const grid = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const cells = []
    for (let i = 0; i < first.getDay(); i++) cells.push(null)
    const days = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d))
    return cells
  }, [cursor])

  function moveMonth(delta) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  async function addEvent() {
    if (!form.title.trim() || !selected) return
    await addDoc(collection(db, 'families', familyId, 'events'), {
      title: form.title.trim(),
      date: selected,
      time: form.time || null,
      owner: user.uid,
      memo: form.memo.trim(),
      createdAt: serverTimestamp()
    })
    setForm({ title: '', time: '', memo: '' })
    setAdding(false)
  }

  function removeEvent(ev) {
    if (confirm(`'${ev.title}' 일정을 삭제할까요?`)) {
      deleteDoc(doc(db, 'families', familyId, 'events', ev.id))
    }
  }

  const selectedEvents = selected ? (eventsByDate[selected] || []) : []

  return (
    <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="text-[24px] font-bold mb-4">📅 캘린더</h1>

      <div className="bg-card rounded-card shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => moveMonth(-1)} className="text-[20px] p-2 press" aria-label="이전 달">‹</button>
          <p className="text-[18px] font-bold">{cursor.getFullYear()}년 {cursor.getMonth() + 1}월</p>
          <button onClick={() => moveMonth(1)} className="text-[20px] p-2 press" aria-label="다음 달">›</button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map((d, i) => (
            <div key={d} className={`text-center text-[13px] font-bold py-1 ${i === 0 ? 'text-red-400' : 'text-ink/50'}`}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {grid.map((date, i) => {
            if (!date) return <div key={`e${i}`} />
            const ds = toDateStr(date)
            const dayEvents = eventsByDate[ds] || []
            const isToday = ds === today
            const isSelected = ds === selected
            return (
              <button
                key={ds}
                onClick={() => setSelected(ds)}
                className={`flex flex-col items-center py-1.5 rounded-[10px] min-h-[52px] press ${
                  isSelected ? 'bg-lavender/60' : isToday ? 'bg-peach/50' : ''
                }`}
              >
                <span className={`text-[16px] ${isToday ? 'font-bold' : ''} ${date.getDay() === 0 ? 'text-red-400' : ''}`}>
                  {date.getDate()}
                </span>
                <span className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-[36px]">
                  {dayEvents.slice(0, 4).map((e) => (
                    <span key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ background: members[e.owner]?.color || '#DDD6F3' }} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-[13px] text-ink/35 text-center mt-3">날짜를 누르면 일정을 보고 추가할 수 있어요</p>

      <BottomSheet open={!!selected} onClose={() => { setSelected(null); setAdding(false) }} title={selected ? formatShortDate(selected) : ''}>
        <div className="flex flex-col gap-2 mb-4">
          {selectedEvents.length === 0 && !adding && (
            <p className="text-[16px] text-ink/40 text-center py-4">일정이 없어요</p>
          )}
          {selectedEvents.map((ev) => {
            const owner = members[ev.owner]
            return (
              <div key={ev.id} className="flex items-center gap-3 bg-bg rounded-card px-4 py-3">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: owner?.color || '#DDD6F3' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-bold">{ev.title}</p>
                  <p className="text-[14px] text-ink/50">
                    {ev.time || '종일'} · {owner?.name || '가족'}
                    {ev.memo && ` · ${ev.memo}`}
                  </p>
                </div>
                {ev.owner === user.uid && (
                  <button onClick={() => removeEvent(ev)} className="text-[14px] text-ink/40 p-2 press">삭제</button>
                )}
              </div>
            )
          })}
        </div>

        {adding ? (
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="일정 제목 (예: 병원 예약)"
              className="bg-bg border border-ink/15 rounded-btn px-4 py-3.5 text-[17px]"
            />
            <div className="flex items-center gap-3">
              <label className="text-[15px] text-ink/60 shrink-0">시간 (비우면 종일)</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="bg-bg border border-ink/15 rounded-btn px-3 py-2.5 text-[16px] flex-1"
              />
            </div>
            <input
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="메모 (선택)"
              className="bg-bg border border-ink/15 rounded-btn px-4 py-3.5 text-[16px]"
            />
            <div className="flex gap-2">
              <button onClick={() => setAdding(false)} className="flex-1 bg-ink/5 rounded-btn py-3.5 text-[16px] font-bold press">취소</button>
              <button onClick={addEvent} disabled={!form.title.trim()} className="flex-[2] bg-peach rounded-btn py-3.5 text-[16px] font-bold press disabled:opacity-40">
                일정 추가
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="w-full bg-peach rounded-btn py-4 text-[17px] font-bold press">
            ＋ 일정 추가
          </button>
        )}
      </BottomSheet>
    </div>
  )
}
