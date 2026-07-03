import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import BottomSheet from '../components/BottomSheet'
import { toDateStr, todayStr, formatShortDate, occursOn, eventExtraLabel, REPEATS } from '../utils'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const MAX_LANES = 4 // 한 주에 겹쳐 보여줄 일정 막대 수
const NUM_ROW = 30 // 날짜 숫자 영역 높이(px)
const BAR_H = 23 // 일정 막대 한 줄 높이(px)
const MIN_WEEK_H = 92 // 타임트리처럼 넉넉한 주 높이

export default function Calendar({ events, fabTick }) {
  const { user, members, familyId } = useAuth()
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selected, setSelected] = useState(null) // 'YYYY-MM-DD'
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', time: '', memo: '', startDate: '', endDate: '', repeat: 'none' })
  const today = todayStr()
  const lastTick = useRef(fabTick)

  // 중앙 FAB → 오늘 날짜 일정 추가
  useEffect(() => {
    if (fabTick !== lastTick.current) {
      lastTick.current = fabTick
      setSelected(today)
      setForm((f) => ({ ...f, startDate: today }))
      setAdding(true)
    }
  }, [fabTick, today])

  // 달력을 주 단위로 (앞뒤 빈 칸 포함)
  const weeks = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const cells = []
    const first = new Date(year, month, 1)
    for (let i = 0; i < first.getDay(); i++) cells.push(null)
    const days = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    const rows = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [cursor])

  // 주별 일정 막대(span) 계산 — 타임트리처럼 날짜를 가로지르는 색 막대
  const weekSpans = useMemo(() => {
    return weeks.map((week) => {
      const spans = []
      for (const ev of events || []) {
        let s = -1
        let e = -1
        week.forEach((cell, i) => {
          if (cell && occursOn(ev, toDateStr(cell))) {
            if (s < 0) s = i
            e = i
          }
        })
        if (s >= 0) spans.push({ ev, s, e, lane: 0 })
      }
      // 먼저 시작하고 긴 일정부터 위 줄(lane)에 배치
      spans.sort((a, b) => (a.s - b.s) || ((b.e - b.s) - (a.e - a.s)))
      const lanes = []
      for (const sp of spans) {
        let l = 0
        while ((lanes[l] || []).some((o) => !(sp.s > o.e || sp.e < o.s))) l++
        if (!lanes[l]) lanes[l] = []
        lanes[l].push(sp)
        sp.lane = l
      }
      return spans
    })
  }, [weeks, events])

  function moveMonth(delta) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  function openAddForm() {
    setForm((f) => ({ ...f, startDate: selected || today }))
    setAdding(true)
  }

  async function addEvent() {
    if (!form.title.trim()) return
    const start = form.startDate || selected || today
    const multiEnd = form.repeat === 'none' && form.endDate && form.endDate > start ? form.endDate : null
    await addDoc(collection(db, 'families', familyId, 'events'), {
      title: form.title.trim(),
      date: start,
      endDate: multiEnd,
      repeat: form.repeat,
      time: form.time || null,
      owner: user.uid,
      memo: form.memo.trim(),
      createdAt: serverTimestamp()
    })
    setForm({ title: '', time: '', memo: '', startDate: '', endDate: '', repeat: 'none' })
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

  return (
    <div className="pt-5 pb-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4 px-4">
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

      <div className="bg-card border-y border-line">
        <div className="grid grid-cols-7 border-b border-line">
          {DAY_NAMES.map((d, i) => (
            <div key={d} className={`text-center text-[11.5px] font-bold py-1.5 ${
              i === 0 ? 'text-danger' : i === 6 ? 'text-[#3B82F6]' : 'text-muted'
            }`}>{d}</div>
          ))}
        </div>

        {weeks.map((week, wi) => {
          const spans = weekSpans[wi]
          const laneCount = Math.min(MAX_LANES, spans.reduce((m, sp) => Math.max(m, sp.lane + 1), 0))
          const height = Math.max(NUM_ROW + laneCount * BAR_H + 6, MIN_WEEK_H)
          return (
            <div key={wi} className="relative border-b border-line last:border-b-0" style={{ height }}>
              <div className="grid grid-cols-7 h-full">
                {week.map((cell, ci) => {
                  if (!cell) return <div key={ci} />
                  const ds = toDateStr(cell)
                  const isToday = ds === today
                  const isSelected = ds === selected
                  return (
                    <button
                      key={ci}
                      onClick={() => setSelected(ds)}
                      className={`relative h-full ${isSelected ? 'bg-accent-soft/50' : ''}`}
                    >
                      <span
                        className={`absolute top-1 left-1/2 -translate-x-1/2 grid place-items-center w-[24px] h-[24px] rounded-full text-[14px] ${
                          isToday
                            ? 'bg-accent text-white font-extrabold'
                            : ci === 0 ? 'text-danger font-semibold' : ci === 6 ? 'text-[#3B82F6] font-semibold' : 'font-semibold'
                        }`}
                      >
                        {cell.getDate()}
                      </span>
                    </button>
                  )
                })}
              </div>
              {spans.filter((sp) => sp.lane < MAX_LANES).map((sp, si) => (
                <div
                  key={si}
                  className="absolute pointer-events-none text-white text-[11.5px] font-bold truncate px-1.5"
                  style={{
                    left: `calc(${(sp.s / 7) * 100}% + 1.5px)`,
                    width: `calc(${((sp.e - sp.s + 1) / 7) * 100}% - 3px)`,
                    top: NUM_ROW + sp.lane * BAR_H,
                    height: BAR_H - 3,
                    lineHeight: `${BAR_H - 3}px`,
                    borderRadius: 6,
                    background: members[sp.ev.owner]?.color || 'rgb(var(--ff-accent))'
                  }}
                >
                  {sp.ev.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <p className="text-[12px] font-semibold text-muted/70 text-center mt-3 px-4">
        날짜를 누르면 일정을 보고 추가할 수 있어요 · 막대 색은 등록한 가족
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
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-bold text-muted mb-1.5">첫날</p>
                <input
                  type="date"
                  value={form.startDate || selected || today}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full bg-alt border-[1.5px] border-line rounded-btn px-3 py-2.5 text-[14px] font-semibold outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-bold text-muted mb-1.5">마지막 날 (하루면 비워두기)</p>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate || selected || today}
                  disabled={form.repeat !== 'none'}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full bg-alt border-[1.5px] border-line rounded-btn px-3 py-2.5 text-[14px] font-semibold outline-none focus:border-accent disabled:opacity-40"
                />
              </div>
            </div>
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
            onClick={openAddForm}
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
