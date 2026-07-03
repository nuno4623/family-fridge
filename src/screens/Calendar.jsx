import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import BottomSheet from '../components/BottomSheet'
import { toDateStr, todayStr, formatShortDate, occursOn, eventExtraLabel, REPEATS } from '../utils'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export default function Calendar({ events, fabTick }) {
  const { user, members, familyId } = useAuth()
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selected, setSelected] = useState(null) // 'YYYY-MM-DD'
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', time: '', memo: '', endDate: '', repeat: 'none' })
  const today = todayStr()
  const lastTick = useRef(fabTick)

  // 중앙 FAB → 오늘 날짜 일정 추가
  useEffect(() => {
    if (fabTick !== lastTick.current) {
      lastTick.current = fabTick
      setSelected(today)
      setAdding(true)
    }
  }, [fabTick, today])

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

  // 보이는 달의 날짜별 일정 (반복·연속 일정 포함)
  const eventsByDate = useMemo(() => {
    const map = {}
    for (const cell of grid) {
      if (!cell) continue
      const ds = toDateStr(cell)
      const list = (events || []).filter((e) => occursOn(e, ds))
      if (list.length > 0) {
        list.sort((a, b) => ((a.time || '') < (b.time || '') ? -1 : 1))
        map[ds] = list
      }
    }
    return map
  }, [events, grid])

  function moveMonth(delta) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  async function addEvent() {
    if (!form.title.trim() || !selected) return
    const multiEnd = form.repeat === 'none' && form.endDate && form.endDate > selected ? form.endDate : null
    await addDoc(collection(db, 'families', familyId, 'events'), {
      title: form.title.trim(),
      date: selected,
      endDate: multiEnd,
      repeat: form.repeat,
      time: form.time || null,
      owner: user.uid,
      memo: form.memo.trim(),
      createdAt: serverTimestamp()
    })
    setForm({ title: '', time: '', memo: '', endDate: '', repeat: 'none' })
    setAdding(false)
  }

  function removeEvent(ev) {
    const isRepeat = (ev.repeat || 'none') !== 'none'
    const msg = isRepeat
      ? `'${ev.title}' 반복 일정을 삭제할까요? (모든 반복이 함께 지워져요)`
      : `'${ev.title}' 일정을 삭제할까요?`
    if (confirm(msg)) {
      deleteDoc(doc(db, 'families', familyId, 'events', ev.id))
    }
  }

  const selectedEvents = useMemo(() => {
    if (!selected) return []
    return (events || [])
      .filter((e) => occursOn(e, selected))
      .sort((a, b) => ((a.time || '') < (b.time || '') ? -1 : 1))
  }, [events, selected])

  function hexToRgba(hex, a) {
    const h = (hex || '#FF6B35').replace('#', '')
    const n = parseInt(h, 16)
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
  }

  return (
    <div className="px-5 pt-5 pb-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-[25px] font-extrabold tracking-tight">
            {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
          </h1>
          <p className="text-[13.5px] font-semibold text-muted">가족 일정</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => moveMonth(-1)} aria-label="이전 달"
            className="w-[38px] h-[38px] rounded-[11px] bg-card border border-line grid place-items-center text-[18px] font-bold press">‹</button>
          <button onClick={() => moveMonth(1)} aria-label="다음 달"
            className="w-[38px] h-[38px] rounded-[11px] bg-card border border-line grid place-items-center text-[18px] font-bold press">›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {DAY_NAMES.map((d, i) => (
          <div key={d} className={`text-center text-[11px] font-bold py-1 ${i === 0 ? 'text-danger' : 'text-muted'}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {grid.map((date, i) => {
          if (!date) return <div key={`e${i}`} />
          const ds = toDateStr(date)
          const dayEvents = eventsByDate[ds] || []
          const color = dayEvents.length > 0 ? (members[dayEvents[0].owner]?.color || '#FF6B35') : null
          const isToday = ds === today
          const isSelected = ds === selected
          return (
            <button
              key={ds}
              onClick={() => setSelected(ds)}
              className="aspect-square rounded-full flex flex-col items-center justify-center press transition-transform"
              style={{
                background: color || (isSelected ? 'rgb(var(--ff-accent-soft))' : 'transparent'),
                boxShadow: color ? `0 6px 14px ${hexToRgba(color, 0.4)}` : 'none',
                outline: isToday ? '2px solid rgb(var(--ff-accent))' : 'none',
                outlineOffset: 2
              }}
            >
              <span className={`text-[14px] ${color ? 'text-white font-extrabold' : date.getDay() === 0 ? 'text-danger font-semibold' : 'font-semibold'}`}>
                {date.getDate()}
              </span>
              {dayEvents.length > 1 && (
                <span className="text-[9px] font-extrabold text-white/90 -mt-0.5">+{dayEvents.length - 1}</span>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-[12px] font-semibold text-muted/70 text-center mt-4">
        날짜를 누르면 일정을 보고 추가할 수 있어요 · 색 원은 가족 일정
      </p>

      <BottomSheet open={!!selected} onClose={() => { setSelected(null); setAdding(false) }} title={selected ? `${formatShortDate(selected)} 📌` : ''}>
        <div className="flex flex-col gap-2.5 mb-4">
          {selectedEvents.length === 0 && !adding && (
            <p className="text-[14.5px] font-semibold text-muted text-center py-4">일정이 없어요</p>
          )}
          {selectedEvents.map((ev) => {
            const owner = members[ev.owner]
            return (
              <div key={ev.id} className="flex items-center gap-3 bg-alt rounded-card px-3.5 py-3">
                <span
                  className="text-[11.5px] font-extrabold text-white px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0"
                  style={{ background: owner?.color || 'rgb(var(--ff-accent))' }}
                >
                  {ev.time || '종일'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] font-bold">{ev.title}</p>
                  <p className="text-[12px] font-semibold text-muted mt-0.5">
                    {owner?.name || '가족'}
                    {eventExtraLabel(ev) && ` · ${eventExtraLabel(ev)}`}
                    {ev.memo && ` · ${ev.memo}`}
                  </p>
                </div>
                {ev.owner === user.uid && (
                  <button onClick={() => removeEvent(ev)} className="text-[13px] font-bold text-muted p-2 press">삭제</button>
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
              className="bg-alt border-[1.5px] border-line rounded-btn px-4 py-3 text-[15px] font-semibold outline-none focus:border-accent"
            />
            <div className="flex items-center gap-3">
              <label className="text-[13px] font-bold text-muted shrink-0">시간 (비우면 종일)</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="bg-alt border-[1.5px] border-line rounded-btn px-3 py-2.5 text-[15px] font-semibold flex-1 outline-none focus:border-accent"
              />
            </div>
            <div>
              <p className="text-[13px] font-bold text-muted mb-2">기간</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setForm({ ...form, endDate: '' })}
                  className={`px-3.5 py-2.5 rounded-[13px] text-[13.5px] font-bold press border-[1.5px] ${
                    !form.endDate ? 'bg-accent text-white border-accent' : 'bg-alt text-muted border-line'
                  }`}
                >
                  하루
                </button>
                <button
                  onClick={() => setForm({ ...form, repeat: 'none', endDate: form.endDate || selected })}
                  className={`px-3.5 py-2.5 rounded-[13px] text-[13.5px] font-bold press border-[1.5px] ${
                    form.endDate ? 'bg-accent text-white border-accent' : 'bg-alt text-muted border-line'
                  }`}
                >
                  여러 날
                </button>
                {form.endDate && (
                  <input
                    type="date"
                    value={form.endDate}
                    min={selected}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="flex-1 min-w-0 bg-alt border-[1.5px] border-line rounded-btn px-3 py-2.5 text-[14px] font-semibold outline-none focus:border-accent"
                    aria-label="마지막 날"
                  />
                )}
              </div>
              {form.endDate && <p className="text-[12px] font-semibold text-muted mt-1.5">마지막 날까지 매일 표시돼요</p>}
            </div>
            <div>
              <p className="text-[13px] font-bold text-muted mb-2">반복</p>
              <div className="flex gap-1.5 flex-wrap">
                {REPEATS.map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setForm({ ...form, repeat: key, endDate: key === 'none' ? form.endDate : '' })}
                    className={`px-3.5 py-2 rounded-full text-[13px] font-bold press border-[1.5px] ${
                      form.repeat === key ? 'bg-accent text-white border-accent' : 'bg-alt text-muted border-line'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <input
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="메모 (선택)"
              className="bg-alt border-[1.5px] border-line rounded-btn px-4 py-3 text-[15px] font-semibold outline-none focus:border-accent"
            />
            <div className="flex gap-2">
              <button onClick={() => setAdding(false)} className="w-[90px] py-3.5 rounded-2xl border-[1.5px] border-line text-[14.5px] font-bold press">취소</button>
              <button
                onClick={addEvent}
                disabled={!form.title.trim()}
                className="flex-1 py-3.5 rounded-2xl text-[15px] font-extrabold text-white bg-accent press disabled:opacity-40"
                style={{ boxShadow: '0 8px 20px rgb(var(--ff-accent) / .4)' }}
              >
                일정 추가
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full py-4 rounded-2xl text-[15.5px] font-extrabold text-white bg-accent press"
            style={{ boxShadow: '0 8px 20px rgb(var(--ff-accent) / .4)' }}
          >
            ＋ 일정 추가
          </button>
        )}
      </BottomSheet>
    </div>
  )
}
